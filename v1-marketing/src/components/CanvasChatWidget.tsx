import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Minimize2, Maximize2, MessageSquare, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Block {
  id: string;
  type: string;
  content?: string;
  title?: string;
  position_x: number;
  position_y: number;
  instruction_prompt?: string;
  url?: string;
  file_path?: string;
}

interface CanvasChatWidgetProps {
  canvasBlocks: Block[];
  selectedBlock?: Block | null;
  onAddToCanvas?: (content: string, type: string) => void;
}

export function CanvasChatWidget({ canvasBlocks, selectedBlock, onAddToCanvas }: CanvasChatWidgetProps) {
  const { boardId } = useParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.5-flash");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const availableModels = [
    { value: "google/gemini-2.5-flash", label: "Flash", provider: "lovable" },
    { value: "google/gemini-2.5-pro", label: "Pro", provider: "lovable" },
    { value: "openai/gpt-5-mini", label: "GPT-5 Mini", provider: "lovable" },
    { value: "google/gemini-2.5-flash-image", label: "🎨 Gemini Image", provider: "lovable" },
    { value: "google/gemini-3-pro-image-preview", label: "🎨 Gemini 3 Image", provider: "lovable" },
    { value: "openrouter/anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet", provider: "openrouter" },
    { value: "openrouter/meta-llama/llama-3.1-405b", label: "Llama 3.1 405B", provider: "openrouter" },
  ];

  // Initialize chat session
  useEffect(() => {
    const initSession = async () => {
      if (!boardId) return;

      const { data: sessions } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("agent_board_id", boardId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (sessions && sessions.length > 0) {
        setSessionId(sessions[0].id);
        await loadSessionMessages(sessions[0].id);
      } else {
        const { data: newSession } = await supabase
          .from("chat_sessions")
          .insert([{ agent_board_id: boardId, title: "Canvas Chat" }])
          .select()
          .single();
        
        if (newSession) {
          setSessionId(newSession.id);
        }
      }
    };

    initSession();
  }, [boardId]);

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

  const handleSend = async () => {
    if (!message.trim() || isGenerating) return;

    const userMessage = message.trim();
    setMessage("");
    
    // Add user message
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    
    // Save user message
    await saveMessageMutation.mutateAsync({ role: "user", content: userMessage });

    setIsGenerating(true);

    try {
      // Build context with canvas blocks
      let contextInfo = "";
      if (canvasBlocks.length > 0) {
        contextInfo = "\n\nCanvas Context:\n";
        canvasBlocks.forEach((block, idx) => {
          contextInfo += `Block ${idx + 1} (${block.type}): ${block.title || block.content || 'Untitled'}\n`;
        });
      }

      if (selectedBlock) {
        contextInfo += `\n\nSelected Block: ${selectedBlock.title || selectedBlock.content || 'Untitled'} (${selectedBlock.type})`;
      }

      const { data, error } = await supabase.functions.invoke("generate-creative", {
        body: {
          messages: [...newMessages, {
            role: "system",
            content: `You are a helpful AI assistant for a visual canvas board. ${contextInfo}`
          }],
          model: selectedModel,
        },
      });

      if (error) throw error;

      const assistantMessage = data.message || "I apologize, but I couldn't generate a response.";
      
      // Add assistant message
      setMessages(prev => [...prev, { role: "assistant", content: assistantMessage }]);
      
      // Save assistant message
      await saveMessageMutation.mutateAsync({ role: "assistant", content: assistantMessage });
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate response",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn(
      "fixed bottom-6 right-6 z-50 shadow-2xl transition-all duration-300",
      isCollapsed ? "w-80 h-16" : "w-96 h-[600px]",
      "flex flex-col"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Canvas Chat</span>
          {selectedBlock && (
            <span className="text-xs text-muted-foreground">
              · {selectedBlock.title || selectedBlock.type}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsMinimized(true)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Start chatting about your canvas</p>
                  <p className="text-xs mt-1">I can see all {canvasBlocks.length} blocks</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={cn("flex gap-3", msg.role === "assistant" ? "justify-start" : "justify-end")}>
                  <div className={cn(
                    "rounded-lg px-3 py-2 max-w-[85%] text-sm",
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
          <div className="p-3 border-t space-y-2">
            <div className="flex gap-2">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="h-8 text-xs flex-1">
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
            </div>
            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about your canvas..."
                className="min-h-[60px] text-sm resize-none"
                disabled={isGenerating}
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || isGenerating}
                size="icon"
                className="h-[60px] w-[60px] flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
