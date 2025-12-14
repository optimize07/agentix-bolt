import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type GenerateImagesInput = {
  campaignContext: {
    brand: string;
    offer: string;
    audience: string;
    platform?: string;
  };
  adCopy: {
    headline: string;
    primaryText: string;
  };
  numImages?: number;
  existingImageUrl?: string; // For retry on a specific image
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

    const body = (await req.json()) as GenerateImagesInput;
    const requestId = (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`;
    console.log(JSON.stringify({ event: 'generate-ad-images:start', requestId, userId: user.id, numImages: body?.numImages }));

    const numImages = Math.min(Math.max(body.numImages ?? 1, 1), 5);
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      console.warn('No GEMINI_API_KEY found, returning placeholder images');
      const placeholders = Array.from({ length: numImages }).map((_, i) => ({
        imageUrl: `https://placehold.co/1024x1024?text=Ad+Image+${i + 1}`,
        imageData: null,
        mimeType: 'image/png'
      }));
      return new Response(JSON.stringify({ images: placeholders, requestId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Build the text prompt for Gemini image generation
    const imagePrompt = `
Create ${numImages} professional ${body.campaignContext.platform || 'social media'} ad image${numImages > 1 ? 's' : ''} for:

Brand: ${body.campaignContext.brand}
Offer: ${body.campaignContext.offer}
Target Audience: ${body.campaignContext.audience}

Ad Headline: ${body.adCopy.headline}
Ad Copy: ${body.adCopy.primaryText}

Style: Modern, eye-catching, professional ad creative. High quality visuals that align with the brand and appeal to the target audience. Include relevant imagery that supports the offer and resonates with the audience.
${body.existingImageUrl ? `\n\nThis is a retry - create a different variation from previous attempts.` : ''}
`.trim();

    const modelId = "gemini-2.0-flash-exp"; // Gemini model with image generation
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?key=${geminiApiKey}`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: imagePrompt
            }
          ]
        }
      ],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
        imageConfig: {
          image_size: "1K" // 1024x1024
        }
      }
    };

    console.log(JSON.stringify({ event: 'generate-ad-images:calling-gemini', requestId, modelId }));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    // Parse the streaming response
    const responseText = await response.text();
    console.log(JSON.stringify({ event: 'generate-ad-images:gemini-response-received', requestId }));

    // Parse the streamed JSON responses
    const images: Array<{ imageUrl?: string; imageData?: string; mimeType?: string }> = [];

    // Split by newlines and parse each JSON chunk
    const lines = responseText.split('\n').filter(line => line.trim());
    for (const line of lines) {
      try {
        const chunk = JSON.parse(line);
        const candidates = chunk?.candidates || [];

        for (const candidate of candidates) {
          const parts = candidate?.content?.parts || [];
          for (const part of parts) {
            // Check for inline image data
            if (part?.inlineData?.data && part?.inlineData?.mimeType) {
              // Convert base64 to data URL
              const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              images.push({
                imageUrl: dataUrl,
                imageData: part.inlineData.data,
                mimeType: part.inlineData.mimeType
              });
            }
          }
        }
      } catch (parseError) {
        console.warn('Failed to parse chunk:', parseError);
      }
    }

    if (images.length === 0) {
      console.warn('No images generated, using placeholders');
      const placeholders = Array.from({ length: numImages }).map((_, i) => ({
        imageUrl: `https://placehold.co/1024x1024?text=Ad+Image+${i + 1}`,
        imageData: null,
        mimeType: 'image/png'
      }));
      return new Response(JSON.stringify({ images: placeholders, requestId, debug: { responseText } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(JSON.stringify({ event: 'generate-ad-images:done', requestId, count: images.length }));
    return new Response(JSON.stringify({ images, requestId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('generate-ad-images error', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
