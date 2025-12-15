import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { csvHeaders, glossaryTerms, userQuery, sheetData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log('Analyzing sheet with:', { csvHeaders, glossaryTermsCount: glossaryTerms?.length, userQuery });

    // Filter out empty rows (rows where all cells are empty/null/undefined)
    const nonEmptyRows = sheetData ? sheetData.filter((row: any[]) => 
      row.some(cell => cell !== null && cell !== undefined && cell !== '')
    ) : [];

    // Take up to 300 rows for analysis
    const sampleData = nonEmptyRows.slice(0, 300);
    
    console.log('Data analysis:', { 
      totalRows: nonEmptyRows.length, 
      sampleRows: sampleData.length,
      hasData: sampleData.length > 0 
    });

    // Strict date validation function - includes Month/Year formats
    function isValidDateString(val: any): boolean {
      if (!val || typeof val !== 'string') return false;
      
      const trimmed = val.trim();
      
      // Check for common date formats including month/year patterns
      const dateFormats = [
        /^\d{4}-\d{2}-\d{2}$/,           // YYYY-MM-DD
        /^\d{4}-\d{2}$/,                  // YYYY-MM (year-month)
        /^\d{4}\/\d{2}$/,                 // YYYY/MM
        /^\d{1,2}\/\d{1,2}\/\d{4}$/,     // MM/DD/YYYY or M/D/YYYY
        /^\d{1,2}-\d{1,2}-\d{4}$/,       // MM-DD-YYYY
        /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+\d{4}$/i, // Jan 2024
        /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/i, // January 2024
        /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[-/]\d{2,4}$/i, // Jan-24, Jan/24, Jan-2024
        /^\d{13}$/,                       // Unix timestamp (ms)
        /^\d{10}$/                        // Unix timestamp (s)
      ];
      
      if (!dateFormats.some(regex => regex.test(trimmed))) {
        return false;
      }
      
      const parsed = new Date(trimmed);
      if (isNaN(parsed.getTime())) return false;
      
      const year = parsed.getFullYear();
      return year >= 1900 && year <= 2100;
    }

    // Analyze date columns and detect time-category columns
    function analyzeDateColumns(data: any[][], headers: string[]) {
      if (!data || data.length < 2) return [];
      
      const dateColumns = headers
        .map((h, idx) => ({ name: h, index: idx }))
        .filter(col => {
          // Check header for time-related keywords
          const headerLower = col.name.toLowerCase();
          const hasTimeKeyword = ['date', 'day', 'month', 'year', 'period', 'week', 'time', 'quarter'].some(
            keyword => headerLower.includes(keyword)
          );
          
          const sample = data.slice(1, Math.min(20, data.length))
            .map(row => row[col.index]);
          const validDates = sample.filter(val => isValidDateString(val));
          
          // Detect time-category columns (e.g., "Week 1", "Q1 2024", "January")
          const hasTimeCategoryPattern = sample.some(val => 
            typeof val === 'string' && (
              /^(Week|Month|Quarter|Q)\s*\d+/i.test(val) ||
              /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(val) ||
              /\d{4}/.test(val) // Contains a year
            )
          );
          
          // Require at least 5 valid dates AND 60% of samples, OR strong header hint with at least 3 valid, OR time-category pattern
          return (validDates.length >= 5 && validDates.length / sample.length >= 0.6) ||
                 (hasTimeKeyword && validDates.length >= 3) ||
                 (hasTimeKeyword && hasTimeCategoryPattern);
        });

      return dateColumns.map(col => {
        const dateValues = data.slice(1)
          .map(row => row[col.index])
          .filter(val => isValidDateString(val))
          .map(val => new Date(val));
        
        const sample = data.slice(1, Math.min(20, data.length))
          .map(row => row[col.index]);
        const isTimeCategoryColumn = dateValues.length < 3 && sample.some(val => 
          typeof val === 'string' && /^(Week|Month|Quarter|Q|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(val)
        );
        
        if (isTimeCategoryColumn) {
          return {
            column: col.name,
            type: 'time-category',
            frequency: 'categorical',
            recommendedGrouping: 'none',
            sampleCount: sample.length,
            note: 'Use as-is for x-axis (e.g., "Week 1", "Q1 2024")'
          };
        }
        
        if (dateValues.length < 2) return null;
        
        const sorted = dateValues.sort((a, b) => a.getTime() - b.getTime());
        const daysBetween = (sorted[sorted.length - 1].getTime() - sorted[0].getTime()) / (1000 * 60 * 60 * 24);
        
        let frequency = 'daily';
        let recommendedGrouping = 'day';
        
        if (daysBetween > 365) {
          frequency = 'yearly';
          recommendedGrouping = 'month';
        } else if (daysBetween > 60) {
          frequency = 'monthly';
          recommendedGrouping = 'month';
        } else if (daysBetween > 14) {
          frequency = 'weekly';
          recommendedGrouping = 'week';
        }
        
        return {
          column: col.name,
          type: 'date',
          minDate: sorted[0].toISOString().split('T')[0],
          maxDate: sorted[sorted.length - 1].toISOString().split('T')[0],
          frequency,
          recommendedGrouping,
          sampleCount: dateValues.length
        };
      }).filter(Boolean);
    }

    const dateAnalysis = analyzeDateColumns(sampleData, csvHeaders);
    console.log('Date analysis:', dateAnalysis);

    // Build enhanced system prompt with date intelligence
    let dateIntelligence = '';
    if (dateAnalysis.length > 0) {
      dateIntelligence = `\n\nDate Intelligence:\n${dateAnalysis.map(d => {
        if (d!.type === 'time-category') {
          return `- Column "${d!.column}": Time-category column (${d!.sampleCount} records)
  → ${d!.note}
  → Perfect for x-axis in charts showing trends or comparisons`;
        }
        return `- Column "${d!.column}": ${d!.minDate} to ${d!.maxDate} (${d!.frequency} data, ${d!.sampleCount} records)
  → Use ${d!.recommendedGrouping} grouping for time-based charts
  → For ${d!.frequency} data, group by ${d!.recommendedGrouping} in your formulas
  → Chart labels should show ${d!.recommendedGrouping === 'month' ? '"Jan 2024", "Feb 2024", etc.' : 'appropriate format for ' + d!.recommendedGrouping}`;
      }).join('\n')}`;
    }

    const systemPrompt = `You are an AI assistant that helps map CSV columns to business glossary terms and generate dashboard components with formulas.

Available glossary terms:
${glossaryTerms ? glossaryTerms.map((t: any) => `- ${t.term_key}: ${t.default_label} (${t.category})`).join('\n') : 'None'}

Your job is to:
1. Map CSV column headers to glossary terms (if glossary provided)
2. Suggest dashboard components (statsCard, barChart, lineChart, pieChart) based on the data
3. Generate formula configurations for aggregations (SUM, AVG, COUNT, MIN, MAX)
4. Provide natural language descriptions

Be smart about data types:
- Numbers → suggest SUM, AVG, MIN, MAX
- Text/Categories → suggest COUNT, group by for charts
- Dates → suggest time-based aggregations with appropriate grouping${dateIntelligence}`;

    let userPrompt = '';
    if (userQuery) {
      // Natural language query mode with explicit time guidance
      const timeGuidance = dateAnalysis.length > 0 
        ? `\n\nIMPORTANT TIME-BASED QUERY GUIDANCE:
- If the user mentions "over time", "by month", "trend", "over the last X", "monthly", "weekly", etc.:
  * ALWAYS use detected date or time-category columns for the x-axis
  * Prefer ${dateAnalysis.map(d => `"${d!.column}"`).join(' or ')} as the x-axis
  * CRITICAL: NEVER transform or generate x-axis labels - use the EXACT original cell values from that column (e.g., if data has "Jan 1", "Feb 1", "Mar 1", use those exact strings, do NOT convert to "Jan 1", "Jan 2", "Jan 3")
  * Do not fill in missing days/months unless explicitly asked; keep exactly the labels present in the data
  * Include time-based grouping in your formula if applicable
  * The description should mention "grouped by ${dateAnalysis[0]?.recommendedGrouping || 'time'}" or "trend over time"`
        : '';
      
      userPrompt = `User wants: "${userQuery}"
      
Available columns: ${csvHeaders.join(', ')}
Total data rows: ${nonEmptyRows.length}

Sample data (first ${sampleData.length} rows):
${sampleData.map((row: any[]) => row.join(' | ')).join('\n')}${timeGuidance}

Generate ONE component that fulfills this request. Include the formula config.`;
    } else {
      // Auto-mapping mode
      userPrompt = `Analyze these CSV columns and suggest 3-5 useful dashboard components:

Columns: ${csvHeaders.join(', ')}
Total data rows: ${nonEmptyRows.length}

Sample data (first ${sampleData.length} rows):
${sampleData.map((row: any[]) => row.join(' | ')).join('\n')}

Suggest components that provide business insights.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_dashboard_suggestions",
            description: "Generate dashboard component suggestions with formulas",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      componentType: {
                        type: "string",
                        enum: ["statsCard", "barChart", "lineChart", "pieChart"]
                      },
                      title: { type: "string" },
                      description: { type: "string" },
                      formula: {
                        type: "object",
                        properties: {
                          type: { type: "string", enum: ["aggregation"] },
                          operation: { type: "string", enum: ["SUM", "AVG", "COUNT", "MIN", "MAX"] },
                          sourceColumn: { type: "string" },
                          filters: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                column: { type: "string" },
                                operator: { type: "string" },
                                value: { type: "string" }
                              }
                            }
                          }
                        },
                        required: ["type", "operation", "sourceColumn"]
                      },
                      dataBinding: {
                        type: "object",
                        properties: {
                          columns: {
                            type: "object",
                            properties: {
                              x: { type: "string" },
                              y: { type: "string" },
                              value: { type: "string" }
                            }
                          }
                        }
                      },
                      glossaryMapping: {
                        type: "object",
                        properties: {
                          csvColumn: { type: "string" },
                          glossaryTerm: { type: "string" }
                        }
                      }
                    },
                    required: ["componentType", "title", "description"]
                  }
                }
              },
              required: ["suggestions"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_dashboard_suggestions" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 503) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable. Please try again in a moment." }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI Response:', JSON.stringify(aiResponse, null, 2));

    // Extract tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const suggestions = JSON.parse(toolCall.function.arguments);
    console.log('Generated suggestions:', suggestions);

    return new Response(
      JSON.stringify(suggestions),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-sheet:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
