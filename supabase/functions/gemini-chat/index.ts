import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ChatInput = {
  prompt: string;
  responseFormat?: 'json' | 'text';
  temperature?: number;
  clientId?: string; // Context for RAG
  scope?: 'agency' | 'client'; // Context for RAG
  stream?: boolean; // Enable streaming response
  model?: string; // Model selection
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Use POST' }), { 
      status: 405, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const body = (await req.json()) as ChatInput;
    const { 
      prompt, 
      responseFormat = 'text', 
      temperature = 0.7, 
      clientId, 
      scope,
      stream = false,
      model = 'google/gemini-2.5-flash'
    } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const requestId = crypto.randomUUID();
    console.log(JSON.stringify({ event: 'gemini-chat:start', requestId, userId: user.id, stream, model }));

    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    const geminiKey = Deno.env.get('GEMINI_API_KEY');

    let response = '';
    let fileSearchTool: any = null;

    // RAG Logic: Find relevant Google File Store
    if (geminiKey) {
        try {
            // Determine which store to query based on context
            // Priority: Client Store -> Agency Store
            // If clientId is provided, look for Client store.
            // If not, look for Agency store (or both? for now singular).
            
            let query = supabase
                .from('knowledge_base_items')
                .select('google_store_id')
                .neq('google_store_id', null) // Only items that are indexed
                .eq('user_id', user.id) // Ensure access
                .limit(1);

            if (clientId) {
                query = query.eq('client_id', clientId);
            } else {
                // Default to agency if no client specified, or maybe general scope
                // If scope is 'agency' or undefined
                query = query.eq('scope', 'agency');
            }

            const { data: items } = await query;
            const storeId = items?.[0]?.google_store_id;

            if (storeId) {
                console.log(`[RAG] Using Store ID: ${storeId}`);
                fileSearchTool = {
                    fileSearch: {
                        fileSearchStoreNames: [storeId]
                    }
                };
            } else {
                console.log('[RAG] No store found for context');
            }
        } catch (e) {
            console.error('[RAG] Error resolving store:', e);
        }
    }

    const systemPrompt = responseFormat === 'json' 
      ? 'You are a helpful assistant. You must respond with valid JSON only, no markdown formatting or extra text.'
      : 'You are a helpful assistant.';

    if (lovableKey) {
      // Use Lovable AI Gateway with optional streaming
      const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          temperature,
          stream: stream,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ]
        })
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error('Lovable API error:', resp.status, errorText);
        
        if (resp.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        if (resp.status === 402) {
          return new Response(JSON.stringify({ error: 'Payment required' }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        throw new Error(`Lovable API error: ${errorText}`);
      }

      // Handle streaming response
      if (stream && resp.body) {
        console.log(JSON.stringify({ event: 'gemini-chat:streaming', requestId }));
        
        return new Response(resp.body, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        });
      }

      // Handle non-streaming response
      const data = await resp.json();
      console.log(JSON.stringify({ event: 'gemini-chat:lovable:response', requestId, hasChoices: !!data?.choices }));
      response = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.message?.text ?? '';
      
    } else if (geminiKey) {
      // Prepare tools
      const tools = fileSearchTool ? [fileSearchTool] : undefined;

      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
          generationConfig: { temperature },
          tools: tools
        })
      });
      const data = await resp.json();
      
      // Log full response for debugging RAG
      // console.log(JSON.stringify(data)); 

      console.log(JSON.stringify({ event: 'gemini-chat:gemini:response', requestId, status: 'ok' }));
      response = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      
      // Check for citations (grounding metadata)
      // const citation = data?.candidates?.[0]?.groundingMetadata;
    } else {
      // Fallback mock for development
      response = responseFormat === 'json' 
        ? '{"message": "Mock response - no API key configured"}'
        : 'Mock response - no API key configured';
    }

    console.log(JSON.stringify({ event: 'gemini-chat:done', requestId, responseLength: response.length }));
    return new Response(JSON.stringify({ response, requestId }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    console.error('gemini-chat error', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
