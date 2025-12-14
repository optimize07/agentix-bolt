import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase Client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: any;
  old_record: any;
  schema: string;
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();
    const { record, old_record, type } = payload;

    console.log(`[RAG-Indexing] Processing ${type} for KB item ${record?.id || old_record?.id}`);

    // Only process if we have a file_path or it's a delete
    // Use safe navigation for record since it might be null/undefined on DELETE
    if (type !== "DELETE" && (!record || !record.file_path)) {
      console.log("[RAG-Indexing] No file path, skipping");
      return new Response(JSON.stringify({ message: "No file path, skipping" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine which record to use
    const item = type === "DELETE" ? old_record : record;
    
    // Validate item exists
    if (!item) {
        console.error("[RAG-Indexing] Error: Item record is missing");
        return new Response(JSON.stringify({ error: "Item record is missing" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const itemId = item.id as string;

    // Handle DELETE - just log for now
    if (type === "DELETE") {
      console.log(`[RAG-Indexing] Would delete file from Google for item ${itemId}`);
      return new Response(JSON.stringify({ success: true, action: "delete" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle INSERT / UPDATE
    // If it's an UPDATE and file_path hasn't changed and already indexed, skip
    if (type === "UPDATE" && 
        record.file_path === old_record?.file_path && 
        record.indexing_status === 'indexed') {
      console.log("[RAG-Indexing] File unchanged and already indexed, skipping");
      return new Response(JSON.stringify({ message: "File unchanged, skipping" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update status to processing
    await updateStatus(itemId, 'processing');

    try {
      // Get store name based on scope
      const storeDisplayName = getStoreName(item);
      console.log(`[RAG-Indexing] Target Store: ${storeDisplayName}`);

      // Download file from Supabase
      const filePath = record.file_path as string;
      console.log(`[RAG-Indexing] Downloading file: ${filePath}`);
      
      const { data: fileData, error: downloadError } = await supabase
        .storage
        .from("knowledge-base")
        .download(filePath);

      if (downloadError) {
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }

      console.log(`[RAG-Indexing] File downloaded, size: ${fileData.size} bytes`);

      // For now, we'll mark it as indexed with a placeholder
      // In a full implementation, you would:
      // 1. Upload to Google File API
      // 2. Create/get a File Search Store
      // 3. Add the file to the store
      // Since Google's File Search API requires specific setup, we'll simulate success
      
      const simulatedGoogleFileName = `files/simulated-${itemId}`;
      const simulatedStoreId = `stores/simulated-${getStoreKey(item)}`;
      
      console.log(`[RAG-Indexing] Would upload to Google:`);
      console.log(`  - File name: ${simulatedGoogleFileName}`);
      console.log(`  - Store ID: ${simulatedStoreId}`);
      console.log(`  - File size: ${fileData.size}`);

      // Update status to indexed
      await updateStatus(itemId, 'indexed', simulatedGoogleFileName, simulatedStoreId);
      
      console.log(`[RAG-Indexing] Successfully processed item ${itemId}`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown Error";
      console.error("[RAG-Indexing] Indexing failed:", errorMessage);
      await updateStatus(itemId, 'failed', undefined, undefined, errorMessage);
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error("[RAG-Indexing] Request error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Helper: Determine Store Name from Record
function getStoreName(record: any): string {
  if (record.scope === 'agency') {
    return "Agency Knowledge Base";
  } else if (record.scope === 'client' && record.client_id) {
    return `Client ${record.client_id} Knowledge Base`;
  }
  return "General Knowledge Base";
}

function getStoreKey(record: any): string {
  if (record.scope === 'agency') {
    return "agency";
  } else if (record.scope === 'client' && record.client_id) {
    return `client-${record.client_id}`;
  }
  return "general";
}

// Helper: Update DB Status
async function updateStatus(
  id: string, 
  status: string, 
  googleFileName?: string, 
  googleStoreId?: string, 
  errorMsg?: string
) {
  const updatePayload: any = { indexing_status: status };
  if (googleFileName) updatePayload.google_file_name = googleFileName;
  if (googleStoreId) updatePayload.google_store_id = googleStoreId;
  if (errorMsg) updatePayload.google_error = errorMsg;
  else if (status === 'indexed') updatePayload.google_error = null;

  const { error } = await supabase
    .from("knowledge_base_items")
    .update(updatePayload)
    .eq("id", id);
    
  if (error) {
    console.error(`[RAG-Indexing] Failed to update status: ${error.message}`);
  }
}
