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

    // read query/body
    let scope: Scope | undefined = undefined;
    let clientId: string | undefined = undefined;

    const url = new URL(req.url);
    const scopeParam = url.searchParams.get('scope');
    const clientParam = url.searchParams.get('clientId');

    if (scopeParam === 'agency' || scopeParam === 'client') {
      scope = scopeParam;
    }
    if (clientParam) clientId = clientParam;

    if (req.headers.get('content-type')?.includes('application/json')) {
      const body = await req.json().catch(() => ({}));
      if (body?.scope === 'agency' || body?.scope === 'client') scope = body.scope;
      if (typeof body?.clientId === 'string') clientId = body.clientId;
    }

    let query = supabase
      .from('n8n_connections')
      .select('id, scope, client_id, label, base_url, is_active, created_at, updated_at')
      .eq('user_id', user.id);

    if (scope) {
      query = query.eq('scope', scope);
    }
    if (scope === 'client' && clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ connections: data ?? [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('n8n-connections error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


