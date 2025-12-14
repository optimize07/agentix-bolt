import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { OperationsSidebar } from "@/components/OperationsSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  Layout,
  Columns3,
  Settings,
  Plus,
  Image,
  FileText,
  Link2,
  Type,
  Layers,
  Video,
  BarChart3,
  Play,
  Bot,
  Eye,
  User,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Send,
  MoreVertical,
  Trash2,
  Edit,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  getProjectWithDetails,
  listAssetStatuses,
  createAsset,
  updateAssetStatus,
  createTask,
  updateTaskStatus,
  addComment,
  ensureDefaultAssetStatuses,
  approveAsset,
} from "@/integrations/projects/api";
import type {
  ProjectWithDetails,
  ProjectAsset,
  ProjectAssetStatus,
  ProjectTask,
  ProjectAgent,
  ProjectComment,
  TaskStatus,
} from "@/integrations/projects/types";
import { listAgentConfigs, AgentConfig } from "@/integrations/n8n/agents";
import { UniversalAgentRunner } from "@/components/agents/UniversalAgentRunner";
import { AgentChatWindow } from "@/components/agents/AgentChatWindow";
import { ProjectCanvas } from "@/components/projects/ProjectCanvas";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReactMarkdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Status display helpers
function getStatusColor(status: string) {
  switch (status) {
    case "complete":
      return "bg-emerald-500/10 text-emerald-500";
    case "in_progress":
      return "bg-blue-500/10 text-blue-500";
    case "blocked":
      return "bg-red-500/10 text-red-500";
    case "review":
      return "bg-amber-500/10 text-amber-500";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getStatusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getTaskIcon(status: TaskStatus) {
  switch (status) {
    case "complete":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "in_progress":
      return <Clock className="h-4 w-4 text-blue-500" />;
    case "blocked":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "review":
      return <Circle className="h-4 w-4 text-amber-500" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
}

// Asset type icons
const assetTypeIcons: Record<string, React.ReactNode> = {
  image: <Image className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  text: <Type className="h-4 w-4" />,
  link: <Link2 className="h-4 w-4" />,
  audio: <Layers className="h-4 w-4" />,
  other: <FileText className="h-4 w-4" />,
};

// Toolbar items
const toolbarItems = [
  { id: "image", icon: Image, label: "Image" },
  { id: "link", icon: Link2, label: "Link" },
  { id: "document", icon: FileText, label: "Document" },
  { id: "text", icon: Type, label: "Text" },
  { id: "layers", icon: Layers, label: "Layers" },
  { id: "video", icon: Video, label: "Video" },
  { id: "chart", icon: BarChart3, label: "Chart" },
];

export default function ProjectDetail() {
  const { clientId, projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [project, setProject] = useState<ProjectWithDetails | null>(null);
  const [statuses, setStatuses] = useState<ProjectAssetStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("canvas");

  // Agent runner state
  const [availableAgents, setAvailableAgents] = useState<AgentConfig[]>([]);
  const [chatAgents, setChatAgents] = useState<AgentConfig[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);
  const [selectedChatAgent, setSelectedChatAgent] = useState<AgentConfig | null>(null);
  const [runnerOpen, setRunnerOpen] = useState(false);

  // Dialogs
  const [addAssetOpen, setAddAssetOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [newAssetType, setNewAssetType] = useState<string>("text");

  // Chat input
  const [chatInput, setChatInput] = useState("");
  const [teamChatMode, setTeamChatMode] = useState<"comments" | "gemini">("comments");
  const [geminiMessages, setGeminiMessages] = useState<Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>>([]);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [assetDetailOpen, setAssetDetailOpen] = useState(false);
  const [activeAsset, setActiveAsset] = useState<ProjectAsset | null>(null);
  const [assetActionId, setAssetActionId] = useState<string | null>(null);

  // Load project data
  useEffect(() => {
    loadProject();
    loadStatuses();
  }, [projectId, clientId]);

  // Load agents separately when clientId is available
  useEffect(() => {
    if (clientId) {
      loadAgents();
    }
  }, [clientId]);

  async function loadProject() {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await getProjectWithDetails(projectId);
      setProject(data);
    } catch (e) {
      console.error("Failed to load project:", e);
      toast({ title: "Error", description: "Failed to load project", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function loadStatuses(autoSeed: boolean = true) {
    try {
      const data = autoSeed
        ? await ensureDefaultAssetStatuses(clientId || undefined)
        : await listAssetStatuses(clientId || undefined);
      setStatuses(data);
    } catch (e) {
      console.error("Failed to load statuses:", e);
    }
  }

  async function loadAgents() {
    if (!clientId) return;
    try {
      // Load agents from multiple areas to get all available chat agents
      const areas = ["marketing", "operations", "strategy", "sales", "advertising", "financials"];
      const allConfigs: AgentConfig[] = [];
      
      for (const area of areas) {
        const configs = await listAgentConfigs({ area, clientId, includePredefined: true });
        allConfigs.push(...configs);
      }
      
      // Dedupe by id
      const uniqueConfigs = Array.from(new Map(allConfigs.map(c => [c.id, c])).values());
      
      setAvailableAgents(uniqueConfigs);
      
      // Treat every n8n/webhook-enabled agent as chat-capable so it can be triggered from the chat panel.
      const chatBased = uniqueConfigs.filter((config) => {
        const isChatBehavior = config.output_behavior === "chat_stream";
        const hasWebhook = Boolean(config.webhook_url);
        const hasSchemaFields = Boolean(config.input_schema?.fields?.length) 
          || Boolean(config.input_mapping?.requiredFields?.length) 
          || Boolean(config.input_mapping?.fields?.length);
        const executionMode = config.execution_mode ?? "n8n";
        const isN8nBased = executionMode !== "internal";
        return isChatBehavior || (isN8nBased && (hasWebhook || hasSchemaFields));
      });

      const sortedChatAgents = [...chatBased].sort((a, b) => {
        const nameA = a.display_name || a.agent_key || "";
        const nameB = b.display_name || b.agent_key || "";
        return nameA.localeCompare(nameB);
      });
      
      setChatAgents(sortedChatAgents);
    } catch (e) {
      console.error("Failed to load agents:", e);
    }
  }


  const sortedStatuses = useMemo(
    () => [...statuses].sort((a, b) => a.sort_order - b.sort_order),
    [statuses]
  );

  const statusMap = useMemo(() => {
    const map = new Map<string, ProjectAssetStatus>();
    sortedStatuses.forEach((status) => map.set(status.id, status));
    return map;
  }, [sortedStatuses]);

  const statusOrderMap = useMemo(() => {
    const map = new Map<string, number>();
    sortedStatuses.forEach((status, index) => map.set(status.id, index));
    return map;
  }, [sortedStatuses]);

  // Asset grouped by status
  const assetsByStatus = useMemo(() => {
    const map: Record<string, ProjectAsset[]> = {};
    for (const status of sortedStatuses) {
      map[status.id] = [];
    }
    for (const asset of project?.assets || []) {
      const key = asset.status_id || (sortedStatuses[0]?.id ?? "unassigned");
      if (!map[key]) map[key] = [];
      map[key].push(asset);
    }
    return map;
  }, [project?.assets, sortedStatuses]);

  // Handlers
  async function handleAddComment() {
    if (!chatInput.trim() || !projectId) return;
    
    if (teamChatMode === "gemini") {
      // Use Gemini chat
      const userMessage = chatInput.trim();
      setGeminiMessages((prev) => [...prev, { role: "user", content: userMessage, timestamp: new Date() }]);
      setChatInput("");
      setGeminiLoading(true);

      try {
        const { data, error } = await supabase.functions.invoke("gemini-chat", {
          body: {
            prompt: `Project Context: ${project?.title}\n${project?.description ? `Description: ${project.description}\n` : ""}User Question: ${userMessage}`,
            responseFormat: "text",
            temperature: 0.7,
          },
        });

        if (error) throw error;

        const assistantMessage = {
          role: "assistant" as const,
          content: data?.response || "No response received",
          timestamp: new Date(),
        };
        setGeminiMessages((prev) => [...prev, assistantMessage]);
      } catch (e: any) {
        console.error("Gemini chat error:", e);
        setGeminiMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error: ${e?.message || "Failed to get response"}`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setGeminiLoading(false);
      }
    } else {
      // Add project comment
      try {
        await addComment({
          project_id: projectId,
          content: chatInput,
          author_name: "User",
        });
        setChatInput("");
        loadProject();
      } catch (e) {
        console.error(e);
      }
    }
  }

  async function handleTaskStatusChange(taskId: string, newStatus: TaskStatus) {
    try {
      await updateTaskStatus(taskId, newStatus);
      loadProject();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleAssetDrop(assetId: string, newStatusId: string) {
    const status = statusMap.get(newStatusId);
    if (!status) return;
    try {
      await updateAssetStatus(assetId, newStatusId, status.name);
      loadProject();
    } catch (e) {
      console.error(e);
    }
  }

  function handleViewAsset(asset: ProjectAsset) {
    setActiveAsset(asset);
    setAssetDetailOpen(true);
  }

  async function handleAssetStatusSelect(asset: ProjectAsset, newStatusId: string) {
    if (!newStatusId) return;
    const status = statuses.find((s) => s.id === newStatusId);
    if (!status) return;
    try {
      setAssetActionId(asset.id);
      const updated = await updateAssetStatus(asset.id, status.id, status.name);
      if (activeAsset?.id === asset.id) {
        setActiveAsset(updated);
      }
      loadProject();
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    } finally {
      setAssetActionId(null);
    }
  }

  async function handleAdvanceAsset(asset: ProjectAsset, direction: "next" | "prev") {
    if (!sortedStatuses.length) return;
    const currentIndex = asset.status_id ? statusOrderMap.get(asset.status_id) ?? 0 : 0;
    const targetIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    const targetStatus = sortedStatuses[targetIndex];
    if (!targetStatus) return;
    try {
      setAssetActionId(asset.id);
      const updated = await updateAssetStatus(asset.id, targetStatus.id, targetStatus.name);
      if (activeAsset?.id === asset.id) {
        setActiveAsset(updated);
      }
      loadProject();
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Unable to move asset.", variant: "destructive" });
    } finally {
      setAssetActionId(null);
    }
  }

  async function handleApproveAsset(asset: ProjectAsset) {
    try {
      setAssetActionId(asset.id);
      const updated = await approveAsset(asset.id, project.owner || "Project Reviewer");
      if (activeAsset?.id === asset.id) {
        setActiveAsset(updated);
      }
      toast({ title: "Asset Approved", description: `${asset.title} marked as approved.` });
      loadProject();
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to approve asset.", variant: "destructive" });
    } finally {
      setAssetActionId(null);
    }
  }

  function handleRunAgent(agent: AgentConfig) {
    setSelectedAgent(agent);
    setRunnerOpen(true);
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full bg-background">
        <OperationsSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading project...</div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen w-full bg-background">
        <OperationsSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Project not found</h2>
            <Button variant="outline" onClick={() => navigate(`/client/${clientId}/projects`)}>
              Back to Projects
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background">
      <OperationsSidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-border bg-background p-4">
          <div className="flex items-center gap-4 mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/client/${clientId}/projects`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{project.title}</h1>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>
            <Badge className={getStatusColor(project.status)}>
              {getStatusLabel(project.status)}
            </Badge>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="chat" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="canvas" className="gap-2">
                <Layout className="h-4 w-4" />
                Canvas
              </TabsTrigger>
              <TabsTrigger value="kanban" className="gap-2">
                <Columns3 className="h-4 w-4" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Toolbar (Kanban only) */}
          {activeTab === "kanban" && (
            <div className="w-12 border-r border-border bg-card flex flex-col items-center py-4 gap-2">
              {toolbarItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  title={item.label}
                  onClick={() => {
                    setNewAssetType(item.id);
                    setAddAssetOpen(true);
                  }}
                >
                  <item.icon className="h-5 w-5" />
                </Button>
              ))}
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden">
            {/* Chat Tab */}
            {activeTab === "chat" && (
              <div className="h-full flex">
                {/* Agent Selector Sidebar */}
                <div className="w-64 border-r border-border bg-card flex flex-col">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold text-foreground mb-1">Chat With</h3>
                    <p className="text-xs text-muted-foreground">Select an AI agent or team chat</p>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                      {/* Team Chat Option */}
                      <div
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedChatAgent === null
                            ? "bg-primary/10 border border-primary"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => setSelectedChatAgent(null)}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-blue-500/20 text-blue-500">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground">Team Chat</p>
                          <p className="text-xs text-muted-foreground truncate">Project discussion</p>
                        </div>
                        {(project.comments || []).length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {project.comments?.length}
                          </Badge>
                        )}
                      </div>

                      {/* Chat Agents */}
                      {chatAgents.length > 0 && (
                        <>
                          <div className="py-2 px-3">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Chat Agents
                            </p>
                          </div>
                          {chatAgents.map((agent) => (
                            <div
                              key={agent.id}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                selectedChatAgent?.id === agent.id
                                  ? "bg-primary/10 border border-primary"
                                  : "hover:bg-muted"
                              }`}
                              onClick={() => setSelectedChatAgent(agent)}
                            >
                              <Avatar className="h-9 w-9">
                                {agent.avatar_url ? (
                                  <AvatarImage src={agent.avatar_url} alt={agent.display_name || ""} />
                                ) : (
                                  <AvatarImage src="/n8n.svg" alt="AI Agent" />
                                )}
                                <AvatarFallback>
                                  <Bot className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-foreground truncate">
                                  {agent.display_name || agent.agent_key}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {agent.display_role || "AI Agent"}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              </div>
                            </div>
                          ))}
                        </>
                      )}

                      {/* Modal-based Agents (Copywriter, etc.) */}
                      {availableAgents.filter(a => a.output_behavior !== "chat_stream").length > 0 && (
                        <>
                          <div className="py-2 px-3">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Run Agents
                            </p>
                          </div>
                          {availableAgents
                            .filter((a) => a.output_behavior !== "chat_stream")
                            .map((agent) => (
                              <div
                                key={agent.id}
                                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted"
                                onClick={() => handleRunAgent(agent)}
                              >
                                <Avatar className="h-9 w-9">
                                  {agent.avatar_url ? (
                                    <AvatarImage src={agent.avatar_url} alt={agent.display_name || ""} />
                                  ) : (
                                    <AvatarImage src="/n8n.svg" alt="AI Agent" />
                                  )}
                                  <AvatarFallback>
                                    <Bot className="h-4 w-4" />
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-foreground truncate">
                                    {agent.display_name || agent.agent_key}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {agent.display_role || "AI Agent"}
                                  </p>
                                </div>
                                <Play className="h-4 w-4 text-muted-foreground" />
                              </div>
                            ))}
                        </>
                      )}

                      {availableAgents.length === 0 && (
                        <div className="p-4 text-center">
                          <Bot className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                          <p className="text-xs text-muted-foreground">
                            No agents available yet.
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Chat Content Area */}
                <div className="flex-1 flex flex-col">
                  {selectedChatAgent ? (
                    /* Agent Chat */
                    <AgentChatWindow
                      agent={selectedChatAgent}
                      clientId={clientId}
                      className="h-full border-0 rounded-none"
                    />
                  ) : (
                    /* Team Chat */
                    <>
                      {/* Chat Mode Toggle */}
                      <div className="border-b border-border p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">Chat Mode:</span>
                          <div className="flex gap-1 bg-muted rounded-md p-1">
                            <Button
                              variant={teamChatMode === "comments" ? "default" : "ghost"}
                              size="sm"
                              className="h-7 px-3 text-xs"
                              onClick={() => setTeamChatMode("comments")}
                            >
                              <User className="h-3 w-3 mr-1" />
                              Team
                            </Button>
                            <Button
                              variant={teamChatMode === "gemini" ? "default" : "ghost"}
                              size="sm"
                              className="h-7 px-3 text-xs"
                              onClick={() => setTeamChatMode("gemini")}
                            >
                              <Bot className="h-3 w-3 mr-1" />
                              AI Assistant
                            </Button>
                          </div>
                        </div>
                      </div>

                      <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                          {teamChatMode === "comments" ? (
                            /* Project Comments */
                            (project.comments || []).length === 0 ? (
                              <div className="text-center py-12 text-muted-foreground">
                                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No messages yet. Start the conversation!</p>
                              </div>
                            ) : (
                              [...(project.comments || [])].reverse().map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                      <User className="h-4 w-4" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-sm text-foreground">
                                        {comment.author_name || "User"}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(comment.created_at).toLocaleString()}
                                      </span>
                                    </div>
                                    <p className="text-sm text-foreground mt-1">{comment.content}</p>
                                  </div>
                                </div>
                              ))
                            )
                          ) : (
                            /* Gemini AI Chat */
                            geminiMessages.length === 0 ? (
                              <div className="text-center py-12 text-muted-foreground">
                                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Chat with AI Assistant</p>
                                <p className="text-xs mt-2">Ask questions about this project or get help with your work.</p>
                              </div>
                            ) : (
                              geminiMessages.map((msg, idx) => (
                                <div
                                  key={idx}
                                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                                >
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                      {msg.role === "assistant" ? (
                                        <Bot className="h-4 w-4" />
                                      ) : (
                                        <User className="h-4 w-4" />
                                      )}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div
                                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                      msg.role === "user"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
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
                                      {msg.timestamp.toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                </div>
                              ))
                            )
                          )}
                          {geminiLoading && (
                            <div className="flex gap-3">
                              <Avatar className="h-8 w-8">
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
                      </ScrollArea>
                      <div className="border-t border-border p-4">
                        <div className="flex gap-2">
                          <Textarea
                            placeholder={
                              teamChatMode === "gemini"
                                ? "Ask AI Assistant anything..."
                                : "Type a message..."
                            }
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            className="min-h-[44px] max-h-32 resize-none"
                            rows={1}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment();
                              }
                            }}
                            disabled={geminiLoading}
                          />
                          <Button
                            onClick={handleAddComment}
                            disabled={!chatInput.trim() || geminiLoading}
                          >
                            {geminiLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Canvas Tab */}
            {activeTab === "canvas" && (
              <ProjectCanvas
                projectId={projectId!}
                clientId={clientId!}
                agents={availableAgents}
                assets={project.assets || []}
                onAssetCreated={loadProject}
              />
            )}

            {/* Kanban Tab */}
            {activeTab === "kanban" && (
              <div className="h-full p-4 overflow-x-auto">
                {sortedStatuses.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                    <div>
                      <p className="mb-3">No workflow stages configured yet.</p>
                      <Button onClick={() => loadStatuses(true)}>Initialize Default Stages</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4 h-full min-w-max">
                    {sortedStatuses.map((status) => {
                      const assetsInColumn = assetsByStatus[status.id] || [];
                      return (
                        <div
                          key={status.id}
                          className="w-80 flex-shrink-0 flex flex-col bg-muted/20 rounded-xl border border-border/50"
                        >
                          <div
                            className="px-4 py-3 border-b border-border flex items-center justify-between"
                            style={{ borderTopColor: status.color, borderTopWidth: 4 }}
                          >
                            <div>
                              <span className="font-semibold text-foreground text-sm block">
                                {status.name}
                              </span>
                              {status.is_final && (
                                <span className="text-[11px] text-emerald-400">Final Approval</span>
                              )}
                              {status.is_default && (
                                <span className="text-[11px] text-muted-foreground">Entry Stage</span>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {assetsInColumn.length}
                            </Badge>
                          </div>
                          <ScrollArea className="flex-1 p-3">
                            <div className="space-y-2">
                              {assetsInColumn.map((asset) => {
                                const statusIdx = asset.status_id
                                  ? statusOrderMap.get(asset.status_id) ?? 0
                                  : 0;
                                const prevStatus =
                                  statusIdx > 0 ? sortedStatuses[statusIdx - 1] : null;
                                const nextStatus =
                                  statusIdx < sortedStatuses.length - 1
                                    ? sortedStatuses[statusIdx + 1]
                                    : null;
                                const isActionLoading = assetActionId === asset.id;

                                return (
                                  <Card
                                    key={asset.id}
                                    className="p-4 cursor-pointer border-border/70 hover:border-primary transition-colors"
                                    draggable
                                    onDragStart={(e) => e.dataTransfer.setData("assetId", asset.id)}
                                    onClick={() => handleViewAsset(asset)}
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      {assetTypeIcons[asset.asset_type]}
                                      <span className="font-medium text-sm text-foreground truncate">
                                        {asset.title}
                                      </span>
                                    </div>
                                    {asset.content && (
                                      <p className="text-xs text-muted-foreground line-clamp-3">
                                        {asset.content}
                                      </p>
                                    )}
                                    <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <Badge variant="outline" className="text-[10px]">
                                          {asset.asset_type}
                                        </Badge>
                                        {asset.source_agent_config_id && (
                                          <Badge variant="outline" className="text-[10px]">
                                            AI
                                          </Badge>
                                        )}
                                      </div>
                                      <span>
                                        {new Date(asset.updated_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                      <div className="text-xs text-muted-foreground">
                                        {asset.status_name}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {prevStatus && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            disabled={isActionLoading}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleAdvanceAsset(asset, "prev");
                                            }}
                                          >
                                            <ArrowLeft className="h-3 w-3" />
                                          </Button>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewAsset(asset);
                                          }}
                                        >
                                          <Eye className="h-3 w-3" />
                                        </Button>
                                        {nextStatus ? (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            disabled={isActionLoading}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleAdvanceAsset(asset, "next");
                                            }}
                                          >
                                            <ArrowRight className="h-3 w-3" />
                                          </Button>
                                        ) : (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-emerald-500"
                                            disabled={isActionLoading}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleApproveAsset(asset);
                                            }}
                                          >
                                            <CheckCircle2 className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </Card>
                                );
                              })}
                              <div
                                className="h-20 border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center text-muted-foreground text-sm"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  const assetId = e.dataTransfer.getData("assetId");
                                  if (assetId) handleAssetDrop(assetId, status.id);
                                }}
                              >
                                Drop assets here
                              </div>
                            </div>
                          </ScrollArea>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="h-full p-6 overflow-auto">
                <div className="max-w-2xl space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Project Details</h3>
                    <div className="grid gap-4">
                      <div>
                        <Label>Title</Label>
                        <Input value={project.title} readOnly className="mt-1" />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea value={project.description || ""} readOnly className="mt-1" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Owner</Label>
                          <Input value={project.owner || ""} readOnly className="mt-1" />
                        </div>
                        <div>
                          <Label>Due Date</Label>
                          <Input value={project.due_date || ""} readOnly className="mt-1" />
                        </div>
                      </div>
                      <div>
                        <Label>Progress</Label>
                        <div className="mt-2">
                          <Progress value={project.progress} />
                          <p className="text-sm text-muted-foreground mt-1">{project.progress}%</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Assigned Agents</h3>
                    <div className="space-y-3">
                      {(project.agents || []).map((agent) => (
                        <div key={agent.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {agent.agent_type === "automation" ? (
                                <AvatarImage src="/n8n.svg" />
                              ) : null}
                              <AvatarFallback>
                                {agent.agent_type === "automation" ? (
                                  <Bot className="h-4 w-4" />
                                ) : (
                                  <User className="h-4 w-4" />
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">{agent.agent_name}</p>
                              <p className="text-xs text-muted-foreground">{agent.agent_role || agent.agent_type}</p>
                            </div>
                          </div>
                          {agent.agent_type === "automation" && agent.agent_config_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              onClick={() => {
                                const config = availableAgents.find((a) => a.id === agent.agent_config_id);
                                if (config) handleRunAgent(config);
                              }}
                            >
                              <Play className="h-3 w-3" />
                              Run
                            </Button>
                          )}
                        </div>
                      ))}
                      {(project.agents || []).length === 0 && (
                        <p className="text-sm text-muted-foreground">No agents assigned to this project.</p>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Tasks & Agents (Kanban only) */}
          {activeTab === "kanban" && (
            <div className="w-72 border-l border-border bg-card flex flex-col">
              {/* Tasks */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">Tasks</h3>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setAddTaskOpen(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="h-40">
                  <div className="space-y-2">
                    {(project.tasks || []).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer"
                        onClick={() => handleTaskStatusChange(task.id, task.status === "complete" ? "pending" : "complete")}
                      >
                        {getTaskIcon(task.status)}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${task.status === "complete" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {task.title}
                          </p>
                          {task.due_date && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {task.due_date}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Available Agents */}
              <div className="p-4 flex-1">
                <h3 className="font-semibold text-foreground mb-3">Run Agent</h3>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {availableAgents.slice(0, 5).map((agent) => (
                      <div
                        key={agent.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer"
                        onClick={() => handleRunAgent(agent)}
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarImage src="/n8n.svg" />
                          <AvatarFallback>
                            <Bot className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {agent.display_name || agent.agent_key}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {agent.display_role || "AI Agent"}
                          </p>
                        </div>
                        <Play className="h-3 w-3 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Agent Runner Modal */}
      {selectedAgent && (
        <UniversalAgentRunner
          agent={selectedAgent}
          open={runnerOpen}
          onOpenChange={setRunnerOpen}
          clientId={clientId}
        />
      )}

      {/* Asset Detail Dialog */}
      <Dialog open={assetDetailOpen} onOpenChange={(open) => {
        setAssetDetailOpen(open);
        if (!open) setActiveAsset(null);
      }}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{activeAsset?.title || "Asset Detail"}</DialogTitle>
          </DialogHeader>
          {activeAsset ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Status</Label>
                  <Select
                    value={activeAsset.status_id || sortedStatuses[0]?.id || ""}
                    onValueChange={(value) => handleAssetStatusSelect(activeAsset, value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedStatuses.map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Info</Label>
                  <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{activeAsset.asset_type}</Badge>
                      {activeAsset.source_agent_config_id && (
                        <Badge variant="outline">AI Generated</Badge>
                      )}
                    </div>
                    <span>Updated {new Date(activeAsset.updated_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <ScrollArea className="h-64 border border-border rounded-md">
                  <div className="p-4 text-sm whitespace-pre-wrap text-foreground">
                    {activeAsset.content || "No content available."}
                  </div>
                </ScrollArea>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select an asset to view details.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Asset Dialog */}
      <Dialog open={addAssetOpen} onOpenChange={setAddAssetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Asset Type</Label>
              <Select value={newAssetType} onValueChange={setNewAssetType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input id="asset-title" placeholder="Asset title..." />
            </div>
            {newAssetType === "text" && (
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea id="asset-content" placeholder="Enter text content..." rows={4} />
              </div>
            )}
            {(newAssetType === "link" || newAssetType === "image" || newAssetType === "video") && (
              <div className="space-y-2">
                <Label>URL</Label>
                <Input id="asset-url" placeholder="https://..." />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAssetOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                const title = (document.getElementById("asset-title") as HTMLInputElement)?.value;
                const content = (document.getElementById("asset-content") as HTMLTextAreaElement)?.value;
                const url = (document.getElementById("asset-url") as HTMLInputElement)?.value;
                if (!title || !projectId) return;
                try {
                  await createAsset({
                    project_id: projectId,
                    client_id: project.client_id,
                    title,
                    asset_type: newAssetType as any,
                    content: content || undefined,
                    file_url: url || undefined,
                  });
                  setAddAssetOpen(false);
                  loadProject();
                  toast({ title: "Asset Added", description: "New asset created successfully" });
                } catch (e) {
                  console.error(e);
                }
              }}
            >
              Add Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input id="task-title" placeholder="Task title..." />
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Input id="task-assignee" placeholder="Who should do this?" />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input id="task-due" type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTaskOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                const title = (document.getElementById("task-title") as HTMLInputElement)?.value;
                const assignee = (document.getElementById("task-assignee") as HTMLInputElement)?.value;
                const dueDate = (document.getElementById("task-due") as HTMLInputElement)?.value;
                if (!title || !projectId) return;
                try {
                  await createTask({
                    project_id: projectId,
                    title,
                    assignee: assignee || undefined,
                    due_date: dueDate || undefined,
                  });
                  setAddTaskOpen(false);
                  loadProject();
                  toast({ title: "Task Added", description: "New task created successfully" });
                } catch (e) {
                  console.error(e);
                }
              }}
            >
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

