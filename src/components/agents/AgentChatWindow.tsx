import { useState, useRef, useEffect, useMemo, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Send, Loader2, Bot, User } from "lucide-react";
import {
  AgentConfig,
  RuntimeField,
  getAgentInputFields,
  executeAgentWebhook,
} from "@/integrations/n8n/agents";
import { runN8nWorkflow } from "@/integrations/n8n/api";
import ReactMarkdown from "react-markdown";
import { recordAgentExchange } from "@/lib/agentMessaging";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  trace?: TraceMeta;
}

interface AgentChatWindowProps {
  agent: AgentConfig;
  clientId?: string;
  className?: string;
}

type TraceMeta = {
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

const createMessageId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

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

  const renderTrace = (trace?: TraceMeta) => {
    if (!trace) return null;
    return (
      <div className="mt-2 text-[11px] text-muted-foreground border-l pl-3 space-y-1">
        <div className="font-semibold">Trace (admin)</div>
        <div>requestId: {trace.requestId || "n/a"}</div>
        <div>
          status: {trace.status ?? "n/a"} {trace.statusText ? `(${trace.statusText})` : ""}
          {trace.success === false ? " – failed" : ""}
        </div>
        <div>duration: {trace.durationMs != null ? formatDuration(trace.durationMs) : "n/a"}</div>
        <div>size: {trace.contentLength != null ? `${trace.contentLength} chars` : "n/a"}</div>
        {trace.startTs && <div>start: {trace.startTs}</div>}
        {trace.endTs && <div>end: {trace.endTs}</div>}
        {trace.error && <div className="text-destructive">error: {trace.error}</div>}
      </div>
    );
  };

const formatFieldPrompt = (field: RuntimeField) =>
  field.placeholder
    ? `${field.label || field.key}: ${field.placeholder}`
    : `Please provide ${field.label || field.key}.`;

const formatFieldPlaceholder = (field: RuntimeField) =>
  field.placeholder || `Provide ${field.label || field.key}`;

const coerceFieldValue = (field: RuntimeField, rawValue: string) => {
  if (field.type === "number") {
    const parsed = Number(rawValue);
    return Number.isNaN(parsed) ? rawValue : parsed;
  }

  if (field.type === "boolean") {
    const normalized = rawValue.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return rawValue;
};

export function AgentChatWindow({ agent, clientId, className = "" }: AgentChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTraces, setShowTraces] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [pendingFieldKeys, setPendingFieldKeys] = useState<string[]>([]);
  const [hasCollectedAll, setHasCollectedAll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const inputFields = useMemo(() => getAgentInputFields(agent), [agent]);
  const requiredFields = useMemo(
    () => inputFields.filter((field) => field.required),
    [inputFields],
  );
  const optionalFields = useMemo(
    () => inputFields.filter((field) => !field.required),
    [inputFields],
  );
  const requiredFieldSignature = useMemo(
    () => requiredFields.map((field) => field.key).join("|"),
    [requiredFields],
  );

  const mainFieldKey = inputFields.length > 0 ? inputFields[0].key : "query";
  const defaultPlaceholder = inputFields[0]?.placeholder || "Type your message...";
  const pendingField = requiredFields.find((field) => field.key === pendingFieldKeys[0]);
  const dynamicPlaceholder = pendingField
    ? formatFieldPlaceholder(pendingField)
    : defaultPlaceholder;

  const appendMessages = (newMessages: ChatMessage | ChatMessage[]) => {
    const array = Array.isArray(newMessages) ? newMessages : [newMessages];
    setMessages((prev) => [...prev, ...array]);
  };

  const promptFieldByKey = (fieldKey?: string) => {
    if (!fieldKey) return;
    const targetField = requiredFields.find((field) => field.key === fieldKey);
    if (!targetField) return;
    appendMessages({
      id: createMessageId(),
      role: "assistant",
      content: formatFieldPrompt(targetField),
      timestamp: new Date(),
    });
  };

  const convertValuesToPayload = (values: Record<string, string>) => {
    const payload: Record<string, any> = {};
    inputFields.forEach((field) => {
      const rawValue = values[field.key];
      if (rawValue === undefined) return;
      payload[field.key] = coerceFieldValue(field, rawValue);
    });
    return payload;
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const requiredKeys = requiredFields.map((field) => field.key);
    setFieldValues({});
    setPendingFieldKeys(requiredKeys);
    setHasCollectedAll(requiredFields.length === 0);
    setInput("");

    if (requiredFields.length > 0) {
      const overviewList = requiredFields
        .map((field, index) => `${index + 1}. ${field.label || field.key}`)
        .join("\n");
      let overview = `To run ${agent.display_name || agent.agent_key}, I'll need:\n${overviewList}`;
      if (optionalFields.length > 0) {
        overview += `\nOptional fields: ${optionalFields
          .map((field) => `${field.label || field.key} (${field.key})`)
          .join(", ")}.\nSet optional values using "<field_key>: value".`;
      }
      setMessages([
        {
          id: createMessageId(),
          role: "assistant",
          content: overview,
          timestamp: new Date(),
        },
        {
          id: createMessageId(),
          role: "assistant",
          content: formatFieldPrompt(requiredFields[0]),
          timestamp: new Date(),
        },
      ]);
    } else {
      setMessages([]);
    }
  }, [agent.id, requiredFieldSignature, requiredFields, optionalFields]);

  const executeAgentWithPayload = async (payload: Record<string, any>, userSummary: string) => {
    const requestId = createRequestId();
    const start = nowMs();
    const startTs = new Date().toISOString();
    let workingTimer: ReturnType<typeof setTimeout> | undefined;

    workingTimer = setTimeout(() => {
      appendMessages({
        id: createMessageId(),
        role: "assistant",
        content: "Still working... this may take a bit.",
        timestamp: new Date(),
      });
    }, 10000);

    setIsLoading(true);

    const buildContent = (response: any) => {
      let content = "";
      if (typeof response === "string") {
        content = response;
      } else if (response?.output) {
        content = typeof response.output === "string" ? response.output : JSON.stringify(response.output, null, 2);
      } else if (response?.result) {
        content = typeof response.result === "string" ? response.result : JSON.stringify(response.result, null, 2);
      } else if (response?.raw) {
        content = response.raw;
      } else if (response?.error) {
        content = `Error: ${response.error}`;
      } else {
        content = JSON.stringify(response, null, 2);
      }

      if (response?.threadId) {
        content += `\n\nThread: ${response.threadId}`;
      }
      return content;
    };

    const buildTrace = (args: {
      status?: number | null;
      statusText?: string | null;
      error?: string | null;
      contentLength?: number | null;
    }) => {
      const end = nowMs();
      return {
        requestId,
        durationMs: Math.round(end - start),
        startTs,
        endTs: new Date().toISOString(),
        success: args.error ? false : true,
        status: args.status ?? null,
        statusText: args.statusText ?? null,
        contentLength: args.contentLength ?? null,
        headers: undefined,
        error: args.error ?? null,
      };
    };

    try {
      let response: any;
      let status: number | null = null;
      let statusText: string | null = null;

      if (agent.is_predefined && agent.webhook_url) {
        const result = await executeAgentWebhook({
          webhookUrl: agent.webhook_url,
          payload,
        });
        response = result.result;
        status = result.success ? 200 : 400;
        statusText = result.success ? "OK" : "Webhook Error";
        if (!result.success) {
          throw new Error(result.error || "Webhook execution failed");
        }
      } else {
        const result = await runN8nWorkflow({
          connectionId: agent.connection_id,
          workflowId: agent.workflow_id,
          webhookUrl: agent.webhook_url || undefined,
          payload,
          waitTillFinished: true,
        });
        response = result.result;
        status = result?.success === false ? 400 : 200;
        statusText = result?.success === false ? "n8n-run error" : "OK";
      }

      const content = buildContent(response);
      const trace = buildTrace({ status, statusText, contentLength: content.length });

      appendMessages({
        id: createMessageId(),
        role: "assistant",
        content: `${content}\n\n_(Completed in ${formatDuration(trace.durationMs)}.)_`,
        timestamp: new Date(),
        trace,
      });

      await recordAgentExchange({
        agent,
        clientId,
        userText: userSummary || JSON.stringify(payload, null, 2),
        agentText: content,
        trace,
      });
    } catch (error: any) {
      const trace = buildTrace({
        status: null,
        statusText: null,
        error: error?.message || "Failed to get response",
        contentLength: null,
      });

      appendMessages({
        id: createMessageId(),
        role: "assistant",
        content: `Error: ${error?.message || "Failed to get response"}\n\n_(Failed after ${formatDuration(
          trace.durationMs || 0,
        )}; requestId: ${requestId}.)_`,
        timestamp: new Date(),
        trace,
      });

      await recordAgentExchange({
        agent,
        clientId,
        userText: userSummary || JSON.stringify(payload, null, 2),
        agentText: `Error: ${error?.message || "Failed to get response"}`,
        trace,
      });
    } finally {
      if (workingTimer) clearTimeout(workingTimer);
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const parseFieldAssignment = (text: string) => {
    const colonIndex = text.indexOf(":");
    if (colonIndex <= 0) return null;
    const keyCandidate = text.slice(0, colonIndex).trim().toLowerCase();
    const field = inputFields.find((f) => f.key.toLowerCase() === keyCandidate);
    if (!field) return null;
    const value = text.slice(colonIndex + 1).trim();
    if (!value) return null;
    return { field, value };
  };

  const handleFieldAssignment = async (field: RuntimeField, value: string) => {
    const updatedValues = { ...fieldValues, [field.key]: value };
    setFieldValues(updatedValues);

    if (!field.required) {
      appendMessages({
        id: createMessageId(),
        role: "assistant",
        content: `Noted ${field.label || field.key}. Use "/run" when you're ready.`,
        timestamp: new Date(),
      });
      return;
    }

    const wasPending = pendingFieldKeys.includes(field.key);
    const nextPending = pendingFieldKeys.filter((key) => key !== field.key);
    setPendingFieldKeys(nextPending);

    if (!wasPending) {
      appendMessages({
        id: createMessageId(),
        role: "assistant",
        content: `Updated ${field.label || field.key}.`,
        timestamp: new Date(),
      });
      return;
    }

    if (nextPending.length === 0) {
      setHasCollectedAll(true);
      const summary = requiredFields
        .map((reqField) => `• ${reqField.label || reqField.key}: ${updatedValues[reqField.key] ?? "Not provided"}`)
        .join("\n");

      appendMessages({
        id: createMessageId(),
        role: "assistant",
        content: `Great! Running the workflow with:\n${summary}`,
        timestamp: new Date(),
      });

      await executeAgentWithPayload(convertValuesToPayload(updatedValues), summary);

      appendMessages({
        id: createMessageId(),
        role: "assistant",
        content: 'Need another run? Update a field with "<field_key>: value" and type "/run", or "/reset" to start over.',
        timestamp: new Date(),
      });
    } else {
      promptFieldByKey(nextPending[0]);
    }
  };

  const handleResetFlow = () => {
    if (requiredFields.length === 0) {
      appendMessages({
        id: createMessageId(),
        role: "assistant",
        content: "No structured inputs to reset. Just type your request.",
        timestamp: new Date(),
      });
      return;
    }
    const freshKeys = requiredFields.map((field) => field.key);
    setFieldValues({});
    setPendingFieldKeys(freshKeys);
    setHasCollectedAll(false);
    appendMessages([
      {
        id: createMessageId(),
        role: "assistant",
        content: "Reset complete. Let's gather the details again.",
        timestamp: new Date(),
      },
      {
        id: createMessageId(),
        role: "assistant",
        content: `Fields needed:\n${requiredFields
          .map((field, index) => `${index + 1}. ${field.label || field.key}`)
          .join("\n")}`,
        timestamp: new Date(),
      },
    ]);
    promptFieldByKey(freshKeys[0]);
  };

  const handleRunCommand = async () => {
    if (requiredFields.length === 0) {
      appendMessages({
        id: createMessageId(),
        role: "assistant",
        content: "Just type your request to run this agent.",
        timestamp: new Date(),
      });
      return;
    }

    if (pendingFieldKeys.length > 0) {
      const missing = pendingFieldKeys
        .map((key) => requiredFields.find((field) => field.key === key)?.label || key)
        .join(", ");
      appendMessages({
        id: createMessageId(),
        role: "assistant",
        content: `I still need: ${missing}`,
        timestamp: new Date(),
      });
      return;
    }

    if (Object.keys(fieldValues).length === 0) {
      appendMessages({
        id: createMessageId(),
        role: "assistant",
        content: 'No inputs captured yet. Use "/reset" to start a new run.',
        timestamp: new Date(),
      });
      return;
    }

    const summary = requiredFields
      .map((field) => `• ${field.label || field.key}: ${fieldValues[field.key] ?? "Not provided"}`)
      .join("\n");

    appendMessages({
      id: createMessageId(),
      role: "assistant",
      content: "Re-running the workflow with the saved values...",
      timestamp: new Date(),
    });

    await executeAgentWithPayload(convertValuesToPayload(fieldValues), summary);

    appendMessages({
      id: createMessageId(),
      role: "assistant",
      content: 'Update fields or type "/reset" to gather new inputs.',
      timestamp: new Date(),
    });
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const normalized = trimmed.toLowerCase();

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    appendMessages(userMessage);
    setInput("");

    if (normalized === "/reset") {
      handleResetFlow();
      return;
    }

    if (normalized === "/run") {
      await handleRunCommand();
      return;
    }

    const assignment = parseFieldAssignment(trimmed);
    if (assignment) {
      await handleFieldAssignment(assignment.field, assignment.value);
      return;
    }

    if (requiredFields.length > 0 && pendingFieldKeys.length > 0) {
      const currentKey = pendingFieldKeys[0];
      const targetField =
        requiredFields.find((field) => field.key === currentKey) || requiredFields[0];
      if (targetField) {
        await handleFieldAssignment(targetField, trimmed);
        return;
      }
    }

    if (requiredFields.length > 0 && pendingFieldKeys.length === 0 && hasCollectedAll) {
      appendMessages({
        id: createMessageId(),
        role: "assistant",
        content:
          'I already have all required values. Update a field with "<field_key>: value" and type "/run", or use "/reset" to start over.',
        timestamp: new Date(),
      });
      return;
    }

    const payload = {
      ...convertValuesToPayload(fieldValues),
      [mainFieldKey]: trimmed,
    };
    await executeAgentWithPayload(payload, trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className={`flex flex-col h-full border border-border bg-card ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Avatar className="h-8 w-8">
          {agent.avatar_url ? (
            <AvatarImage src={agent.avatar_url} alt={agent.display_name || ""} />
          ) : null}
          <AvatarFallback>
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm text-foreground">{agent.display_name || agent.agent_key}</p>
          <p className="text-xs text-muted-foreground">{agent.display_role || "AI Agent"}</p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-muted-foreground">Online</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setShowTraces((v) => !v)}
          >
            {showTraces ? "Hide traces" : "Show traces"}
          </Button>
          {requiredFields.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleResetFlow}
              disabled={isLoading}
            >
              Reset Inputs
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-foreground mb-1">Start a conversation</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {agent.description || `Ask ${agent.display_name || "the agent"} anything.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  {msg.role === "assistant" ? (
                    <>
                      {agent.avatar_url ? (
                        <AvatarImage src={agent.avatar_url} alt={agent.display_name || ""} />
                      ) : null}
                      <AvatarFallback>
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </>
                  ) : (
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                  <p className="text-xs mt-1 opacity-60">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {showTraces && msg.trace ? renderTrace(msg.trace) : null}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  {agent.avatar_url ? (
                    <AvatarImage src={agent.avatar_url} alt={agent.display_name || ""} />
                  ) : null}
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={dynamicPlaceholder}
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
            disabled={isLoading}
          />
          <Button
            size="icon"
            className="h-11 w-11 flex-shrink-0"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {requiredFields.length > 0
            ? 'Commands: "/reset" to restart, "/run" to reuse saved fields. Optional fields via "<field_key>: value".'
            : "Press Enter to send, Shift+Enter for new line"}
        </p>
      </div>
    </Card>
  );
}

