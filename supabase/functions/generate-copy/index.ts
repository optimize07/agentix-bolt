import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type GenerateInput = {
  projectId?: string;
  productContext: Record<string, unknown>;
  winningExamples?: Array<string | Record<string, unknown>>;
  numVariants?: number;
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

    const body = (await req.json()) as GenerateInput;
    const requestId = (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`;
    console.log(JSON.stringify({ event: 'generate-copy:start', requestId, userId: user.id, numVariants: body?.numVariants }));
    const n = Math.min(Math.max(body.numVariants ?? 5, 1), 10);

    const prompt = `
You are an expert Facebook Ads copywriter.
Generate ${n} distinct ad variants based on the PRODUCT CONTEXT and WINNING AD STRUCTURE INSIGHTS.
Use winning ads only to emulate structure and angle; DO NOT copy text verbatim.
Return strict JSON with field: "variants": [ { "headline": "...", "primaryText": "...", "cta": "...", "websiteUrl": "...", "rationale": "..." } ].

PRODUCT CONTEXT:
${JSON.stringify(body.productContext ?? {}, null, 2)}

WINNING AD STRUCTURE INSIGHTS (informational only):
${JSON.stringify(body.winningExamples ?? [], null, 2)}
`.trim();

    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    const geminiKey = Deno.env.get('GEMINI_API_KEY');

    let variants: Array<Record<string, unknown>> = [];

    if (geminiKey) {
      // Use Gemini 2.5 Flash directly for ad copy generation
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            responseMimeType: 'application/json'
          }
        })
      });
      const data = await resp.json();
      console.log(JSON.stringify({ event: 'generate-copy:gemini-2.5-flash:response', requestId, status: 'ok' }));
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      try {
        const parsed = JSON.parse(text);
        variants = Array.isArray(parsed?.variants) ? parsed.variants : [];
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            const parsed = JSON.parse(match[0]);
            variants = Array.isArray(parsed?.variants) ? parsed.variants : [];
          } catch {
            variants = [];
          }
        }
      }
    } else if (lovableKey) {
      // Fallback to Lovable Gateway
      const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          temperature: 0.8,
          messages: [
            { role: 'system', content: 'You produce JSON only unless asked for prose.' },
            { role: 'user', content: prompt }
          ]
        })
      });
      const data = await resp.json();
      console.log(JSON.stringify({ event: 'generate-copy:lovable:response', requestId, hasChoices: !!data?.choices }));
      const text = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.message?.text ?? '';
      try {
        const parsed = JSON.parse(text);
        variants = Array.isArray(parsed?.variants) ? parsed.variants : [];
      } catch {
        // Try to extract JSON substring
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            const parsed = JSON.parse(match[0]);
            variants = Array.isArray(parsed?.variants) ? parsed.variants : [];
          } catch {
            variants = [];
          }
        }
      }
    } else {
      // Fallback mock for development without keys
      variants = Array.from({ length: n }).map((_, i) => ({
        headline: `Sample Headline ${i + 1}`,
        primaryText: `Sample primary text variant ${i + 1} about the offer.`,
        cta: 'LEARN_MORE',
        websiteUrl: String((body.productContext as any)?.websiteUrl ?? 'https://example.com'),
        rationale: 'Mock output (no API key present)'
      }));
    }

    console.log(JSON.stringify({ event: 'generate-copy:done', requestId, count: variants.length }));
    return new Response(JSON.stringify({ variants, requestId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('generate-copy error', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


