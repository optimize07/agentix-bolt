import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Minimize2, Maximize2, MessageSquare, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Block {
  id: string;
  type: string;
  content?: string;
  title?: string;
  instruction_prompt?: string;
  url?: string;
  file_path?: string;
  width: number;
  height: number;
}

interface ChatBlockProps {
  block: Block;
  connectedBlocks: Block[];
  isSelected: boolean;
  isResizing?: boolean;
}

export function ChatBlock({ block, connectedBlocks, isSelected, isResizing }: ChatBlockProps) {
  const { boardId } = useParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.5-flash");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const availableModels = [
    { value: "google/gemini-2.5-flash", label: "Flash" },
    { value: "google/gemini-2.5-pro", label: "Pro" },
    { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
  ];

  // Initialize chat session for this specific block
  useEffect(() => {
    const initSession = async () => {
      if (!boardId || !block.id) return;

      // Try to find existing session for this block
      const { data: sessions } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("agent_board_id", boardId)
        .eq("id", block.id)
        .limit(1);

      if (sessions && sessions.length > 0) {
        setSessionId(sessions[0].id);
        await loadSessionMessages(sessions[0].id);
      } else {
        // Create new session with block ID
        const { data: newSession } = await supabase
          .from("chat_sessions")
          .insert([{ 
            id: block.id,
            agent_board_id: boardId, 
            title: block.title || "Chat" 
          }])
          .select()
          .single();
        
        if (newSession) {
          setSessionId(newSession.id);
        }
      }
    };

    initSession();
  }, [boardId, block.id]);

  const loadSessionMessages = async (sid: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_session_id", sid)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    if (data) {
      setMessages(data.map(msg => ({
        role: msg.role,
        content: msg.content
      })));
    }
  };

  const saveMessageMutation = useMutation({
    mutationFn: async ({ role, content }: { role: string; content: string }) => {
      if (!sessionId) return;
      const { error } = await supabase
        .from("chat_messages")
        .insert([{ chat_session_id: sessionId, role, content }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", sessionId] });
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const buildContext = () => {
    let context = "";
    if (connectedBlocks.length > 0) {
      context = "\n\nConnected Knowledge:\n";
      connectedBlocks.forEach((connectedBlock, idx) => {
        context += `\n[${idx + 1}] ${connectedBlock.title || 'Untitled'} (${connectedBlock.type}):\n`;
        if (connectedBlock.content) context += `Content: ${connectedBlock.content}\n`;
        if (connectedBlock.instruction_prompt) context += `Instructions: ${connectedBlock.instruction_prompt}\n`;
        if (connectedBlock.url) context += `URL: ${connectedBlock.url}\n`;
      });
    }
    return context;
  };

  const handleSend = async () => {
    if (!message.trim() || isGenerating) return;

    const userMessage = message.trim();
    setMessage("");
    setIsGenerating(true);
    
    // Add user message
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    
    // Save user message
    saveMessageMutation.mutate({ role: "user", content: userMessage });

    try {
      const contextInfo = buildContext();
      const systemPrompt = block.instruction_prompt 
        ? `${block.instruction_prompt}${contextInfo}`
        : `You are a helpful AI assistant for a visual canvas board.${contextInfo}`;

      const apiMessages = [
        { role: "system", content: systemPrompt },
        ...newMessages
      ];

      // Add empty assistant message for streaming
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      // Stream the response
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        if (response.status === 402) {
          throw new Error("Payment required. Please add credits to continue.");
        }
        throw new Error("Failed to generate response");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === "assistant") {
                  lastMessage.content = assistantContent;
                }
                return newMessages;
              });
              scrollToBottom();
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save final assistant message
      if (assistantContent) {
        saveMessageMutation.mutate({ role: "assistant", content: assistantContent });
      }
    } catch (error: any) {
      console.error("Error:", error);
      // Remove empty assistant message on error
      setMessages((prev) => prev.slice(0, -1));
      toast({
        title: "Error",
        description: error.message || "Failed to generate response",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card 
      className={cn(
        "flex flex-col h-full bg-card overflow-hidden transition-all",
        isSelected && "ring-2 ring-primary shadow-lg shadow-primary/20"
      )}
      style={{
        width: block.width,
        height: block.height,
        transition: isResizing ? "none" : "width 0.15s ease-out, height 0.15s ease-out",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="font-semibold text-xs truncate">{block.title || "Chat"}</span>
          {connectedBlocks.length > 0 && (
            <Badge variant="secondary" className="h-5 text-xs">
              {connectedBlocks.length}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
        </Button>
      </div>

      {!isCollapsed && (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-xs py-4">
                  <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p>Chat with your connected blocks</p>
                  {connectedBlocks.length > 0 && (
                    <p className="text-xs mt-1">{connectedBlocks.length} blocks connected</p>
                  )}
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={cn("flex gap-2", msg.role === "assistant" ? "justify-start" : "justify-end")}>
                  <div className={cn(
                    "rounded-lg px-2.5 py-1.5 max-w-[85%] text-xs",
                    msg.role === "assistant" 
                      ? "bg-muted text-foreground" 
                      : "bg-primary text-primary-foreground"
                  )}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-2 border-t space-y-1.5 bg-muted/20">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map(model => (
                  <SelectItem key={model.value} value={model.value} className="text-xs">
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1.5">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about connected blocks..."
                className="min-h-[50px] text-xs resize-none"
                disabled={isGenerating}
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || isGenerating}
                size="icon"
                className="h-[50px] w-[50px] flex-shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
