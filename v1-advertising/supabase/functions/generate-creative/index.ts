import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, assets, styleNotes, generateImages = true, canvasContext, canvasImages = [], toolsContext, knowledgeContext, strategyContext, researchContext, model = "google/gemini-2.5-flash", isFirstMessage = false } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

    console.log("Generate creative request with model:", model);

    // Build context from assets, style notes, and canvas
    let context = styleNotes ? `Creative Style Notes: ${styleNotes}\n\n` : "";
    
    // Canvas context contains reference materials - mark it clearly
    if (canvasContext && canvasContext.trim()) {
      context += canvasContext + "\n\n";
    }

    if (knowledgeContext && knowledgeContext.trim()) {
      context += "Knowledge Base:\n";
      context += knowledgeContext + "\n\n";
    }

    if (strategyContext && strategyContext.trim()) {
      context += "Strategic Guidelines:\n";
      context += strategyContext + "\n\n";
    }

    if (researchContext && researchContext.trim()) {
      context += "Market Research:\n";
      context += researchContext + "\n\n";
    }
    
    if (assets && assets.length > 0) {
      context += "Referenced Assets:\n";
      assets.forEach((asset: any) => {
        context += `- ${asset.name} (${asset.type})\n`;
        if (asset.text_content) {
          context += `  Content: ${asset.text_content}\n`;
        }
      });
      context += "\n";
    }

    if (toolsContext && toolsContext.trim()) {
      context += "Available Tools:\n";
      context += toolsContext + "\n\n";
    }

    // Build reference image instruction if images are provided
    const referenceImageInstruction = canvasImages && canvasImages.length > 0 
      ? `
IMPORTANT - REFERENCE IMAGES PROVIDED:
You have been given ${canvasImages.length} reference image(s) to analyze. When creating visual_prompt:
1. ANALYZE the style, colors, lighting, composition, and aesthetic of the reference images
2. MATCH the visual identity - use similar color palettes, photography styles, and mood
3. MAINTAIN brand consistency - the generated images should feel like they belong to the same visual family
4. DESCRIBE specific elements you observe: lighting direction, color temperature, subject positioning, background style
5. If reference shows product photography, match that style. If lifestyle photography, match that style.
` : '';

    // Build reference text instruction if canvas context has example content
    const hasTextReferences = canvasContext && canvasContext.includes('EXAMPLE AD COPY') || canvasContext && canvasContext.includes('REFERENCE CONTENT');
    const referenceTextInstruction = hasTextReferences
      ? `
CRITICAL - REFERENCE AD COPY/TEXT PROVIDED:
You have been given example ads and reference content in the "CONNECTED REFERENCE MATERIALS" section above.
YOU MUST:
1. STUDY the writing style, hooks, angles, emotional triggers, and tone of the examples
2. IDENTIFY successful patterns: pain points addressed, benefits highlighted, urgency tactics, CTA approaches
3. ANALYZE the sentence structure, word choices, and persuasion techniques
4. CREATE NEW, ORIGINAL ads that are INSPIRED BY these examples
5. DO NOT copy text verbatim - extract the STRATEGY and STYLE, then write fresh copy
6. Match the energy, voice, and persuasion approach while being completely original
7. If examples show direct-response style, match that. If brand-focused, match that.
` : '';

    const systemPrompt = `You are an expert Facebook/Meta advertising creative generator. You can have conversations and generate compelling ad creatives that convert.

${context}
${referenceImageInstruction}
${referenceTextInstruction}

When the user asks you to generate ad creatives, use the generate_ad_creatives tool to return structured data.
For conversations, questions, or requests that don't require creative generation, respond naturally.

CRITICAL: When writing visual_prompt, you MUST write concrete, photographic descriptions that an image AI can generate. DO NOT write conceptual or abstract descriptions.
${canvasImages && canvasImages.length > 0 ? 'Use the reference images provided to match the visual style, colors, and aesthetic.' : ''}
${hasTextReferences ? 'IMPORTANT: Your ad copy MUST be inspired by the reference examples provided. Match their style and approach while creating original content.' : ''}

✅ GOOD visual_prompt examples:
- "A 30-year-old professional woman in business casual attire, smiling confidently while holding a tablet, modern office with large windows, soft natural lighting, shot on Canon 85mm lens, shallow depth of field"
- "Product flat lay: premium skincare serum bottle surrounded by fresh green leaves and water droplets on white marble surface, soft studio lighting, commercial photography style"
- "Close-up of hands typing on laptop keyboard, coffee cup visible in background, cozy home office setting, warm afternoon light through window, lifestyle photography"

❌ BAD visual_prompt examples (NEVER USE):
- "An image representing digital transformation" (too conceptual)
- "Create a visual showing the benefits of productivity" (too abstract)
- "A picture of success and achievement" (not concrete)

Always include: subject details (age, appearance, action), setting/background, lighting, photography style.`;

    // Determine provider and check if image model
    const isOpenRouter = model.startsWith("openrouter/");
    const IMAGE_MODELS = ['google/gemini-2.5-flash-image', 'google/gemini-3-pro-image-preview'];
    const isImageModel = IMAGE_MODELS.includes(model);
    
    let apiUrl: string;
    let apiKey: string;
    let actualModel: string;
    
    if (isOpenRouter) {
      // OpenRouter configuration
      if (!OPENROUTER_API_KEY) {
        return new Response(JSON.stringify({ error: "OpenRouter API key not configured. Please add your key in Brand Settings." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      apiUrl = "https://openrouter.ai/api/v1/chat/completions";
      apiKey = OPENROUTER_API_KEY;
      actualModel = model.replace("openrouter/", "");
    } else {
      // Lovable AI configuration
      if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY not configured");
      }
      
      apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
      apiKey = LOVABLE_API_KEY;
      actualModel = model;
    }
    
    // If image model, handle differently (no tool calling, direct image generation)
    if (isImageModel) {
      console.log("Image model detected - generating image directly");
      
      const imageResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: actualModel,
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"]
        }),
      });
      
      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        console.error("Image generation error:", imageResponse.status, errorText);
        
        if (imageResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        if (imageResponse.status === 402) {
          return new Response(
            JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        throw new Error(`Image generation error: ${imageResponse.status}`);
      }
      
      const imageData = await imageResponse.json();
      const message = imageData.choices?.[0]?.message;
      const images = message?.images || [];
      
      return new Response(
        JSON.stringify({
          type: "conversation",
          message: message?.content || "Image generated",
          images: images.map((img: any) => img.image_url?.url).filter(Boolean),
          creatives: []
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Generate copy with AI using tool calling
    // Build user message with images if present
    let userMessage: any;
    if (canvasImages && canvasImages.length > 0) {
      // Multimodal message with images
      const content: any[] = [
        { type: "text", text: prompt }
      ];
      
      // Add up to 5 images (to avoid token limits)
      canvasImages.slice(0, 5).forEach((imageUrl: string) => {
        content.push({
          type: "image_url",
          image_url: { url: imageUrl }
        });
      });
      
      userMessage = { role: "user", content };
    } else {
      // Text-only message
      userMessage = { role: "user", content: prompt };
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    // Add OpenRouter-specific headers
    if (isOpenRouter) {
      headers["HTTP-Referer"] = "https://lovable.dev";
      headers["X-Title"] = "Lovable AI Agent";
    }

    // Text models with tool calling for structured output
    const copyResponse = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: actualModel,
        messages: [
          { role: "system", content: systemPrompt },
          userMessage,
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_ad_creatives",
            description: "Generate Facebook/Meta ad creatives based on user request",
            parameters: {
              type: "object",
              properties: {
                creatives: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Descriptive title for the ad concept" },
                      headline: { type: "string", description: "Attention-grabbing headline (40 chars max)" },
                      primary_text: { type: "string", description: "Compelling primary text (125 chars ideal)" },
                      description_text: { type: "string", description: "Call-to-action focused description (30 chars)" },
                      visual_prompt: { type: "string", description: "Detailed visual prompt for image generation" },
                      tags: { type: "array", items: { type: "string" }, description: "3-5 relevant tags" }
                    },
                    required: ["title", "headline", "primary_text", "description_text", "visual_prompt", "tags"]
                  }
                }
              },
              required: ["creatives"]
            }
          }
        }]
      }),
    });

    if (!copyResponse.ok) {
      const errorText = await copyResponse.text();
      console.error("AI gateway error:", copyResponse.status, errorText);
      
      if (copyResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (copyResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI gateway error: ${copyResponse.status}`);
    }

    const copyData = await copyResponse.json();
    const message = copyData.choices?.[0]?.message;

    if (!message) {
      throw new Error("No message in AI response");
    }

    // Check if AI used the tool to generate creatives
    let creatives = [];
    let isConversation = false;

    if (message.tool_calls && message.tool_calls.length > 0) {
      // AI used the tool - extract creatives
      const toolCall = message.tool_calls[0];
      if (toolCall.function.name === "generate_ad_creatives") {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          creatives = args.creatives || [];
        } catch (e) {
          console.error("Failed to parse tool call arguments:", e);
        }
      }
    } else if (message.content) {
      // AI responded conversationally - return as conversation
      isConversation = true;
    }

    // If it's a conversational response, generate title if first message
    if (isConversation) {
      let suggestedTitle = null;
      
      if (isFirstMessage) {
        try {
          const titleResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [{
                role: "user",
                content: `Generate a short, descriptive title (max 50 chars) for a chat that starts with this message: "${prompt}". Return only the title, no quotes or extra text.`
              }],
            }),
          });

          if (titleResponse.ok) {
            const titleData = await titleResponse.json();
            suggestedTitle = titleData.choices?.[0]?.message?.content?.trim().slice(0, 50);
          }
        } catch (e) {
          console.error("Failed to generate title:", e);
        }
      }

      return new Response(
        JSON.stringify({ 
          type: "conversation",
          message: message.content,
          creatives: [],
          suggestedTitle
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If no creatives generated, return error
    if (creatives.length === 0) {
      return new Response(
        JSON.stringify({ 
          type: "conversation",
          message: "I couldn't generate creatives from that request. Could you provide more details about what you'd like to create?",
          creatives: []
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Generate images with Nano Banana (if requested)
    if (generateImages && creatives.length > 0) {
      console.log("Generating images with Nano Banana...");
      
      // Only generate images for first 3 creatives to avoid timeout
      const creativesToGenerateImages = creatives.slice(0, 3);
      console.log(`Generating images for ${creativesToGenerateImages.length} creatives out of ${creatives.length} total`);
      
      const imagePromises = creativesToGenerateImages.map(async (creative: any, index: number) => {
        try {
          console.log(`Starting image generation ${index + 1}/${creativesToGenerateImages.length} for: ${creative.title}`);
          
          // Create timeout promise
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Image generation timeout after 30s')), 30000)
          );
          
          // Image generation promise
          const imageGenPromise = fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image",
              messages: [{
                role: "user",
                content: creative.visual_prompt
              }],
              modalities: ["image", "text"]
            }),
          }).then(async (res) => {
            if (!res.ok) {
              const errorText = await res.text();
              throw new Error(`Image API error (${res.status}): ${errorText}`);
            }
            return res.json();
          });
          
          // Race between timeout and actual request
          const imageData: any = await Promise.race([imageGenPromise, timeoutPromise]);
          
          // Extract image from message.images array (Lovable AI / Nano banana format)
          const responseImages = imageData?.choices?.[0]?.message?.images || [];
          if (responseImages.length > 0) {
            const imageUrl = responseImages[0]?.image_url?.url;
            if (imageUrl) {
              creative.image_data = imageUrl;
              console.log(`✓ Image generated for: ${creative.title}`);
            } else {
              console.log(`⚠ No image URL in response for: ${creative.title}`);
            }
          } else {
            console.log(`⚠ No images array in response for: ${creative.title}`);
          }
        } catch (error: any) {
          console.error(`Image generation failed for "${creative.title}":`, error.message);
          creative.visual_description = `Image generation failed: ${error.message}`;
        }
      });
      
      await Promise.allSettled(imagePromises);
      console.log("Image generation phase complete");
    }

    return new Response(
      JSON.stringify({ 
        message: `Generated ${creatives.length} ad creative${creatives.length === 1 ? '' : 's'}`,
        creatives 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});