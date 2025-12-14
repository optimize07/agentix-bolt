import { supabase } from "@/integrations/supabase/client";

export type N8nScope = "agency" | "client";

export interface N8nConnection {
  id: string;
  scope: N8nScope;
  client_id: string | null;
  label: string | null;
  base_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function connectN8n(params: {
  scope: N8nScope;
  clientId?: string;
  label?: string;
  baseUrl: string;
  apiKey: string;
}) {
  const { data, error } = await supabase.functions.invoke("n8n-connect", {
    body: {
      scope: params.scope,
      clientId: params.clientId,
      label: params.label,
      baseUrl: params.baseUrl,
      apiKey: params.apiKey,
    },
  });
  if (error) throw error;
  return data as { success: boolean; connection: N8nConnection };
}

export async function listN8nConnections(params?: {
  scope?: N8nScope;
  clientId?: string;
}) {
  const { data, error } = await supabase.functions.invoke("n8n-connections", {
    method: "POST", // Important for body to be parsed correctly in some setups
    body: {
      scope: params?.scope,
      clientId: params?.clientId,
    },
  });
  if (error) throw error;
  return data as { connections: N8nConnection[] };
}

export async function listN8nWorkflows(params: { connectionId: string }) {
  const { data, error } = await supabase.functions.invoke("n8n-list", {
    body: { connectionId: params.connectionId },
  });
  if (error) throw error;
  return data as { workflows: any[]; projects?: any[] };
}

export async function runN8nWorkflow(params: {
  connectionId: string;
  workflowId: string;
  webhookUrl?: string;
  payload?: Record<string, any>;
  waitTillFinished?: boolean;
}) {
  const { data, error } = await supabase.functions.invoke("n8n-run", {
    body: {
      connectionId: params.connectionId,
      workflowId: params.workflowId,
      webhookUrl: params.webhookUrl,
      payload: params.payload ?? {},
      waitTillFinished: params.waitTillFinished ?? true,
    },
  });
  if (error) throw error;
  return data as { success: boolean; result: any };
}

export async function getN8nExecutionStatus(params: {
  connectionId: string;
  executionId: string;
}) {
  const { data, error } = await supabase.functions.invoke(
    "n8n-execution-status",
    {
      body: {
        connectionId: params.connectionId,
        executionId: params.executionId,
      },
    }
  );
  if (error) throw error;
  return data as { execution: any };
}


