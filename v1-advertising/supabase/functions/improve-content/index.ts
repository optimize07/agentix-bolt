import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, contentType, instruction } = await req.json();
    
    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context-aware system prompt
    const typeContextMap: Record<string, string> = {
      headline: 'short, attention-grabbing headlines (max 30 chars for Google Ads)',
      description: 'compelling ad descriptions (max 90 chars for Google Ads)',
      primary: 'engaging primary text for social media ads',
      hook: 'powerful 3-second video hooks that stop scrolling',
      cta: 'clear, action-oriented call-to-action phrases'
    };
    const typeContext = typeContextMap[contentType] || 'compelling marketing copy';

    const systemPrompt = `You are an expert copywriter specializing in advertising and marketing content. 
Your task is to improve ${typeContext}.

Follow these rules:
- Keep the core message and intent
- Make it more compelling and action-oriented
- Use power words and emotional triggers
- Ensure clarity and conciseness
- Match the tone of the original
- For headlines: be punchy and memorable
- For hooks: create curiosity or urgency
- For CTAs: be direct and benefit-focused

Provide 3 improved variations that are better than the original.`;

    const userPrompt = instruction 
      ? `Original content: "${content}"\n\nSpecific instruction: ${instruction}\n\nProvide 3 improved variations.`
      : `Original content: "${content}"\n\nProvide 3 improved variations that are more compelling and effective.`;

    console.log('Calling Lovable AI for content improvement...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit reached. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Parse the response to extract variations
    const variations = aiResponse
      .split('\n')
      .filter((line: string) => line.trim().length > 0 && /^\d+[.):]/.test(line.trim()))
      .map((line: string) => line.replace(/^\d+[.):]\s*/, '').replace(/^["']|["']$/g, '').trim())
      .filter((v: string) => v.length > 0)
      .slice(0, 3);

    console.log('Generated variations:', variations);

    return new Response(
      JSON.stringify({ 
        success: true,
        variations: variations.length > 0 ? variations : [aiResponse],
        original: content
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in improve-content function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate suggestions'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
