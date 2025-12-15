import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Randomly select images from the collection for maximum diversity
function getRandomSample(urls: string[], maxCount: number): string[] {
  if (!urls || urls.length === 0) return [];
  if (urls.length <= maxCount) return [...urls];
  
  // Fisher-Yates shuffle and pick first N
  const shuffled = [...urls];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, maxCount);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { prompt, imageUrls, count = 1 } = await req.json();
    
    console.log(`Batch generate: ${count} images with ${imageUrls?.length || 0} reference images`);
    console.log('[batch-generate-images] Reference image URLs:', imageUrls);
    
    const results: string[] = [];
    const batchSize = 3;
    
    // System instruction for strict color matching
    const colorMatchingSystem = `You are an expert advertisement image creator with STRICT color matching abilities.

CRITICAL COLOR MATCHING RULES:
1. When reference images are provided, you MUST analyze them FIRST for:
   - Exact color palette (list specific colors with hex codes if possible)
   - Color temperature (warm oranges/reds vs cool blues/greens)
   - Saturation and brightness levels
   - Overall mood and lighting style
   
2. Your generated images MUST use ONLY colors visible in the reference images
3. DO NOT use default "professional" colors like corporate blue or teal unless they appear in references
4. If references show warm earth tones (orange, brown, tan), use warm earth tones
5. If references show vibrant saturated colors, match that vibrancy
6. If references show muted pastels, use muted pastels

BEFORE generating, you must mentally list the colors you observe in the references.`;
    
    for (let i = 0; i < count; i += batchSize) {
      const batchCount = Math.min(batchSize, count - i);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}: generating ${batchCount} images`);
      
      const batchPromises = Array(batchCount).fill(null).map(async (_, idx) => {
        const variationNumber = i + idx + 1;
        const variationPrompt = `${prompt}\n\nThis is variation ${variationNumber} of ${count}. Make this variation unique while STRICTLY maintaining the exact color palette from the reference images.`;
        
        // Randomly sample up to 10 images per variation for maximum diversity
        const sampledUrls = getRandomSample(imageUrls || [], 10);
        console.log(`Image ${variationNumber}/${count} using ${sampledUrls.length} random refs from ${imageUrls?.length || 0} total`);
        
        const messageContent = sampledUrls.length > 0
          ? [
              { type: "text", text: `FIRST: Analyze the ${sampledUrls.length} reference images and identify the EXACT colors present (list them).
THEN: Generate an advertisement image using ONLY those colors.

${variationPrompt}` },
              ...sampledUrls.map((url: string) => ({
                type: "image_url",
                image_url: { url }
              }))
            ]
          : variationPrompt;

        console.log(`Generating image ${variationNumber}/${count}`);
        
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image-preview",
            messages: [
              { role: "system", content: colorMatchingSystem },
              { role: "user", content: messageContent }
            ],
            modalities: ["image", "text"]
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Image ${variationNumber} failed: ${response.status}`, errorText);
          
          if (response.status === 429) {
            return { error: 'rate_limit', status: 429 };
          }
          if (response.status === 402) {
            return { error: 'payment_required', status: 402 };
          }
          return null;
        }
        
        const data = await response.json();
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (imageUrl) {
          console.log(`Image ${variationNumber} generated successfully`);
          return imageUrl;
        }
        
        console.error(`Image ${variationNumber}: No image in response`);
        return null;
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          if (typeof result.value === 'string') {
            results.push(result.value);
          } else if (result.value.error === 'rate_limit') {
            return new Response(JSON.stringify({ 
              error: 'Rate limit exceeded. Please try again later.',
              images: results,
              total: count 
            }), {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          } else if (result.value.error === 'payment_required') {
            return new Response(JSON.stringify({ 
              error: 'AI credits depleted. Please add more credits.',
              images: results,
              total: count 
            }), {
              status: 402,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
        }
      }
      
      // Rate limit delay between batches
      if (i + batchSize < count) {
        console.log('Waiting 1s before next batch...');
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    console.log(`Batch complete: ${results.length}/${count} images generated`);
    
    return new Response(JSON.stringify({ images: results, total: count }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
    
  } catch (error: any) {
    console.error("Batch generation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
