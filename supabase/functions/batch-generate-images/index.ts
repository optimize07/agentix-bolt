import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BatchGenerateInput {
  prompt: string;
  referenceImageUrls?: string[];
  count: number;
  maxReferencesPerImage?: number;
}

/**
 * Fisher-Yates shuffle to randomly sample references
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Sample N random images from references using Fisher-Yates
 */
function sampleReferences(refs: string[], maxCount: number): string[] {
  if (refs.length <= maxCount) return refs;
  return shuffleArray(refs).slice(0, maxCount);
}

/**
 * Delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const body: BatchGenerateInput = await req.json();
    const { prompt, referenceImageUrls = [], count = 3, maxReferencesPerImage = 10 } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const requestId = crypto.randomUUID();
    console.log(JSON.stringify({ 
      event: 'batch-generate:start', 
      requestId, 
      count, 
      referenceCount: referenceImageUrls.length 
    }));

    const generatedImages: Array<{ imageUrl: string; index: number }> = [];
    const errors: Array<{ index: number; error: string }> = [];

    // Process in batches of 3 with rate limiting
    const batchSize = 3;
    for (let i = 0; i < count; i += batchSize) {
      const batchPromises = [];
      
      for (let j = i; j < Math.min(i + batchSize, count); j++) {
        batchPromises.push(
          (async (index: number) => {
            try {
              // Sample references for this specific image
              const sampledRefs = sampleReferences(referenceImageUrls, maxReferencesPerImage);
              
              // Build multimodal content with prompt and reference images
              const contentParts: any[] = [
                { 
                  type: 'text', 
                  text: `${prompt}\n\nVariation ${index + 1} of ${count}. Create a unique variation that maintains style consistency but offers creative differences.${
                    sampledRefs.length > 0 
                      ? `\n\nAnalyze the ${sampledRefs.length} reference images for style, colors, composition, and mood. Apply these visual elements to your generation.` 
                      : ''
                  }` 
                }
              ];

              // Add sampled reference images
              for (const refUrl of sampledRefs) {
                contentParts.push({
                  type: 'image_url',
                  image_url: { url: refUrl }
                });
              }

              const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'google/gemini-2.5-flash-image-preview',
                  messages: [
                    {
                      role: 'user',
                      content: contentParts
                    }
                  ],
                  modalities: ['image', 'text']
                }),
              });

              if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API error: ${response.status} - ${errorText}`);
              }

              const data = await response.json();
              const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

              if (imageUrl) {
                return { success: true, index, imageUrl };
              } else {
                return { success: false, index, error: 'No image generated' };
              }
            } catch (err) {
              console.error(`Error generating image ${index}:`, err);
              return { 
                success: false, 
                index, 
                error: err instanceof Error ? err.message : 'Unknown error' 
              };
            }
          })(j)
        );
      }

      const batchResults = await Promise.all(batchPromises);
      
      for (const result of batchResults) {
        if (result.success) {
          generatedImages.push({ imageUrl: result.imageUrl!, index: result.index });
        } else {
          errors.push({ index: result.index, error: result.error! });
        }
      }

      // Rate limit: wait 1 second between batches
      if (i + batchSize < count) {
        await delay(1000);
      }
    }

    // Sort by index
    generatedImages.sort((a, b) => a.index - b.index);

    console.log(JSON.stringify({ 
      event: 'batch-generate:done', 
      requestId, 
      successCount: generatedImages.length,
      errorCount: errors.length 
    }));

    return new Response(JSON.stringify({ 
      images: generatedImages.map(img => img.imageUrl),
      errors: errors.length > 0 ? errors : undefined,
      requestId 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err) {
    console.error('batch-generate-images error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
