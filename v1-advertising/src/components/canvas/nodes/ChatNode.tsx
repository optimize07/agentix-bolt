import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import { ChatErrorBoundary } from "./ChatNode/ErrorBoundary";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Send, 
  Maximize2, 
  Minimize2, 
  ChevronDown, 
  ChevronUp,
  Plus,
  Brain,
  X,
  History,
  Sparkles,
  Image as ImageIcon,
  Loader2,
  Copy,
  RefreshCw,
  Download,
  Pencil,
  Square,
  Search,
  ArrowRight,
  Split,
  Trash2,
  Check,
  ImagePlus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CentralBrainModal } from "@/components/CentralBrainModal";
import { ImageGallery } from "@/components/chat/ImageGallery";
import { MarkdownMessage } from "@/components/chat/MarkdownMessage";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { parseMetadata } from "./ChatNode/schemas";
import { parseAIResponse } from "./ChatNode/sectionParser";
import { SectionBubble } from "./ChatNode/SectionBubble";
import { 
  Message, 
  AdCreative, 
  CreativeVariant, 
  ConnectedBlock, 
  ChatNodeData, 
  ChatNodeProps 
} from "./ChatNode/types";
import { 
  MAX_TOTAL_CONTEXT, 
  MAX_BLOCK_CHARS, 
  SEND_COOLDOWN_MS, 
  IMAGE_MODELS, 
  VISION_MODELS,
  CREATIVE_KEYWORDS,
  MODEL_CATEGORIES
} from "./ChatNode/constants";
import { ThinkingIndicator } from "./ChatNode/ThinkingIndicator";
import { QuickBatchGenerator } from "./ChatNode/QuickBatchGenerator";

// Memoized message component for better performance
const MessageItem = memo(({ 
  msg, 
  idx, 
  msgId, 
  isLastAssistant, 
  isEditing, 
  isGenerating,
  selectedModel,
  editContent,
  editingMessageId,
  setEditingMessageId,
  setEditContent,
  handleCopyMessage,
  handleEditMessage,
  handleRegenerate,
  handleBranchConversation,
  handlePushSingleCreative,
  handlePushImageToCreative,
  handlePushContentToCreative,
  handleDownloadMessage,
  handleDeleteMessage,
  connectedCreativeNodes
}: {
  msg: Message;
  idx: number;
  msgId: string;
  isLastAssistant: boolean;
  isEditing: boolean;
  isGenerating: boolean;
  selectedModel: string;
  editContent: string;
  editingMessageId: string | null;
  setEditingMessageId: (id: string | null) => void;
  setEditContent: (content: string) => void;
  handleCopyMessage: (content: string) => void;
  handleEditMessage: (id: string, content: string) => Promise<void>;
  handleRegenerate: (model?: string) => Promise<void>;
  handleBranchConversation: (idx: number) => Promise<void>;
  handlePushSingleCreative?: (creative: AdCreative) => void;
  handlePushImageToCreative?: (imageUrl: string, targetNodeId?: string) => void;
  handlePushContentToCreative?: (content: string, targetNodeId?: string) => void;
  handleDownloadMessage: (content: string, role: string, idx: number) => void;
  handleDeleteMessage: (messageId: string | undefined, idx: number) => Promise<void>;
  connectedCreativeNodes?: { id: string; title?: string }[];
}) => {
  return (
    <div
      className={`group relative p-2 rounded-lg text-sm max-w-[92%] ${
        msg.role === "user"
          ? "bg-primary text-primary-foreground ml-auto rounded-br-none"
          : "bg-muted mr-auto rounded-bl-none"
      }`}
    >
      {isEditing ? (
        <div className="space-y-2">
          <Textarea 
            value={editContent} 
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[60px] nodrag"
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setEditingMessageId(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => handleEditMessage(msgId, editContent)}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className={msg.role === "assistant" ? "" : "whitespace-pre-wrap"}>
            {msg.role === "assistant" ? (
              (() => {
                const sections = parseAIResponse(msg.content);
                
                // Always render as SectionBubbles with action buttons
                return (
                  <div className="space-y-4">
                    {sections.map((section) => (
                      <SectionBubble
                        key={section.id}
                        section={section}
                        onCopy={handleCopyMessage}
                        onPushToCreative={handlePushContentToCreative}
                        connectedCreativeNodes={connectedCreativeNodes}
                      />
                    ))}
                  </div>
                );
              })()
            ) : (
              msg.content
            )}
          </div>
          
          {/* Action buttons on hover - only for assistant messages */}
          {msg.role === "assistant" && (
            <div className="absolute -top-1 left-full ml-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <Button
                size="icon"
                variant="secondary"
                className="h-6 w-6 shadow-sm"
                onClick={() => handleDownloadMessage(msg.content, msg.role, idx)}
                title="Download message"
              >
                <Download className="w-3 h-3" />
              </Button>
              
              {isLastAssistant && !isGenerating && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-6 w-6 shadow-sm"
                      title="Regenerate with model"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-50">
                    <DropdownMenuItem onClick={() => handleRegenerate()}>
                      Same Model ({selectedModel.split('/')[1]})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRegenerate('google/gemini-2.5-flash')}>
                      Gemini Flash
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRegenerate('google/gemini-2.5-pro')}>
                      Gemini Pro
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRegenerate('openai/gpt-5-mini')}>
                      GPT-5 Mini
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRegenerate('smart-auto')}>
                      🧠 Smart Auto
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRegenerate('openai/gpt-5')}>
                      GPT-5
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRegenerate('openrouter/anthropic/claude-3.5-sonnet')}>
                      Claude 3.5 Sonnet (OR)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <Button
                size="icon"
                variant="secondary"
                className="h-6 w-6 shadow-sm"
                onClick={() => handleBranchConversation(idx)}
                title="Branch conversation from here"
              >
                <Split className="w-3 h-3" />
              </Button>
              
              <Button
                size="icon"
                variant="secondary"
                className="h-6 w-6 shadow-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDeleteMessage(msg.id, idx)}
                title="Delete message"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )}
          
          {msg.images && msg.images.length > 0 && (
            <div className="mt-2">
              <ImageGallery 
                images={msg.images} 
                onPushToCreative={handlePushImageToCreative}
                showPushButton={connectedCreativeNodes && connectedCreativeNodes.length > 0}
              />
            </div>
          )}
          
          {msg.creatives && msg.creatives.length > 0 && (
            <div className="mt-2 space-y-2">
              {msg.creatives.map((creative, creativeIdx) => (
                <div key={creativeIdx} className="group/creative relative p-2 bg-card rounded border border-border space-y-1">
                  <h4 className="font-semibold text-xs">{creative.title}</h4>
                  <p className="text-xs"><span className="font-medium">Headline:</span> {creative.headline}</p>
                  <p className="text-xs"><span className="font-medium">Primary:</span> {creative.primary_text}</p>
                  <p className="text-xs"><span className="font-medium">Description:</span> {creative.description_text}</p>
                  {creative.tags && creative.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1">
                      {creative.tags.map((tag, tagIdx) => (
                        <Badge key={tagIdx} variant="secondary" className="text-[10px] px-1 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {creative.image_data && (
                    <img src={creative.image_data} alt={creative.title} className="mt-2 rounded max-w-full" />
                  )}
                  
                  {/* Push to creative node button */}
                  {connectedCreativeNodes && connectedCreativeNodes.length > 0 && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute top-1 right-1 h-6 w-6 shadow-sm opacity-0 group-hover/creative:opacity-100 transition-opacity z-10"
                      onClick={() => handlePushSingleCreative?.(creative)}
                      title="Push to creative node"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
});

export function ChatNode({ data, selected }: ChatNodeProps) {
  // Debug: Log connected output nodes and blocks
  console.log('[ChatNode] connectedOutputNodes:', data.connectedOutputNodes);
  console.log('[ChatNode] Creative nodes:', data.connectedOutputNodes?.filter(n => n.type === 'creative'));
  console.log('[ChatNode] connectedBlocks:', data.connectedBlocks?.map(b => ({
    id: b.id, type: b.type, title: b.title, hasUrl: !!b.url, hasFilePath: !!b.file_path
  })));
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("openrouter/anthropic/claude-sonnet-4.5");
  const [selectedRole, setSelectedRole] = useState("general");
  const [sessionId, setSessionId] = useState<string>(data.sessionId || "");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(data.title || "New Chat");
  const [showBrainModal, setShowBrainModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [connectedTools, setConnectedTools] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // New feature states
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  
  
  // Context selection states
  const [selectedAssets, setSelectedAssets] = useState<any[]>([]);
  const [selectedKnowledge, setSelectedKnowledge] = useState<any[]>([]);
  const [selectedStrategies, setSelectedStrategies] = useState<any[]>([]);
  const [selectedResearch, setSelectedResearch] = useState<any[]>([]);
  
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [branchFromMessageId, setBranchFromMessageId] = useState<string | null>(null);
  const prevMessagesLengthRef = useRef<number>(0);
  const wasAtBottomRef = useRef<boolean>(true);

  const queryClient = useQueryClient();

  // Fetch global Central Brain roles
  const { data: aiRoles = [] } = useQuery({
    queryKey: ["ai-roles-global"],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from("ai_roles")
        .select("*")
        .is("project_id", null)
        .eq("enabled", true)
        .order("name");
      if (error) throw error;
      return roles || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Build roles list with default + fetched from ai_roles
  const roles = [
    { value: "general", label: "General Assistant", prompt: "You are a helpful assistant." },
    ...aiRoles.map(role => ({ 
      value: role.id, 
      label: role.name, 
      prompt: role.system_prompt,
      icon: role.icon,
      description: role.description,
    }))
  ];

  // Fetch chat sessions for history - ONLY for this canvas block
  const { data: sessions = [] } = useQuery({
    queryKey: ["chat-sessions-block", data.blockId],
    queryFn: async () => {
      if (!data.blockId) return [];
      const { data: sessionsData, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("canvas_block_id", data.blockId)  // Filter by canvas block ID
        .order("created_at", { ascending: false });
      if (error) throw error;
      return sessionsData || [];
    },
    enabled: !!data.blockId,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: true, // Always fetch fresh data on mount
  });

  // Memoized function to group sessions by date
  const groupSessionsByDate = useMemo(() => {
    return (sessionsList: any[]) => {
      const groups: Record<string, any[]> = {
        'Today': [],
        'Yesterday': [],
        'This Week': [],
        'Older': []
      };

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(thisWeekStart.getDate() - 7);

      sessionsList.forEach(session => {
        const sessionDate = new Date(session.created_at);
        const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());

        if (sessionDay.getTime() === today.getTime()) {
          groups['Today'].push(session);
        } else if (sessionDay.getTime() === yesterday.getTime()) {
          groups['Yesterday'].push(session);
        } else if (sessionDate >= thisWeekStart) {
          groups['This Week'].push(session);
        } else {
          groups['Older'].push(session);
        }
      });

      return groups;
    };
  }, []);

  // Reset all chat state when blockId changes (component reuse protection)
  useEffect(() => {
    // Clear messages immediately to prevent showing old messages
    setMessages([]);
    setStreamingContent("");
    
    // Reset session to what's in props or empty
    setSessionId(data.sessionId || "");
    setEditTitle(data.title || "New Chat");
    
    // Clear any editing/generation states
    setIsGenerating(false);
    setEditingMessageId(null);
    setInput("");
    
    // Abort any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, [data.blockId]);

  // Auto-select most recent session on mount if no session is active
  useEffect(() => {
    if (!sessionId && sessions.length > 0 && data.blockId) {
      const mostRecent = sessions[0];
      setSessionId(mostRecent.id);
      setEditTitle(mostRecent.title || "New Chat");
    }
  }, [sessions, sessionId, data.blockId]);

  // Load messages for current session with race condition protection
  useEffect(() => {
    if (!sessionId || !data.blockId) return;

    const abortController = new AbortController();
    
    const loadMessages = async () => {
      setIsLoadingMessages(true);
      const { data: messagesData, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("chat_session_id", sessionId)
        .order("created_at", { ascending: true })
        .abortSignal(abortController.signal);

      if (abortController.signal.aborted) return;

      if (error) {
        console.error("Failed to load messages:", error);
        setIsLoadingMessages(false);
        return;
      }

      setMessages(messagesData.map((m) => {
        const { images, creatives } = parseMetadata(m.metadata);
        return {
          id: m.id,
          role: m.role as "user" | "assistant", 
          content: m.content,
          images,
          creatives
        };
      }));
      setIsLoadingMessages(false);
    };

    loadMessages();

    return () => {
      abortController.abort();
    };
  }, [sessionId, data.blockId]);

  // Save message mutation - accepts explicit sessionId parameter
  const saveMessageMutation = useMutation({
    mutationFn: async ({ role, content, sessionId: sid, metadata }: { role: string; content: string; sessionId?: string; metadata?: any }) => {
      const targetSessionId = sid || sessionId;
      if (!targetSessionId) return;
      const { error } = await supabase
        .from("chat_messages")
        .insert({
          chat_session_id: targetSessionId,
          role,
          content,
          metadata,
        });
      if (error) throw error;
    },
  });

  // Send to Kanban mutation
  const sendToKanbanMutation = useMutation({
    mutationFn: async (creative: AdCreative) => {
      let imageUrl = null;
      
      if (creative.image_data) {
        const blob = await fetch(creative.image_data).then(r => r.blob());
        const fileName = `${Date.now()}-${creative.title.replace(/\s+/g, '-').toLowerCase()}.png`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("creative-images")
          .upload(fileName, blob, { contentType: "image/png" });

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from("creative-images")
            .getPublicUrl(uploadData.path);
          imageUrl = publicUrl;
        }
      }

      const { error } = await supabase.from("creative_cards").insert({
        agent_board_id: data.boardId!,
        title: creative.title,
        headline: creative.headline,
        primary_text: creative.primary_text,
        description_text: creative.description_text,
        tags: creative.tags,
        status: "AI_DRAFT",
        image_url: imageUrl,
        notes: creative.visual_prompt,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creative-cards"] });
      toast.success("Sent to Kanban board");
    },
    onError: (error) => {
      console.error("Error sending to Kanban:", error);
      toast.error("Failed to send to Kanban");
    },
  });

  // Save to Assets mutation
  const saveToAssetMutation = useMutation({
    mutationFn: async (creative: AdCreative) => {
      let imageUrl = null;
      
      if (creative.image_data) {
        const blob = await fetch(creative.image_data).then(r => r.blob());
        const fileName = `${Date.now()}-${creative.title.replace(/\s+/g, '-').toLowerCase()}.png`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("canvas-uploads")
          .upload(`${data.boardId}/${fileName}`, blob, { contentType: "image/png" });

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from("canvas-uploads")
            .getPublicUrl(uploadData.path);
          imageUrl = publicUrl;
        }
      }

      const { error } = await supabase.from("assets").insert({
        agent_board_id: data.boardId!,
        name: creative.title,
        type: "image",
        description: `${creative.headline}\n\n${creative.primary_text}`,
        tags: creative.tags,
        url_or_path: imageUrl,
        status: "active",
        enabled: true,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Saved to Assets");
    },
    onError: (error) => {
      console.error("Error saving to assets:", error);
      toast.error("Failed to save to assets");
    },
  });

  // Update session title mutation
  const updateTitleMutation = useMutation({
    mutationFn: async ({ title }: { title: string }) => {
      if (!sessionId) return;
      const { error } = await supabase
        .from("chat_sessions")
        .update({ title })
        .eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Chat renamed");
    },
  });

  // Delete session mutation with storage cleanup
  const deleteSessionMutation = useMutation({
    mutationFn: async (sid: string) => {
      // Get all image URLs from messages before deletion
      const { data: imageUrls } = await supabase.rpc('get_session_image_urls', { p_session_id: sid });
      
      // Delete storage files if any exist
      if (imageUrls && imageUrls.length > 0) {
        const filePaths: string[] = [];
        
        for (const urlData of imageUrls) {
          const imageUrl = urlData.image_url;
          // Extract file path from Supabase storage URL
          // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
          const match = imageUrl.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/);
          if (match) {
            const bucket = match[1];
            const path = match[2];
            filePaths.push(path);
            
            // Delete from storage (best effort, don't fail if storage delete fails)
            try {
              await supabase.storage.from(bucket).remove([path]);
            } catch (error) {
              console.warn(`Failed to delete storage file: ${path}`, error);
            }
          }
        }
      }
      
      // Delete messages first, then session
      await supabase.from("chat_messages").delete().eq("chat_session_id", sid);
      await supabase.from("chat_sessions").delete().eq("id", sid);
    },
    onSuccess: (_, deletedSid) => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions-block", data.blockId] });
      
      // If deleted current session, switch to another or create new
      if (sessionId === deletedSid) {
        const remaining = sessions.filter(s => s.id !== deletedSid);
        if (remaining.length > 0) {
          setSessionId(remaining[0].id);
          setEditTitle(remaining[0].title || "New Chat");
        } else {
          setSessionId("");
          setMessages([]);
          setEditTitle("New Chat");
        }
      }
      toast.success("Chat deleted");
    },
  });

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  };

  // Smart auto-scroll: only scroll when user is at bottom or during generation
  useEffect(() => {
    const isNewMessage = messages.length > prevMessagesLengthRef.current;
    const shouldAutoScroll = (wasAtBottomRef.current || isGenerating || streamingContent) && isNewMessage;
    
    if (shouldAutoScroll) {
      // Small delay to ensure DOM is updated
      setTimeout(scrollToBottom, 50);
    }
    
    prevMessagesLengthRef.current = messages.length;
  }, [messages, isGenerating, streamingContent]);

  // Scroll tracking for scroll-to-bottom button
  useEffect(() => {
    // Small delay to ensure DOM is ready (especially for fullscreen transition)
    const timeoutId = setTimeout(() => {
      const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (!viewport) return;

      const handleScroll = () => {
        const isAtBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 100;
        setShowScrollButton(!isAtBottom);
        wasAtBottomRef.current = isAtBottom;
      };

      viewport.addEventListener('scroll', handleScroll);
      
      // Initialize wasAtBottomRef
      const isAtBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 100;
      wasAtBottomRef.current = isAtBottom;
      setShowScrollButton(!isAtBottom);
      
      return () => viewport.removeEventListener('scroll', handleScroll);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [isFullscreen]);

  // Cleanup on unmount - abort any ongoing generation
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
    setStreamingContent("");
    toast.info("Generation stopped");
  };

  const handleRegenerate = async (alternateModel?: string) => {
    // Find last user message index
    let lastUserMsgIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserMsgIndex = i;
        break;
      }
    }
    if (lastUserMsgIndex === -1) return;
    
    // Remove assistant message(s) after last user message
    const messagesUpToUser = messages.slice(0, lastUserMsgIndex + 1);
    setMessages(messagesUpToUser);
    
    // If using alternate model, temporarily switch
    const originalModel = selectedModel;
    if (alternateModel) {
      setSelectedModel(alternateModel);
    }
    
    // Re-send the last user message
    const lastUserMsg = messages[lastUserMsgIndex].content;
    setInput(lastUserMsg);
    
    // Trigger send after a brief delay to ensure state updates
    setTimeout(() => {
      handleSend();
      setInput("");
      // Restore original model after a delay
      if (alternateModel) {
        setTimeout(() => setSelectedModel(originalModel), 1000);
      }
    }, 50);
  };

  const exportConversation = (format: 'markdown' | 'json') => {
    const title = editTitle || 'Chat Export';
    
    if (format === 'markdown') {
      const md = messages.map(m => 
        `**${m.role === 'user' ? 'You' : 'AI'}:**\n\n${m.content}\n`
      ).join('\n---\n\n');
      
      downloadFile(`${title}.md`, md, 'text/markdown');
    } else {
      const json = JSON.stringify({ title, messages, model: selectedModel, role: selectedRole }, null, 2);
      downloadFile(`${title}.json`, json, 'application/json');
    }
    
    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  const downloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Rate limiting state
  const [lastSendTime, setLastSendTime] = useState(0);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    // Rate limiting check
    const now = Date.now();
    if (now - lastSendTime < SEND_COOLDOWN_MS) {
      toast.error("Please wait a moment before sending another message");
      return;
    }
    setLastSendTime(now);

    console.log('[ChatNode] handleSend called:', {
      input: input.trim().slice(0, 100),
      model: selectedModel,
      role: selectedRole,
      sessionId,
      boardId: data.boardId,
      blockId: data.blockId,
      messagesCount: messages.length
    });

    // Initialize AbortController for stop functionality
    abortControllerRef.current = new AbortController();

    // Auto-create session if none exists
    let currentSessionId = sessionId;
    if (!currentSessionId && data.boardId && data.blockId) {
      console.log('[ChatNode] Creating new session...');
      const { data: newSession, error } = await supabase
        .from("chat_sessions")
        .insert({
          agent_board_id: data.boardId,
          canvas_block_id: data.blockId,
          title: input.trim().slice(0, 50) + (input.length > 50 ? "..." : ""),
        })
        .select()
        .single();

      if (error) {
        toast.error("Failed to create chat session");
        return;
      }
      currentSessionId = newSession.id;
      setSessionId(currentSessionId);
      setEditTitle(newSession.title || "New Chat");
      console.log('[ChatNode] Session created:', currentSessionId);
    }

    if (!currentSessionId) {
      toast.error("No chat session available");
      return;
    }

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);

    // Save user message with explicit sessionId
    await saveMessageMutation.mutateAsync({ role: "user", content: userMessage.content, sessionId: currentSessionId });

    try {
      const rolePrompt = roles.find((r) => r.value === selectedRole)?.prompt || roles[0].prompt;
      
      // Include connected tools in context
      const toolContext = connectedTools.length > 0 
        ? `\n\nYou have access to these tools and capabilities:\n${connectedTools.map(t => `- ${t.name}: ${t.description || 'No description'}`).join('\n')}`
        : '';
      
      // Include connected blocks context
      const blockContext = buildConnectedContext();
      
      const systemPrompt = rolePrompt + toolContext + blockContext;

      // Detect if this is a creative generation request
      const isCreativeRequest = CREATIVE_KEYWORDS.some(keyword => userMessage.content.toLowerCase().includes(keyword));
      
      // Detect if this is an image model
      const isImageModel = IMAGE_MODELS.includes(selectedModel);

      console.log('[ChatNode] Request type:', {
        isCreativeRequest,
        isImageModel,
        selectedModel
      });

      // Extract image URLs from connected blocks for vision analysis
      const getConnectedImageUrls = (): string[] => {
        const blocks = data.connectedBlocks || [];
        return blocks
          .filter(block => block.type === 'image' && (block.url || block.file_path))
          .map(block => block.url || block.file_path || '')
          .filter(Boolean)
          .slice(0, 5); // Limit to 5 images to avoid token limits
      };

      if (isCreativeRequest && !isImageModel) {
        // Use generate-creative endpoint for structured ad generation
        const connectedImageUrls = getConnectedImageUrls();
        console.log('[ChatNode] Calling generate-creative endpoint with', connectedImageUrls.length, 'reference images');
        const requestBody = {
          prompt: userMessage.content,
          generateImages: false,
          canvasContext: blockContext,
          canvasImages: connectedImageUrls, // Pass image URLs for vision analysis
          model: selectedModel,
          isFirstMessage: messages.length === 0,
          knowledgeContext: selectedKnowledge.map(k => k.content).join("\n\n"),
          strategyContext: selectedStrategies.map(s => s.content).join("\n\n"),
          researchContext: selectedResearch.map(r => r.content).join("\n\n"),
          assets: selectedAssets.map(a => ({
            name: a.name,
            type: a.type,
            description: a.description || "",
            url: a.url_or_path || "",
          })),
        };
        console.log('[ChatNode] Request body:', requestBody);

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-creative`,
          {
            method: "POST",
            signal: abortControllerRef.current.signal,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (!response.ok) {
          if (response.status === 429) {
            toast.error("Rate limited - please try again later");
            return;
          }
          if (response.status === 402) {
            toast.error("Payment required - please add funds");
            return;
          }
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate response");
        }

        const data = await response.json();
        console.log('[ChatNode] generate-creative response:', data);
        let assistantMessage: Message;

        // Handle creative generation response
        if (data.creatives && data.creatives.length > 0) {
          assistantMessage = {
            role: "assistant",
            content: data.message || `Generated ${data.creatives.length} creative(s)`,
            creatives: data.creatives,
          };
        } else {
          assistantMessage = {
            role: "assistant",
            content: data.message,
            images: data.images || [],
          };
        }

        setMessages(prev => [...prev, assistantMessage]);
        
        // Save to DB with metadata
        console.log('[ChatNode] Saving creative message:', { 
          role: 'assistant', 
          content: assistantMessage.content.slice(0, 50), 
          hasImages: !!assistantMessage.images,
          hasCreatives: !!assistantMessage.creatives
        });
        await saveMessageMutation.mutateAsync({ 
          role: "assistant", 
          content: assistantMessage.content, 
          sessionId: currentSessionId,
          metadata: assistantMessage.images 
            ? { images: assistantMessage.images }
            : assistantMessage.creatives 
            ? { creatives: assistantMessage.creatives }
            : null
        });

        // Update session title if AI provided one (for first message)
        if (data.suggestedTitle && messages.length === 0) {
          await supabase
            .from("chat_sessions")
            .update({ title: data.suggestedTitle })
            .eq("id", currentSessionId);
            
          setEditTitle(data.suggestedTitle);
          queryClient.invalidateQueries({ queryKey: ["chat-sessions-block", data.blockId] });
        }
      } else if (isImageModel) {
        // Image models use chat endpoint directly for image generation
        console.log('[ChatNode] Calling chat endpoint for image model...');
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
          {
            method: "POST",
            signal: abortControllerRef.current.signal,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              messages: [{ role: "user", content: userMessage.content }],
              model: selectedModel,
            }),
          }
        );

        if (!response.ok) {
          if (response.status === 429) {
            toast.error("Rate limited - please try again later");
            return;
          }
          if (response.status === 402) {
            toast.error("Payment required - please add funds");
            return;
          }
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate response");
        }

        const data = await response.json();
        console.log('[ChatNode] Image model response:', data);
        // Chat endpoint returns { choices: [{ message: { content, images: [{ image_url: { url } }] } }] }
        const responseImages = data.choices?.[0]?.message?.images || [];
        const images = responseImages.map((img: any) => img.image_url?.url).filter(Boolean);
        console.log('[ChatNode] Parsed images:', images);
        const content = data.choices?.[0]?.message?.content || 'Generated image';
        
        // Store message with images
        const assistantMessage: Message = { 
          role: "assistant", 
          content,
          images
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        // Save to DB with metadata
        console.log('[ChatNode] Saving image message:', { 
          role: 'assistant', 
          imagesCount: assistantMessage.images?.length || 0 
        });
        await saveMessageMutation.mutateAsync({ 
          role: "assistant", 
          content: assistantMessage.content, 
          sessionId: currentSessionId,
          metadata: { images: assistantMessage.images }
        });
      } else {
        // Use streaming chat endpoint for conversational messages
        console.log('[ChatNode] Calling chat endpoint for streaming...');
        const conversationHistory = messages.map(m => ({
          role: m.role,
          content: m.content
        }));

        // Check for connected images and if model supports vision
        const connectedImageUrls = getConnectedImageUrls();
        const isVisionCapable = VISION_MODELS.includes(selectedModel);
        console.log('[ChatNode] Vision check:', { 
          connectedImages: connectedImageUrls.length, 
          isVisionCapable, 
          selectedModel 
        });

        // Build user message - multimodal if images present and model supports vision
        let userMessageContent: any;
        if (connectedImageUrls.length > 0 && isVisionCapable) {
          console.log('[ChatNode] Building multimodal message with', connectedImageUrls.length, 'images');
          userMessageContent = [
            { type: "text", text: userMessage.content }
          ];
          connectedImageUrls.forEach((imageUrl) => {
            userMessageContent.push({
              type: "image_url",
              image_url: { url: imageUrl }
            });
          });
        } else {
          userMessageContent = userMessage.content;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
          {
            method: "POST",
            signal: abortControllerRef.current.signal,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              messages: [
                { role: "system", content: systemPrompt },
                ...conversationHistory,
                { role: "user", content: userMessageContent }
              ],
              model: selectedModel,
            }),
          }
        );

        if (!response.ok) {
          if (response.status === 429) {
            toast.error("Rate limited - please try again later");
            return;
          }
          if (response.status === 402) {
            toast.error("Payment required - please add funds");
            return;
          }
          const errorText = await response.text();
          throw new Error(errorText || "Failed to generate response");
        }

        // Parse SSE stream token-by-token
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let assistantContent = "";
        let buffer = "";

        // Add empty assistant message to show streaming
        setMessages(prev => [...prev, { role: "assistant", content: "" }]);

        // Debounce state updates during streaming (batch every 50ms)
        let lastUpdateTime = 0;
        let pendingUpdate = false;

        const updateMessage = () => {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { 
              role: "assistant", 
              content: assistantContent 
            };
            return updated;
          });
          pendingUpdate = false;
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          
          // Keep the last incomplete line in the buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim() || line.startsWith(':')) continue;
            
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const token = parsed.choices?.[0]?.delta?.content;
                
                if (token) {
                  assistantContent += token;
                  
                  // Debounced update: only update UI every 50ms
                  const now = Date.now();
                  if (now - lastUpdateTime >= 50) {
                    updateMessage();
                    lastUpdateTime = now;
                  } else if (!pendingUpdate) {
                    pendingUpdate = true;
                    setTimeout(updateMessage, 50);
                  }
                }
              } catch (e) {
                // Skip invalid JSON lines
                console.warn("Failed to parse SSE data:", data);
              }
            }
          }
        }

        // Final update to ensure last tokens are shown
        if (pendingUpdate || assistantContent) {
          updateMessage();
        }

        // Save final message to database
        if (assistantContent) {
          console.log('[ChatNode] Saving streamed message:', { 
            role: 'assistant', 
            contentLength: assistantContent.length 
          });
          await saveMessageMutation.mutateAsync({ 
            role: "assistant", 
            content: assistantContent, 
            sessionId: currentSessionId,
          });
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // User stopped generation - keep partial content
        console.log("[ChatNode] Generation stopped by user");
        return;
      }
      console.error("[ChatNode] Error in handleSend:", error);
      console.error("[ChatNode] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      toast.error("Failed to generate response");
      setMessages(prev => prev.filter(m => m.role !== "assistant" || m.content !== ""));
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleNewChat = async () => {
    if (!data.boardId || !data.blockId) return;

    setIsLoadingMessages(true);
    const { data: newSession, error } = await supabase
      .from("chat_sessions")
      .insert({
        agent_board_id: data.boardId,
        canvas_block_id: data.blockId,  // Link to this canvas block
        title: "New Chat",
      })
      .select()
      .single();

    if (error) {
      setIsLoadingMessages(false);
      toast.error("Failed to create new chat");
      return;
    }

    setMessages([]);
    setSessionId(newSession.id);
    setEditTitle("New Chat");
    setIsLoadingMessages(false);
    toast.success("New chat created");
  };

  const handleSwitchSession = (newSessionId: string) => {
    // Abort any ongoing generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
    
    setIsLoadingMessages(true);
    setSessionId(newSessionId);
    const session = sessions.find((s) => s.id === newSessionId);
    if (session) {
      setEditTitle(session.title || "New Chat");
    }
  };

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      updateTitleMutation.mutate({ title: editTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleBrainSelect = (item: any, type?: string) => {
    if (type === 'tool') {
      // Add tool connection
      setConnectedTools(prev => {
        if (prev.find(t => t.id === item.id)) return prev;
        return [...prev, item];
      });
      toast.success(`Connected tool: ${item.name}`);
    } else if (type === 'asset') {
      setSelectedAssets(prev => {
        if (prev.some(a => a.id === item.id)) return prev;
        return [...prev, item];
      });
      toast.success(`Added asset: ${item.name}`);
    } else if (type === 'knowledge') {
      setSelectedKnowledge(prev => {
        if (prev.some(k => k.id === item.id)) return prev;
        return [...prev, item];
      });
      toast.success(`Added knowledge: ${item.title}`);
    } else if (type === 'prompt') {
      setInput(item.content);
    } else {
      // Get name and content based on item type
      const name = item.name || item.title || 'Content';
      let content = '';
      
      // Handle different content types
      if (typeof item === 'string') {
        content = item;
      } else if (type === 'role') {
        content = item.system_prompt || item.description || '';
      } else if (type === 'strategy') {
        setSelectedStrategies(prev => {
          if (prev.some(s => s.id === item.id)) return prev;
          return [...prev, item];
        });
        toast.success(`Added strategy: ${item.title}`);
        setShowBrainModal(false);
        return;
      } else if (type === 'research') {
        setSelectedResearch(prev => {
          if (prev.some(r => r.id === item.id)) return prev;
          return [...prev, item];
        });
        toast.success(`Added research: ${item.name}`);
        setShowBrainModal(false);
        return;
      } else {
        content = item.content || item.text_content || item.description || '';
      }
      
      // Format with context label
      const formattedContent = `[Injected ${type}: ${name}]\n\n${content}`;
      setInput((prev) => (prev ? `${prev}\n\n${formattedContent}` : formattedContent));
    }
    setShowBrainModal(false);
  };

  const handleRemoveTool = (toolId: string) => {
    setConnectedTools(prev => prev.filter(t => t.id !== toolId));
    toast.success("Tool disconnected");
  };

  const buildConnectedContext = () => {
    const blocks = data.connectedBlocks || [];
    if (blocks.length === 0) return '';
    
    let context = "\n\n=== CONNECTED REFERENCE MATERIALS ===\n";
    context += `IMPORTANT: The following ${blocks.length} block(s) are connected as REFERENCE MATERIALS.\n`;
    context += "You MUST analyze and use these as INSPIRATION when generating content:\n";
    context += "- Study the writing style, hooks, angles, and tone\n";
    context += "- Identify successful patterns and persuasion techniques\n";
    context += "- Create NEW content inspired by (NOT copied from) these examples\n";
    context += "- Match the energy and style while being original\n\n";
    
    let totalChars = context.length;
    let truncatedBlocks = 0;
    
    for (let idx = 0; idx < blocks.length; idx++) {
      const block = blocks[idx];
      const blockHeader = `\n--- REFERENCE ${idx + 1}: ${block.title || 'Untitled'} (${block.type}) ---\n`;
      
      // Check if adding this block would exceed total limit
      if (totalChars + blockHeader.length > MAX_TOTAL_CONTEXT) {
        truncatedBlocks = blocks.length - idx;
        break;
      }
      
      context += blockHeader;
      totalChars += blockHeader.length;
      
      // Handle group blocks specially - their instructions apply to all children
      if (block.type === 'group') {
        const groupInfo = `[REFERENCE GROUP: ${block.title || 'Untitled Group'}]\n`;
        if (block.instruction_prompt) {
          const groupContext = groupInfo + 
            `STYLE NOTES FOR THIS GROUP:\n${block.instruction_prompt}\n` +
            `--- End Style Notes ---\n`;
          if (totalChars + groupContext.length <= MAX_TOTAL_CONTEXT) {
            context += groupContext;
            totalChars += groupContext.length;
          }
        } else {
          if (totalChars + groupInfo.length <= MAX_TOTAL_CONTEXT) {
            context += groupInfo;
            totalChars += groupInfo.length;
          }
        }
        continue; // Skip normal content handling for groups
      }
      
      // Handle image blocks specially
      if (block.type === 'image') {
        const imageInfo = `[REFERENCE IMAGE: ${block.title || 'Untitled'}]\n`;
        if (block.url || block.file_path) {
          const imageContext = imageInfo + `Image URL: ${block.url || block.file_path}\n` + 
                              `INSTRUCTION: Analyze this image's style, colors, and composition. Match this visual style.\n`;
          if (totalChars + imageContext.length <= MAX_TOTAL_CONTEXT) {
            context += imageContext;
            totalChars += imageContext.length;
          }
        }
        continue; // Skip normal content handling for images
      }
      
      // For documents/PDFs, prioritize parsed content over file_path
      if (block.type === 'document') {
        if (block.content) {
          // Truncate very long documents
          const contentToAdd = block.content.length > MAX_BLOCK_CHARS 
            ? block.content.substring(0, MAX_BLOCK_CHARS) + '\n[... document truncated due to length ...]\n'
            : block.content + '\n';
          
          if (totalChars + contentToAdd.length > MAX_TOTAL_CONTEXT) {
            const remainingChars = MAX_TOTAL_CONTEXT - totalChars;
            context += `REFERENCE DOCUMENT (analyze for style & patterns):\n${block.content.substring(0, Math.max(0, remainingChars - 100))}...\n`;
            truncatedBlocks = blocks.length - idx - 1;
            break;
          }
          
          context += `REFERENCE DOCUMENT (analyze for style & patterns):\n${contentToAdd}`;
          totalChars += contentToAdd.length;
        } else if (block.file_path || block.url) {
          const fileUrl = block.file_path || block.url;
          const fileNote = `[Document: ${block.title || 'Untitled'}]\nURL: ${fileUrl}\nNote: This document's text content has not been parsed yet. Please re-parse to enable AI reading.\n`;
          if (totalChars + fileNote.length <= MAX_TOTAL_CONTEXT) {
            context += fileNote;
            totalChars += fileNote.length;
          }
        }
      } else {
        // For text blocks - these are EXAMPLES to be inspired by
        if (block.content) {
          const isLikelyAdCopy = block.content.length < 2000 && 
            (block.content.includes('headline') || block.content.includes('CTA') || 
             block.content.match(/\d+%/) || block.content.includes('free') ||
             block.type === 'text');
          
          const label = isLikelyAdCopy 
            ? `EXAMPLE AD COPY (use as INSPIRATION for style, hooks, and angles):\n`
            : `REFERENCE CONTENT (analyze for tone and approach):\n`;
          
          const contentToAdd = block.content.length > MAX_BLOCK_CHARS
            ? `${label}${block.content.slice(0, MAX_BLOCK_CHARS)}...\n`
            : `${label}${block.content}\n`;
          
          if (totalChars + contentToAdd.length > MAX_TOTAL_CONTEXT) {
            const remainingChars = MAX_TOTAL_CONTEXT - totalChars;
            context += `${label}${block.content.slice(0, Math.max(0, remainingChars - 100))}...\n`;
            truncatedBlocks = blocks.length - idx - 1;
            break;
          }
          
          context += contentToAdd;
          totalChars += contentToAdd.length;
        }
        if (block.url) {
          const urlLine = `Source URL: ${block.url}\n`;
          if (totalChars + urlLine.length <= MAX_TOTAL_CONTEXT) {
            context += urlLine;
            totalChars += urlLine.length;
          }
        }
      }
      
      if (block.instruction_prompt) {
        const instructLine = `⚠️ SPECIAL INSTRUCTION FOR THIS BLOCK: ${block.instruction_prompt}\n`;
        if (totalChars + instructLine.length <= MAX_TOTAL_CONTEXT) {
          context += instructLine;
          totalChars += instructLine.length;
        }
      }
    }
    
    context += "\n=== END REFERENCE MATERIALS ===\n";
    context += "Remember: Analyze the above examples and CREATE NEW, ORIGINAL content inspired by their style and approach.\n";
    if (truncatedBlocks > 0) {
      context += `[Note: ${truncatedBlocks} additional block(s) omitted due to context size limit]\n`;
    }
    
    return context;
  };



  // Push a single creative to connected creative nodes
  const handlePushSingleCreative = async (creative: AdCreative) => {
    const creativeNodes = data.connectedOutputNodes?.filter(n => n.type === 'creative') || [];
    
    if (creativeNodes.length === 0) {
      toast.error("No creative node connected. Connect a creative node first.");
      return;
    }

    // Convert single creative to variant format
    const variant: CreativeVariant = {
      id: crypto.randomUUID(),
      channel: 'facebook-ig',
      primaryText: creative.primary_text,
      headline: creative.headline,
      ctaButton: 'Learn More',
      images: creative.image_data ? [creative.image_data] : [],
    };

    for (const node of creativeNodes) {
      // Fetch existing content and merge
      const { data: existingBlock } = await supabase
        .from("canvas_blocks")
        .select("content")
        .eq("id", node.id)
        .maybeSingle();

      let existingVariants: CreativeVariant[] = [];
      try {
        const parsed = JSON.parse(existingBlock?.content || '{}');
        existingVariants = parsed.variants || [];
      } catch {}

      const updatedVariants = [...existingVariants, variant];

      const { error } = await supabase
        .from("canvas_blocks")
        .update({
          content: JSON.stringify({ variants: updatedVariants }),
          metadata: { lastPushedAt: new Date().toISOString(), pushedFrom: data.blockId }
        })
        .eq("id", node.id);

      if (error) {
        toast.error("Failed to push creative");
        return;
      }

      if (data.onUpdateNodeData) {
        data.onUpdateNodeData(node.id, { content: JSON.stringify({ variants: updatedVariants }) });
      }
    }

    toast.success(`Pushed "${creative.title}" to creative node`);
  };

  // Helper to clean AI prefixes from content (conservative approach)
  const cleanContentPrefixes = (content: string): string => {
    let cleaned = content;
    
    // Only remove very specific AI intro patterns (first line only)
    const firstLineBreak = cleaned.indexOf('\n');
    const firstLine = firstLineBreak > 0 ? cleaned.slice(0, firstLineBreak) : '';
    
    // Check if first line is a clear intro phrase (not part of script)
    const introPatterns = [
      /^here's (a|an|the|your) (draft|version|script|creative|ad|copy).*:?$/i,
      /^based on (your|the) (context|request|brief).*:?$/i,
      /^i've (created|written|drafted).*:?$/i,
      /^sure[,!]? here.*:?$/i,
    ];
    
    // Only remove if first line matches AND is short (< 80 chars)
    if (firstLine.length < 80 && introPatterns.some(p => p.test(firstLine.trim()))) {
      cleaned = cleaned.slice(firstLineBreak + 1);
    }
    
    return cleaned.trim();
  };

  // Parse structured creative content
  const parseContentToCreative = (content: string) => {
    // Require labels to be at start of line and followed by colon
    const headlineMatch = content.match(/^[\*\s]*(?:Headline|Title)\s*:\s*(.+?)$/im);
    const primaryMatch = content.match(/^[\*\s]*(?:Primary Text|Body Text|Description)\s*:\s*([\s\S]+?)(?=^[\*\s]*(?:Headline|Title|CTA|Call to Action)\s*:|$)/im);
    const ctaMatch = content.match(/^[\*\s]*(?:CTA|Call to Action)\s*:\s*(.+?)$/im);
    
    // Only use parsed content if we found CLEAR structured markers
    if (headlineMatch && primaryMatch) {
      return {
        headline: headlineMatch[1]?.trim(),
        primaryText: primaryMatch[1]?.trim(),
        ctaButton: ctaMatch?.[1]?.trim() || 'Learn More',
      };
    }
    
    // Return null for unstructured content (scripts, etc.)
    return null;
  };

  // Push message content to connected creative nodes
  const handlePushContentToCreative = useCallback(async (content: string, targetNodeId?: string) => {
    console.log('[ChatNode] Push content to creative, full length:', content.length);
    console.log('[ChatNode] Content preview:', content.slice(0, 200), '...');
    
    const creativeNodes = data.connectedOutputNodes?.filter(n => n.type === 'creative') || [];
    
    // If targetNodeId provided, only push to that specific node
    const nodesToUpdate = targetNodeId 
      ? creativeNodes.filter(n => n.id === targetNodeId)
      : creativeNodes;
    
    if (nodesToUpdate.length === 0) {
      toast.error(targetNodeId ? "Target creative node not found" : "No creative nodes connected");
      return;
    }
    
    // Clean and parse content
    const cleanedContent = cleanContentPrefixes(content);
    console.log('[ChatNode] After cleaning, length:', cleanedContent.length);
    
    const parsedContent = parseContentToCreative(cleanedContent);
    console.log('[ChatNode] Parsed content:', parsedContent ? 'YES (structured)' : 'NO (raw script)');
    
    // Detect content type based on length
    const isScript = cleanedContent.length > 500;
    
    // Use parsed content or create basic variant with FULL content
    const contentToPush = parsedContent || {
      primaryText: cleanedContent,
      headline: isScript 
        ? 'Script' 
        : (cleanedContent.split('\n')[0]?.slice(0, 150) || 'Generated Content'),
      ctaButton: 'Learn More',
    };
    
    // Parse content into a creative variant
    const newVariant: CreativeVariant = {
      id: crypto.randomUUID(),
      channel: 'facebook-ig',
      ...contentToPush,
      images: [],
    };
    
    // Push to selected creative nodes
    for (const node of nodesToUpdate) {
      const { data: existingBlock } = await supabase
        .from("canvas_blocks")
        .select("content")
        .eq("id", node.id)
        .maybeSingle();

      let existingVariants: CreativeVariant[] = [];
      try {
        const parsed = JSON.parse(existingBlock?.content || '{}');
        existingVariants = parsed.variants || [];
      } catch {}

      const updatedVariants = [...existingVariants, newVariant];
      const updatedContent = JSON.stringify({ variants: updatedVariants });
      
      await supabase
        .from("canvas_blocks")
        .update({ 
          content: updatedContent,
          metadata: { lastPushedAt: new Date().toISOString(), pushedFrom: data.blockId }
        })
        .eq("id", node.id);
      
      if (data.onUpdateNodeData) {
        data.onUpdateNodeData(node.id, { content: updatedContent });
      }
    }
    
    queryClient.invalidateQueries({ queryKey: ["canvas-blocks"] });
    toast.success(`Pushed content to ${nodesToUpdate.length} creative node(s)`);
  }, [data.connectedOutputNodes, data.blockId, data.onUpdateNodeData, queryClient]);

  // Download a single message as markdown file
  const handleDownloadMessage = (content: string, role: string, idx: number) => {
    const filename = `message-${role}-${idx + 1}.md`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Message downloaded");
  };

  // Delete a single message
  const handleDeleteMessage = async (messageId: string | undefined, idx: number) => {
    // If it's a real database message (not just local)
    if (messageId) {
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("id", messageId);
      
      if (error) {
        console.error("Error deleting message:", error);
        toast.error("Failed to delete message from database");
        return;
      }
    }
    
    // Remove from local state
    setMessages(prev => prev.filter((_, i) => i !== idx));
    toast.success("Message deleted");
  };

  // Push an image to connected creative nodes
  const handlePushImageToCreative = useCallback(async (imageUrl: string, targetNodeId?: string) => {
    console.log('[ChatNode] Push image to creative:', imageUrl);
    
    const creativeNodes = data.connectedOutputNodes?.filter(n => n.type === 'creative') || [];
    console.log('[ChatNode] Found creative nodes:', creativeNodes.map(n => ({ id: n.id, title: n.title })));
    
    // If targetNodeId provided, only push to that specific node
    const nodesToUpdate = targetNodeId 
      ? creativeNodes.filter(n => n.id === targetNodeId)
      : creativeNodes;
    
    if (nodesToUpdate.length === 0) {
      toast.error(targetNodeId ? "Target creative node not found" : "No creative nodes connected");
      return;
    }
    
    console.log('[ChatNode] onUpdateNodeData exists?', !!data.onUpdateNodeData);
    
    // Push image to selected creative nodes
    for (const node of nodesToUpdate) {
      console.log(`[ChatNode] Pushing to creative node: ${node.id}`);
      
      const newVariant: CreativeVariant = {
        id: crypto.randomUUID(),
        channel: 'facebook-ig',
        images: [imageUrl],
        headline: 'Generated Image',
      };
      
      // Fetch existing content and merge
      const { data: existingBlock } = await supabase
        .from("canvas_blocks")
        .select("content")
        .eq("id", node.id)
        .maybeSingle();

      let existingVariants: CreativeVariant[] = [];
      try {
        const parsed = JSON.parse(existingBlock?.content || '{}');
        existingVariants = parsed.variants || [];
      } catch {}

      const updatedVariants = [...existingVariants, newVariant];
      const updatedContent = JSON.stringify({ variants: updatedVariants });

      console.log('[ChatNode] Updating DB with variants:', updatedVariants.length);
      
      await supabase
        .from("canvas_blocks")
        .update({ 
          content: updatedContent,
          metadata: { lastPushedAt: new Date().toISOString(), pushedFrom: data.blockId }
        })
        .eq("id", node.id);
      
      console.log('[ChatNode] Calling onUpdateNodeData for:', node.id);
      if (data.onUpdateNodeData) {
        data.onUpdateNodeData(node.id, { content: updatedContent });
      } else {
        console.warn('[ChatNode] onUpdateNodeData not available!');
      }
    }
    
    queryClient.invalidateQueries({ queryKey: ["canvas-blocks"] });
    toast.success(`Pushed image to ${nodesToUpdate.length} creative node(s)`);
  }, [data.connectedOutputNodes, data.blockId, data.onUpdateNodeData, queryClient]);


  // Batch push all creatives from current session
  const handleBatchPushAllCreatives = async () => {
    const creativeNodes = data.connectedOutputNodes?.filter(n => n.type === 'creative') || [];
    
    if (creativeNodes.length === 0) {
      toast.error("No creative node connected. Connect a creative node first.");
      return;
    }

    // Collect all creatives from messages
    const allCreatives: AdCreative[] = [];
    messages.forEach(msg => {
      if (msg.role === 'assistant' && msg.creatives) {
        allCreatives.push(...msg.creatives);
      }
    });

    if (allCreatives.length === 0) {
      toast.error("No creatives to push");
      return;
    }

    // Convert all creatives to variants
    const variants: CreativeVariant[] = allCreatives.map(creative => ({
      id: crypto.randomUUID(),
      channel: 'facebook-ig',
      primaryText: creative.primary_text,
      headline: creative.headline,
      ctaButton: 'Learn More',
      images: creative.image_data ? [creative.image_data] : [],
    }));

    // Push to all connected creative nodes
    for (const node of creativeNodes) {
      // Fetch existing content and merge
      const { data: existingBlock } = await supabase
        .from("canvas_blocks")
        .select("content")
        .eq("id", node.id)
        .maybeSingle();

      let existingVariants: CreativeVariant[] = [];
      try {
        const parsed = JSON.parse(existingBlock?.content || '{}');
        existingVariants = parsed.variants || [];
      } catch {}

      const updatedVariants = [...existingVariants, ...variants];

      const { error } = await supabase
        .from("canvas_blocks")
        .update({
          content: JSON.stringify({ variants: updatedVariants }),
          metadata: { lastPushedAt: new Date().toISOString(), pushedFrom: data.blockId }
        })
        .eq("id", node.id);

      if (error) {
        toast.error("Failed to push creatives");
        return;
      }

      if (data.onUpdateNodeData) {
        data.onUpdateNodeData(node.id, { content: JSON.stringify({ variants: updatedVariants }) });
      }
    }

    toast.success(`Pushed ${allCreatives.length} creative(s) to ${creativeNodes.length} node(s)`);
  };


  // Memoize grouped sessions to prevent recalculation on every render
  const groupedSessions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: Record<string, any[]> = { Today: [], Yesterday: [], Older: [] };
    
    sessions.forEach(session => {
      const date = new Date(session.created_at);
      date.setHours(0, 0, 0, 0);
      
      if (date.getTime() === today.getTime()) groups.Today.push(session);
      else if (date.getTime() === yesterday.getTime()) groups.Yesterday.push(session);
      else groups.Older.push(session);
    });

    return groups;
  }, [sessions]);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleCopyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  }, []);

  const handleEditMessage = useCallback(async (msgId: string, newContent: string) => {
    await supabase.from("chat_messages").update({ content: newContent }).eq("id", msgId);
    
    setMessages(prev => prev.map((m) => 
      m.id === msgId ? { ...m, content: newContent } : m
    ));
    
    setEditingMessageId(null);
    toast.success("Message updated");
  }, []);

  const handleBranchConversation = useCallback(async (fromMessageIndex: number) => {
    if (!data.boardId || !data.blockId) return;
    
    try {
      // Create new session with messages up to branch point (atomic transaction)
      const branchMessages = messages.slice(0, fromMessageIndex + 1);
      const lastMsg = branchMessages[branchMessages.length - 1];
      const branchTitle = `Branch: ${lastMsg.content.slice(0, 30)}...`;
      
      // Prepare messages for RPC function
      const messagesToCopy = branchMessages.map(m => ({
        role: m.role,
        content: m.content,
        metadata: m.images?.length ? { images: m.images } : m.creatives?.length ? { creatives: m.creatives } : null,
      }));
      
      // Use RPC function for atomic transaction
      const { data: newSessionId, error } = await supabase.rpc('branch_chat_session', {
        p_board_id: data.boardId,
        p_block_id: data.blockId,
        p_title: branchTitle,
        p_messages: messagesToCopy as any,
      });
      
      if (error) throw error;
      if (!newSessionId) throw new Error("No session ID returned");
      
      // Switch to new session
      await queryClient.invalidateQueries({ queryKey: ["chat-sessions-block", data.blockId] });
      setSessionId(newSessionId);
      setEditTitle(branchTitle);
      toast.success("Created conversation branch");
    } catch (error) {
      console.error("Failed to branch conversation:", error);
      toast.error("Failed to create branch");
    }
  }, [data.boardId, data.blockId, messages, queryClient, setSessionId, setEditTitle]);

  const chatContent = (
    <div className="flex flex-col flex-1 min-h-0 h-full">
      {/* Header + Messages + Sidebar Row */}
      <div className="flex flex-1 min-h-0 overflow-hidden h-full">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-24 border-r border-border bg-muted/30 flex flex-col shrink-0">
          <div className="p-2 border-b border-border space-y-2">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 text-[10px] pl-7 pr-2 nodrag"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center gap-1 text-[10px] px-1"
              onClick={handleNewChat}
            >
              <Plus className="w-3 h-3" />
              New
            </Button>
          </div>
          <ScrollArea 
            className="flex-1 nowheel nodrag"
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="p-1 space-y-2">
              {Object.entries(groupSessionsByDate(
                searchQuery.trim() 
                  ? sessions.filter(s => 
                      s.title?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                  : sessions
              )).map(([group, groupSessions]) => {
                if (groupSessions.length === 0) return null;
                return (
                  <div key={group}>
                    <div className="px-1 py-1 text-[10px] font-semibold text-muted-foreground">
                      {group}
                    </div>
                    <div className="space-y-0.5">
                      {groupSessions.map((session) => (
                        <Button
                          key={session.id}
                          variant={session.id === sessionId ? "secondary" : "ghost"}
                          className="w-full justify-start text-[10px] px-1 py-1 h-auto leading-tight group relative"
                          onClick={() => handleSwitchSession(session.id)}
                        >
                          <span className="truncate flex-1 text-left">{session.title}</span>
                          {session.id === sessionId && (
                            <span className="ml-auto w-1 h-1 rounded-full bg-primary shrink-0" />
                          )}
                <button
                  className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-destructive/10 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setDeleteSessionId(session.id);
                  }}
                  title="Delete chat"
                >
                  <X className="h-3 w-3" />
                </button>
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
        )}

        {/* Main Chat Area */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-card flex-none">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isEditingTitle ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-7 text-sm flex-1 nodrag"
                autoFocus
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") {
                    setIsEditingTitle(false);
                    setEditTitle(data.title || "New Chat");
                  }
                }}
              />
            ) : (
              <span 
                className="font-semibold text-sm truncate cursor-pointer hover:text-primary transition-colors"
                onDoubleClick={() => setIsEditingTitle(true)}
                title="Double-click to rename"
              >
                {editTitle}
              </span>
            )}
          </div>
          {/* Export button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Download className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportConversation('markdown')}>
                Export as Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportConversation('json')}>
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col relative">
            <ScrollArea 
              ref={scrollRef} 
              className="flex-1 h-0 p-3 nowheel nodrag"
              onWheel={(e) => e.stopPropagation()}
            >
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <p className="text-sm">Start a conversation</p>
                <p className="text-xs mt-1">Choose a role and type your message below</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, idx) => {
                  const msgId = msg.id || `${sessionId}-${idx}`;
                  const isLastAssistant = msg.role === "assistant" && idx === messages.length - 1;
                  const isEditing = editingMessageId === msgId;
                  
                  return (
                    <MessageItem
                      key={idx}
                      msg={msg}
                      idx={idx}
                      msgId={msgId}
                      isLastAssistant={isLastAssistant}
                      isEditing={isEditing}
                      isGenerating={isGenerating}
                      selectedModel={selectedModel}
                      editContent={editContent}
                      editingMessageId={editingMessageId}
                      setEditingMessageId={setEditingMessageId}
                      setEditContent={setEditContent}
                      handleCopyMessage={handleCopyMessage}
                      handleEditMessage={handleEditMessage}
                      handleRegenerate={handleRegenerate}
                      handleBranchConversation={handleBranchConversation}
                      handlePushSingleCreative={handlePushSingleCreative}
                      handlePushImageToCreative={handlePushImageToCreative}
                      handlePushContentToCreative={handlePushContentToCreative}
                      handleDownloadMessage={handleDownloadMessage}
                      handleDeleteMessage={handleDeleteMessage}
                      connectedCreativeNodes={data.connectedOutputNodes?.filter(n => n.type === 'creative').map(n => ({ id: n.id, title: n.title })) || []}
                    />
                  );
                })}
                {isGenerating && !messages.some((m, i) => m.role === "assistant" && i === messages.length - 1) && (
                  <ThinkingIndicator
                    hasConnectedBlocks={(data.connectedBlocks?.length || 0) > 0}
                    hasInstructions={data.connectedBlocks?.some(b => b.instruction_prompt)}
                  />
                )}
              </div>
            )}
            </ScrollArea>
            
            {/* Scroll to bottom button */}
            {showScrollButton && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-16 right-4 h-8 w-8 rounded-full shadow-lg z-30 pointer-events-auto"
                onClick={scrollToBottom}
                title="Scroll to bottom"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Input Area - Full Width - Fixed with shrink-0 to prevent cutoff */}
          <div className="p-3 border-t border-border bg-card space-y-2 flex-none">
          <div className="flex gap-2">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="h-8 text-xs flex-1 nodrag">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value} className="text-xs">
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs flex-1 nodrag justify-between min-w-0">
                  <span className="truncate">
                    {MODEL_CATEGORIES.flatMap(c => c.models).find(m => m.value === selectedModel)?.label || 'Select Model'}
                  </span>
                  <ChevronDown className="h-3 w-3 ml-1 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[420px] max-h-[600px] overflow-y-auto" align="start">
                {MODEL_CATEGORIES.map((category, idx) => (
                  <div key={category.id}>
                    {idx > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuLabel className="flex items-center justify-between py-2">
                      <span className="text-xs font-semibold">{category.label}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">{category.description}</span>
                    </DropdownMenuLabel>
                    {category.models.map(model => (
                      <DropdownMenuItem
                        key={model.value}
                        onClick={() => setSelectedModel(model.value)}
                        className={`cursor-pointer ${selectedModel === model.value ? 'bg-accent' : ''}`}
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{model.label}</span>
                            
                            {/* Only show image generation badge - it's the rare/special capability */}
                            {IMAGE_MODELS.includes(model.value) && (
                              <div className="flex items-center gap-0.5 text-pink-400" title="Can generate images">
                                <ImagePlus className="h-3 w-3" />
                                <Check className="h-2.5 w-2.5" />
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">{model.description}</span>
                        </div>
                        {selectedModel === model.value && <Check className="h-4 w-4 ml-2 shrink-0" />}
                      </DropdownMenuItem>
                    ))}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {connectedTools.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {connectedTools.map(tool => (
                <Badge 
                  key={tool.id} 
                  variant="secondary" 
                  className="text-xs flex items-center gap-1"
                >
                  {tool.name}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => handleRemoveTool(tool.id)}
                  />
                </Badge>
              ))}
            </div>
          )}
          {(selectedAssets.length > 0 || selectedKnowledge.length > 0 || selectedStrategies.length > 0 || selectedResearch.length > 0) && (
            <div className="flex flex-wrap gap-1">
              {selectedAssets.map(a => (
                <Badge key={a.id} variant="secondary" className="text-xs flex items-center gap-1">
                  🎨 {a.name}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => setSelectedAssets(prev => prev.filter(x => x.id !== a.id))}
                  />
                </Badge>
              ))}
              {selectedKnowledge.map(k => (
                <Badge key={k.id} variant="secondary" className="text-xs flex items-center gap-1">
                  📚 {k.title}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => setSelectedKnowledge(prev => prev.filter(x => x.id !== k.id))}
                  />
                </Badge>
              ))}
              {selectedStrategies.map(s => (
                <Badge key={s.id} variant="secondary" className="text-xs flex items-center gap-1">
                  🎯 {s.title}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => setSelectedStrategies(prev => prev.filter(x => x.id !== s.id))}
                  />
                </Badge>
              ))}
              {selectedResearch.map(r => (
                <Badge key={r.id} variant="secondary" className="text-xs flex items-center gap-1">
                  🔬 {r.name}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => setSelectedResearch(prev => prev.filter(x => x.id !== r.id))}
                  />
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 shrink-0"
                onClick={() => setShowBrainModal(true)}
                title="Inject from Brain"
              >
                <Brain className="w-4 h-4" />
              </Button>
              
            </div>
            <div className="flex-1 space-y-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your message..."
                disabled={isGenerating}
                className="min-h-[60px] resize-none nodrag"
              />
            </div>
            {isGenerating ? (
              <Button onClick={handleStop} variant="destructive" size="icon" className="self-end mb-6">
                <Square className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleSend} disabled={!input.trim()} size="icon" className="self-end mb-6">
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          {/* Quick Batch Image Generator */}
          <QuickBatchGenerator
            connectedBlocks={data.connectedBlocks || []}
            connectedCreativeNodes={data.connectedOutputNodes?.filter(n => n.type === 'creative').map(n => ({ id: n.id, title: n.title })) || []}
            onPushImageToCreative={handlePushImageToCreative}
            onCreateImageBlock={data.onCreateImageBlock}
            nodePosition={data.nodePosition}
            projectId={data.projectId}
          />
        </div>
      </div>
    </div>
  </div>
  );

  return (
    <ChatErrorBoundary>
      <NodeResizer
        isVisible={selected}
        minWidth={400}
        minHeight={400}
        handleClassName="h-8 w-8 bg-primary border-2 border-primary-foreground rounded cursor-nwse-resize shadow-lg"
      />
      <Handle
        type="target" 
        position={Position.Left} 
        style={{ 
          left: '-12px',
          width: '24px',
          height: '24px',
          background: 'hsl(var(--primary))',
          border: '2px solid hsl(var(--primary-foreground))',
          zIndex: 50,
        }}
        className="hover:scale-125 transition-transform cursor-grab"
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ 
          right: '-12px',
          width: '24px',
          height: '24px',
          background: 'hsl(var(--accent))',
          border: '2px solid hsl(var(--accent-foreground))',
          zIndex: 50,
        }}
        className="hover:scale-125 transition-transform cursor-grab"
        title="Drag to connect"
      />

      <Card 
        className={`w-full h-full flex flex-col overflow-hidden nowheel ${selected ? "ring-2 ring-primary" : ""}`}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Collapsed View */}
        {isCollapsed ? (
          <div className="p-3 h-full flex items-center justify-between">
            <span className="font-semibold text-sm truncate">{editTitle}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setIsCollapsed(false)}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <>
            {/* Normal View with Controls */}
            <div className="absolute top-2 right-2 flex gap-1 z-10">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 bg-card/80 backdrop-blur-sm"
                onClick={() => setIsCollapsed(true)}
              >
                <ChevronUp className="w-3 h-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 bg-card/80 backdrop-blur-sm"
                onClick={() => setIsFullscreen(true)}
              >
                <Maximize2 className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">{chatContent}</div>
          </>
        )}
      </Card>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="w-screen h-screen max-w-none m-0 rounded-none p-0 flex flex-col overflow-hidden">
          <DialogHeader className="px-6 pt-4 pb-2 shrink-0 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span>{editTitle}</span>
              <Button size="icon" variant="ghost" onClick={() => setIsFullscreen(false)}>
                <Minimize2 className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden">{chatContent}</div>
        </DialogContent>
      </Dialog>

      {/* Brain Modal */}
      <CentralBrainModal
        open={showBrainModal}
        onOpenChange={setShowBrainModal}
        onSelectPrompt={(prompt: any) => handleBrainSelect(prompt, 'prompt')}
        onSelectAsset={(asset: any) => handleBrainSelect(asset, 'asset')}
        onSelectKnowledge={(knowledge: any) => handleBrainSelect(knowledge, 'knowledge')}
        onSelectTool={(tool: any) => handleBrainSelect(tool, 'tool')}
      />




      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteSessionId} onOpenChange={() => setDeleteSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteSessionId) {
                  deleteSessionMutation.mutate(deleteSessionId);
                  setDeleteSessionId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ChatErrorBoundary>
  );
}
