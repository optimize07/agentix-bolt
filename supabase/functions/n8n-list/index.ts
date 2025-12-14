import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    if (!connectionId) {
      return new Response(JSON.stringify({ error: 'Missing connectionId' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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

    const headers = { 'X-N8N-API-KEY': conn.api_key_encrypted as string };

    // List workflows
    const wfResp = await fetch(`${conn.base_url}/api/v1/workflows`, { headers });
    if (!wfResp.ok) {
      const text = await wfResp.text().catch(() => '');
      return new Response(JSON.stringify({ error: `Failed to list workflows: ${wfResp.status} ${text}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    const wfData = await wfResp.json().catch(() => ({}));
    const workflows = Array.isArray(wfData.data) ? wfData.data : (Array.isArray(wfData) ? wfData : []);

    // Try listing projects (ignore on failure)
    let projects: unknown[] = [];
    try {
      const projResp = await fetch(`${conn.base_url}/rest/projects`, { headers });
      if (projResp.ok) {
        projects = await projResp.json().catch(() => []);
      }
    } catch {
      // ignore
    }

    return new Response(JSON.stringify({ workflows, projects }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('n8n-list error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


