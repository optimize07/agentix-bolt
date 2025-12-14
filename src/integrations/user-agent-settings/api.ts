import { supabase } from "@/integrations/supabase/client";

export interface UserAgentSettings {
  id: string;
  user_id: string;
  client_id: string | null;
  department_id: string;
  agent_name: string;
  custom_name: string | null;
  personal_notes: string | null;
  schedule_enabled: boolean;
  schedule_type: "daily" | "weekly" | "monthly" | "custom" | null;
  schedule_time: string | null;
  schedule_day_of_week: number | null;
  schedule_day_of_month: number | null;
  schedule_cron: string | null;
  schedule_timezone: string | null;
  last_scheduled_run: string | null;
  next_scheduled_run: string | null;
  knowledge_base_ids: string[] | null;
  input_integration_id: string | null;
  output_integration_id: string | null;
  default_parameters: Record<string, any> | null;
  is_favorite: boolean;
  is_hidden: boolean;
  run_count: number;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertSettingsParams {
  clientId?: string;
  departmentId: string;
  agentName: string;
  customName?: string | null;
  personalNotes?: string | null;
  scheduleEnabled?: boolean;
  scheduleType?: "daily" | "weekly" | "monthly" | "custom" | null;
  scheduleTime?: string | null;
  scheduleDayOfWeek?: number | null;
  scheduleDayOfMonth?: number | null;
  scheduleCron?: string | null;
  scheduleTimezone?: string | null;
  knowledgeBaseIds?: string[] | null;
  inputIntegrationId?: string | null;
  outputIntegrationId?: string | null;
  defaultParameters?: Record<string, any> | null;
  isFavorite?: boolean;
  isHidden?: boolean;
}

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id ?? null;
}

/**
 * Get settings for a specific agent
 */
export async function getAgentSettings(params: {
  departmentId: string;
  agentName: string;
  clientId?: string;
}): Promise<UserAgentSettings | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  let query = (supabase as any)
    .from("user_agent_settings")
    .select("*")
    .eq("user_id", userId)
    .eq("department_id", params.departmentId)
    .eq("agent_name", params.agentName);

  if (params.clientId) {
    query = query.eq("client_id", params.clientId);
  } else {
    query = query.is("client_id", null);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error("Error fetching agent settings:", error);
    return null;
  }

  return data as UserAgentSettings | null;
}

/**
 * Get all settings for a user (optionally filtered by client)
 */
export async function getAllAgentSettings(clientId?: string): Promise<UserAgentSettings[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  let query = (supabase as any)
    .from("user_agent_settings")
    .select("*")
    .eq("user_id", userId);

  if (clientId) {
    // Get both client-specific and global settings
    query = query.or(`client_id.eq.${clientId},client_id.is.null`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching all agent settings:", error);
    return [];
  }

  return (data || []) as UserAgentSettings[];
}

/**
 * Upsert (create or update) agent settings
 */
export async function upsertAgentSettings(
  params: UpsertSettingsParams
): Promise<UserAgentSettings | null> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const payload = {
    user_id: userId,
    client_id: params.clientId || null,
    department_id: params.departmentId,
    agent_name: params.agentName,
    custom_name: params.customName,
    personal_notes: params.personalNotes,
    schedule_enabled: params.scheduleEnabled ?? false,
    schedule_type: params.scheduleType,
    schedule_time: params.scheduleTime,
    schedule_day_of_week: params.scheduleDayOfWeek,
    schedule_day_of_month: params.scheduleDayOfMonth,
    schedule_cron: params.scheduleCron,
    schedule_timezone: params.scheduleTimezone || "UTC",
    knowledge_base_ids: params.knowledgeBaseIds,
    input_integration_id: params.inputIntegrationId,
    output_integration_id: params.outputIntegrationId,
    default_parameters: params.defaultParameters,
    is_favorite: params.isFavorite ?? false,
    is_hidden: params.isHidden ?? false,
  };

  // Check if settings already exist
  const existing = await getAgentSettings({
    departmentId: params.departmentId,
    agentName: params.agentName,
    clientId: params.clientId,
  });

  if (existing?.id) {
    // Update existing
    const { data, error } = await (supabase as any)
      .from("user_agent_settings")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) throw error;
    return data as UserAgentSettings;
  }

  // Create new
  const { data, error } = await (supabase as any)
    .from("user_agent_settings")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data as UserAgentSettings;
}

/**
 * Delete agent settings (restore to defaults)
 */
export async function deleteAgentSettings(params: {
  departmentId: string;
  agentName: string;
  clientId?: string;
}): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  let query = (supabase as any)
    .from("user_agent_settings")
    .delete()
    .eq("user_id", userId)
    .eq("department_id", params.departmentId)
    .eq("agent_name", params.agentName);

  if (params.clientId) {
    query = query.eq("client_id", params.clientId);
  } else {
    query = query.is("client_id", null);
  }

  const { error } = await query;
  if (error) {
    console.error("Error deleting agent settings:", error);
    return false;
  }

  return true;
}

/**
 * Toggle favorite status for an agent
 */
export async function toggleFavorite(params: {
  departmentId: string;
  agentName: string;
  clientId?: string;
}): Promise<boolean> {
  const existing = await getAgentSettings(params);
  const newFavoriteStatus = !existing?.is_favorite;

  await upsertAgentSettings({
    ...params,
    isFavorite: newFavoriteStatus,
  });

  return newFavoriteStatus;
}

/**
 * Increment run count and update last run timestamp
 */
export async function recordAgentRun(params: {
  departmentId: string;
  agentName: string;
  clientId?: string;
}): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const existing = await getAgentSettings(params);

  if (existing?.id) {
    await (supabase as any)
      .from("user_agent_settings")
      .update({
        run_count: (existing.run_count || 0) + 1,
        last_run_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await upsertAgentSettings({
      ...params,
    });
    // Then update the run count
    const newSettings = await getAgentSettings(params);
    if (newSettings?.id) {
      await (supabase as any)
        .from("user_agent_settings")
        .update({
          run_count: 1,
          last_run_at: new Date().toISOString(),
        })
        .eq("id", newSettings.id);
    }
  }
}

