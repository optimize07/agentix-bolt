import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bot, Send, Loader2, Sparkles, History, ArrowLeft, Plus, Trash2, Zap, ChevronDown, MessageSquare, Search, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useSellixContext } from "@/hooks/useSellixContext";
import { SellixQuickActions } from "./SellixQuickActions";
import { cn } from "@/lib/utils";
import { useAiConversations, createConversation, addMessage, deleteConversation } from "@/hooks/useAiConversations";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SellixChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AVAILABLE_MODELS = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', speed: 'Fast' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', speed: 'Best' },
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', speed: 'Fastest' },
  { id: 'openai/gpt-5', name: 'GPT-5', speed: 'Powerful' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', speed: 'Balanced' },
];

export const SellixChatDialog = ({ open, onOpenChange }: SellixChatDialogProps) => {
  const { organization, niche, user } = useOrganization();
  const salesContext = useSellixContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState(() => 
    localStorage.getItem('sellix-model') || 'google/gemini-2.5-flash'
  );
  const { conversations, refetch } = useAiConversations();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingMessageRef = useRef<string>("");

  // Persist model selection
  useEffect(() => {
    localStorage.setItem('sellix-model', selectedModel);
  }, [selectedModel]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessageRef.current]);

  // Get conversation history summary
  const getHistorySummary = () => {
    const recentConvs = conversations
      .filter(c => c.metadata?.type === 'sellix')
      .slice(0, 5);
    
    if (recentConvs.length === 0) return '';
    
    return recentConvs.map(c => 
      `- ${formatDistanceToNow(new Date(c.updated_at))} ago: "${c.title}"`
    ).join('\n');
  };

  // Filter conversations based on search query
  const filteredConversations = conversations
    .filter(c => c.metadata?.type === 'sellix')
    .filter(c => 
      searchQuery.trim() === '' || 
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isStreaming) return;

    const userMessage: Message = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);
    streamingMessageRef.current = "";

    // Create conversation on first message
    if (!conversationId && user && organization) {
      const title = textToSend.slice(0, 50) + (textToSend.length > 50 ? "..." : "");
      const newConvId = await createConversation(user.id, organization.id, title, { type: 'sellix' });
      if (newConvId) {
        setConversationId(newConvId);
        await addMessage(newConvId, "user", textToSend);
      }
    } else if (conversationId) {
      await addMessage(conversationId, "user", textToSend);
    }

    // Add placeholder for assistant response
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const context = {
      organization: {
        name: organization?.name,
        niche: niche?.name,
        userCount: salesContext.teamSize,
      },
      salesData: {
        recentSubmissions: salesContext.recentSubmissionsCount,
        targetProgress: salesContext.targetProgress,
      },
      conversationHistory: getHistorySummary(),
    };

    try {
      const SELLIX_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sellix-chat`;
      const resp = await fetch(SELLIX_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: [...messages, userMessage], 
          context,
          model: selectedModel 
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        const errorMessage = errorData.error || `Request failed with status ${resp.status}`;
        
        if (resp.status === 429) {
          toast.error("Rate limit exceeded. Please try again later.");
        } else if (resp.status === 402) {
          toast.error("Payment required. Please add credits to your workspace.");
        } else {
          toast.error(errorMessage);
        }
        setMessages((prev) => prev.slice(0, -1));
        setIsStreaming(false);
        return;
      }

      if (!resp.body) {
        toast.error("No response from Sellix");
        setMessages((prev) => prev.slice(0, -1));
        setIsStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
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
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              streamingMessageRef.current += content;
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: streamingMessageRef.current,
                };
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save assistant response to conversation
      const finalMessage = streamingMessageRef.current;
      setIsStreaming(false);
      streamingMessageRef.current = "";
      
      // Delay refetch to avoid race condition
      if (conversationId && finalMessage) {
        await addMessage(conversationId, "assistant", finalMessage);
        setTimeout(() => refetch(), 500);
      }
    } catch (error) {
      console.error("[Sellix] Error:", error);
      toast.error("Failed to connect to Sellix");
      setMessages((prev) => prev.slice(0, -1));
      setIsStreaming(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  const handleLoadConversation = async (convId: string) => {
    setConversationId(convId);
    // Load messages from the conversation
    const { data, error } = await supabase
      .from('ai_conversation_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    
    if (data && !error) {
      const loadedMessages = data.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      }));
      setMessages(loadedMessages);
    }
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await deleteConversation(convId);
    if (success) {
      refetch();
      if (conversationId === convId) {
        handleNewChat();
      }
      toast.success("Conversation deleted");
    } else {
      toast.error("Failed to delete conversation");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-5xl p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SheetTitle>Sellix</SheetTitle>
              <Badge variant="secondary" className="gap-1.5">
                <Sparkles className="w-3 h-3" />
                AI
              </Badge>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 gap-1">
                    <Zap className="w-3 h-3" />
                    {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name || 'Model'}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2">
                  {AVAILABLE_MODELS.map(model => (
                    <Button
                      key={model.id}
                      variant={selectedModel === model.id ? "secondary" : "ghost"}
                      className="w-full justify-start text-sm mb-1"
                      onClick={() => setSelectedModel(model.id)}
                    >
                      <span className="flex-1 text-left">{model.name}</span>
                      <span className="text-xs text-muted-foreground">{model.speed}</span>
                    </Button>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Conversation History */}
          <div className="w-60 border-r flex flex-col">
            <div className="p-3 border-b space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={handleNewChat}
              >
                <Plus className="w-4 h-4" />
                New Chat
              </Button>
              
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-9 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8 px-2">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground">
                      {searchQuery ? "No conversations found" : "No conversations yet"}
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={cn(
                        "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted transition-colors",
                        conversationId === conv.id && "bg-muted"
                      )}
                      onClick={() => handleLoadConversation(conv.id)}
                    >
                      <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate flex-1">{conv.title}</span>
                      <Trash2 
                        className="w-4 h-4 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                      />
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Chat Area */}
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary flex items-center justify-center mx-auto">
                      <Bot className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Hi, I'm Sellix!</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        I'm your AI Sales Department Head. I can help you analyze performance, 
                        set strategies, and guide your team to success.
                      </p>
                    </div>
                    <SellixQuickActions onSelectAction={handleSend} />
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "rounded-lg px-4 py-2 max-w-[80%]",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}

                {isStreaming && messages[messages.length - 1]?.content === "" && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about sales, team performance, or get coaching..."
                  className="min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={isStreaming}
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isStreaming}
                  size="icon"
                  className="h-[60px] w-[60px]"
                >
                  {isStreaming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
