// User Profiles API - Data access layer for user profile and role management
// Uses untyped client as these tables exist in external Supabase but not in auto-generated types

import { supabase } from "@/integrations/supabase/client";
import { untypedSupabase } from "@/integrations/supabase/untyped-client";

export type UserRole = "agency_admin" | "client_user";
export type ClientMemberRole = "owner" | "admin" | "member";

export interface UserProfile {
  id: string;
  role: UserRole;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientMember {
  id: string;
  client_id: string;
  user_id: string;
  role: ClientMemberRole;
  invited_at: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface ClientMemberWithDetails extends ClientMember {
  user_profile?: UserProfile;
  user_email?: string;
}

// ============================================================================
// User Profile Functions
// ============================================================================

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) return null;

  // Add timeout to prevent infinite hang
  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => {
      console.warn("Profile fetch timed out after 10s");
      resolve(null);
    }, 10000);
  });

  const fetchPromise = (async () => {
    const { data, error } = await untypedSupabase
      .from("user_profiles")
      .select("*")
      .eq("id", userData.user.id)
      .single();

    if (error) {
      // Profile doesn't exist - try to create one
      if (error.code === "PGRST116") {
        return await createDefaultProfile(userData.user.id, userData.user.email);
      }
      // Log other errors but don't throw - return null to allow graceful handling
      console.error("Error fetching user profile:", error);
      return null;
    }

    return data as UserProfile;
  })();

  return Promise.race([fetchPromise, timeoutPromise]);
}

// Create a default profile for new users
async function createDefaultProfile(userId: string, email?: string | null): Promise<UserProfile | null> {
  try {
    const { data, error } = await untypedSupabase
      .from("user_profiles")
      .insert({
        id: userId,
        role: "client_user", // Default to client_user, admin promotes manually
        display_name: email?.split("@")[0] || "User",
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error creating default profile:", error);
      return null;
    }

    return data as UserProfile;
  } catch (e) {
    console.error("Failed to create default profile:", e);
    return null;
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await untypedSupabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data as UserProfile;
}

export async function updateUserProfile(
  updates: Partial<{
    display_name: string;
    avatar_url: string;
  }>
): Promise<UserProfile> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) throw new Error("Not authenticated");

  const { data, error } = await untypedSupabase
    .from("user_profiles")
    .update(updates)
    .eq("id", userData.user.id)
    .select("*")
    .single();

  if (error) throw error;
  return data as UserProfile;
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<UserProfile> {
  const { data, error } = await untypedSupabase
    .from("user_profiles")
    .update({ role })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data as UserProfile;
}

export async function isAgencyAdmin(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  return profile?.role === "agency_admin";
}

// ============================================================================
// Client Member Functions
// ============================================================================

export async function getClientMembers(clientId: string): Promise<ClientMemberWithDetails[]> {
  const { data, error } = await untypedSupabase
    .from("client_members")
    .select(`
      *,
      user_profile:user_profiles(*)
    `)
    .eq("client_id", clientId)
    .order("joined_at", { ascending: true });

  if (error) throw error;
  
  // Also fetch user emails
  const memberData = data as any[];
  
  // Note: In production, you'd want a server-side function for this
  // For now, we'll return what we have
  return memberData.map(m => ({
    ...m,
    user_profile: m.user_profile as UserProfile,
  })) as ClientMemberWithDetails[];
}

export async function getUserClientMemberships(): Promise<(ClientMember & { client: { id: string; slug: string; name: string } })[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) return [];

  const { data, error } = await untypedSupabase
    .from("client_members")
    .select(`
      *,
      client:clients(id, slug, name)
    `)
    .eq("user_id", userData.user.id);

  if (error) throw error;
  return (data || []) as any;
}

export async function addClientMember(
  clientId: string,
  userId: string,
  role: ClientMemberRole = "member"
): Promise<ClientMember> {
  const { data, error } = await untypedSupabase
    .from("client_members")
    .insert({
      client_id: clientId,
      user_id: userId,
      role,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as ClientMember;
}

export async function updateClientMemberRole(
  memberId: string,
  role: ClientMemberRole
): Promise<ClientMember> {
  const { data, error } = await untypedSupabase
    .from("client_members")
    .update({ role })
    .eq("id", memberId)
    .select("*")
    .single();

  if (error) throw error;
  return data as ClientMember;
}

export async function removeClientMember(memberId: string): Promise<void> {
  const { error } = await untypedSupabase
    .from("client_members")
    .delete()
    .eq("id", memberId);

  if (error) throw error;
}

export async function canAccessClient(clientId: string): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) return false;

  // Check if agency admin
  const profile = await getCurrentUserProfile();
  if (profile?.role === "agency_admin") return true;

  // Check membership
  const { data, error } = await untypedSupabase
    .from("client_members")
    .select("id")
    .eq("client_id", clientId)
    .eq("user_id", userData.user.id)
    .single();

  return !error && !!data;
}

export async function getClientRole(clientId: string): Promise<ClientMemberRole | "agency_admin" | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) return null;

  // Check if agency admin
  const profile = await getCurrentUserProfile();
  if (profile?.role === "agency_admin") return "agency_admin";

  // Get membership role
  const { data, error } = await untypedSupabase
    .from("client_members")
    .select("role")
    .eq("client_id", clientId)
    .eq("user_id", userData.user.id)
    .single();

  if (error || !data) return null;
  return data.role as ClientMemberRole;
}
