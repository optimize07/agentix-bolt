// Edge function to export Central Brain data from the database
// This function uses the SERVICE_ROLE_KEY to bypass RLS restrictions
// Deploy this to the source Supabase project and invoke it to get the data

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Tables to export with their relationships
const TABLES_TO_EXPORT = [
  // Content management
  'content_groups',
  'assets',
  'swipe_files',
  'prompt_templates',
  'ai_roles',
  'knowledge_entries',
  
  // Strategy
  'project_strategies',
  'market_research',
  'funnels',
  'offers',
  'offer_assets',
  
  // Tools & Integrations
  'project_tools',
  'integrations',
  
  // Agent Projects
  'agent_boards',
  'project_groups',
  'board_settings',
  'board_tools',
  
  // Creative Cards (Kanban)
  'creative_cards',
  
  // Canvas
  'canvas_blocks',
  'canvas_edges',
  'canvas_groups',
  
  // Chat
  'agent_chat_sessions',
  'agent_chat_messages',
  // Note: Some projects might have 'chat_sessions' and 'chat_messages' instead
  
  // Ad Spy
  'ad_spy_competitors',
  'ad_spy_ads',
  'ad_spy_boards',
  'ad_spy_board_items',
  'ad_spy_search_history',
  'ad_spy_settings',
  'ad_spy_research_agents',
  
  // App Settings
  'app_settings',
];

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
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

    console.log('Starting export of Central Brain data...')

    const exportData: Record<string, any[]> = {}
    const errors: Record<string, string> = {}
    const stats: Record<string, number> = {}

    // Export each table
    for (const tableName of TABLES_TO_EXPORT) {
      try {
        console.log(`Exporting table: ${tableName}`)
        
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(10000) // Safety limit

        if (error) {
          // Table might not exist in this project - that's okay
          if (error.code === '42P01' || error.message.includes('does not exist')) {
            console.log(`Table ${tableName} does not exist, skipping...`)
            errors[tableName] = 'Table does not exist'
          } else {
            console.error(`Error exporting ${tableName}:`, error)
            errors[tableName] = error.message
          }
          exportData[tableName] = []
          stats[tableName] = 0
        } else {
          exportData[tableName] = data || []
          stats[tableName] = data?.length || 0
          console.log(`Exported ${stats[tableName]} rows from ${tableName}`)
        }
      } catch (tableError: any) {
        console.error(`Exception exporting ${tableName}:`, tableError)
        errors[tableName] = tableError.message || 'Unknown error'
        exportData[tableName] = []
        stats[tableName] = 0
      }
    }

    // Also try to export the old chat_sessions/chat_messages if they exist
    // (Some projects might use these instead of agent_chat_*)
    const legacyTables = ['chat_sessions', 'chat_messages']
    for (const tableName of legacyTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(10000)

        if (!error && data && data.length > 0) {
          exportData[tableName] = data
          stats[tableName] = data.length
          console.log(`Exported ${stats[tableName]} rows from legacy table ${tableName}`)
        }
      } catch (e) {
        // Silently skip - these are optional legacy tables
      }
    }

    // Calculate total records
    const totalRecords = Object.values(stats).reduce((sum, count) => sum + count, 0)
    const tablesWithData = Object.entries(stats).filter(([_, count]) => count > 0).length
    
    console.log(`Export complete! Total: ${totalRecords} records from ${tablesWithData} tables`)

    // Return the export data
    return new Response(
      JSON.stringify({
        success: true,
        exportedAt: new Date().toISOString(),
        summary: {
          totalRecords,
          tablesWithData,
          tablesExported: TABLES_TO_EXPORT.length,
        },
        stats,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
        data: exportData,
      }, null, 2),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error: any) {
    console.error('Export failed:', error)
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

