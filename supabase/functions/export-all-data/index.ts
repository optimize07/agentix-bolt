// Data Export Edge Function
// Deploy this to OLD Lovable Cloud Supabase to export all data
// Uses service role key automatically available in edge function environment

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TABLES_TO_EXPORT = [
  'agent_configs',
  'agent_messages',
  'clients',
  'knowledge_base_items',
  'market_research_reports',
  'n8n_connections',
  'project_agents',
  'project_asset_statuses',
  'project_tasks',
  'projects'
];

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role key (automatically available in edge function)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const table = url.searchParams.get("table");

    // If table specified, export just that table
    if (table) {
      console.log(`Exporting table: ${table}`);

      let allData: any[] = [];
      let page = 0;
      const pageSize = 1000;

      while (true) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
          console.error(`Error fetching ${table}:`, error);

          // Return empty array for tables that don't exist
          if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
            return new Response(JSON.stringify([]), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify({ error: error.message, code: error.code }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (!data || data.length === 0) break;

        allData = allData.concat(data);

        if (data.length < pageSize) break;

        page++;
      }

      console.log(`Exported ${allData.length} rows from ${table}`);

      return new Response(JSON.stringify(allData), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No table specified - export all tables
    console.log('Exporting all tables...');

    const allExports: Record<string, any[]> = {};
    const stats: Record<string, { rows: number, error?: string }> = {};

    for (const tableName of TABLES_TO_EXPORT) {
      try {
        console.log(`Exporting ${tableName}...`);

        let allData: any[] = [];
        let page = 0;
        const pageSize = 1000;

        while (true) {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .range(page * pageSize, (page + 1) * pageSize - 1);

          if (error) {
            console.error(`Error fetching ${tableName}:`, error);
            stats[tableName] = { rows: 0, error: error.message };
            break;
          }

          if (!data || data.length === 0) break;

          allData = allData.concat(data);

          if (data.length < pageSize) break;

          page++;
        }

        allExports[tableName] = allData;
        stats[tableName] = { rows: allData.length };
        console.log(`Exported ${allData.length} rows from ${tableName}`);

      } catch (err) {
        console.error(`Failed to export ${tableName}:`, err);
        stats[tableName] = {
          rows: 0,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }
    }

    return new Response(JSON.stringify({
      data: allExports,
      stats: stats,
      totalRows: Object.values(allExports).reduce((sum, arr) => sum + arr.length, 0)
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Export Error:", err);
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
