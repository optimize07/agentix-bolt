import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({}));
    const connectionId = body?.connectionId ?? body?.connection_id;
    const workflowId = body?.workflowId ?? body?.workflow_id;
    const payload = body?.payload ?? {};
    const waitTillFinished = body?.waitTillFinished ?? true;
    const webhookUrl = body?.webhookUrl ?? body?.webhook_url;

    // Lightweight proxy mode when a direct webhook URL is supplied.
    if (webhookUrl) {
      const runResp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const text = await runResp.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }

      if (!runResp.ok) {
        return new Response(JSON.stringify({ success: false, error: text || 'Failed to execute webhook' }), {
          status: runResp.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, result: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!connectionId || !workflowId) {
      return new Response(JSON.stringify({ error: 'Missing connectionId or workflowId' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: conn, error: connError } = await supabase
      .from('n8n_connections')
      .select('id, base_url, api_key_encrypted, is_active')
      .eq('user_id', user.id)
      .eq('id', connectionId)
      .single();

    if (connError || !conn) {
      return new Response(JSON.stringify({ error: 'Connection not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!conn.is_active) {
      return new Response(JSON.stringify({ error: 'Connection inactive' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const headers = {
      'X-N8N-API-KEY': conn.api_key_encrypted as string,
      'Content-Type': 'application/json',
    };

    // Webhook Execution Support
    // If a webhook URL is provided in the payload or config, use it.
    // Otherwise, attempt the Activation API (v1/workflows/{id}/activate) which simply turns it on,
    // OR specific webhook-based triggering if the user has configured it.

    // If no webhook URL, fall back to the internal API attempts (which will likely fail with 401 on Cloud)
    // OR return a helpful error telling the user to configure a webhook.
    
    // Check if we are using n8n Cloud (often implied by the URL or failure of rest api)
    const isCloud = conn.base_url.includes('n8n.cloud');
    
    if (isCloud) {
       return new Response(JSON.stringify({ 
         error: 'n8n Cloud requires a Webhook URL to trigger workflows. Please configure a Webhook in your agent settings or provide a webhookUrl.' 
       }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // First attempt: POST /rest/workflows/run
    const runBody = JSON.stringify({ workflowId, payload, waitTillFinished });
    let runResp = await fetch(`${conn.base_url}/rest/workflows/run`, { method: 'POST', headers, body: runBody });

    // Fallback: POST /rest/workflows/${id}/run
    if (!runResp.ok) {
      runResp = await fetch(`${conn.base_url}/rest/workflows/${encodeURIComponent(workflowId)}/run`, { method: 'POST', headers, body: runBody });
    }

    // Second fallback: POST /rest/executions (legacy/alternative)
    if (!runResp.ok) {
      const execBody = JSON.stringify({ workflowId, payload, waitTillFinished, mode: 'manual' });
      runResp = await fetch(`${conn.base_url}/rest/executions`, { method: 'POST', headers, body: execBody });
    }

    const text = await runResp.text();
    if (!runResp.ok) {
      return new Response(JSON.stringify({ error: `Failed to run workflow: ${runResp.status} ${text}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return new Response(JSON.stringify({ success: true, result: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('n8n-run error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


