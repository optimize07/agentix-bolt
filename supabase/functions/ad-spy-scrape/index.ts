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

    const { searchQuery, searchType } = await req.json();

    console.log('Ad Spy scrape request:', { searchQuery, searchType, userId: user.id });

    // Create search record
    const { data: searchData, error: searchError } = await supabase
      .from('ad_spy_searches')
      .insert({
        user_id: user.id,
        search_query: searchQuery,
        search_type: searchType,
      })
      .select()
      .single();

    if (searchError) throw searchError;

    // Start background processing
    processAdScraping(searchData.id, searchQuery, searchType, supabaseUrl, supabaseKey);

    return new Response(
      JSON.stringify({
        success: true,
        searchId: searchData.id,
        message: 'Scraping started',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in ad-spy-scrape:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processAdScraping(
  searchId: string,
  searchQuery: string,
  searchType: string,
  supabaseUrl: string,
  supabaseKey: string
) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('Starting ad scraping process for search:', searchId);

    // Mock scraping for now - in production, this would use Puppeteer or similar
    const mockAds = [
      {
        search_id: searchId,
        ad_library_url: `https://www.facebook.com/ads/library/?id=mock_${Date.now()}`,
        platform: 'facebook',
        video_url: 'https://example.com/video1.mp4',
        image_url: null,
        ad_copy: 'Discover the secret to 10x growth with our proven system. Limited time offer!',
      },
    ];

    // Insert scraped ads
    const { data: adsData, error: adsError } = await supabase
      .from('ad_spy_ads')
      .insert(mockAds)
      .select();

    if (adsError) throw adsError;

    console.log('Ads inserted:', adsData?.length);

    // Analyze each ad using AI
    for (const ad of adsData || []) {
      await analyzeAd(ad.id, ad.ad_copy || '', supabase);
    }

    console.log('Ad scraping and analysis completed for search:', searchId);

  } catch (error: any) {
    console.error('Error in processAdScraping:', error);
  }
}

async function analyzeAd(adId: string, adCopy: string, supabase: any) {
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return;
    }

    const prompt = `Analyze this Facebook ad copy and extract:
1. Hook (the attention-grabbing opening)
2. Angle (the unique selling approach)
3. Emotion (the emotional trigger being used)
4. CTA (the call to action)
5. Script Summary (brief overview of the ad structure)
6. Why It Works (explanation of why this ad is effective)

Ad Copy:
${adCopy}

Respond in JSON format with keys: hook, angle, emotion, cta, script_summary, why_it_works`;

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
    const content = aiData.choices[0].message.content;

    // Try to parse JSON from the response
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      analysis = {
        hook: 'Unable to extract',
        angle: 'Unable to extract',
        emotion: 'Unable to extract',
        cta: 'Unable to extract',
        script_summary: content,
        why_it_works: 'Analysis in progress',
      };
    }

    // Insert analysis
    const { error: analysisError } = await supabase
      .from('ad_spy_analysis')
      .insert({
        ad_id: adId,
        hook: analysis.hook,
        angle: analysis.angle,
        emotion: analysis.emotion,
        cta: analysis.cta,
        script_summary: analysis.script_summary,
        why_it_works: analysis.why_it_works,
      });

    if (analysisError) throw analysisError;

    console.log('Analysis completed for ad:', adId);

  } catch (error: any) {
    console.error('Error analyzing ad:', error);
  }
}
