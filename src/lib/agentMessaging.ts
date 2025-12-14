import { supabase } from "@/integrations/supabase/client";
import type { AgentConfig } from "@/integrations/n8n/agents";

type RecordAgentExchangeParams = {
  agent: AgentConfig;
  clientId?: string;
  userText: string;
  agentText: string;
  trace?: {
    requestId?: string;
    durationMs?: number;
    startTs?: string;
    endTs?: string;
    success?: boolean;
    status?: number | null;
    statusText?: string | null;
    contentLength?: number | null;
    headers?: Record<string, string>;
    error?: string | null;
  };
};

export async function recordAgentExchange({
  agent,
  clientId,
  userText,
  agentText,
  trace,
}: RecordAgentExchangeParams) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const rows = [];

  if (userText.trim().length > 0) {
    rows.push({
      agent_config_id: agent.id,
      client_id: clientId ?? null,
      user_id: user.id,
      role: "user",
      content: userText,
      metadata: { area: agent.area, agent_key: agent.agent_key, trace },
      source: "user",
    });
  }

  if (agentText.trim().length > 0) {
    rows.push({
      agent_config_id: agent.id,
      client_id: clientId ?? null,
      user_id: user.id,
      role: "assistant",
      content: agentText,
      metadata: { area: agent.area, agent_key: agent.agent_key, trace },
      source: "agent",
    });
  }

  if (rows.length) {
    await supabase.from("agent_messages").insert(rows).select("id");
  }

  if (agentText.trim().length > 0) {
    // Mirror into knowledge base so the response can be referenced later
    await supabase.from("knowledge_base_items").insert({
      user_id: user.id,
      scope: clientId ? "client" : "agency",
      client_id: clientId ?? null,
      source_department: agent.area || "operations",
      category: "research",
      title: `${agent.display_name || agent.agent_key} Response`,
      description: agentText.slice(0, 240),
      tags: [`agent:${agent.agent_key}`, `department:${agent.area}`],
      metadata: {
        agent_config_id: agent.id,
        agent_name: agent.display_name || agent.agent_key,
        exchange_type: "n8n-webhook",
        trace,
      },
    });
  }
}


