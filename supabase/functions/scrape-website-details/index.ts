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
    const { url } = await req.json();
    const cleanUrl = url.trim();
    
    console.log('Analyzing website:', cleanUrl);

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!FIRECRAWL_API_KEY || !GEMINI_API_KEY) {
      throw new Error('API keys not configured');
    }

    // Step 1: Use Firecrawl to extract product/service description from actual website content
    console.log('Step 1: Extracting product description with Firecrawl...');
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: cleanUrl,
        formats: ['extract'],
        extract: {
          prompt: `Analyze this business website and provide a comprehensive description of their product or service. Include: what they do, what problems they solve, their unique value proposition, target market, and key differentiators. Be detailed and specific (minimum 100 characters).`,
          schema: {
            type: "object",
            properties: {
              product_service_description: {
                type: "string",
                description: "Comprehensive product/service description",
                minLength: 100
              }
            },
            required: ["product_service_description"]
          }
        }
      }),
    });

    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text();
      console.error('Firecrawl error:', firecrawlResponse.status, errorText);
      throw new Error(`Firecrawl error: ${firecrawlResponse.status}`);
    }

    const firecrawlData = await firecrawlResponse.json();
    console.log('Firecrawl response:', firecrawlData);
    
    const productDescription = firecrawlData.data?.extract?.product_service_description;
    
    if (!productDescription) {
      throw new Error('Could not extract product description from website');
    }

    // Step 2: Use Gemini with search grounding to find real competitors based on the business context
    console.log('Step 2: Finding competitors with Gemini search...');
    const geminiPrompt = `Research and identify 3 REAL direct competitor companies based on this business information:

**Website:** ${cleanUrl}
**What They Do:** ${productDescription}

Find companies that:
1. Offer similar products/services in the same industry
2. Target similar customers
3. Solve similar problems
4. Are direct competitors (NOT suppliers, partners, or unrelated businesses)

Return their primary website URLs (format: https://competitor.com)

Return ONLY a valid JSON object with this structure:
{
  "competitors": ["https://competitor1.com", "https://competitor2.com", "https://competitor3.com"]
}`;

    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: geminiPrompt }]
          }],
          tools: [{
            googleSearch: {}
          }],
          generationConfig: {
            temperature: 0.3,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048,
          }
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini error:', geminiResponse.status, errorText);
      throw new Error(`Gemini error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response:', JSON.stringify(geminiData, null, 2));

    // Combine all text parts from Gemini response
    const parts = geminiData.candidates?.[0]?.content?.parts || [];
    const fullText = parts.map((part: any) => part.text || '').join('\n');
    
    if (!fullText) {
      throw new Error('No content in Gemini response');
    }

    // Extract JSON from markdown code blocks or plain text
    let jsonMatch = fullText.match(/```json\s*\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
      jsonMatch = fullText.match(/\{[\s\S]*\}/);
    }
    
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Gemini response');
    }

    const jsonString = jsonMatch[1] || jsonMatch[0];
    const competitorData = JSON.parse(jsonString);
    
    // Combine results
    const finalResult = {
      success: true,
      data: {
        product_service_description: productDescription,
        competitors: competitorData.competitors || []
      }
    };

    console.log('Final result:', finalResult);

    return new Response(JSON.stringify(finalResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in scrape-website-details:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
