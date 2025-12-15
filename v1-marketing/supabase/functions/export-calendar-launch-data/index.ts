// Edge function to export Calendar and Launch data from the agentix-marketing database
// This function uses the SERVICE_ROLE_KEY to bypass RLS restrictions
// Deploy this to the SOURCE Supabase project (wwaxocfjvmvglzdsiepz) and invoke it to get the data

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Tables to export for Calendar and Launch features
const TABLES_TO_EXPORT = [
  // Calendar / Scheduled Posts
  'scheduled_posts',
  
  // Chat / Launch feature
  'chat_sessions',
  'chat_messages',
  
  // Agent boards (might be referenced by scheduled_posts or chat_sessions)
  'agent_boards',
  
  // Creative cards (might be referenced by scheduled_posts)
  'creative_cards',
  
  // Canvas blocks (might be referenced by chat_sessions)
  'canvas_blocks',
  
  // Also export any content that might be related
  'content_groups',
  'assets',
];

// Additional tables that might exist with similar names
const ALTERNATIVE_TABLES = [
  // Some projects might use different naming
  'posts',
  'campaign_posts',
  'content_calendar',
  'campaigns',
  
  // Alternative chat tables
  'agent_chat_sessions',
  'agent_chat_messages',
  'conversations',
  'messages',
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

    console.log('Starting export of Calendar and Launch data...')
    console.log(`Supabase URL: ${supabaseUrl}`)

    const exportData: Record<string, any[]> = {}
    const errors: Record<string, string> = {}
    const stats: Record<string, number> = {}
    const tableSchemas: Record<string, any> = {}

    // Helper function to export a table
    async function exportTable(tableName: string, isOptional = false) {
      try {
        console.log(`Exporting table: ${tableName}`)
        
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(10000) // Safety limit

        if (error) {
          if (error.code === '42P01' || error.message.includes('does not exist')) {
            if (!isOptional) {
              console.log(`Table ${tableName} does not exist`)
              errors[tableName] = 'Table does not exist'
            }
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
          
          // If we got data, try to capture the schema from the first row
          if (data && data.length > 0) {
            tableSchemas[tableName] = Object.keys(data[0])
          }
        }
      } catch (tableError: any) {
        console.error(`Exception exporting ${tableName}:`, tableError)
        if (!isOptional) {
          errors[tableName] = tableError.message || 'Unknown error'
        }
        exportData[tableName] = []
        stats[tableName] = 0
      }
    }

    // Export main tables
    for (const tableName of TABLES_TO_EXPORT) {
      await exportTable(tableName)
    }

    // Try alternative table names (silently, they're optional)
    for (const tableName of ALTERNATIVE_TABLES) {
      await exportTable(tableName, true)
    }

    // Also try to get the database schema information if possible
    let schemaInfo = null
    try {
      // Try to get column information from information_schema
      const { data: columnsData, error: columnsError } = await supabase.rpc('get_table_columns', {})
      if (!columnsError && columnsData) {
        schemaInfo = columnsData
      }
    } catch (e) {
      // Schema introspection might not be available, that's okay
      console.log('Schema introspection not available')
    }

    // Calculate total records
    const totalRecords = Object.values(stats).reduce((sum, count) => sum + count, 0)
    const tablesWithData = Object.entries(stats).filter(([_, count]) => count > 0).length
    
    console.log(`Export complete! Total: ${totalRecords} records from ${tablesWithData} tables`)

    // Create summary of what was found
    const foundTables = Object.entries(stats)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({ name, count, columns: tableSchemas[name] || [] }))

    // Return the export data
    return new Response(
      JSON.stringify({
        success: true,
        exportedAt: new Date().toISOString(),
        sourceProject: supabaseUrl,
        summary: {
          totalRecords,
          tablesWithData,
          tablesChecked: TABLES_TO_EXPORT.length + ALTERNATIVE_TABLES.length,
        },
        foundTables,
        stats,
        tableSchemas,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
        schemaInfo,
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
        stack: error.stack,
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

