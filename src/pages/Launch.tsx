import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ChatSidebar } from "@/components/ChatSidebar";
import { Sparkles, Send, Plus, MessageSquare, Loader2, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MarkdownMessage } from "@/components/chat/MarkdownMessage";
import { useAllFeatureToggles } from "@/hooks/useFeatureToggle";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  title: string | null;
  created_at: string;
}

export default function Launch() {
  const { clientId } = useParams<{ clientId: string }>();
  const { isEnabled, loading: loadingFeatures } = useAllFeatureToggles(clientId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.5-flash");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Check if feature is enabled
  const featureEnabled = loadingFeatures || isEnabled("feature.launch");

  if (!loadingFeatures && !featureEnabled) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>Feature Disabled</CardTitle>
            <CardDescription>
              The Launch feature is currently disabled for this client. Contact your administrator to enable it.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Fetch standalone chat sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ["launch-sessions", clientId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from("chat_sessions")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (clientId) {
        query = query.eq("client_id", clientId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ChatSession[];
    },
  });

  // Load messages for selected session
  useEffect(() => {
    if (currentSessionId) {
      loadSessionMessages(currentSessionId);
    }
  }, [currentSessionId]);

  const loadSessionMessages = async (sessionId: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, role, content")
      .eq("chat_session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load messages");
      return;
    }

    setMessages(data.map(m => ({ 
      id: m.id, 
      role: m.role as "user" | "assistant", 
      content: m.content 
    })));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createNewChat = async () => {
    setMessages([]);
    setCurrentSessionId(null);
  };

  const saveMessage = async (sessionId: string, role: string, content: string) => {
    const { error } = await supabase
      .from("chat_messages")
      .insert({ chat_session_id: sessionId, role, content });
    
    if (error) console.error("Failed to save message:", error);
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsGenerating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Create session if needed
      let sessionId = currentSessionId;
      if (!sessionId) {
        const { data: newSession, error: sessionError } = await supabase
          .from("chat_sessions")
          .insert({ 
            client_id: clientId || null,
            user_id: user.id,
            title: userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : "")
          })
          .select()
          .single();

        if (sessionError) throw sessionError;
        sessionId = newSession.id;
        setCurrentSessionId(sessionId);
        queryClient.invalidateQueries({ queryKey: ["launch-sessions", clientId] });
      }

      // Save user message
      await saveMessage(sessionId, "user", userMessage);

      // Build prompt for API
      const conversationContext = messages.map(m => `${m.role}: ${m.content}`).join("\n");
      const fullPrompt = conversationContext 
        ? `${conversationContext}\nuser: ${userMessage}\n\nPlease continue the conversation as the assistant.`
        : userMessage;

      // Call gemini-chat edge function with streaming
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ 
            prompt: fullPrompt, 
            model: selectedModel,
            stream: true,
            clientId: clientId 
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again later.");
          return;
        }
        if (response.status === 402) {
          toast.error("Usage limit reached. Please add credits.");
          return;
        }
        throw new Error("Failed to get response");
      }

      const contentType = response.headers.get("content-type");
      
      // Check if streaming response
      if (contentType?.includes("text/event-stream")) {
        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        let assistantContent = "";
        setMessages(prev => [...prev, { role: "assistant", content: "" }]);

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  assistantContent += content;
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                    return updated;
                  });
                }
              } catch {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }

        // Save assistant message
        if (assistantContent) {
          await saveMessage(sessionId, "assistant", assistantContent);
        }
      } else {
        // Handle non-streaming JSON response
        const data = await response.json();
        const assistantContent = data.response || data.choices?.[0]?.message?.content || "No response";
        
        setMessages(prev => [...prev, { role: "assistant", content: assistantContent }]);
        await saveMessage(sessionId, "assistant", assistantContent);
      }

    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to send message");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen w-full bg-background">
      <ChatSidebar />
      <main className="flex-1 flex h-[calc(100vh-2rem)] p-4 gap-4 overflow-hidden">
        {/* Sidebar - Chat History */}
        <Card className="w-64 flex-shrink-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Chats</CardTitle>
            <Button variant="ghost" size="icon" onClick={createNewChat}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="space-y-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setCurrentSessionId(session.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm truncate transition-colors ${
                    currentSessionId === session.id
                      ? "bg-primary/20 text-primary"
                      : "hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <MessageSquare className="h-3 w-3 inline mr-2" />
                  {session.title || "New Chat"}
                </button>
              ))}
              {sessions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No chats yet
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Agentix AI</CardTitle>
            <span className="text-sm text-muted-foreground">Your AI assistant for quick questions & ideas</span>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Start a conversation</p>
                  <p className="text-sm">Ask anything - brainstorm ideas, get advice, or just chat.</p>
                </div>
              )}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <MarkdownMessage content={message.content} />
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isGenerating && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="max-w-3xl mx-auto flex gap-2">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google/gemini-2.5-flash">Gemini Flash</SelectItem>
                  <SelectItem value="google/gemini-2.5-pro">Gemini Pro</SelectItem>
                  <SelectItem value="openai/gpt-4o-mini">GPT-4o Mini</SelectItem>
                  <SelectItem value="openai/gpt-4o">GPT-4o</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 min-h-[44px] max-h-32 resize-none"
                rows={1}
              />
              <Button onClick={handleSend} disabled={!input.trim() || isGenerating}>
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </main>
    </div>
  );
}

