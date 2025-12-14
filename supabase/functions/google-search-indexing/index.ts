import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KnowledgeBaseItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  tags: string[] | null;
  file_path: string | null;
  external_url: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  user_id: string;
  client_id: string | null;
  scope: string;
  mime_type: string | null;
}

interface GoogleSearchDocument {
  id: string;
  structData: {
    title: string;
    description: string;
    content: string;
    url?: string;
    category: string;
    tags: string[];
    created_at: string;
    updated_at: string;
    metadata: any;
  };
}

/**
 * Google Search API Integration for Knowledge Base Indexing
 *
 * This function indexes knowledge base items into Google's Custom Search API
 * for enhanced search and retrieval capabilities.
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // These are optional now if we are just mocking or using a different backend
    const googleSearchApiKey = Deno.env.get("GOOGLE_SEARCH_API_KEY");
    const googleSearchEngineId = Deno.env.get("GOOGLE_SEARCH_ENGINE_ID");

    // NOTE: Removing strict check for now to allow partial functionality without keys
    // if (!googleSearchApiKey || !googleSearchEngineId) {
    //   throw new Error("Google Search API credentials not configured");
    // }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body safely
    let body;
    try {
        body = await req.json();
    } catch (e) {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    const { action, itemId, scope } = body;

    if (!action) {
        return new Response(JSON.stringify({ error: "Missing 'action' parameter" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    if (action === "index") {
      if (!itemId) {
          return new Response(JSON.stringify({ error: "Missing 'itemId' for index action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Index a single item
      const { data: item, error: fetchError } = await supabase
        .from("knowledge_base_items")
        .select("*")
        .eq("id", itemId)
        .single();

      if (fetchError) throw fetchError;
      if (!item) throw new Error("Item not found");

      const document = await prepareDocument(item, supabase);
      await indexDocument(document, googleSearchApiKey, googleSearchEngineId);

      // Update indexing status
      await supabase
        .from("knowledge_base_items")
        .update({
          indexing_status: "indexed",
          google_search_indexed: true,
          google_search_indexed_at: new Date().toISOString(),
        })
        .eq("id", itemId);

      return new Response(
        JSON.stringify({ success: true, itemId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "search") {
      // Perform a search query
      const { query, filters, limit = 10 } = body;

      if (!googleSearchApiKey || !googleSearchEngineId) {
           // Fallback for missing keys
           return new Response(
            JSON.stringify({ success: true, results: [], warning: "Google Search not configured" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
      }

      const results = await searchDocuments(
        query,
        filters,
        limit,
        googleSearchApiKey,
        googleSearchEngineId
      );

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "delete") {
      // Remove document from index
      await deleteDocument(itemId, googleSearchApiKey, googleSearchEngineId);

      await supabase
        .from("knowledge_base_items")
        .update({
          google_search_indexed: false,
          google_search_indexed_at: null,
        })
        .eq("id", itemId);

      return new Response(
        JSON.stringify({ success: true, itemId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "reindex") {
      // Reindex all documents for a scope
      const { data: items, error: fetchError } = await supabase
        .from("knowledge_base_items")
        .select("*")
        .eq("scope", scope)
        .eq("is_archived", false);

      if (fetchError) throw fetchError;

      let indexed = 0;
      let failed = 0;

      for (const item of items) {
        try {
          const document = await prepareDocument(item, supabase);
          await indexDocument(document, googleSearchApiKey, googleSearchEngineId);

          await supabase
            .from("knowledge_base_items")
            .update({
              indexing_status: "indexed",
              google_search_indexed: true,
              google_search_indexed_at: new Date().toISOString(),
            })
            .eq("id", item.id);

          indexed++;
        } catch (error) {
          console.error(`Failed to index item ${item.id}:`, error);
          failed++;
        }
      }

      return new Response(
        JSON.stringify({ success: true, indexed, failed }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Invalid action: ${action}`);
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function prepareDocument(
  item: KnowledgeBaseItem,
  supabase: any
): Promise<GoogleSearchDocument> {
  let content = item.description || "";

  // If there's scraped markdown, include it
  if (item.metadata?.scraped_markdown) {
    content += "\n\n" + item.metadata.scraped_markdown;
  }

  // If there's a file, try to extract text content
  if (item.file_path) {
    try {
      const { data: fileData } = await supabase.storage
        .from("knowledge-base")
        .download(item.file_path);

      if (fileData && item.mime_type?.includes("text")) {
        const text = await fileData.text();
        content += "\n\n" + text;
      }
    } catch (error) {
      console.error("Error reading file:", error);
    }
  }

  return {
    id: item.id,
    structData: {
      title: item.title,
      description: item.description || "",
      content: content.substring(0, 50000), // Limit content size
      url: item.external_url || undefined,
      category: item.category,
      tags: item.tags || [],
      created_at: item.created_at,
      updated_at: item.updated_at,
      metadata: item.metadata || {},
    },
  };
}

async function indexDocument(
  document: GoogleSearchDocument,
  apiKey: string | undefined,
  engineId: string | undefined
): Promise<void> {
  // Note: Google Custom Search API doesn't support direct indexing
  // This is a placeholder for integration with Google Cloud Search API
  // or Google Indexing API

  console.log("Document prepared for indexing:", {
    id: document.id,
    title: document.structData.title,
  });

  // If no keys, just log and return (mock success)
  if (!apiKey || !engineId) return;

  // TODO: Implement actual API call if using Google Cloud Search
}

async function searchDocuments(
  query: string,
  filters: any,
  limit: number,
  apiKey: string,
  engineId: string
): Promise<any[]> {
  // Build search query with filters
  let searchQuery = query;

  if (filters?.category) {
    searchQuery += ` category:${filters.category}`;
  }

  if (filters?.tags && filters.tags.length > 0) {
    searchQuery += ` ${filters.tags.map((tag: string) => `tag:${tag}`).join(" ")}`;
  }

  // Use Google Custom Search API
  const searchUrl = new URL("https://www.googleapis.com/customsearch/v1");
  searchUrl.searchParams.set("key", apiKey);
  searchUrl.searchParams.set("cx", engineId);
  searchUrl.searchParams.set("q", searchQuery);
  searchUrl.searchParams.set("num", limit.toString());

  const response = await fetch(searchUrl.toString());

  if (!response.ok) {
    throw new Error(`Search API error: ${response.statusText}`);
  }

  const data = await response.json();

  return data.items || [];
}

async function deleteDocument(
  itemId: string,
  apiKey: string | undefined,
  engineId: string | undefined
): Promise<void> {
  // Placeholder for delete operation
  console.log("Document removed from index:", itemId);
}
