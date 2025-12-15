import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { imageBase64, imageMimeType } = await req.json();
    console.log("[Extract Table] Received image for OCR extraction");

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Use vision-capable model to extract table data
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image of a spreadsheet or table and extract ALL data exactly as shown.

Return ONLY a JSON object (no markdown, no additional text) with this exact structure:
{
  "success": true,
  "headers": ["Column1", "Column2", ...],
  "rows": [
    ["value1", "value2", ...],
    ["value3", "value4", ...]
  ],
  "confidence": "high" | "medium" | "low",
  "notes": "Any issues or observations"
}

CRITICAL RULES:
- Preserve exact text as shown (including spaces, capitalization, punctuation)
- Include ALL visible rows and columns
- For merged cells, repeat the value across merged columns/rows
- Keep number formatting (e.g., $1,234.56, 45%, 01/15/2024)
- If a cell is empty, use an empty string ""
- If the image is blurry or unclear, set confidence to "low"
- If you cannot detect a clear table structure, set success to false

Return ONLY the JSON object, nothing else.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${imageMimeType};base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Extract Table] AI Gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to process image with AI" }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    console.log("[Extract Table] AI response received, parsing JSON...");

    // Parse the JSON response
    let extractedData;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("[Extract Table] Failed to parse AI response as JSON:", parseError);
      console.error("[Extract Table] Raw content:", content);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse extracted data",
          details: "AI returned invalid JSON format"
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!extractedData.success) {
      console.log("[Extract Table] No table detected in image");
      return new Response(
        JSON.stringify({ 
          error: "No table detected in image",
          notes: extractedData.notes
        }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Extract Table] Successfully extracted ${extractedData.rows?.length || 0} rows`);

    return new Response(
      JSON.stringify({
        success: true,
        headers: extractedData.headers || [],
        rows: extractedData.rows || [],
        confidence: extractedData.confidence || "medium",
        notes: extractedData.notes || ""
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Extract Table] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
