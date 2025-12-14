import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ProxyRequest = {
  tool_slug: string;
  arguments: Record<string, unknown>;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    const u = new URL(req.url);
    const q = u.searchParams.get('q') ?? undefined;
    const folderId = u.searchParams.get('folderId') ?? undefined;
    const requestId = (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`;
    console.log(JSON.stringify({ event: 'drive-list:start', requestId, userId: user.id, hasQ: !!q, hasFolder: !!folderId }));

    const proxyUrl = Deno.env.get('COMPOSIO_PROXY_URL');
    if (proxyUrl) {
      const payload: ProxyRequest[] = [
        {
          tool_slug: "GOOGLEDRIVE_FIND_FILE",
          arguments: {
            q: q ?? (folderId ? undefined : "mimeType contains 'image/'"),
            folder_id: folderId ?? undefined,
            fields: "files(id,name,mimeType,parents,modifiedTime,thumbnailLink,iconLink),nextPageToken"
          }
        }
      ];
      const proxyResp = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tools: payload }),
      });
      const proxyData = await proxyResp.json().catch(() => ({}));
      console.log(JSON.stringify({ event: 'drive-list:proxy:response', requestId, ok: proxyResp.ok }));
      return new Response(JSON.stringify({ via: 'proxy', requestId, proxyData }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fallback placeholder response
    return new Response(
      JSON.stringify({
        files: [],
        note: 'Connect Google Drive via Settings. Configure COMPOSIO_PROXY_URL to enable live listing.',
        requestId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('drive-list error', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


