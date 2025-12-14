import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Scope = 'agency' | 'client';

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
    const scope = (body.scope ?? 'agency') as Scope;
    const clientId = typeof body.clientId === 'string' ? body.clientId : null;
    const label = typeof body.label === 'string' ? body.label : null;
    let baseUrl = typeof body.baseUrl === 'string' ? body.baseUrl : '';
    const apiKey = typeof body.apiKey === 'string' ? body.apiKey : '';

    if (!baseUrl || !apiKey) {
      return new Response(JSON.stringify({ error: 'Missing required fields: baseUrl, apiKey' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Normalize baseUrl (trim trailing slash)
    baseUrl = baseUrl.replace(/\/+$/, '');

    // Test connection
    const testResp = await fetch(`${baseUrl}/api/v1/workflows`, {
      headers: {
        'X-N8N-API-KEY': apiKey,
      },
    });

    if (!testResp.ok) {
      const text = await testResp.text().catch(() => '');
      return new Response(JSON.stringify({ error: `Failed to connect to n8n: ${testResp.status} ${text}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Store connection
    const { data, error } = await supabase
      .from('n8n_connections')
      .insert({
        user_id: user.id,
        scope,
        client_id: scope === 'client' ? clientId : null,
        label,
        base_url: baseUrl,
        api_key_encrypted: apiKey,
        is_active: true,
      })
      .select('id, scope, client_id, label, base_url, is_active, created_at, updated_at')
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, connection: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('n8n-connect error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


