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
    const { url, existingAvatarDescription, productDescription, companyName } = await req.json();
    
    console.log('Analyzing competitor with Gemini:', url);

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Build the analysis prompt
    const prompt = `Analyze the competitor at ${url} and help define the ideal client avatar for ${companyName || 'our company'}.

**Our Company's Product/Service:**
${productDescription || 'Not provided'}

**Current Ideal Client Avatar (if any):**
${existingAvatarDescription || 'Not yet defined'}

**Task:**
1. Research the competitor's target audience, case studies, testimonials, and positioning
2. Synthesize insights about who THEY serve
3. Based on our product/service description, refine and update the ideal client avatar for OUR COMPANY (not the competitor)
4. If there's existing avatar data, integrate the new insights with it to create a more comprehensive profile

**Return a detailed ideal client avatar description as a flowing paragraph (300-500 words) that includes:**
- Demographics (age, location, role, industry)
- Psychographics (values, goals, challenges)
- Pain points they experience
- What they care about most
- How they make decisions
- Where they seek information

Focus on creating the ideal client profile for OUR COMPANY based on competitive intelligence.

Write a comprehensive, flowing paragraph that describes the ideal client avatar. Do NOT return JSON. Return plain text in paragraph form that can be directly used in a marketing document.

Return ONLY the paragraph description, nothing else.`;

    // Use Gemini with search grounding
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          tools: [{
            googleSearch: {}
          }],
          generationConfig: {
            temperature: 0.4,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const geminiData = await response.json();
    console.log('Gemini response:', JSON.stringify(geminiData, null, 2));

    // Combine all text parts from Gemini response
    const parts = geminiData.candidates?.[0]?.content?.parts || [];
    const fullText = parts.map((part: any) => part.text || '').join('\n').trim();
    
    if (!fullText) {
      throw new Error('No content in Gemini response');
    }

    console.log('Extracted avatar description:', fullText);

    return new Response(JSON.stringify({ ideal_client_avatar: fullText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in scrape-competitor-avatar:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
