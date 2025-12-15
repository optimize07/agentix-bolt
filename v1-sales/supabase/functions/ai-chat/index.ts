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
    const { messages, context, streaming = true, mode = 'chat' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const selectedModel = context?.model || "google/gemini-2.5-flash";

    console.log('AI Chat request:', { 
      messageCount: messages?.length, 
      hasContext: !!context,
      sheetHeaders: context?.sheetData?.[0],
      glossaryCount: context?.glossaryTerms?.length,
      existingWidgetCount: context?.existingWidgets?.length,
      hasUploadedSheet: context?.hasUploadedSheet,
      model: selectedModel,
      streaming,
      mode
    });

    // Handle generate-config mode (for Configure Widget panel)
    if (mode === 'generate-config') {
      const dataSourcesInfo = context?.dataSources?.map((ds: any) => 
        `- ${ds.name} (ID: ${ds.id}): Columns: ${ds.columns?.join(', ')}`
      ).join('\n') || 'No data sources provided';

      const configPrompt = `Generate widget configuration based on the user's request.

Available data sources:
${dataSourcesInfo}

Widget Configuration Guidelines:
- statsCard/kpi: Use for single metrics (totals, averages, counts). Requires value column and aggregation.
- lineChart: Use for time-series data, trends over time. Requires x (time/category) and y (value) columns.
- barChart: Use for category comparisons. Requires x (category) and y (value) columns.
- pieChart: Use for distribution/composition. Requires label and value columns.
- sheet/table: Use for displaying raw tabular data. No specific column requirements.

Generate a configuration using the generate_widgets tool. Do not ask clarifying questions - make reasonable assumptions based on the request and available data.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: "system", content: configPrompt },
            ...messages
          ],
          stream: false,
          tools: [{
            type: "function",
            function: {
              name: "generate_widgets",
              description: "Generate widget configuration",
              parameters: {
                type: "object",
                properties: {
                  widgets: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        widgetType: {
                          type: "string",
                          enum: ["statsCard", "kpi", "barChart", "lineChart", "pieChart", "sheet", "table"]
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
                                  operator: { type: "string", enum: ["equals", "contains", "greaterThan", "lessThan"] },
                                  value: { type: "string" }
                                }
                              }
                            }
                          }
                        },
                        dataBinding: {
                          type: "object",
                          properties: {
                            sheetId: { type: "string", description: "ID of the data source" },
                            columns: {
                              type: "object",
                              properties: {
                                x: { type: "string", description: "X-axis column (for charts)" },
                                y: { type: "string", description: "Y-axis column (for charts)" },
                                value: { type: "string", description: "Value column (for stats/kpi/pie)" },
                                label: { type: "string", description: "Label column (for pie charts)" }
                              }
                            },
                            aggregation: {
                              type: "string",
                              enum: ["sum", "avg", "count", "min", "max", "none"],
                              description: "Aggregation method for data"
                            }
                          }
                        }
                      },
                      required: ["widgetType", "title", "description"]
                    }
                  }
                },
                required: ["widgets"]
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "generate_widgets" } }
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
            JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Generate-config AI response:', data);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build comprehensive system prompt with all context
    const widgetTypes = [
      { type: 'statsCard', purpose: 'Display single metrics with optional trend indicators', bestFor: 'KPIs, totals, counts, averages' },
      { type: 'barChart', purpose: 'Compare values across categories', bestFor: 'Sales by product, revenue by region, counts by status' },
      { type: 'lineChart', purpose: 'Show trends over time', bestFor: 'Revenue over time, growth trends, time-series data' },
      { type: 'pieChart', purpose: 'Show composition/distribution', bestFor: 'Market share, percentage breakdowns, category distribution' },
      { type: 'sheet', purpose: 'Display detailed tabular data', bestFor: 'Raw data viewing, detailed records' }
    ];

    const glossaryInfo = context?.glossaryTerms?.length > 0 
      ? `\n\nAvailable Glossary Terms (${context.glossaryTerms.length} terms):\n${context.glossaryTerms.map((t: any) => 
          `- ${t.term_key}: "${t.default_label}" (${t.category})`
        ).join('\n')}\n\nUse these terms to help users understand their data in business context.`
      : '';

    const sheetInfo = context?.sheetData?.length > 0
      ? `\n\n${context.hasUploadedSheet ? '📁 Uploaded' : 'Current'} Sheet Structure:\n- Headers: ${context.sheetData[0]?.join(', ')}\n- Rows: ${context.sheetData.length - 1} data rows\n\nSample data (first 3 rows):\n${context.sheetData.slice(1, 4).map((row: any[]) => row.join(' | ')).join('\n')}\n\n⚠️ CRITICAL RULES FOR SHEET/TABLE WIDGETS:\n1. Do NOT generate or include sample data values - data comes from the uploaded CSV\n2. NEVER add formulas to sheet/table widgets - they display RAW DATA ONLY\n3. Formulas (SUM, AVG, COUNT, etc.) are ONLY for statsCard/KPI widgets\n4. Only specify column bindings for sheets, never invent data values or filters`
      : '';
    
    const multiWidgetGuidance = context?.hasUploadedSheet 
      ? `\n\n🎯 UPLOADED DATA DETECTED: When users upload a sheet and ask for analysis or visualization, suggest 3-5 appropriate widgets based on the data structure. Use the generate_widgets tool with an array of widgets to create multiple widgets at once. Examples:\n- If sheet has dates + metrics → suggest line chart (trends), bar chart (comparisons), stats cards (totals)\n- If sheet has categories + values → suggest pie chart (distribution), bar chart (comparison), stats cards (highlights)\n- Always explain why each widget is relevant to their data.`
      : '';

    const existingWidgetsInfo = context?.existingWidgets?.length > 0
      ? `\n\nExisting Widgets on Canvas:\n${context.existingWidgets.map((w: any) => 
          `- ${w.type}: "${w.config?.title || 'Untitled'}"`
        ).join('\n')}`
      : '';

    const systemPrompt = `You are an AI assistant specialized in helping users build dashboard widgets for data visualization and analysis.

Your capabilities:
1. **Conversation**: Answer questions about dashboard building, data analysis, and visualization best practices
2. **Widget Generation**: Create dashboard widgets with proper formulas and data bindings
3. **Glossary Mapping**: Help map data columns to business terminology
4. **Guidance**: Suggest best approaches for visualizing different types of data

Available Widget Types:
${widgetTypes.map(w => `- **${w.type}**: ${w.purpose}\n  Best for: ${w.bestFor}`).join('\n')}

Formula Operations:
- **SUM**: Total of numeric values
- **AVG**: Average of numeric values  
- **COUNT**: Count of records (can filter)
- **MIN/MAX**: Minimum/maximum values

Data Binding Structure:
- For charts: specify x-axis and y-axis columns
- For stats cards: specify value column and optional filters
- Filters: column, operator (equals, contains, greaterThan, lessThan), value${glossaryInfo}${sheetInfo}${existingWidgetsInfo}${multiWidgetGuidance}

Communication Style:
- Be conversational and helpful
- Ask clarifying questions when user intent is unclear
- Suggest alternatives when appropriate
- Use tool calls to generate widgets only when user clearly wants to create something
- Keep responses concise and actionable`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        stream: streaming,
        tools: [{
          type: "function",
          function: {
            name: "generate_widgets",
            description: "Generate one or multiple dashboard widgets with formula and data binding configuration. Use widgets array for multiple widgets.",
            parameters: {
              type: "object",
              properties: {
                widgets: {
                  type: "array",
                  description: "Array of widgets to generate (use for multiple widgets)",
                  items: {
                    type: "object",
                    properties: {
                      widgetType: {
                        type: "string",
                        enum: ["statsCard", "barChart", "lineChart", "pieChart", "sheet"]
                      },
                      title: { type: "string", description: "Widget title" },
                      description: { type: "string", description: "Brief description of what this widget shows" },
                      formula: {
                        type: "object",
                        description: "ONLY for statsCard widgets - NEVER use for sheet/table widgets. Never invent filter values.",
                        properties: {
                          type: { type: "string", enum: ["aggregation"] },
                          operation: { type: "string", enum: ["SUM", "AVG", "COUNT", "MIN", "MAX"] },
                          sourceColumn: { type: "string", description: "Column name to aggregate" },
                          filters: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                column: { type: "string" },
                                operator: { type: "string", enum: ["equals", "contains", "greaterThan", "lessThan"] },
                                value: { type: "string" }
                              }
                            }
                          }
                        }
                      },
                      dataBinding: {
                        type: "object",
                        properties: {
                          columns: {
                            type: "object",
                            properties: {
                              x: { type: "string", description: "X-axis column for charts" },
                              y: { type: "string", description: "Y-axis column for charts" },
                              value: { type: "string", description: "Value column for stats cards" }
                            }
                          }
                        }
                      }
                    },
                    required: ["widgetType", "title", "description"]
                  }
                }
              },
              required: ["widgets"]
            }
          }
        }],
        tool_choice: "auto"
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
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    // Handle non-streaming response
    if (!streaming) {
      const data = await response.json();
      console.log('Non-streaming AI response:', data);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return the streaming response directly
    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('Error in ai-chat:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
