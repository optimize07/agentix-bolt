// Clients API - Data access layer for client management

import { supabase } from "@/integrations/supabase/client";

export interface Client {
  id: string;
  user_id: string;
  slug: string;
  name: string;
  type: string | null;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  logo_url: string | null;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export async function listClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data || []) as unknown as Client[];
}

export async function getClient(slug: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data as unknown as Client;
}

export async function createClient(input: {
  slug: string;
  name: string;
  type?: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  website_url?: string;
  logo_url?: string;
}): Promise<Client> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("clients")
    .insert({
      user_id: userData.user.id,
      slug: input.slug,
      name: input.name,
      type: input.type || null,
      description: input.description || null,
      contact_email: input.contact_email || null,
      contact_phone: input.contact_phone || null,
      website_url: input.website_url || null,
      logo_url: input.logo_url || null,
      is_active: true,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as unknown as Client;
}

export async function updateClient(
  clientId: string,
  input: Partial<{
    name: string;
    type: string;
    description: string;
    contact_email: string;
    contact_phone: string;
    website_url: string;
    logo_url: string;
    is_active: boolean;
  }>
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId)
    .select("*")
    .single();

  if (error) throw error;
  return data as unknown as Client;
}

export async function deleteClient(clientId: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) throw error;
}

