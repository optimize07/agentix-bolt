import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Plus, Loader2, MessageSquare, Trash2, Bot, Brain } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CentralBrainModal } from "@/components/CentralBrainModal";

interface ChatMessage {
  role: string;
  content: string;
}

export default function Chat() {
  const { boardId } = useParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.5-flash");
  const [centralBrainOpen, setCentralBrainOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const availableModels = [
    { value: "google/gemini-2.5-flash", label: "Gemini Flash (Default)" },
    { value: "google/gemini-2.5-pro", label: "Gemini Pro (Best)" },
    { value: "openai/gpt-4o-mini", label: "GPT-4o Mini (Fast)" },
    { value: "openai/gpt-4o", label: "GPT-4o (Powerful)" },
  ];

  const { data: board } = useQuery({
    queryKey: ["agent-board", boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_boards")
        .select("*")
        .eq("id", boardId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!boardId,
  });

  // Fetch chat sessions
  const { data: chatSessions = [] } = useQuery({
    queryKey: ["agent-chat-sessions", boardId],
    queryFn: async () => {
      if (!boardId) return [];
      const { data, error } = await supabase
        .from("agent_chat_sessions")
        .select("*")
        .eq("agent_board_id", boardId)
        .is("canvas_block_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!boardId,
  });

  // Initialize or fetch chat session
  useEffect(() => {
    const initSession = async () => {
      if (!boardId) return;

      if (selectedSessionId) {
        setSessionId(selectedSessionId);
        await loadSessionMessages(selectedSessionId);
        return;
      }

      if (chatSessions.length > 0) {
        const firstSession = chatSessions[0];
        setSessionId(firstSession.id);
        setSelectedSessionId(firstSession.id);
        await loadSessionMessages(firstSession.id);
      } else {
        const { data: newSession } = await supabase
          .from("agent_chat_sessions")
          .insert([{ 
            agent_board_id: boardId, 
            canvas_block_id: null,
            title: "New Chat" 
          }])
          .select()
          .single();
        
        if (newSession) {
          setSessionId(newSession.id);
          setSelectedSessionId(newSession.id);
          queryClient.invalidateQueries({ queryKey: ["agent-chat-sessions", boardId] });
        }
      }
    };

    initSession();
  }, [boardId, selectedSessionId, chatSessions.length]);

  const loadSessionMessages = async (sessId: string) => {
    const { data: prevMessages } = await supabase
      .from("agent_chat_messages")
      .select("*")
      .eq("agent_chat_session_id", sessId)
      .order("created_at", { ascending: true });

    if (prevMessages) {
      setMessages(prevMessages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })));
    } else {
      setMessages([]);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const deleteChatMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await supabase.from("agent_chat_messages").delete().eq("agent_chat_session_id", sessionId);
      await supabase.from("agent_chat_sessions").delete().eq("id", sessionId);
    },
    onSuccess: (_, deletedSessionId) => {
      queryClient.invalidateQueries({ queryKey: ["agent-chat-sessions", boardId] });
      if (selectedSessionId === deletedSessionId) {
        const remainingSessions = chatSessions.filter(s => s.id !== deletedSessionId);
        if (remainingSessions.length > 0) {
          setSelectedSessionId(remainingSessions[0].id);
        } else {
          handleNewChat();
        }
      }
      toast({
        title: "Chat Deleted",
        description: "Chat session has been removed",
      });
    },
  });

  const handleSendMessage = async () => {
    if (!message.trim() || !boardId || !sessionId) return;

    const userMessage = { role: "user", content: message };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    // Save user message to DB
    await supabase.from("agent_chat_messages").insert([{
      agent_chat_session_id: sessionId,
      role: "user",
      content: message,
    }]);

    setMessage("");
    setIsGenerating(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-creative`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: message,
            styleNotes: board?.creative_style_notes,
            model: selectedModel,
            isFirstMessage: messages.length === 0,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate response");
      }

      const data = await response.json();
      
      const assistantMessage = {
        role: "assistant",
        content: data.message || "I'm here to help! Ask me anything.",
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message to DB
      await supabase.from("agent_chat_messages").insert([{
        agent_chat_session_id: sessionId,
        role: "assistant",
        content: assistantMessage.content,
      }]);

      // Update session title if AI provided one
      if (data.suggestedTitle && messages.length === 0) {
        await supabase
          .from("agent_chat_sessions")
          .update({ title: data.suggestedTitle })
          .eq("id", sessionId);
        queryClient.invalidateQueries({ queryKey: ["agent-chat-sessions", boardId] });
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate response",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNewChat = async () => {
    if (!boardId) return;

    const { data: newSession } = await supabase
      .from("agent_chat_sessions")
      .insert([{ 
        agent_board_id: boardId, 
        title: "New Chat",
        canvas_block_id: null
      }])
      .select()
      .single();
    
    if (newSession) {
      setSelectedSessionId(newSession.id);
      setSessionId(newSession.id);
      setMessages([]);
      queryClient.invalidateQueries({ queryKey: ["agent-chat-sessions", boardId] });
    }
  };

  const handleSelectSession = (sessId: string) => {
    setSelectedSessionId(sessId);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        {/* Chat History Sidebar */}
        <div className="w-64 border-r border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
          <Button onClick={handleNewChat} className="w-full" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {chatSessions.map((session) => (
              <div key={session.id} className="group relative">
                <Button
                  variant={session.id === selectedSessionId ? "secondary" : "ghost"}
                  className="w-full justify-start text-left h-auto py-2 pr-8"
                  onClick={() => handleSelectSession(session.id)}
                >
                  <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate text-xs">{session.title || "New Chat"}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 h-6 w-6 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChatMutation.mutate(session.id);
                  }}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="border-b border-border p-4 flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[200px]">
                <Bot className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map(model => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    Start a Conversation
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    Ask the AI to generate creatives, brainstorm campaign ideas,
                    or explore marketing strategies.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <Card
                key={idx}
                className={cn(
                  "p-4",
                  msg.role === "user"
                    ? "bg-primary/5 ml-12"
                    : "bg-muted/30 mr-12"
                )}
              >
                <p className="text-sm text-foreground whitespace-pre-wrap">{msg.content}</p>
              </Card>
            ))}
            
            {isGenerating && (
              <Card className="p-4 bg-muted/30 mr-12">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Generating...</span>
                </div>
              </Card>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-border bg-card p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCentralBrainOpen(true)}
                  title="Central Brain - Quick Access"
                >
                  <Brain className="w-4 h-4" />
                </Button>
              </div>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the creatives you want to generate..."
                className="min-h-[60px] resize-none flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button 
                onClick={handleSendMessage} 
                size="lg" 
                className="shrink-0"
                disabled={isGenerating}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      </div>

      <CentralBrainModal
        open={centralBrainOpen}
        onOpenChange={setCentralBrainOpen}
        onSelectPrompt={(content) => setMessage((prev) => prev + (prev ? "\n\n" : "") + content)}
      />
    </div>
  );
}

