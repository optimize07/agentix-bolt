// Client Invitations API - Data access layer for invitation management
// Uses untyped client as these tables exist in external Supabase but not in auto-generated types

import { supabase } from "@/integrations/supabase/client";
import { untypedSupabase } from "@/integrations/supabase/untyped-client";

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";
export type InvitationRole = "owner" | "admin" | "member";

export interface ClientInvitation {
  id: string;
  client_id: string;
  email: string;
  invited_by: string;
  token: string;
  status: InvitationStatus;
  role: InvitationRole;
  message: string | null;
  expires_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvitationWithClient extends ClientInvitation {
  client: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface InvitationDetails {
  id: string;
  client_id: string;
  client_name: string;
  client_slug: string;
  email: string;
  role: InvitationRole;
  message: string | null;
  status: InvitationStatus;
  expires_at: string;
  is_valid: boolean;
}

export interface CreateInvitationResult {
  success: boolean;
  error?: string;
  invitation_id?: string;
  token?: string;
  expires_at?: string;
}

export interface AcceptInvitationResult {
  success: boolean;
  error?: string;
  client_id?: string;
  role?: string;
}

// ============================================================================
// Invitation Management (Admin)
// ============================================================================

export async function listClientInvitations(clientId: string): Promise<ClientInvitation[]> {
  const { data, error } = await untypedSupabase
    .from("client_invitations")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as ClientInvitation[];
}

export async function listPendingInvitations(clientId: string): Promise<ClientInvitation[]> {
  const { data, error } = await untypedSupabase
    .from("client_invitations")
    .select("*")
    .eq("client_id", clientId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as ClientInvitation[];
}

export async function createInvitation(
  clientId: string,
  email: string,
  role: InvitationRole = "member",
  message?: string
): Promise<CreateInvitationResult> {
  const { data, error } = await untypedSupabase.rpc("create_client_invitation", {
    p_client_id: clientId,
    p_email: email,
    p_role: role,
    p_message: message || null,
  });

  if (error) throw error;
  return data as CreateInvitationResult;
}

export async function revokeInvitation(invitationId: string): Promise<boolean> {
  const { data, error } = await untypedSupabase.rpc("revoke_invitation", {
    p_invitation_id: invitationId,
  });

  if (error) throw error;
  return data as boolean;
}

export async function resendInvitation(invitationId: string): Promise<CreateInvitationResult> {
  // Get the existing invitation
  const { data: existing, error: fetchError } = await untypedSupabase
    .from("client_invitations")
    .select("*")
    .eq("id", invitationId)
    .single();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error("Invitation not found");

  // Revoke the old one and create a new one
  await revokeInvitation(invitationId);
  
  return createInvitation(
    existing.client_id,
    existing.email,
    existing.role as InvitationRole,
    existing.message
  );
}

// ============================================================================
// Invitation Acceptance (Public/User)
// ============================================================================

export async function getInvitationByToken(token: string): Promise<InvitationDetails | null> {
  const { data, error } = await untypedSupabase.rpc("get_invitation_by_token", {
    p_token: token,
  });

  if (error) throw error;
  if (!data || data.length === 0) return null;
  
  const row = data[0];
  return {
    id: row.id,
    client_id: row.client_id,
    client_name: row.client_name,
    client_slug: row.client_slug,
    email: row.email,
    role: row.role as InvitationRole,
    message: row.message,
    status: row.status as InvitationStatus,
    expires_at: row.expires_at,
    is_valid: row.is_valid,
  };
}

export async function acceptInvitation(token: string): Promise<AcceptInvitationResult> {
  const { data, error } = await untypedSupabase.rpc("accept_invitation", {
    p_token: token,
  });

  if (error) throw error;
  return data as AcceptInvitationResult;
}

// ============================================================================
// User's Pending Invitations
// ============================================================================

export async function getMyPendingInvitations(): Promise<InvitationWithClient[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.email) return [];

  const { data, error } = await untypedSupabase
    .from("client_invitations")
    .select(`
      *,
      client:clients(id, name, slug)
    `)
    .eq("email", userData.user.email.toLowerCase())
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as InvitationWithClient[];
}

// ============================================================================
// Invitation Utilities
// ============================================================================

export function getInviteUrl(token: string): string {
  return `${window.location.origin}/auth/invite?token=${token}`;
}

export function isInvitationExpired(invitation: ClientInvitation): boolean {
  return new Date(invitation.expires_at) < new Date();
}

export function formatExpiresAt(expiresAt: string): string {
  const date = new Date(expiresAt);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return "Expired";
  if (diffDays === 0) return "Expires today";
  if (diffDays === 1) return "Expires tomorrow";
  return `Expires in ${diffDays} days`;
}
