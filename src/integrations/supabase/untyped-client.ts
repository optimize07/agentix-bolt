// Untyped Supabase client for tables that exist in external DB but not in auto-generated types
// This bypasses TypeScript type checking for tables like feature_definitions, client_invitations, etc.

import { supabase } from "./client";

// Export an untyped version of the supabase client
// Use this for tables that exist in your external Supabase but aren't in the auto-generated types
export const untypedSupabase = supabase as any;
