import { supabase } from "@/integrations/supabase/client";
import type { N8nScope } from "./api";

export type FieldType = "text" | "number" | "boolean" | "textarea" | "select";
export type OutputBehavior = "chat_stream" | "modal_display" | "field_populate";
export type ExecutionMode = "n8n" | "internal";

export interface RuntimeField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  defaultValue?: string | number | boolean;
  placeholder?: string;
  options?: string[]; // For select type
}

export interface InputSchema {
  fields: RuntimeField[];
}

export interface AgentConfig {
  id: string;
  scope: N8nScope;
  client_id: string | null;
  area: string;
  agent_key: string;
  display_name?: string | null;
  display_role?: string | null;
  description?: string | null;
  connection_id: string;
  workflow_id: string;
  webhook_url?: string | null;
  input_schema?: InputSchema | null;
  input_mapping: {
    requiredFields?: RuntimeField[];
    fields?: RuntimeField[];
    [k: string]: any;
  } | null;
  output_mapping: any;
  output_behavior?: OutputBehavior | null;
  execution_mode?: ExecutionMode | null;
  is_predefined?: boolean;
  avatar_url?: string | null;
}

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id ?? null;
}

export async function fetchAgentConfig(params: {
  area: string;
  agentKey: string;
  clientId?: string;
}): Promise<AgentConfig | null> {
  // Prefer client-scoped config, fallback to agency-scoped
  const { data: clientRows, error: clientErr } = await (supabase as any)
    .from("agent_configs")
    .select("*")
    .eq("area", params.area)
    .eq("agent_key", params.agentKey)
    .eq("scope", "client")
    .eq("client_id", params.clientId || null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!clientErr && clientRows && clientRows.length > 0) {
    return clientRows[0] as unknown as AgentConfig;
  }

  const { data: agencyRows } = await (supabase as any)
    .from("agent_configs")
    .select("*")
    .eq("area", params.area)
    .eq("agent_key", params.agentKey)
    .eq("scope", "agency")
    .order("created_at", { ascending: false })
    .limit(1);

  return (agencyRows?.[0] as unknown as AgentConfig) || null;
}

export async function upsertAgentConfig(params: {
  scope: N8nScope;
  clientId?: string;
  area: string;
  agentKey: string;
  displayName?: string;
  displayRole?: string;
  description?: string;
  avatarUrl?: string;
  connectionId?: string;
  workflowId?: string;
  webhookUrl?: string;
  inputSchema?: InputSchema;
  requiredFields?: RuntimeField[];
  outputBehavior?: OutputBehavior;
  executionMode?: ExecutionMode;
}): Promise<AgentConfig> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const targetClientId = params.scope === "client" ? params.clientId ?? null : null;

  // Determine if the current user already has a config for this agent
  let query = (supabase as any)
    .from("agent_configs")
    .select("*")
    .eq("user_id", userId)
    .eq("scope", params.scope)
    .eq("area", params.area)
    .eq("agent_key", params.agentKey)
    .order("created_at", { ascending: false })
    .limit(1);

  if (targetClientId) {
    query = query.eq("client_id", targetClientId);
  } else {
    query = query.is("client_id", null);
  }

  const { data: existing } = await query.maybeSingle();

  const payload = {
    user_id: userId,
    scope: params.scope,
    client_id: targetClientId,
    area: params.area,
    agent_key: params.agentKey,
    display_name: params.displayName ?? params.agentKey,
    display_role: params.displayRole ?? null,
    description: params.description ?? null,
    avatar_url: params.avatarUrl ?? null,
    connection_id: params.connectionId || "00000000-0000-0000-0000-000000000000",
    workflow_id: params.workflowId || "webhook",
    webhook_url: params.webhookUrl ?? null,
    input_schema: params.inputSchema ?? (params.requiredFields?.length ? { fields: params.requiredFields } : null),
    input_mapping: params.requiredFields?.length ? { requiredFields: params.requiredFields } : null,
    output_mapping: null,
    output_behavior: params.outputBehavior ?? "modal_display",
    execution_mode: params.executionMode ?? "n8n",
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { data, error } = await (supabase as any)
      .from("agent_configs")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as AgentConfig;
  }

  const { data, error } = await (supabase as any)
    .from("agent_configs")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data as unknown as AgentConfig;
}

export async function listAgentConfigs(params: {
  area: string;
  clientId?: string;
  includePredefined?: boolean;
}): Promise<AgentConfig[]> {
  const pieces: AgentConfig[] = [];

  // Client scoped
  if (params.clientId) {
    const { data } = await (supabase as any)
      .from("agent_configs")
      .select("*")
      .eq("area", params.area)
      .eq("scope", "client")
      .eq("client_id", params.clientId);
    if (Array.isArray(data)) pieces.push(...(data as any));
  }

  // Agency scoped (including predefined if requested)
  const agencyQuery = (supabase as any)
    .from("agent_configs")
    .select("*")
    .eq("area", params.area)
    .eq("scope", "agency");
  
  // By default include predefined, can exclude with includePredefined: false
  if (params.includePredefined === false) {
    agencyQuery.eq("is_predefined", false);
  }

  const { data: agency } = await agencyQuery;
  if (Array.isArray(agency)) pieces.push(...(agency as any));

  return pieces;
}

/**
 * List all predefined agents for a department area
 */
export async function listPredefinedAgents(area: string): Promise<AgentConfig[]> {
  const { data } = await (supabase as any)
    .from("agent_configs")
    .select("*")
    .eq("area", area)
    .eq("is_predefined", true)
    .order("display_name", { ascending: true });
  
  return (data || []) as unknown as AgentConfig[];
}

/**
 * Get the input fields from an agent config.
 * Checks input_schema first, then falls back to input_mapping.requiredFields
 */
export function getAgentInputFields(config: AgentConfig): RuntimeField[] {
  // Prefer input_schema.fields
  if (config.input_schema?.fields?.length) {
    return config.input_schema.fields;
  }
  // Fallback to input_mapping.fields or input_mapping.requiredFields
  if (config.input_mapping?.fields?.length) {
    return config.input_mapping.fields;
  }
  if (config.input_mapping?.requiredFields?.length) {
    return config.input_mapping.requiredFields;
  }
  return [];
}

/**
 * Execute an agent via its webhook URL directly (for predefined agents)
 */
export async function executeAgentWebhook(params: {
  webhookUrl: string;
  payload: Record<string, any>;
}): Promise<{ success: boolean; result: any; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("n8n-run", {
      body: {
        webhookUrl: params.webhookUrl,
        payload: params.payload,
        waitTillFinished: true,
      },
    });

    if (error) {
      return { success: false, result: null, error: error.message || "Failed to invoke webhook" };
    }

    if (!data?.success) {
      return { success: false, result: data?.result ?? null, error: data?.error || "Webhook execution failed" };
    }

    return { success: true, result: data.result };
  } catch (e: any) {
    return { success: false, result: null, error: e?.message || "Unknown error" };
  }
}


