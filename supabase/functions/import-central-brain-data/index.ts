// Edge function to import Central Brain data into the database
// This function uses the SERVICE_ROLE_KEY to bypass RLS restrictions
// Deploy this to the TARGET Supabase project and invoke it with the exported data

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Tables in order of dependency (insert in this order to respect foreign keys)
const IMPORT_ORDER = [
  // Independent tables first
  'content_groups',
  'app_settings',
  
  // Agent projects hierarchy
  'agent_boards',
  'project_groups',
  'board_settings',
  'board_tools',
  
  // Content that may reference agent_boards
  'assets',
  'prompt_templates',
  'ai_roles',
  'knowledge_entries',
  'swipe_files',
  'project_strategies',
  'market_research',
  'funnels',
  'project_tools',
  'integrations',
  
  // Offers (then their assets)
  'offers',
  'offer_assets',
  
  // Creative cards (Kanban)
  'creative_cards',
  
  // Canvas (depends on agent_boards)
  'canvas_blocks',
  'canvas_groups',
  'canvas_edges',
  
  // Chat (depends on agent_boards)
  'agent_chat_sessions',
  'agent_chat_messages',
  
  // Ad Spy
  'ad_spy_settings',
  'ad_spy_competitors',
  'ad_spy_boards',
  'ad_spy_ads',
  'ad_spy_board_items',
  'ad_spy_search_history',
  'ad_spy_research_agents',
]

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST with the export data in the body.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Get the export data from the request body
    const body = await req.json()
    const exportData = body.data

    if (!exportData) {
      return new Response(
        JSON.stringify({ error: 'No data provided. Send the export data in the request body.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log('Starting import of Central Brain data...')

    const results: Record<string, { inserted: number; errors: string[] }> = {}

    // Import tables in dependency order
    for (const tableName of IMPORT_ORDER) {
      const tableData = exportData[tableName]
      
      if (!tableData || tableData.length === 0) {
        console.log(`Skipping ${tableName} - no data to import`)
        results[tableName] = { inserted: 0, errors: [] }
        continue
      }

      console.log(`Importing ${tableData.length} rows into ${tableName}...`)

      try {
        // Use upsert to handle conflicts (in case some data already exists)
        const { data, error } = await supabase
          .from(tableName)
          .upsert(tableData, {
            onConflict: 'id', // Assume all tables have 'id' as primary key
            ignoreDuplicates: false, // Update existing records
          })
          .select()

        if (error) {
          console.error(`Error importing ${tableName}:`, error)
          results[tableName] = { 
            inserted: 0, 
            errors: [error.message] 
          }
        } else {
          results[tableName] = { 
            inserted: tableData.length, 
            errors: [] 
          }
          console.log(`Successfully imported ${tableData.length} rows into ${tableName}`)
        }
      } catch (tableError: any) {
        console.error(`Exception importing ${tableName}:`, tableError)
        results[tableName] = { 
          inserted: 0, 
          errors: [tableError.message || 'Unknown error'] 
        }
      }
    }

    // Handle legacy chat tables if present
    for (const legacyTable of ['chat_sessions', 'chat_messages']) {
      const tableData = exportData[legacyTable]
      if (tableData && tableData.length > 0) {
        try {
          const { error } = await supabase
            .from(legacyTable)
            .upsert(tableData, { onConflict: 'id', ignoreDuplicates: false })

          if (!error) {
            results[legacyTable] = { inserted: tableData.length, errors: [] }
          }
        } catch (e) {
          // Silently skip legacy tables that don't exist
        }
      }
    }

    // Calculate summary
    const totalInserted = Object.values(results).reduce((sum, r) => sum + r.inserted, 0)
    const tablesWithData = Object.entries(results).filter(([_, r]) => r.inserted > 0).length
    const tablesWithErrors = Object.entries(results).filter(([_, r]) => r.errors.length > 0).length

    console.log(`Import complete! Inserted ${totalInserted} records into ${tablesWithData} tables`)

    return new Response(
      JSON.stringify({
        success: true,
        importedAt: new Date().toISOString(),
        summary: {
          totalInserted,
          tablesWithData,
          tablesWithErrors,
        },
        results,
      }, null, 2),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error: any) {
    console.error('Import failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})

