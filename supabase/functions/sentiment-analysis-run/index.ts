import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { timeWindowDays = 7, triggerType = 'manual' } = await req.json();

    console.log(`Starting Ad Spy run for user ${user.id}, window: ${timeWindowDays} days, trigger: ${triggerType}`);

    // Check if user has Facebook account connected
    const { data: fbAccounts, error: fbError } = await supabaseClient
      .from('facebook_ad_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (fbError || !fbAccounts) {
      throw new Error('No Facebook ad account connected. Please connect your account first.');
    }

    // Check if user has Google Sheets connected
    const { data: sheetsConnection, error: sheetsError } = await supabaseClient
      .from('google_sheets_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (sheetsError || !sheetsConnection) {
      throw new Error('No Google Sheets connected. Please connect your Ad Generator sheet first.');
    }

    // Create new run record
    const { data: run, error: runError } = await supabaseClient
      .from('ad_spy_runs')
      .insert({
        user_id: user.id,
        trigger_type: triggerType,
        status: 'pending',
        time_window_days: timeWindowDays,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (runError || !run) {
      throw new Error('Failed to create run record');
    }

    // Start background processing
    processAdSpyRun(run.id, user.id, fbAccounts, sheetsConnection, timeWindowDays, supabaseClient);

    return new Response(
      JSON.stringify({ 
        success: true, 
        runId: run.id,
        message: 'Ad analysis started. You will be notified when it completes.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ad-spy-run:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processAdSpyRun(
  runId: string,
  userId: string,
  fbAccount: any,
  sheetsConnection: any,
  timeWindowDays: number,
  supabaseClient: any
) {
  try {
    // Update status to analyzing
    await supabaseClient
      .from('ad_spy_runs')
      .update({ status: 'analyzing' })
      .eq('id', runId);

    console.log(`Analyzing ads for run ${runId}`);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeWindowDays);

    const since = startDate.toISOString().split('T')[0];
    const until = endDate.toISOString().split('T')[0];

    // Fetch ad insights from Facebook
    const fbResponse = await fetch(
      `https://graph.facebook.com/v21.0/act_${fbAccount.account_id}/insights?` +
      `fields=ad_id,ad_name,impressions,clicks,ctr,conversions,spend,reach,actions&` +
      `time_range={"since":"${since}","until":"${until}"}&` +
      `level=ad&` +
      `limit=100&` +
      `access_token=${fbAccount.access_token_encrypted}`
    );

    if (!fbResponse.ok) {
      const errorText = await fbResponse.text();
      throw new Error(`Facebook API error: ${fbResponse.status} - ${errorText}`);
    }

    const fbData = await fbResponse.json();
    console.log(`Retrieved ${fbData.data?.length || 0} ads from Facebook`);

    if (!fbData.data || fbData.data.length === 0) {
      throw new Error('No ads found in the specified time window');
    }

    // Calculate ROAS and filter for video ads
    const adsWithMetrics = fbData.data
      .map((ad: any) => {
        const conversions = parseFloat(ad.conversions || '0');
        const spend = parseFloat(ad.spend || '0');
        const roas = spend > 0 ? conversions / spend : 0;
        
        return {
          ad_id: ad.ad_id,
          ad_name: ad.ad_name,
          impressions: parseInt(ad.impressions || '0'),
          clicks: parseInt(ad.clicks || '0'),
          ctr: parseFloat(ad.ctr || '0'),
          conversions: conversions,
          spend: spend,
          roas: roas,
          reach: parseInt(ad.reach || '0'),
        };
      })
      .filter((ad: any) => ad.ad_name && ad.impressions > 0)
      .sort((a: any, b: any) => b.roas - a.roas)
      .slice(0, 3);

    console.log(`Top 3 performers:`, adsWithMetrics.map((a: any) => ({ name: a.ad_name, roas: a.roas })));

    // Process each top performer
    for (let rank = 0; rank < adsWithMetrics.length; rank++) {
      const ad = adsWithMetrics[rank];
      
      // Fetch ad creative details
      const adDetailsResponse = await fetch(
        `https://graph.facebook.com/v21.0/${ad.ad_id}?fields=creative{video_id,thumbnail_url,object_story_spec}&access_token=${fbAccount.access_token_encrypted}`
      );
      
      let videoUrl = null;
      let thumbnailUrl = null;
      
      if (adDetailsResponse.ok) {
        const adDetails = await adDetailsResponse.json();
        thumbnailUrl = adDetails.creative?.thumbnail_url;
        if (adDetails.creative?.video_id) {
          videoUrl = `https://www.facebook.com/${adDetails.creative.video_id}`;
        }
      }

      // Insert top performer
      const { data: topPerformer, error: performerError } = await supabaseClient
        .from('ad_spy_top_performers')
        .insert({
          run_id: runId,
          ad_id: ad.ad_id,
          ad_name: ad.ad_name,
          ad_account_id: fbAccount.account_id,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          performance_metrics: {
            impressions: ad.impressions,
            clicks: ad.clicks,
            ctr: ad.ctr,
            conversions: ad.conversions,
            spend: ad.spend,
            roas: ad.roas,
            reach: ad.reach,
          },
          rank: rank + 1,
        })
        .select()
        .single();

      if (performerError) {
        console.error(`Error inserting top performer ${rank + 1}:`, performerError);
        continue;
      }

      // Fetch ad details from Google Sheets
      const sheetData = await fetchFromGoogleSheets(sheetsConnection.spreadsheet_id, ad.ad_name);
      
      if (!sheetData) {
        console.log(`No sheet data found for ad: ${ad.ad_name}`);
        continue;
      }

      // Generate AI iteration
      const iteration = await generateScriptIteration(ad, sheetData);

      if (iteration) {
        await supabaseClient
          .from('ad_spy_script_iterations')
          .insert({
            top_performer_id: topPerformer.id,
            original_script: sheetData.script,
            original_hooks: sheetData.hooks,
            original_cta: sheetData.cta,
            new_script: iteration.new_script,
            new_hooks: iteration.new_hooks,
            new_cta: iteration.new_cta,
            iteration_rationale: iteration.iteration_rationale,
          });
      }
    }

    // Update run status to completed
    await supabaseClient
      .from('ad_spy_runs')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

    console.log(`Ad Spy run ${runId} completed successfully`);

  } catch (error) {
    console.error(`Error processing run ${runId}:`, error);
    
    await supabaseClient
      .from('ad_spy_runs')
      .update({ 
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);
  }
}

async function fetchFromGoogleSheets(spreadsheetId: string, adName: string) {
  try {
    // For now, return mock data since we need Google Sheets API setup
    // In production, this would use Google Sheets API with service account
    console.log(`Fetching sheet data for ad: ${adName}`);
    
    return {
      script: `This is the original script for ${adName}. It focuses on pain points and provides a clear solution with strong social proof.`,
      hooks: [
        "Hook 1: Are you struggling with low ad performance?",
        "Hook 2: What if I told you there's a better way?",
        "Hook 3: Stop wasting money on ads that don't convert"
      ],
      cta: "Click the link below to get started today!",
    };
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    return null;
  }
}

async function generateScriptIteration(ad: any, sheetData: any) {
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert ad copywriter analyzing top-performing video ad scripts. Your task is to create NEW iterations (not improvements to existing) that test different angles while maintaining the core winning elements.`
          },
          {
            role: 'user',
            content: `
ORIGINAL TOP PERFORMING AD:
Ad Name: ${ad.ad_name}
Performance: ${ad.roas.toFixed(2)}x ROAS, ${ad.ctr.toFixed(2)}% CTR, ${ad.conversions} conversions
Original Script: ${sheetData.script}
Original Hooks: ${JSON.stringify(sheetData.hooks)}
Original CTA: ${sheetData.cta}

Generate a NEW script iteration that:
1. Tests a different hook angle (emotional vs logical, pain vs gain, etc.)
2. Maintains the core offer and value proposition
3. Uses a different storytelling structure
4. Provides 3 alternative hook variations
5. Suggests a CTA variation

Format your response as JSON with these exact fields:
{
  "new_script": "full script here",
  "new_hooks": ["hook 1", "hook 2", "hook 3"],
  "new_cta": "CTA here",
  "iteration_rationale": "why this iteration will perform well"
}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_ad_iteration",
            description: "Generate a new ad script iteration",
            parameters: {
              type: "object",
              properties: {
                new_script: { type: "string" },
                new_hooks: { type: "array", items: { type: "string" } },
                new_cta: { type: "string" },
                iteration_rationale: { type: "string" }
              },
              required: ["new_script", "new_hooks", "new_cta", "iteration_rationale"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_ad_iteration" } }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', errorText);
      return null;
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      return args;
    }

    return null;
  } catch (error) {
    console.error('Error generating script iteration:', error);
    return null;
  }
}