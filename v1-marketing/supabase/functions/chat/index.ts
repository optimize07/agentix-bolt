import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Smart model routing function
function routeToOptimalModel(messages: any[]): { model: string; reason: string } {
  const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
  const content = lastUserMessage.toLowerCase();
  
  // Check for image analysis/vision tasks (routes to vision model, NOT image gen model)
  if (['read image', 'analyze image', 'describe image', 'what\'s in this', 'look at this', 
       'examine', 'identify', 'ocr', 'what do you see', 'attached image', 'this image', 
       'the image', 'uploaded image'].some(k => content.includes(k))) {
    return { model: 'google/gemini-2.5-flash', reason: 'vision_analysis' };
  }
  
  // Check for image GENERATION (different from analysis!)
  if (['generate image', 'create image', 'draw', 'picture of', 'visualize', 'illustration', 'make an image'].some(k => content.includes(k))) {
    return { model: 'google/gemini-3-pro-image-preview', reason: 'image_generation' };
  }
  
  // Check for creative/ad requests
  if (['generate creative', 'create ad', 'write copy', 'campaign', 'headline', 'tagline'].some(k => content.includes(k))) {
    return { model: 'google/gemini-2.5-pro', reason: 'creative_task' };
  }
  
  // Check for code/technical
  if (['write code', 'function', 'debug', 'typescript', 'javascript', 'implement', 'fix bug'].some(k => content.includes(k))) {
    return { model: 'openai/gpt-5', reason: 'code_task' };
  }
  
  // Check for analysis/reasoning
  if (['analyze', 'compare', 'explain why', 'strategy', 'evaluate', 'assess', 'review'].some(k => content.includes(k))) {
    return { model: 'google/gemini-2.5-pro', reason: 'analysis_task' };
  }
  
  // Simple prompts use fast model
  if (lastUserMessage.length < 100) {
    return { model: 'google/gemini-2.5-flash-lite', reason: 'simple_query' };
  }
  
  // Default balanced model
  return { model: 'google/gemini-2.5-flash', reason: 'default' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let { messages, model = "google/gemini-2.5-flash" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    
    // Handle smart-auto model selection
    let modelUsed = model;
    let routingReason = '';
    if (model === 'smart-auto') {
      const routed = routeToOptimalModel(messages);
      modelUsed = routed.model;
      routingReason = routed.reason;
      console.log(`Smart router chose: ${modelUsed} (reason: ${routingReason})`);
    }
    
    console.log("Chat request received with", messages.length, "messages", "using model:", modelUsed);

    // Determine provider based on model prefix
    const isOpenRouter = modelUsed.startsWith("openrouter/");
    
    // All image-capable models
    const IMAGE_MODELS = [
      'google/gemini-2.5-flash-image',
      'google/gemini-3-pro-image-preview'
    ];
    const isImageModel = IMAGE_MODELS.includes(modelUsed);
    
    let apiUrl: string;
    let apiKey: string;
    let requestBody: any;
    
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
      
      // Extract actual model name (remove "openrouter/" prefix)
      const actualModel = modelUsed.replace("openrouter/", "");
      
      requestBody = {
        model: actualModel,
        messages,
        stream: true,
      };
    } else {
      // Lovable AI configuration
      if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY is not configured");
      }
      
      apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
      apiKey = LOVABLE_API_KEY;
      
      requestBody = {
        model: modelUsed,
        messages,
        stream: !isImageModel, // Don't stream for image generation
        ...(isImageModel && { modalities: ["image", "text"] })
      };
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

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: `AI gateway error: ${errorText}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For image models, return JSON response directly (non-streaming)
    if (isImageModel) {
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-Model-Used": modelUsed,
          ...(routingReason && { "X-Routing-Reason": routingReason })
        },
      });
    }

    // For text models, return streaming response
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "X-Model-Used": modelUsed,
        ...(routingReason && { "X-Routing-Reason": routingReason })
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});