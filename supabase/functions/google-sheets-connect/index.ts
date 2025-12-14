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

    const { spreadsheetId, spreadsheetName } = await req.json();

    if (!spreadsheetId) {
      throw new Error('Missing required field: spreadsheetId');
    }

    console.log(`Connecting Google Sheet ${spreadsheetId} for user ${user.id}`);

    // Extract spreadsheet ID from URL if full URL provided
    let cleanSpreadsheetId = spreadsheetId;
    if (spreadsheetId.includes('docs.google.com')) {
      const match = spreadsheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        cleanSpreadsheetId = match[1];
      }
    }

    // In production, validate access to the sheet using Google Sheets API
    // For now, just store the connection
    const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL') || 'service-account@example.com';

    const { data, error } = await supabaseClient
      .from('google_sheets_connections')
      .upsert({
        user_id: user.id,
        spreadsheet_id: cleanSpreadsheetId,
        spreadsheet_name: spreadsheetName || 'Ad Generator',
        service_account_email: serviceAccountEmail,
        is_active: true,
        last_accessed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,spreadsheet_id'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save Google Sheets connection: ${error.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        connection: data,
        message: 'Google Sheets connected successfully',
        instructions: `Make sure to share the sheet with: ${serviceAccountEmail}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in google-sheets-connect:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});