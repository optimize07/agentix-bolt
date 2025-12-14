import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Send,
  Loader2,
  FileText,
  X,
  Plus,
  Check,
  Sparkles,
  ExternalLink,
  Calendar,
  Tag,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import type { Database } from "@/integrations/supabase/types";
import {
  AgentConfig,
  getAgentInputFields,
  executeAgentWebhook,
} from "@/integrations/n8n/agents";
import { runN8nWorkflow } from "@/integrations/n8n/api";
import { RunAgentDynamicModal } from "@/components/agents/RunAgentDynamicModal";
import { recordAgentExchange } from "@/lib/agentMessaging";
import { getResultText } from "@/lib/resultText";

type KnowledgeBaseItem = Database["public"]["Tables"]["knowledge_base_items"]["Row"];

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: KnowledgeBaseItem[];
  timestamp: Date;
}

interface AskAIWidgetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedItems?: KnowledgeBaseItem[];
  clientId?: string;
  initialAgent?: AgentConfig | null;
}

export function AskAIWidget({ open, onOpenChange, preselectedItems = [], clientId, initialAgent = null }: AskAIWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<KnowledgeBaseItem[]>(preselectedItems);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [agentPickerOpen, setAgentPickerOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);
  const [agentRunnerOpen, setAgentRunnerOpen] = useState(false);
  const [agentRunning, setAgentRunning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch all knowledge base items for selection
  const { data: allItems = [] } = useQuery({
    queryKey: ["kb-items-for-chat"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("knowledge_base_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .in("indexing_status", ["indexed", "processing"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as KnowledgeBaseItem[];
    },
    enabled: open,
  });

  // Fetch available agents (predefined + client overrides)
  const { data: availableAgents = [] } = useQuery({
    queryKey: ["askai-agents", clientId, open],
    enabled: open,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from("agent_configs")
        .select("*")
        .eq("is_predefined", true);

      if (clientId) {
        query = query.or(`scope.eq.agency,client_id.eq.${clientId}`);
      } else {
        query = query.eq("scope", "agency");
      }

      const { data, error } = await query.order("display_name", { ascending: true });
      if (error) throw error;
      return (data || []) as AgentConfig[];
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (preselectedItems.length > 0) {
      setSelectedItems(preselectedItems);
    }
  }, [preselectedItems]);

  // Auto-select agent if provided
  useEffect(() => {
    if (open && initialAgent) {
      setSelectedAgent(initialAgent);
      setAgentRunnerOpen(true);
    }
  }, [open, initialAgent]);

  const toggleItemSelection = (item: KnowledgeBaseItem) => {
    setSelectedItems(prev =>
      prev.find(i => i.id === item.id)
        ? prev.filter(i => i.id !== item.id)
        : [...prev, item]
    );
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Get current user and client context
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Prepare the context
      const itemIds = selectedItems.map(item => item.id);
      const itemContext = selectedItems.length > 0
        ? selectedItems.map(item => ({
            title: item.title,
            content: item.description || "",
            metadata: item.metadata,
          }))
        : undefined;

      // Call the gemini-chat edge function with RAG context
      const { data, error } = await supabase.functions.invoke("gemini-chat", {
        body: {
          prompt: input,
          userId: user.id,
          kbItemIds: itemIds.length > 0 ? itemIds : undefined,
          itemContext,
          temperature: 0.7,
          enableRag: true,
        },
      });

      if (error) throw error;

      // Find sources from the response
      const sources = data.sources
        ? allItems.filter(item => data.sources.includes(item.id))
        : selectedItems;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response || data.text || "I apologize, but I couldn't generate a response.",
        sources: sources.length > 0 ? sources : undefined,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error("Chat error:", error);
      toast.error("Failed to get AI response", {
        description: error.message,
      });

      const errorMessage: Message = {
        role: "assistant",
        content: "I apologize, but I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSelectedItems([]);
  };

  const runSelectedAgent = async (values: Record<string, any>) => {
    if (!selectedAgent) return null;
    const requestId = crypto.randomUUID?.() || `req-${Date.now()}`;
    const start = performance?.now ? performance.now() : Date.now();
    setAgentRunning(true);
    try {
      let response: any;
      let status: number | null = null;
      let statusText: string | null = null;

      if (selectedAgent.is_predefined && selectedAgent.webhook_url) {
        const result = await executeAgentWebhook({
          webhookUrl: selectedAgent.webhook_url,
          payload: values,
        });
        response = result.result;
        status = result.success ? 200 : 400;
        statusText = result.success ? "OK" : "Webhook Error";
        if (!result.success) {
          throw new Error(result.error || "Webhook execution failed");
        }
      } else {
        const result = await runN8nWorkflow({
          connectionId: selectedAgent.connection_id,
          workflowId: selectedAgent.workflow_id,
          webhookUrl: selectedAgent.webhook_url || undefined,
          payload: values,
          waitTillFinished: true,
        });
        response = result.result;
        status = result?.success === false ? 400 : 200;
        statusText = result?.success === false ? "n8n-run error" : "OK";
      }

      const end = performance?.now ? performance.now() : Date.now();
      const durationMs = Math.round(end - start);
      const responseText = `${getResultText(response)}\n\n(Completed in ${durationMs}ms.)`;
      const trace = {
        requestId,
        durationMs,
        startTs: new Date(Date.now() - durationMs).toISOString(),
        endTs: new Date().toISOString(),
        success: true,
        status,
        statusText,
        contentLength: responseText.length,
        headers: undefined,
        error: null,
      };

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: responseText,
          timestamp: new Date(),
        },
      ]);

      await recordAgentExchange({
        agent: selectedAgent,
        clientId,
        userText: JSON.stringify(values, null, 2),
        agentText: responseText,
        trace,
      });

      return response;
    } catch (error: any) {
      const end = performance?.now ? performance.now() : Date.now();
      const durationMs = Math.round(end - start);
      const errText = error?.message || "Failed to run agent";

      await recordAgentExchange({
        agent: selectedAgent,
        clientId,
        userText: JSON.stringify(values, null, 2),
        agentText: `Error: ${errText}`,
        trace: {
          requestId,
          durationMs,
          startTs: new Date(Date.now() - durationMs).toISOString(),
          endTs: new Date().toISOString(),
          success: false,
          status: null,
          statusText: null,
          contentLength: null,
          headers: undefined,
          error: errText,
        },
      });

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${errText}`,
          timestamp: new Date(),
        },
      ]);
      throw error;
    } finally {
      setAgentRunning(false);
      setAgentRunnerOpen(false);
    }
  };

  // Filter items based on search
  const filteredItems = allItems.filter(item => {
    const searchLower = itemSearch.toLowerCase();
    return (
      item.title.toLowerCase().includes(searchLower) ||
      item.category.toLowerCase().includes(searchLower) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
  });

  const agentFields = useMemo(() => {
    if (!selectedAgent) return [];
    return getAgentInputFields(selectedAgent);
  }, [selectedAgent]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl h-[80vh] flex flex-col"
        style={{
          background: 'var(--page-bg)',
          borderColor: 'var(--divider-color)',
        }}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ background: 'color-mix(in srgb, var(--button-bg) 20%, transparent)' }}
              >
                <Sparkles className="w-5 h-5" style={{ color: 'var(--button-bg)' }} />
              </div>
              <div>
                <DialogTitle style={{ color: 'var(--foreground)' }}>Ask AI</DialogTitle>
                <DialogDescription style={{ color: 'var(--muted-foreground)' }}>
                  Query your knowledge base with agentic RAG
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setAgentPickerOpen(true)}>
                Add agent to chat
              </Button>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Clear Chat
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Selected Items */}
        {selectedItems.length > 0 && (
          <div 
            className="flex-shrink-0 pb-3"
            style={{ borderBottom: '1px solid var(--divider-color)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Querying {selectedItems.length} document{selectedItems.length !== 1 ? "s" : ""}:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedItems.map(item => (
                <Badge
                  key={item.id}
                  variant="secondary"
                  style={{
                    background: 'var(--card-bg)',
                    color: 'var(--foreground)',
                    borderColor: 'var(--divider-color)',
                  }}
                >
                  {item.title}
                  <button
                    onClick={() => toggleItemSelection(item)}
                    className="ml-2 hover:opacity-80"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Add Documents Button */}
        <div className="flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowItemSelector(!showItemSelector)}
            className="w-full"
            style={{
              borderColor: 'var(--divider-color)',
              color: 'var(--foreground)',
            }}
          >
            {showItemSelector ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Hide Documents
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Documents to Context
              </>
            )}
          </Button>
        </div>

        {/* Item Selector */}
        {showItemSelector && (
          <Card 
            className="flex-shrink-0 p-4 max-h-64 flex flex-col"
            style={{
              background: 'var(--card-bg)',
              borderColor: 'var(--divider-color)',
            }}
          >
             <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                <Input
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="Search documents..."
                  className="pl-9 h-9"
                  style={{
                    background: 'var(--page-bg)',
                    borderColor: 'var(--divider-color)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>
            <div className="overflow-y-auto space-y-2 pr-2">
              {filteredItems.map(item => {
                const isSelected = selectedItems.find(i => i.id === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItemSelection(item)}
                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:opacity-80"
                    style={{ background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)' }}
                  >
                    <div 
                      className="w-5 h-5 rounded border-2 flex items-center justify-center"
                      style={{
                        background: isSelected ? 'var(--button-bg)' : 'transparent',
                        borderColor: isSelected ? 'var(--button-bg)' : 'var(--divider-color)',
                      }}
                    >
                      {isSelected && <Check className="w-3 h-3" style={{ color: 'var(--button-text)' }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{item.title}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{item.category}</p>
                    </div>
                  </div>
                );
              })}
              {filteredItems.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: 'var(--muted-foreground)' }}>
                  {itemSearch ? "No documents match your search" : "No indexed documents available"}
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <Card 
                className="p-8 text-center"
                style={{
                  background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
                  borderColor: 'var(--divider-color)',
                }}
              >
                <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--button-bg)' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Ask me anything</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
                  I can help you find information, summarize documents, and answer questions about your knowledge base.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
                  <button
                    onClick={() => setInput("What are the key points in these documents?")}
                    className="p-3 rounded-lg transition-colors text-sm hover:opacity-80"
                    style={{
                      background: 'color-mix(in srgb, var(--card-bg) 70%, transparent)',
                      color: 'var(--foreground)',
                    }}
                  >
                    Summarize selected documents
                  </button>
                  <button
                    onClick={() => setInput("What is our brand voice?")}
                    className="p-3 rounded-lg transition-colors text-sm hover:opacity-80"
                    style={{
                      background: 'color-mix(in srgb, var(--card-bg) 70%, transparent)',
                      color: 'var(--foreground)',
                    }}
                  >
                    Ask about brand voice
                  </button>
                  <button
                    onClick={() => setInput("Find all mentions of our target audience")}
                    className="p-3 rounded-lg transition-colors text-sm hover:opacity-80"
                    style={{
                      background: 'color-mix(in srgb, var(--card-bg) 70%, transparent)',
                      color: 'var(--foreground)',
                    }}
                  >
                    Search for specific information
                  </button>
                  <button
                    onClick={() => setInput("Compare these documents and highlight differences")}
                    className="p-3 rounded-lg transition-colors text-sm hover:opacity-80"
                    style={{
                      background: 'color-mix(in srgb, var(--card-bg) 70%, transparent)',
                      color: 'var(--foreground)',
                    }}
                  >
                    Compare documents
                  </button>
                </div>
              </Card>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div 
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'color-mix(in srgb, var(--button-bg) 20%, transparent)' }}
                  >
                    <Sparkles className="w-4 h-4" style={{ color: 'var(--button-bg)' }} />
                  </div>
                )}
                <div className={`flex-1 max-w-[80%] ${message.role === "user" ? "flex justify-end" : ""}`}>
                  <Card 
                    className="p-4"
                    style={{
                      background: message.role === "user" ? 'var(--button-bg)' : 'var(--card-bg)',
                      borderColor: message.role === "user" ? 'var(--button-bg)' : 'var(--divider-color)',
                    }}
                  >
                    <div className="prose prose-invert prose-sm max-w-none">
                      {message.role === "assistant" ? (
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      ) : (
                        <p style={{ color: 'var(--button-text)' }}>{message.content}</p>
                      )}
                    </div>

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div 
                        className="mt-4 pt-4"
                        style={{ borderTop: '1px solid var(--divider-color)' }}
                      >
                        <p className="text-xs mb-2 flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
                          <FileText className="w-3 h-3" />
                          Sources used:
                        </p>
                        <div className="space-y-2">
                          {message.sources.map((source) => (
                            <div
                              key={source.id}
                              className="flex items-start gap-2 p-2 rounded text-xs"
                              style={{ background: 'color-mix(in srgb, var(--page-bg) 50%, transparent)' }}
                            >
                              <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: 'var(--muted-foreground)' }} />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate" style={{ color: 'var(--foreground)' }}>{source.title}</p>
                                <div className="flex items-center gap-2 mt-1" style={{ color: 'var(--muted-foreground)' }}>
                                  <Calendar className="w-3 h-3" />
                                  <span>{format(new Date(source.created_at), "MMM d, yyyy")}</span>
                                  <Tag className="w-3 h-3 ml-2" />
                                  <span>{source.category}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
                      {format(message.timestamp, "h:mm a")}
                    </p>
                  </Card>
                </div>
                {message.role === "user" && (
                  <div 
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--card-bg)' }}
                  >
                    <MessageSquare className="w-4 h-4" style={{ color: 'var(--foreground)' }} />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div 
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'color-mix(in srgb, var(--button-bg) 20%, transparent)' }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: 'var(--button-bg)' }} />
                </div>
                <Card 
                  className="p-4"
                  style={{
                    background: 'var(--card-bg)',
                    borderColor: 'var(--divider-color)',
                  }}
                >
                  <div className="flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div 
          className="flex-shrink-0 flex gap-2 pt-4"
          style={{ borderTop: '1px solid var(--divider-color)' }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={selectedItems.length > 0
              ? "Ask about the selected documents..."
              : "Ask anything about your knowledge base..."
            }
            disabled={isLoading}
            style={{
              background: 'var(--card-bg)',
              borderColor: 'var(--divider-color)',
              color: 'var(--foreground)',
            }}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            style={{
              background: 'var(--button-bg)',
              color: 'var(--button-text)',
            }}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </DialogContent>

      {/* Agent Runner Modal */}
      {selectedAgent && (
        <RunAgentDynamicModal
          open={agentRunnerOpen}
          onOpenChange={setAgentRunnerOpen}
          title={selectedAgent.display_name || selectedAgent.agent_key}
          description={selectedAgent.description || undefined}
          fields={agentFields}
          onRun={runSelectedAgent}
          running={agentRunning}
          outputBehavior={selectedAgent.output_behavior || "modal_display"}
          progressNote={agentRunning ? "Running agent..." : undefined}
        />
      )}

      {/* Agent Picker */}
      <Dialog open={agentPickerOpen} onOpenChange={setAgentPickerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Select an agent</DialogTitle>
            <DialogDescription>Attach a predefined n8n agent to this chat.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[320px] overflow-auto">
            {availableAgents.length === 0 && (
              <p className="text-sm text-muted-foreground">No agents available.</p>
            )}
            {availableAgents.map((agent) => (
              <Card
                key={agent.id}
                className="p-3 border border-border hover:border-emerald-500 cursor-pointer"
                onClick={() => {
                  setSelectedAgent(agent);
                  setAgentRunnerOpen(true);
                  setAgentPickerOpen(false);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">
                      {agent.display_name || agent.agent_key}
                    </p>
                    <p className="text-xs text-muted-foreground">{agent.description}</p>
                  </div>
                  <Badge variant="outline">{agent.area || "agent"}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
