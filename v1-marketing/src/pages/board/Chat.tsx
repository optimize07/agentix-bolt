import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Plus, FileText, Image as ImageIcon, Paperclip, BookOpen, Save, Layers, MessageSquare, Trash2, Maximize2, Minimize2, Bot, Brain } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import AssetSelectorModal from "@/components/AssetSelectorModal";
import PromptInsertModal from "@/components/PromptInsertModal";
import SaveToAssetDialog from "@/components/SaveToAssetDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CentralBrainModal } from "@/components/CentralBrainModal";
import { ImageGallery } from "@/components/chat/ImageGallery";

interface Creative {
  title: string;
  headline: string;
  primary_text: string;
  description_text: string;
  visual_description?: string;
  visual_prompt?: string;
  tags: string[];
  image_data?: string;
}

interface ChatMessage {
  role: string;
  content: string;
  creatives?: Creative[];
  images?: string[]; // Add images support
}

export default function Chat() {
  const { boardId } = useParams();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [saveAssetDialogOpen, setSaveAssetDialogOpen] = useState(false);
  const [saveAssetData, setSaveAssetData] = useState<{ content: string; type: any; name: string } | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<any[]>([]);
  const [selectedKnowledge, setSelectedKnowledge] = useState<any[]>([]);
  const [selectedStrategies, setSelectedStrategies] = useState<any[]>([]);
  const [selectedMarketResearch, setSelectedMarketResearch] = useState<any[]>([]);
  const [generateImages, setGenerateImages] = useState(true);
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.5-flash");
  const [centralBrainOpen, setCentralBrainOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const availableModels = [
    { value: "google/gemini-2.5-flash", label: "Gemini Flash (Default)", provider: "lovable" },
    { value: "google/gemini-2.5-pro", label: "Gemini Pro (Best)", provider: "lovable" },
    { value: "openai/gpt-5-mini", label: "GPT-5 Mini (Fast)", provider: "lovable" },
    { value: "openai/gpt-5", label: "GPT-5 (Powerful)", provider: "lovable" },
    { value: "google/gemini-2.5-flash-image", label: "🎨 Gemini Image", provider: "lovable" },
    { value: "google/gemini-3-pro-image-preview", label: "🎨 Gemini 3 Image", provider: "lovable" },
    { value: "openrouter/anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet (OpenRouter)", provider: "openrouter" },
    { value: "openrouter/anthropic/claude-3-opus", label: "Claude 3 Opus (OpenRouter)", provider: "openrouter" },
    { value: "openrouter/meta-llama/llama-3.1-405b", label: "Llama 3.1 405B (OpenRouter)", provider: "openrouter" },
    { value: "openrouter/google/gemini-pro-1.5", label: "Gemini 1.5 Pro (OpenRouter)", provider: "openrouter" },
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

  // Fetch all canvas blocks for context
  const { data: canvasBlocks = [] } = useQuery({
    queryKey: ["canvas-blocks-context", boardId],
    queryFn: async () => {
      if (!boardId) return [];
      const { data, error } = await supabase
        .from("canvas_blocks")
        .select("*")
        .eq("agent_board_id", boardId);
      if (error) throw error;
      return data;
    },
    enabled: !!boardId,
  });

  // Fetch board tools
  const { data: boardTools = [] } = useQuery({
    queryKey: ["board-tools", boardId],
    queryFn: async () => {
      if (!boardId) return [];
      const { data, error } = await supabase
        .from("board_tools")
        .select("*")
        .eq("agent_board_id", boardId)
        .eq("enabled", true);
      if (error) throw error;
      return data;
    },
    enabled: !!boardId,
  });

  // Fetch DIRECTOR chat sessions only (canvas_block_id IS NULL)
  const { data: chatSessions = [] } = useQuery({
    queryKey: ["chat-sessions-director", boardId],
    queryFn: async () => {
      if (!boardId) return [];
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("agent_board_id", boardId)
        .is("canvas_block_id", null)  // Only director sessions
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!boardId,
  });

  // Fetch all canvas node chat sessions and their messages for Director context awareness
  const { data: canvasNodeChats = [] } = useQuery({
    queryKey: ["canvas-node-chats", boardId],
    queryFn: async () => {
      if (!boardId) return [];
      const { data: sessions, error } = await supabase
        .from("chat_sessions")
        .select(`
          *,
          canvas_blocks!inner(id, title, type),
          chat_messages(role, content, created_at)
        `)
        .eq("agent_board_id", boardId)
        .not("canvas_block_id", "is", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return sessions;
    },
    enabled: !!boardId,
  });

  // Initialize or fetch chat session
  useEffect(() => {
    const initSession = async () => {
      if (!boardId) return;

      // If a session is selected, use it
      if (selectedSessionId) {
        setSessionId(selectedSessionId);
        await loadSessionMessages(selectedSessionId);
        return;
      }

      // Otherwise, use the first session or create new
      if (chatSessions.length > 0) {
        const firstSession = chatSessions[0];
        setSessionId(firstSession.id);
        setSelectedSessionId(firstSession.id);
        await loadSessionMessages(firstSession.id);
      } else {
        // Create new Director session (explicitly NULL canvas_block_id)
        const { data: newSession } = await supabase
          .from("chat_sessions")
          .insert([{ 
            agent_board_id: boardId, 
            canvas_block_id: null,  // Explicitly mark as Director session
            title: "New Chat" 
          }])
          .select()
          .single();
        
        if (newSession) {
          setSessionId(newSession.id);
          setSelectedSessionId(newSession.id);
          queryClient.invalidateQueries({ queryKey: ["chat-sessions-director", boardId] });
        }
      }
    };

    initSession();
  }, [boardId, selectedSessionId, chatSessions.length]);

  const loadSessionMessages = async (sessId: string) => {
    const { data: prevMessages } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_session_id", sessId)
      .order("created_at", { ascending: true });

    if (prevMessages) {
      setMessages(prevMessages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        creatives: msg.metadata?.creatives,
        images: msg.metadata?.images, // Load images from metadata
      })));
    } else {
      setMessages([]);
    }
  };

  // Handle referenced block from Canvas
  useEffect(() => {
    if (location.state?.referencedBlock) {
      const block = location.state.referencedBlock;
      const refText = `[Referenced from Canvas: ${block.title || block.type}]\n${block.content || block.url || ''}`;
      setMessage(refText);
    }
  }, [location.state]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const deleteChatMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await supabase.from("chat_messages").delete().eq("chat_session_id", sessionId);
      await supabase.from("chat_sessions").delete().eq("id", sessionId);
    },
    onSuccess: (_, deletedSessionId) => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions-director", boardId] });
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

  const sendToKanbanMutation = useMutation({
    mutationFn: async (creative: Creative) => {
      let imageUrl = null;

      // Upload image to storage if available
      if (creative.image_data) {
        try {
          const base64Data = creative.image_data.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/png' });
          
          const fileName = `${Date.now()}-${creative.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('canvas-uploads')
            .upload(fileName, blob);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('canvas-uploads')
            .getPublicUrl(fileName);
          
          imageUrl = publicUrl;
        } catch (error) {
          console.error("Error uploading image:", error);
        }
      }

      const { error } = await supabase
        .from("creative_cards")
        .insert({
          agent_board_id: boardId,
          title: creative.title,
          headline: creative.headline,
          primary_text: creative.primary_text,
          description_text: creative.description_text,
          tags: creative.tags,
          status: "AI_DRAFT",
          image_url: imageUrl,
          notes: creative.visual_prompt || creative.visual_description || "",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creative-cards"] });
      toast({
        title: "Added to Kanban",
        description: "Creative has been added to AI Generated Drafts",
      });
    },
  });

  const handleSendMessage = async () => {
    if (!message.trim() || !boardId || !sessionId) return;

    const userMessage = { role: "user", content: message };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    // Save user message to DB
    await supabase.from("chat_messages").insert([{
      chat_session_id: sessionId,
      role: "user",
      content: message,
    }]);

    // Title will be auto-generated by AI after first response

    setMessage("");
    setIsGenerating(true);

    // Build canvas context - separate images for vision
    const imageBlocks: string[] = [];
    const textContext: string[] = [];
    
    canvasBlocks.forEach((block: any) => {
      const type = block.type.toUpperCase();
      const title = block.title || 'Untitled';
      
      if (block.type === 'image' && block.url) {
        // Add to image array for vision
        imageBlocks.push(block.url);
        textContext.push(`[IMAGE] ${title}`);
      } else {
        const content = block.content || block.url || block.file_path || '';
        textContext.push(`[${type}] ${title}: ${content}`);
      }
    });
    
    const canvasContext = textContext.join('\n');

    // Build tools context
    const toolsContext = boardTools
      .map((tool: any) => `- ${tool.name}: ${tool.description || 'No description'}`)
      .join('\n');

    // Build knowledge context
    const knowledgeContext = selectedKnowledge
      .map((k: any) => `[KNOWLEDGE] ${k.title}: ${k.content}`)
      .join('\n');

    // Build strategy context
    const strategyContext = selectedStrategies
      .map((s: any) => `[STRATEGY - ${s.category}] ${s.title}: ${s.content}`)
      .join('\n');

    // Build market research context
    const researchContext = selectedMarketResearch
      .map((r: any) => `[RESEARCH - ${r.type}] ${r.name}: ${r.content}`)
      .join('\n');

    // Build canvas chat node context - Director sees ALL canvas conversations
    const canvasChatsContext = canvasNodeChats
      .map((chat: any) => {
        const blockTitle = chat.canvas_blocks?.title || 'Untitled Canvas Chat';
        const blockType = chat.canvas_blocks?.type || 'chat';
        const messages = (chat.chat_messages || [])
          .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((m: any) => `  ${m.role}: ${m.content}`)
          .join('\n');
        return `[CANVAS CHAT - ${blockType.toUpperCase()}] ${blockTitle}:\n${messages || '  (No messages yet)'}`;
      })
      .join('\n\n');

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
            assets: selectedAssets,
            generateImages: generateImages,
            canvasContext: canvasContext,
            canvasImages: imageBlocks,
            toolsContext: toolsContext,
            knowledgeContext: knowledgeContext,
            strategyContext: strategyContext,
            researchContext: researchContext,
            canvasChatsContext: canvasChatsContext,  // Director context awareness
            model: selectedModel,
            isFirstMessage: messages.length === 0,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again in a moment.");
        }
        
        if (response.status === 402) {
          throw new Error("Payment required. Please add credits to your workspace.");
        }
        
        throw new Error(errorData.error || "Failed to generate creatives");
      }

      const data = await response.json();
      console.log("Response data:", data);

      let assistantMessage: ChatMessage;
      
      if (data.type === "conversation" || (data.creatives?.length === 0 && data.message)) {
        // Conversational response (may include images)
        assistantMessage = {
          role: "assistant",
          content: data.message || "I'm here to help! Ask me anything or request ad creatives.",
          creatives: [],
          images: data.images || [], // Include images if present
        };
      } else {
        // Creative generation response
        assistantMessage = {
          role: "assistant",
          content: data.message || `Generated ${data.creatives?.length || 0} creative concepts:`,
          creatives: data.creatives || [],
        };
      }

      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message to DB with images
      await supabase.from("chat_messages").insert([{
        chat_session_id: sessionId,
        role: "assistant",
        content: assistantMessage.content,
        metadata: { 
          creatives: assistantMessage.creatives,
          images: assistantMessage.images // Save images to metadata
        } as any, // Cast to avoid Json type error
      }]);

      // Update session title if AI provided one
      if (data.suggestedTitle && messages.length === 0) {
        await supabase
          .from("chat_sessions")
          .update({ title: data.suggestedTitle })
          .eq("id", sessionId);
        queryClient.invalidateQueries({ queryKey: ["chat-sessions-director", boardId] });
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate creatives",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToAsset = (creative: Creative) => {
    setSaveAssetData({
      content: JSON.stringify(creative),
      type: "text",
      name: creative.title,
    });
    setSaveAssetDialogOpen(true);
  };

  const handleNewChat = async () => {
    if (!boardId) return;

    const { data: newSession } = await supabase
      .from("chat_sessions")
      .insert([{ 
        agent_board_id: boardId, 
        title: "New Chat",
        canvas_block_id: null  // Director session
      }])
      .select()
      .single();
    
    if (newSession) {
      setSelectedSessionId(newSession.id);
      setSessionId(newSession.id);
      setMessages([]);
      queryClient.invalidateQueries({ queryKey: ["chat-sessions-director", boardId] });
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
            {canvasBlocks.length > 0 && (
              <Badge variant="outline" className="text-xs">
                <Layers className="w-3 h-3 mr-1" />
                {canvasBlocks.length} canvas block(s)
              </Badge>
            )}
            {boardTools.length > 0 && (
              <Badge variant="outline" className="text-xs">
                <Brain className="w-3 h-3 mr-1" />
                {boardTools.length} tool(s)
              </Badge>
            )}
          </div>
          {(selectedKnowledge.length > 0 || selectedStrategies.length > 0 || selectedMarketResearch.length > 0 || selectedAssets.length > 0) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Context:</span>
              {selectedKnowledge.length > 0 && <Badge variant="secondary" className="text-xs">📚 {selectedKnowledge.length} Knowledge</Badge>}
              {selectedStrategies.length > 0 && <Badge variant="secondary" className="text-xs">📋 {selectedStrategies.length} Strategy</Badge>}
              {selectedMarketResearch.length > 0 && <Badge variant="secondary" className="text-xs">📊 {selectedMarketResearch.length} Research</Badge>}
              {selectedAssets.length > 0 && <Badge variant="secondary" className="text-xs">🎨 {selectedAssets.length} Assets</Badge>}
            </div>
          )}
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
                    Ask the AI to generate creatives, reference assets from your library, or
                    explore campaign ideas.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx}>
                <Card
                  className={`p-4 ${
                    msg.role === "user"
                      ? "bg-primary/5 ml-12"
                      : "bg-muted/30 mr-12"
                  }`}
                >
                  <p className="text-sm text-foreground">{msg.content}</p>
                  
                  {/* Display generated images */}
                  {msg.images && msg.images.length > 0 && (
                    <div className="mt-4">
                      <ImageGallery images={msg.images} />
                    </div>
                  )}
                </Card>
                
                {msg.creatives && msg.creatives.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 mr-12">
                    {msg.creatives.map((creative, creativeIdx) => (
                      <Card key={creativeIdx} className="p-4 space-y-3">
                        <div className="aspect-video bg-muted/50 rounded-md overflow-hidden">
                          {creative.image_data ? (
                            <img 
                              src={creative.image_data} 
                              alt={creative.title} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-center p-4">
                                <ImageIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">
                                  {creative.visual_prompt || creative.visual_description || "No image generated"}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">{creative.title}</h4>
                          <p className="text-xs text-foreground">
                            <strong>Headline:</strong> {creative.headline}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {creative.primary_text}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {creative.tags.map((tag, tagIdx) => (
                              <Badge key={tagIdx} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => sendToKanbanMutation.mutate(creative)}
                            disabled={sendToKanbanMutation.isPending}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Send to Kanban
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveToAsset(creative)}
                          >
                            <Save className="w-3 h-3 mr-1" />
                            Save to Assets
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-border bg-card p-4">
          <div className="max-w-4xl mx-auto">
            {canvasBlocks.length > 0 && (
              <div className="mb-3">
                <Badge variant="outline" className="text-xs">
                  <Layers className="w-3 h-3 mr-1" />
                  Canvas context active ({canvasBlocks.length} blocks)
                </Badge>
              </div>
            )}
            {(selectedKnowledge.length > 0 || selectedStrategies.length > 0 || selectedMarketResearch.length > 0 || selectedAssets.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedKnowledge.map((item) => (
                  <Badge key={item.id} variant="secondary" className="gap-1">
                    📚 {item.title}
                    <button
                      onClick={() => setSelectedKnowledge(prev => prev.filter(k => k.id !== item.id))}
                      className="ml-1 hover:text-destructive"
                    >
                      ✕
                    </button>
                  </Badge>
                ))}
                {selectedStrategies.map((item) => (
                  <Badge key={item.id} variant="secondary" className="gap-1">
                    📋 {item.title}
                    <button
                      onClick={() => setSelectedStrategies(prev => prev.filter(s => s.id !== item.id))}
                      className="ml-1 hover:text-destructive"
                    >
                      ✕
                    </button>
                  </Badge>
                ))}
                {selectedMarketResearch.map((item) => (
                  <Badge key={item.id} variant="secondary" className="gap-1">
                    📊 {item.name}
                    <button
                      onClick={() => setSelectedMarketResearch(prev => prev.filter(r => r.id !== item.id))}
                      className="ml-1 hover:text-destructive"
                    >
                      ✕
                    </button>
                  </Badge>
                ))}
                {selectedAssets.map((item) => (
                  <Badge key={item.id} variant="secondary" className="gap-1">
                    🎨 {item.name}
                    <button
                      onClick={() => setSelectedAssets(prev => prev.filter(a => a.id !== item.id))}
                      className="ml-1 hover:text-destructive"
                    >
                      ✕
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAssetModalOpen(true)}
                  title="Attach Assets"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPromptModalOpen(true)}
                  title="Insert Template"
                >
                  <BookOpen className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCentralBrainOpen(true)}
                  title="Central Brain - Quick Access"
                >
                  <Brain className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 space-y-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the creatives you want to generate..."
                  className="min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateImages}
                    onChange={(e) => setGenerateImages(e.target.checked)}
                    className="w-4 h-4 rounded border-border"
                  />
                  Generate images with AI (slower but includes visuals)
                </label>
              </div>
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

      <AssetSelectorModal
        open={assetModalOpen}
        onOpenChange={setAssetModalOpen}
        onSelect={(assets) => setSelectedAssets(assets)}
        multiSelect
      />

      <PromptInsertModal
        open={promptModalOpen}
        onOpenChange={setPromptModalOpen}
        onSelect={(template) => setMessage((prev) => prev + "\n" + template.content)}
      />

      {saveAssetData && (
        <SaveToAssetDialog
          open={saveAssetDialogOpen}
          onOpenChange={setSaveAssetDialogOpen}
          content={saveAssetData.content}
          type={saveAssetData.type}
          defaultName={saveAssetData.name}
        />
      )}

      <CentralBrainModal
        open={centralBrainOpen}
        onOpenChange={setCentralBrainOpen}
        onSelectPrompt={(content) => setMessage((prev) => prev + (prev ? "\n\n" : "") + content)}
        onSelectAsset={(asset) => {
          if (!selectedAssets.find(a => a.id === asset.id)) {
            setSelectedAssets((prev) => [...prev, asset]);
          }
        }}
        onSelectKnowledge={(knowledge) => {
          if (!selectedKnowledge.find(k => k.id === knowledge.id)) {
            setSelectedKnowledge((prev) => [...prev, knowledge]);
          }
        }}
        onSelectStrategy={(strategy) => {
          if (!selectedStrategies.find(s => s.id === strategy.id)) {
            setSelectedStrategies((prev) => [...prev, strategy]);
          }
        }}
        onSelectMarketResearch={(research) => {
          if (!selectedMarketResearch.find(r => r.id === research.id)) {
            setSelectedMarketResearch((prev) => [...prev, research]);
          }
        }}
        selectedItems={{
          assets: selectedAssets.map(a => a.id),
          knowledge: selectedKnowledge.map(k => k.id),
          strategies: selectedStrategies.map(s => s.id),
          research: selectedMarketResearch.map(r => r.id),
          prompts: [],
          tools: [],
          roles: [],
        }}
      />
    </div>
  );
}
