import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getUserFromAuthHeader(req: Request): Promise<{ id: string } | null> {
  const authHeader = req.headers.get('Authorization');
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (!authHeader || !supabaseUrl || !anonKey) return null;
  const resp = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: authHeader, apikey: anonKey }
  });
  if (!resp.ok) return null;
  try {
    const user = await resp.json();
    return user && user.id ? user : null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let toolkit = url.searchParams.get('toolkit') ?? '';
    let clientId = url.searchParams.get('clientId') ?? undefined;

    // Also accept toolkit/clientId via JSON body
    if (!toolkit && req.headers.get('content-type')?.includes('application/json')) {
      try {
        const body = await req.json();
        if (typeof body?.toolkit === 'string') toolkit = body.toolkit;
        if (typeof body?.clientId === 'string') clientId = body.clientId;
      } catch {
        // ignore
      }
    }

    if (!toolkit) {
      return new Response(JSON.stringify({ error: 'Missing `toolkit` query param' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const user = await getUserFromAuthHeader(req);
    if (!user) {
       return new Response(
        JSON.stringify({ status: 'anonymous', redirect_url: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('COMPOSIO_API_KEY');
    if (!apiKey) {
      console.error('Missing COMPOSIO_API_KEY');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing API Key' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get auth config ID for this toolkit
    const globalAuthCfg = Deno.env.get('COMPOSIO_AUTH_CONFIG_ID') ?? undefined;
    const perToolkitAuthCfg = Deno.env.get(`COMPOSIO_AUTH_CONFIG_ID_${toolkit.toUpperCase()}`) ?? undefined;
    const authConfigId = perToolkitAuthCfg ?? globalAuthCfg;

    if (!authConfigId) {
      console.warn(`No auth config ID found for toolkit: ${toolkit}`);
      return new Response(
        JSON.stringify({
          status: 'not_configured',
          error: `No COMPOSIO_AUTH_CONFIG_ID_${toolkit.toUpperCase()} environment variable set`,
          redirect_url: null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const composioBaseUrl = 'https://backend.composio.dev';
    let isConnected = false;

    // Check if connected via Composio API
    try {
      console.log(`Checking connections for user ${user.id} and config ${authConfigId}`);
      const connectionsResp = await fetch(
        `${composioBaseUrl}/api/v1/connected-accounts?user_ids=${user.id}&auth_config_ids=${authConfigId}&statuses=ACTIVE`,
        {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (connectionsResp.ok) {
        const connections = await connectionsResp.json();
        if (connections.items && connections.items.length > 0) {
          isConnected = true;
          console.log(`User ${user.id} is already connected to ${toolkit}`);
        }
      } else {
         console.warn(`Check connection failed: ${connectionsResp.status} ${await connectionsResp.text()}`);
      }
    } catch (error) {
      console.error('Error listing connections:', error);
      // Continue to generate link if check fails
    }

    // Generate connection link via Composio API with v3 body format
    const callbackUrl = req.headers.get('referer') || req.headers.get('origin') || '';
    
    // V3 API request body format (for /api/v1/connected-accounts endpoint)
    const payload = {
        auth_config: {
          id: authConfigId
        },
        connection: {
          user_id: user.id,
          redirect_url: callbackUrl || undefined
        }
    };

    console.log(`Initiating connection with payload:`, JSON.stringify(payload));

    const initiateResp = await fetch(`${composioBaseUrl}/api/v1/connected-accounts`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!initiateResp.ok) {
      const errorText = await initiateResp.text();
      console.error('Composio initiate error:', initiateResp.status, errorText);
      return new Response(
        JSON.stringify({ error: `Failed to initiate connection: ${initiateResp.status}`, details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const connectionRequest = await initiateResp.json();
    // Response can have redirect_url in different locations
    const redirect_url = connectionRequest.deprecated?.redirect_url || connectionRequest.redirect_url || connectionRequest.connectionData?.redirect_url;
    const requestId = connectionRequest.id;

    console.log(`[DEBUG] Generated redirect_url: ${redirect_url}`);

    return new Response(
      JSON.stringify({ 
        status: isConnected ? 'connected' : 'disconnected', 
        redirect_url, 
        requestId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('composio-manage-connection error', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
