import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context, model } = await req.json();
    console.log("[Sellix] Received request with context:", context ? Object.keys(context) : "none");
    console.log("[Sellix] Requested model:", model);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Initialize Supabase client for data access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build context-aware system prompt
    const organizationContext = context?.organization || {};
    const salesContext = context?.salesData || {};
    const conversationHistory = context?.conversationHistory || '';

    // Validate and select model
    const allowedModels = [
      'google/gemini-2.5-flash',
      'google/gemini-2.5-pro',
      'google/gemini-2.5-flash-lite',
      'openai/gpt-5',
      'openai/gpt-5-mini'
    ];
    const selectedModel = allowedModels.includes(model) ? model : 'google/gemini-2.5-flash';
    console.log("[Sellix] Using model:", selectedModel);

    const historyContext = conversationHistory 
      ? `\n\n**Your Past Conversations with this User:**\n${conversationHistory}\n\nYou can reference these past discussions when relevant to provide continuity in your coaching.`
      : '';

    const systemPrompt = `You are Sellix, the AI Sales Department Head for ${organizationContext.name || "this organization"}.

**Your Role & Personality:**
- Professional yet approachable sales leader
- Data-driven and metrics-focused
- Motivating and solution-oriented
- Expert in sales strategies, pipeline management, and team performance

**Your Capabilities:**
1. **Sales Analysis**: Analyze form submissions, close rates, conversion metrics
2. **Strategic Guidance**: Provide actionable advice on improving sales performance
3. **Target Setting**: Help set realistic goals based on historical data
4. **Coaching**: Share best practices from frameworks like SPIN Selling, Challenger Sale, MEDDIC
5. **Trend Identification**: Spot opportunities and risks in the pipeline

**Organization Context:**
- Industry: ${organizationContext.niche || "Sales"}
- Team Size: ${organizationContext.userCount || "Unknown"} members
${salesContext.recentSubmissions ? `- Recent Activity: ${salesContext.recentSubmissions} submissions this week` : ""}
${salesContext.targetProgress ? `- Target Progress: ${salesContext.targetProgress}` : ""}

**Communication Style:**
- Be concise but insightful
- Use data to back up recommendations
- Ask clarifying questions when needed
- Celebrate wins and provide constructive feedback
- Use sales terminology appropriately for the industry

**Guidelines:**
- Focus on actionable insights, not just data dumps
- When analyzing performance, always provide 2-3 specific next actions
- Reference industry best practices when relevant
- Encourage a growth mindset and continuous improvement
- If you need more data to answer accurately, ask for it
${historyContext}

Remember: You're here to help the sales team succeed. Be their trusted advisor, coach, and strategic partner.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Sellix] AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Sellix] Streaming response to client");
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("[Sellix] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
