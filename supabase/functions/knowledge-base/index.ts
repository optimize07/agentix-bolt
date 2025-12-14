// Knowledge Base Edge Function
// Handles CRUD operations for knowledge base items and file uploads

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KBItem {
  id?: string;
  scope: 'agency' | 'client' | 'project' | 'task';
  client_id?: string;
  project_id?: string;
  task_id?: string;
  source_department: string;
  category: string;
  title: string;
  description?: string;
  tags?: string[];
  file_path?: string;
  external_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  metadata?: Record<string, unknown>;
  is_pinned?: boolean;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list";

    // Route actions
    switch (action) {
      case "list": {
        const scope = url.searchParams.get("scope");
        const clientId = url.searchParams.get("client_id");
        const department = url.searchParams.get("department");
        const category = url.searchParams.get("category");
        const search = url.searchParams.get("search");
        const pinnedOnly = url.searchParams.get("pinned_only") === "true";
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const offset = parseInt(url.searchParams.get("offset") || "0");

        let query = supabase
          .from("knowledge_base_items")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_archived", false)
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (scope) query = query.eq("scope", scope);
        if (clientId) query = query.eq("client_id", clientId);
        if (department) query = query.eq("source_department", department);
        if (category) query = query.eq("category", category);
        if (pinnedOnly) query = query.eq("is_pinned", true);
        if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

        const { data, error } = await query;

        if (error) throw error;

        return new Response(JSON.stringify({ items: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get": {
        const id = url.searchParams.get("id");
        if (!id) {
          return new Response(JSON.stringify({ error: "Missing item id" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await supabase
          .from("knowledge_base_items")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ item: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "create": {
        const body: KBItem = await req.json();
        
        const { data, error } = await supabase
          .from("knowledge_base_items")
          .insert({
            user_id: user.id,
            scope: body.scope || "client",
            client_id: body.client_id,
            project_id: body.project_id,
            task_id: body.task_id,
            source_department: body.source_department,
            category: body.category,
            title: body.title,
            description: body.description,
            tags: body.tags || [],
            file_path: body.file_path,
            external_url: body.external_url,
            file_name: body.file_name,
            file_size: body.file_size,
            mime_type: body.mime_type,
            metadata: body.metadata || {},
            is_pinned: body.is_pinned || false,
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ item: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update": {
        const body: KBItem = await req.json();
        if (!body.id) {
          return new Response(JSON.stringify({ error: "Missing item id" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const updateData: Record<string, unknown> = {};
        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.tags !== undefined) updateData.tags = body.tags;
        if (body.category !== undefined) updateData.category = body.category;
        if (body.is_pinned !== undefined) updateData.is_pinned = body.is_pinned;
        if (body.metadata !== undefined) updateData.metadata = body.metadata;

        const { data, error } = await supabase
          .from("knowledge_base_items")
          .update(updateData)
          .eq("id", body.id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ item: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        const id = url.searchParams.get("id");
        if (!id) {
          return new Response(JSON.stringify({ error: "Missing item id" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get the item first to check for file
        const { data: item } = await supabase
          .from("knowledge_base_items")
          .select("file_path")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        // Delete from storage if file exists
        if (item?.file_path) {
          await supabase.storage
            .from("knowledge-base")
            .remove([item.file_path]);
        }

        // Delete the record
        const { error } = await supabase
          .from("knowledge_base_items")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "archive": {
        const id = url.searchParams.get("id");
        if (!id) {
          return new Response(JSON.stringify({ error: "Missing item id" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await supabase
          .from("knowledge_base_items")
          .update({ is_archived: true })
          .eq("id", id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ item: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "toggle_pin": {
        const id = url.searchParams.get("id");
        if (!id) {
          return new Response(JSON.stringify({ error: "Missing item id" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get current state
        const { data: current } = await supabase
          .from("knowledge_base_items")
          .select("is_pinned")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        // Toggle
        const { data, error } = await supabase
          .from("knowledge_base_items")
          .update({ is_pinned: !current?.is_pinned })
          .eq("id", id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ item: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_upload_url": {
        // Generate a signed upload URL for direct browser upload
        const fileName = url.searchParams.get("file_name");
        const clientId = url.searchParams.get("client_id") || "agency";
        
        if (!fileName) {
          return new Response(JSON.stringify({ error: "Missing file_name" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Create a unique path: user_id/client_id/timestamp_filename
        const timestamp = Date.now();
        const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = `${user.id}/${clientId}/${timestamp}_${safeName}`;

        const { data, error } = await supabase.storage
          .from("knowledge-base")
          .createSignedUploadUrl(filePath);

        if (error) throw error;

        return new Response(JSON.stringify({ 
          upload_url: data.signedUrl,
          file_path: filePath,
          token: data.token
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "categories": {
        // Return available categories with counts
        const clientId = url.searchParams.get("client_id");

        let query = supabase
          .from("knowledge_base_items")
          .select("category")
          .eq("user_id", user.id)
          .eq("is_archived", false);

        if (clientId) query = query.eq("client_id", clientId);

        const { data, error } = await query;

        if (error) throw error;

        // Count by category
        const counts: Record<string, number> = {};
        data?.forEach((item: { category: string }) => {
          counts[item.category] = (counts[item.category] || 0) + 1;
        });

        return new Response(JSON.stringify({ categories: counts }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    console.error("Knowledge Base Error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

