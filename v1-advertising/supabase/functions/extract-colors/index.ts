import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sample images evenly across the array for large batches
function sampleImages(urls: string[], maxCount: number): string[] {
  if (urls.length <= maxCount) return urls;
  const step = Math.floor(urls.length / maxCount);
  return Array.from({ length: maxCount }, (_, i) => urls[Math.min(i * step, urls.length - 1)]);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrls } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return new Response(
        JSON.stringify({ colors: [], error: "No image URLs provided" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sample up to 15 images for color extraction to stay within token limits
    const sampledUrls = sampleImages(imageUrls, 15);
    console.log(`[extract-colors] Analyzing ${sampledUrls.length} images (sampled from ${imageUrls.length})`);

    const imageContent = sampledUrls.map((url: string) => ({
      type: "image_url",
      image_url: { url }
    }));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze these ${sampledUrls.length} reference images and extract the dominant color palette used across all of them.

For each distinct color, provide:
1. The exact hex code
2. A descriptive name
3. Approximate percentage of usage across all images

Return ONLY a valid JSON array with this exact format, no other text:
[{"hex": "#FF5733", "name": "Warm Orange", "percentage": 25}, ...]

Focus on the most prominent 5-8 colors that define the overall visual style. Include background colors, accent colors, and any distinctive brand colors you see repeated.`
              },
              ...imageContent
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[extract-colors] AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ colors: [], error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ colors: [], error: "Insufficient credits. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    console.log("[extract-colors] Raw AI response:", content.substring(0, 500));

    // Extract JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("[extract-colors] No JSON array found in response");
      return new Response(
        JSON.stringify({ colors: [], error: "Failed to parse color data" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const colors = JSON.parse(jsonMatch[0]);
    console.log(`[extract-colors] Extracted ${colors.length} colors`);

    return new Response(
      JSON.stringify({ colors, sampledCount: sampledUrls.length, totalCount: imageUrls.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[extract-colors] Error:", error);
    return new Response(
      JSON.stringify({ colors: [], error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
