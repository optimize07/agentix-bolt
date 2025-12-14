import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ExportInput = {
  spreadsheetId: string;
  sheetName: string;
  keyColumn: string;
  headers: string[];
  rows: Array<Array<string | number | boolean | null>>;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Use POST' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const requestId = (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`;
    const body = (await req.json()) as ExportInput;

    const proxyUrl = Deno.env.get('COMPOSIO_PROXY_URL');
    if (proxyUrl) {
      const payload = {
        tools: [
          {
            tool_slug: "GOOGLESHEETS_UPSERT_ROWS",
            arguments: {
              spreadsheetId: body.spreadsheetId,
              sheetName: body.sheetName,
              keyColumn: body.keyColumn,
              headers: body.headers,
              data: body.rows
            }
          }
        ]
      };
      const resp = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json().catch(() => ({}));
      console.log(JSON.stringify({ event: 'sheets-export:proxy:response', requestId, ok: resp.ok }));
      return new Response(JSON.stringify({ via: 'proxy', requestId, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(JSON.stringify({ event: 'sheets-export:placeholder', requestId }));
    return new Response(JSON.stringify({ note: 'Configure COMPOSIO_PROXY_URL to enable exports.', requestId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('sheets-export error', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});


