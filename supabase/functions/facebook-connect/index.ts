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

    const { accessToken, accountId, accountName } = await req.json();

    if (!accessToken || !accountId || !accountName) {
      throw new Error('Missing required fields: accessToken, accountId, accountName');
    }

    console.log(`Connecting Facebook account ${accountId} for user ${user.id}`);

    // Verify the token is valid by making a test API call
    const testResponse = await fetch(
      `https://graph.facebook.com/v21.0/act_${accountId}?fields=name&access_token=${accessToken}`
    );

    if (!testResponse.ok) {
      throw new Error('Invalid Facebook access token or account ID');
    }

    // Store the account (token would be encrypted in production using Supabase Vault)
    const { data, error } = await supabaseClient
      .from('facebook_ad_accounts')
      .upsert({
        user_id: user.id,
        account_id: accountId,
        account_name: accountName,
        access_token_encrypted: accessToken, // In production, encrypt this
        is_active: true,
        last_synced_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,account_id'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save Facebook account: ${error.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        account: data,
        message: 'Facebook account connected successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in facebook-connect:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});