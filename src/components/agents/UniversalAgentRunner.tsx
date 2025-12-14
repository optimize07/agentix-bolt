import { useState } from "react";
import { AgentConfig, getAgentInputFields, executeAgentWebhook } from "@/integrations/n8n/agents";
import { runN8nWorkflow } from "@/integrations/n8n/api";
import { RunAgentDynamicModal } from "./RunAgentDynamicModal";
import { AgentChatWindow } from "./AgentChatWindow";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { recordAgentExchange } from "@/lib/agentMessaging";
import { getResultText } from "@/lib/resultText";

interface UniversalAgentRunnerProps {
  agent: AgentConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
}

/**
 * Universal runner that displays either:
 * - Chat interface for chat_stream agents
 * - Form modal for modal_display agents
 */
export function UniversalAgentRunner({ agent, open, onOpenChange, clientId }: UniversalAgentRunnerProps) {
  const [running, setRunning] = useState(false);
  const [progressNote, setProgressNote] = useState<string | null>(null);

  const inputFields = getAgentInputFields(agent);
  const outputBehavior = agent.output_behavior || "modal_display";

  const createRequestId = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`; 
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const nowMs = () =>
    typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();

  const handleRun = async (values: Record<string, any>): Promise<any> => {
    const requestId = createRequestId();
    const start = nowMs();
    const startTs = new Date().toISOString();
    let progressTimer: ReturnType<typeof setTimeout> | undefined;

    progressTimer = setTimeout(() => {
      setProgressNote("Still working... this may take a bit.");
    }, 10000);

    setRunning(true);
    try {
      let response: any;
      let status: number | null = null;
      let statusText: string | null = null;

      // Check if this is a predefined agent with a direct webhook URL
      if (agent.is_predefined && agent.webhook_url) {
        const result = await executeAgentWebhook({
          webhookUrl: agent.webhook_url,
          payload: values,
        });
        response = result.result;
        status = result.success ? 200 : 400;
        statusText = result.success ? "OK" : "Webhook Error";
        if (!result.success) {
          throw new Error(result.error || "Webhook execution failed");
        }
      } else {
        // Use the n8n connection flow
        const result = await runN8nWorkflow({
          connectionId: agent.connection_id,
          workflowId: agent.workflow_id,
          webhookUrl: agent.webhook_url || undefined,
          payload: values,
          waitTillFinished: true,
        });
        response = result.result;
        status = result?.success === false ? 400 : 200;
        statusText = result?.success === false ? "n8n-run error" : "OK";
      }

      const formattedInputs = formatInputs(values);
      const end = nowMs();
      const durationMs = Math.round(end - start);
      const responseText = `${getResultText(response)}\n\n(Completed in ${formatDuration(durationMs)}.)`;
      const trace = {
        requestId,
        durationMs,
        startTs,
        endTs: new Date().toISOString(),
        success: true,
        status,
        statusText,
        contentLength: responseText.length,
        headers: undefined,
        error: null,
      };

      await recordAgentExchange({
        agent,
        clientId,
        userText: formattedInputs || "(no inputs)",
        agentText: responseText,
        trace,
      });

      return response;
    } catch (error: any) {
      const end = nowMs();
      const trace = {
        requestId,
        durationMs: Math.round(end - start),
        startTs,
        endTs: new Date().toISOString(),
        success: false,
        status: null,
        statusText: null,
        contentLength: null,
        headers: undefined,
        error: error?.message || "Failed to run agent",
      };

      await recordAgentExchange({
        agent,
        clientId,
        userText: formatInputs(values) || "(no inputs)",
        agentText: `Error: ${trace.error}`,
        trace,
      });

      const enriched = new Error(`${trace.error} (after ${formatDuration(trace.durationMs)}; requestId: ${requestId})`);
      throw enriched;
    } finally {
      if (progressTimer) clearTimeout(progressTimer);
      setProgressNote(null);
      setRunning(false);
    }
  };

  // Chat interface for chat_stream agents
  if (outputBehavior === "chat_stream") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl h-[80vh] p-0 gap-0 flex flex-col">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle className="sr-only">{agent.display_name || agent.agent_key}</DialogTitle>
          </DialogHeader>
          <AgentChatWindow agent={agent} clientId={clientId} className="flex-1 border-0 rounded-none" />
        </DialogContent>
      </Dialog>
    );
  }

  // Form modal for modal_display or field_populate agents
  return (
    <RunAgentDynamicModal
      open={open}
      onOpenChange={onOpenChange}
      title={agent.display_name || agent.agent_key}
      description={agent.description || undefined}
      fields={inputFields}
      onRun={handleRun}
      running={running}
      outputBehavior={outputBehavior}
      progressNote={progressNote || undefined}
    />
  );
}

const formatInputs = (values: Record<string, any>): string => {
  if (!values || Object.keys(values).length === 0) {
    return "";
  }
  return Object.entries(values)
    .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`)
    .join("\n");
};

