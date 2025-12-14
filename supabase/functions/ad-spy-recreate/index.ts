import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { adId } = await req.json();

    console.log('Ad recreation request:', { adId, userId: user.id });

    // Fetch ad and analysis
    const { data: adData, error: adError } = await supabase
      .from('ad_spy_ads')
      .select(`
        *,
        ad_spy_analysis (*)
      `)
      .eq('id', adId)
      .single();

    if (adError || !adData) throw new Error('Ad not found');

    const analysis = adData.ad_spy_analysis?.[0];
    if (!analysis) throw new Error('Analysis not available');

    // Generate recreation using AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('AI not configured');

    const prompt = `Based on this ad analysis, create a new ad script for a similar product/service:

Original Analysis:
- Hook: ${analysis.hook}
- Angle: ${analysis.angle}
- Emotion: ${analysis.emotion}
- CTA: ${analysis.cta}
- Why it works: ${analysis.why_it_works}

Create a NEW ad script that:
1. Uses a different hook but same emotional trigger
2. Maintains the successful angle
3. Adapts the structure to feel fresh
4. Keeps a strong, clear CTA

Provide the new script in a ready-to-use format.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const aiData = await response.json();
    const recreatedScript = aiData.choices[0].message.content;

    // Save recreation
    const { data: recreationData, error: recreationError } = await supabase
      .from('ad_spy_recreations')
      .insert({
        ad_id: adId,
        user_id: user.id,
        recreated_script: recreatedScript,
        status: 'completed',
      })
      .select()
      .single();

    if (recreationError) throw recreationError;

    return new Response(
      JSON.stringify({
        success: true,
        recreation: recreationData,
        script: recreatedScript,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in ad-spy-recreate:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
