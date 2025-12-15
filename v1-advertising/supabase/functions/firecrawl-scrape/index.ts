import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraping URL:', url);

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

    if (FIRECRAWL_API_KEY) {
      // Use Firecrawl API for rich content extraction
      console.log('Using Firecrawl API for rich scraping');
      
      try {
        const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            formats: ['markdown', 'html'],
            onlyMainContent: true,
          }),
        });

        if (!firecrawlResponse.ok) {
          throw new Error(`Firecrawl API error: ${firecrawlResponse.status}`);
        }

        const firecrawlData = await firecrawlResponse.json();
        
        return new Response(
          JSON.stringify({
            title: firecrawlData.data?.metadata?.title || new URL(url).hostname,
            description: firecrawlData.data?.metadata?.description || '',
            image: firecrawlData.data?.metadata?.ogImage || firecrawlData.data?.metadata?.image || null,
            siteName: firecrawlData.data?.metadata?.ogSiteName || new URL(url).hostname,
            markdown: firecrawlData.data?.markdown || null,
            hasFirecrawl: true,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (firecrawlError) {
        console.error('Firecrawl API failed, falling back to basic scrape:', firecrawlError);
        // Fall through to basic scraping
      }
    }

    // Fallback: Basic metadata extraction
    console.log('Using basic metadata extraction');
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    
    // Extract Open Graph metadata
    const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
                      html.match(/<title>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
                     html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    const imageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    const siteNameMatch = html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i);

    const urlObj = new URL(url);
    
    return new Response(
      JSON.stringify({
        title: titleMatch?.[1] || urlObj.hostname,
        description: descMatch?.[1] || '',
        image: imageMatch?.[1] || null,
        siteName: siteNameMatch?.[1] || urlObj.hostname,
        markdown: null,
        hasFirecrawl: false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in firecrawl-scrape function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
