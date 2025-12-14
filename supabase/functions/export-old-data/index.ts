/**
 * Export Data from OLD Supabase (Lovable Cloud)
 *
 * This edge function is deployed to your NEW Supabase,
 * but connects to the OLD Supabase to read data.
 *
 * Since we don't have the service role key for Lovable Cloud,
 * we'll pass the user's auth token from their browser session
 * which bypasses RLS.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OLD_SUPABASE_URL = 'https://pooeaxqkysmngpnpnswn.supabase.co';
const OLD_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvb2VheHFreXNtbmdwbnBuc3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNTk3ODgsImV4cCI6MjA3NjgzNTc4OH0.Tx38u656P8LUvpQCH5rp6d5flDtV_f9_vsMEn8cr4FI';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const url = new URL(req.url);
    const tableName = url.searchParams.get('table');
    const userToken = url.searchParams.get('token'); // User's auth token from browser

    if (!tableName) {
      return new Response(
        JSON.stringify({ error: 'Missing table parameter' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Create client with user's token to bypass RLS
    const oldSupabase = createClient(
      OLD_SUPABASE_URL,
      OLD_SUPABASE_ANON_KEY,
      {
        global: {
          headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Fetch all data with pagination
    let allData: any[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await oldSupabase
        .from(tableName)
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.error(`Error fetching ${tableName}:`, error);

        // Return empty array for tables that don't exist
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          return new Response(
            JSON.stringify([]),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              }
            }
          );
        }

        return new Response(
          JSON.stringify({ error: error.message, code: error.code }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            }
          }
        );
      }

      if (!data || data.length === 0) {
        break;
      }

      allData = allData.concat(data);

      if (data.length < pageSize) {
        break;
      }

      page++;
    }

    return new Response(
      JSON.stringify(allData),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  } catch (error: any) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
});
