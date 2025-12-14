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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      reportId,
      companyName, 
      companyWebsite, 
      productDescription, 
      competitorLinks = [],
      clientAvatarDescription 
    } = await req.json();

    console.log('Generating market research report for:', companyName);

    // Update status to processing with progress updates
    await supabase
      .from('market_research_reports')
      .update({ 
        status: 'processing',
        processing_started_at: new Date().toISOString()
      })
      .eq('id', reportId);

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    console.log('Step 1/3: Gathering market data and analyzing competitors...');

    console.log('Step 2/3: Generating comprehensive market analysis...');
    const finalReport = await generateMarketResearchReport(
      apiKey,
      companyName,
      companyWebsite,
      productDescription,
      competitorLinks,
      clientAvatarDescription
    );

    console.log('Step 3/3: Finalizing report and formatting...');

    // Save completed report
    const { error: updateError } = await supabase
      .from('market_research_reports')
      .update({
        status: 'completed',
        report_content: finalReport,
        processing_completed_at: new Date().toISOString()
      })
      .eq('id', reportId);

    if (updateError) {
      throw updateError;
    }

    console.log('Market research completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        reportId,
        preview: finalReport.substring(0, 500) + '...'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in market-research function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function callGemini(apiKey: string, prompt: string) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 16384,
      }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Gemini API error:', error);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function generateMarketResearchReport(
  apiKey: string,
  companyName: string,
  companyWebsite: string,
  productServiceDescription: string,
  competitors: string[],
  idealClientAvatarDescription: string
) {
  const competitorsList = competitors
    .filter(c => c && c.trim())
    .map((c, i) => `  ${i + 1}. ${c}`)
    .join('\n');

  const prompt = `You are an expert market research analyst. Your task is to generate a comprehensive 20-40 page market research report based on the following data. The report should be structured, insightful, and professional. The output format MUST be in well-structured Markdown.

**Input Data:**
- Company Name: ${companyName}
- Company Website: ${companyWebsite}
- Product/Service Description: ${productServiceDescription}
- Top 3 Competitors: 
${competitorsList}
- Ideal Client Avatar / Target Audience Profile: ${idealClientAvatarDescription}

**Report Structure:**
Generate the report using the following Markdown structure. Be thorough and elaborate on each section.

# Market Research Report: ${companyName}

## 1. Executive Summary
(A high-level overview of the market, key findings, and strategic recommendations.)

## 2. Company & Product Overview
### 2.1. Company Profile: ${companyName}
(Analyze the company based on its provided description.)
### 2.2. Product/Service Analysis
(Deep-dive into the product description. Analyze its value proposition, problem-solving capabilities, and unique selling points.)
### 2.3. Initial SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats)
(Based on the provided data, perform a preliminary SWOT analysis.)

## 3. Competitive Landscape
(For each competitor, create a subsection. Analyze their likely strengths and weaknesses based on their domain name and the context of the user's company.)
### 3.1. Competitor 1: ${competitors[0] || 'N/A'}
### 3.2. Competitor 2: ${competitors[1] || 'N/A'}
### 3.3. Competitor 3: ${competitors[2] || 'N/A'}
### 3.4. Competitive Positioning Map
(Create a conceptual positioning map description, e.g., plotting competitors on a Price vs. Quality axis.)

## 4. Target Audience Analysis
(Based on the 'Ideal Client Avatar Description', create a detailed profile.)
### 4.1. Demographic & Psychographic Profile
### 4.2. Pain Points & Needs
### 4.3. Customer Journey Map (Conceptual)

## 5. Market Opportunities & Strategic Recommendations
### 5.1. Identified Market Gaps
### 5.2. Marketing & Sales Strategy Recommendations
### 5.3. Product Development Recommendations

## 6. Conclusion
(Summarize the report and reiterate the most critical strategic takeaways.)`;

  console.log('Generating report with Gemini...');
  return await callGemini(apiKey, prompt);
}
