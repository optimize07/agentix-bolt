import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdvertisingSidebar } from "@/components/AdvertisingSidebar";
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
  Sparkles,
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
  Project,
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
import { Canvas } from "@/components/canvas";
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

export default function AdvertisingProjectDetail() {
  const { clientId, boardId } = useParams();
  const projectId = boardId; // Using boardId as projectId for compatibility
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [project, setProject] = useState<ProjectWithDetails | null>(null);
  const [statuses, setStatuses] = useState<ProjectAssetStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("canvas");
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

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

  // Load available projects when no projectId is provided
  useEffect(() => {
    if (!projectId && clientId) {
      loadAvailableProjects();
    }
  }, [projectId, clientId]);

  // Load project data
  useEffect(() => {
    if (projectId) {
      loadProject();
      loadStatuses();
    } else {
      setLoading(false);
    }
  }, [projectId, clientId]);

  // Load agents separately when clientId is available
  useEffect(() => {
    if (clientId) {
      loadAgents();
    }
  }, [clientId]);

  async function loadAvailableProjects() {
    if (!clientId) return;
    setProjectsLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setAvailableProjects((data || []) as Project[]);
    } catch (e) {
      console.error("Failed to load projects:", e);
    } finally {
      setProjectsLoading(false);
    }
  }

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
      const areas = ["advertising", "marketing", "operations", "strategy", "sales", "financials"];
      const allConfigs: AgentConfig[] = [];
      
      for (const area of areas) {
        const configs = await listAgentConfigs({ area, clientId, includePredefined: true });
        allConfigs.push(...configs);
      }
      
      const uniqueConfigs = Array.from(new Map(allConfigs.map(c => [c.id, c])).values());
      setAvailableAgents(uniqueConfigs);
      
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
      const updated = await approveAsset(asset.id, project?.owner || "Project Reviewer");
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

  function handleAssetCreated() {
    loadProject();
  }

  if (loading && projectId) {
    return (
      <div className="flex h-screen w-full bg-background">
        <AdvertisingSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading project...
          </div>
        </main>
      </div>
    );
  }

  // Project selector when no projectId provided
  if (!projectId) {
    return (
      <div className="flex h-screen w-full bg-background">
        <AdvertisingSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-border bg-background p-6">
            <h1 className="text-2xl font-bold text-foreground">Canvas Studio</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Select a project to open the advanced canvas workspace
            </p>
          </div>
          
          <ScrollArea className="flex-1 p-6">
            {projectsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : availableProjects.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No projects yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a project first to use Canvas Studio
                </p>
                <Button onClick={() => navigate(`/client/${clientId}/advertising/projects`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Go to Projects
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableProjects.map((proj) => (
                  <Card
                    key={proj.id}
                    className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => navigate(`/client/${clientId}/advertising/canvas-2/${proj.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">{proj.title}</h3>
                        {proj.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {proj.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={getStatusColor(proj.status)}>
                            {getStatusLabel(proj.status)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(proj.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen w-full bg-background">
        <AdvertisingSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Project not found</h2>
            <Button variant="outline" onClick={() => navigate(`/client/${clientId}/advertising/canvas-2`)}>
              Back to Canvas Studio
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background">
      <AdvertisingSidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-border bg-background p-4">
          <div className="flex items-center gap-4 mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/client/${clientId}/advertising/projects`)}
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
                <Sparkles className="h-4 w-4" />
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

                      {/* Modal-based Agents */}
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
                    <AgentChatWindow
                      agent={selectedChatAgent}
                      clientId={clientId}
                      className="h-full border-0 rounded-none"
                    />
                  ) : (
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

                      {/* Chat Input */}
                      <div className="border-t border-border p-4">
                        <div className="flex gap-2">
                          <Textarea
                            placeholder={teamChatMode === "gemini" ? "Ask AI Assistant..." : "Type a message..."}
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment();
                              }
                            }}
                            className="min-h-[60px] resize-none"
                          />
                          <Button onClick={handleAddComment} disabled={!chatInput.trim() || geminiLoading}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Canvas Tab (ReactFlow-based node canvas) */}
            {activeTab === "canvas" && projectId && (
              <div className="h-full">
                <Canvas projectId={projectId} />
              </div>
            )}

            {/* Kanban Tab */}
            {activeTab === "kanban" && (
              <div className="h-full p-4 overflow-auto">
                <div className="flex gap-4 h-full min-w-max">
                  {sortedStatuses.map((status) => (
                    <div key={status.id} className="w-72 flex-shrink-0">
                      <Card className="h-full flex flex-col">
                        <div className="p-3 border-b border-border flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: status.color || "#6b7280" }}
                            />
                            <span className="font-medium text-sm">{status.name}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {assetsByStatus[status.id]?.length || 0}
                          </Badge>
                        </div>
                        <ScrollArea className="flex-1 p-2">
                          <div className="space-y-2">
                            {(assetsByStatus[status.id] || []).map((asset) => (
                              <Card
                                key={asset.id}
                                className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleViewAsset(asset)}
                              >
                                <div className="flex items-start gap-2">
                                  {assetTypeIcons[asset.asset_type] || assetTypeIcons.other}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{asset.title}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {asset.asset_type}
                                    </p>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="h-full p-6 overflow-auto">
                <div className="max-w-2xl mx-auto space-y-6">
                  <Card className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Project Details</h3>
                    <div className="space-y-4">
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
                          <Label>Status</Label>
                          <Input value={getStatusLabel(project.status)} readOnly className="mt-1" />
                        </div>
                        <div>
                          <Label>Progress</Label>
                          <div className="mt-1">
                            <Progress value={project.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">{project.progress}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Assigned Agents</h3>
                    <div className="space-y-2">
                      {(project.agents || []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No agents assigned yet.</p>
                      ) : (
                        project.agents?.map((agent) => (
                          <div key={agent.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{agent.agent_name}</p>
                              <p className="text-xs text-muted-foreground">{agent.agent_role || agent.agent_type}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>
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
      <Dialog open={assetDetailOpen} onOpenChange={setAssetDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{activeAsset?.title}</DialogTitle>
          </DialogHeader>
          {activeAsset && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {assetTypeIcons[activeAsset.asset_type] || assetTypeIcons.other}
                <Badge variant="outline">{activeAsset.asset_type}</Badge>
                {activeAsset.approved_at && (
                  <Badge className="bg-emerald-500/10 text-emerald-500">Approved</Badge>
                )}
              </div>
              {activeAsset.content && (
                <div className="p-4 bg-muted rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap">{activeAsset.content}</pre>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Label>Status:</Label>
                <Select
                  value={activeAsset.status_id || ""}
                  onValueChange={(val) => handleAssetStatusSelect(activeAsset, val)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedStatuses.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => handleAdvanceAsset(activeAsset, "prev")}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Prev Status
                </Button>
                <Button variant="outline" onClick={() => handleAdvanceAsset(activeAsset, "next")}>
                  Next Status <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
                {!activeAsset.approved_at && (
                  <Button onClick={() => handleApproveAsset(activeAsset)}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
