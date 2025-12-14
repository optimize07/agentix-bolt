import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type PublishInput = {
  accountId: string;
  pageId: string;
  campaign: Record<string, unknown>;
  adset: Record<string, unknown>;
  creatives: Array<{
    headline?: string;
    primaryText: string;
    cta?: string;
    websiteUrl: string;
    assetRefs?: Array<{ driveFileId?: string; url?: string }>;
  }>;
  dryRun?: boolean;
};

type ProxyRequest = {
  tool_slug: string;
  arguments: Record<string, unknown>;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Use POST' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = (await req.json()) as PublishInput;
    const requestId = (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`;
    console.log(JSON.stringify({ event: 'metaads-publish:start', requestId, userId: user.id, accountId: body?.accountId, pageId: body?.pageId, creatives: body?.creatives?.length ?? 0 }));
    if (!body?.accountId || !body?.pageId || !Array.isArray(body?.creatives)) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const proxyUrl = Deno.env.get('COMPOSIO_PROXY_URL');

    // Normalize to a predictable sequence; optionally proxy to Composio
    if (proxyUrl && !body.dryRun) {
      const steps: ProxyRequest[] = [];
      steps.push({
        tool_slug: "METAADS_CREATE_CAMPAIGN",
        arguments: {
          account_id: `act_${body.accountId}`,
          name: body.campaign?.['name'] ?? 'AdCreator Campaign',
          objective: body.campaign?.['objective'] ?? 'CONVERSIONS',
          status: body.campaign?.['status'] ?? 'PAUSED'
        }
      });
      steps.push({
        tool_slug: "METAADS_CREATE_AD_SET",
        arguments: {
          campaign_id: "__use_previous_result__",
          name: body.adset?.['name'] ?? 'AdCreator Ad Set',
          optimization_goal: body.adset?.['optimization_goal'] ?? 'LINK_CLICKS',
          billing_event: body.adset?.['billing_event'] ?? 'IMPRESSIONS',
          bid_amount: body.adset?.['bid_amount'] ?? 50,
          targeting: body.adset?.['targeting'] ?? { location_type: 'countries', locations: ['US'], age_min: 18, age_max: 65, genders: [0] },
          status: body.adset?.['status'] ?? 'PAUSED'
        }
      });
      // Note: upload image / create creative / create ad would be repeated per creative
      const proxyResp = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tools: steps })
      });
      const proxyData = await proxyResp.json().catch(() => ({}));
      console.log(JSON.stringify({ event: 'metaads-publish:proxy:response', requestId, ok: proxyResp.ok }));
      return new Response(JSON.stringify({ via: 'proxy', requestId, proxyData }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Dry-run payload
    const payload = {
      accountId: body.accountId,
      pageId: body.pageId,
      campaign: body.campaign,
      adset: body.adset,
      creatives: body.creatives
    };

    // Optionally persist an audit log row
    const { error: auditError } = await supabase.from('ad_publish_runs').insert({
      project_id: (body as any).projectId ?? null,
      created_by: user.id,
      status: 'pending',
      payload
    }).select().single();
    // Ignore errors since this is an optional audit log

    console.log(JSON.stringify({ event: 'metaads-publish:dry-run', requestId }));
    return new Response(JSON.stringify({ created: [], payload, requestId, note: 'Dry-run; set COMPOSIO_PROXY_URL and remove dryRun to execute.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('metaads-publish error', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


