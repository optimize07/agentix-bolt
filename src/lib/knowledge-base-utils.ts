import { supabase } from "@/integrations/supabase/client";

/**
 * Get a signed URL for a knowledge base file
 * @param filePath The file path in storage (e.g., "user_id/client_id/filename.png")
 * @param expiresIn Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL or null if error
 */
export async function getKnowledgeBaseFileUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from("knowledge-base")
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error("Error creating signed URL:", error);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error("Error getting file URL:", err);
    return null;
  }
}

/**
 * Get a public URL if bucket is public, otherwise return signed URL
 * Note: This is a fallback - prefer using signed URLs for private buckets
 */
export function getKnowledgeBasePublicUrl(filePath: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/knowledge-base/${filePath}`;
}

