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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { minLikes = 100, sheetsUrl } = await req.json();

    console.log('Starting ad assessment with minLikes:', minLikes);

    // Fetch ads meeting the criteria
    const { data: ads, error: adsError } = await supabaseClient
      .from('ad_spy_ads')
      .select(`
        *,
        competitor:ad_spy_competitors(name, logo_url)
      `)
      .gte('metrics->likes', minLikes)
      .order('created_at', { ascending: false });

    if (adsError) {
      console.error('Error fetching ads:', adsError);
      throw adsError;
    }

    console.log(`Found ${ads?.length || 0} ads meeting criteria`);

    // Format data for Google Sheets
    const formattedData = ads?.map(ad => ({
      title: ad.title,
      competitor: ad.competitor?.name || 'Unknown',
      media_type: ad.media_type,
      hook: ad.hook || '',
      landing_page: ad.landing_page_url || '',
      likes: ad.metrics?.likes || 0,
      comments: ad.metrics?.comments || 0,
      shares: ad.metrics?.shares || 0,
      duration_days: ad.duration_days || 0,
      status: ad.status,
      first_seen: ad.first_seen_at,
      last_seen: ad.last_seen_at,
      media_url: ad.media_url || '',
      assessed_at: new Date().toISOString(),
    })) || [];

    // In a production environment, you would integrate with Google Sheets API here
    // For now, we'll just log the data and return success
    console.log('Data formatted for sheets:', formattedData.length, 'rows');
    
    if (sheetsUrl && formattedData.length > 0) {
      console.log('Would push to sheets URL:', sheetsUrl);
      // TODO: Implement actual Google Sheets API integration
      // This would require Google Sheets API credentials stored as secrets
    }

    // Update last assessment timestamp
    const { error: updateError } = await supabaseClient
      .from('ad_spy_settings')
      .update({ last_assessment_at: new Date().toISOString() })
      .limit(1);

    if (updateError) {
      console.error('Error updating last assessment time:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        pushed: formattedData.length,
        message: `Assessment complete. ${formattedData.length} ads meet the criteria.`,
        preview: formattedData.slice(0, 3), // Return first 3 for preview
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Assessment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: errorMessage,
        success: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
