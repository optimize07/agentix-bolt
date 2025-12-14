// Scrape URL content using Firecrawl and return markdown
// Used for knowledge base external URL items

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    const cleanUrl = url.trim();

    if (!cleanUrl) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

    if (!FIRECRAWL_API_KEY) {
      throw new Error("FIRECRAWL_API_KEY not configured");
    }

    console.log("Scraping URL for knowledge base:", cleanUrl);

    // Use Firecrawl to scrape and convert to markdown
    const firecrawlResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: cleanUrl,
        formats: ["markdown"], // Get markdown format
        onlyMainContent: true, // Focus on main content, skip headers/footers
      }),
    });

    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text();
      console.error("Firecrawl error:", firecrawlResponse.status, errorText);
      throw new Error(`Firecrawl error: ${firecrawlResponse.status}`);
    }

    const firecrawlData = await firecrawlResponse.json();
    console.log("Firecrawl response received");

    const markdownContent = firecrawlData.data?.markdown || "";
    const title = firecrawlData.data?.metadata?.title || "";
    const description = firecrawlData.data?.metadata?.description || "";

    if (!markdownContent) {
      throw new Error("Could not extract content from URL");
    }

    return new Response(
      JSON.stringify({
        success: true,
        markdown: markdownContent,
        title: title || cleanUrl,
        description: description || "",
        url: cleanUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in scrape-url-content:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

