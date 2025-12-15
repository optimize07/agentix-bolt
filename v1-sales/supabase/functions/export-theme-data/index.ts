// Edge function to export Theme Builder data from the source database (sales-spotlight-hub)
// This function uses the SERVICE_ROLE_KEY to bypass RLS restrictions
// Deploy this to the SOURCE Supabase project (gryxarbwnvmitksyzhvi) and invoke it to get the data
//
// Deployment:
//   npx supabase functions deploy export-theme-data --project-ref gryxarbwnvmitksyzhvi
//
// Invocation (PowerShell):
//   Invoke-WebRequest -Uri "https://gryxarbwnvmitksyzhvi.supabase.co/functions/v1/export-theme-data" -Method POST -Headers @{"Authorization"="Bearer YOUR_ANON_KEY"} -OutFile theme-data-export.json

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Theme-related tables to export
const TABLES_TO_EXPORT = [
  // Theme settings from sales-spotlight-hub
  'organization_theme_settings',
  'custom_theme_presets',
  
  // Also check for any profiles that might have theme preferences
  'profiles',
  
  // Organization data that might be needed
  'organizations',
];

// Also export the CSS/styling from the source to understand the structure
const SCHEMA_QUERIES = [
  // Get organization_theme_settings table structure
  {
    name: 'organization_theme_settings_columns',
    query: `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'organization_theme_settings'
      ORDER BY ordinal_position
    `
  },
  // Get custom_theme_presets table structure
  {
    name: 'custom_theme_presets_columns',
    query: `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'custom_theme_presets'
      ORDER BY ordinal_position
    `
  },
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

    console.log('Starting export of Theme Builder data from sales-spotlight-hub...')

    const exportData: Record<string, any[]> = {}
    const schemaData: Record<string, any[]> = {}
    const errors: Record<string, string> = {}
    const stats: Record<string, number> = {}

    // Export schema information first
    console.log('Exporting schema information...')
    for (const schemaQuery of SCHEMA_QUERIES) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: schemaQuery.query })
        
        if (error) {
          // Try raw query if RPC doesn't exist
          console.log(`Schema query via RPC failed for ${schemaQuery.name}, trying direct...`)
        } else {
          schemaData[schemaQuery.name] = data || []
          console.log(`Got schema info for ${schemaQuery.name}`)
        }
      } catch (e) {
        console.log(`Could not get schema for ${schemaQuery.name}`)
      }
    }

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

    // Calculate total records
    const totalRecords = Object.values(stats).reduce((sum, count) => sum + count, 0)
    const tablesWithData = Object.entries(stats).filter(([_, count]) => count > 0).length
    
    console.log(`Export complete! Total: ${totalRecords} records from ${tablesWithData} tables`)

    // Generate SQL insert statements for importing into the new database
    const sqlStatements: string[] = []
    
    // Generate INSERT statements for organization_theme_settings
    if (exportData['organization_theme_settings'] && exportData['organization_theme_settings'].length > 0) {
      sqlStatements.push('-- organization_theme_settings data')
      for (const row of exportData['organization_theme_settings']) {
        const columns = Object.keys(row).filter(k => row[k] !== null)
        const values = columns.map(k => {
          const val = row[k]
          if (val === null) return 'NULL'
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`
          if (typeof val === 'boolean') return val ? 'true' : 'false'
          return val
        })
        sqlStatements.push(`INSERT INTO organization_theme_settings (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;`)
      }
    }
    
    // Generate INSERT statements for custom_theme_presets
    if (exportData['custom_theme_presets'] && exportData['custom_theme_presets'].length > 0) {
      sqlStatements.push('\n-- custom_theme_presets data')
      for (const row of exportData['custom_theme_presets']) {
        const columns = Object.keys(row).filter(k => row[k] !== null)
        const values = columns.map(k => {
          const val = row[k]
          if (val === null) return 'NULL'
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`
          if (typeof val === 'boolean') return val ? 'true' : 'false'
          return val
        })
        sqlStatements.push(`INSERT INTO custom_theme_presets (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;`)
      }
    }

    // Return the export data
    return new Response(
      JSON.stringify({
        success: true,
        exportedAt: new Date().toISOString(),
        sourceProject: 'gryxarbwnvmitksyzhvi (sales-spotlight-hub)',
        summary: {
          totalRecords,
          tablesWithData,
          tablesExported: TABLES_TO_EXPORT.length,
        },
        stats,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
        schema: schemaData,
        data: exportData,
        sqlStatements: sqlStatements.length > 0 ? sqlStatements.join('\n') : null,
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
