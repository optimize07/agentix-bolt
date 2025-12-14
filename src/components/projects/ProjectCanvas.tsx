import { useState, useRef, useCallback, useEffect } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Bot,
  Brain,
  FileText,
  Image,
  Link2,
  Type,
  Video,
  Layers,
  Play,
  X,
  GripVertical,
  Sparkles,
  ArrowRight,
  Loader2,
  ChevronDown,
  ChevronUp,
  Plus,
  Database,
  Target,
  Megaphone,
  BarChart3,
  Mail,
  Globe,
  Zap,
  Check,
  Copy,
  Download,
} from "lucide-react";
import { AgentConfig, executeAgentWebhook } from "@/integrations/n8n/agents";
import { runN8nWorkflow } from "@/integrations/n8n/api";
import type { ProjectAsset } from "@/integrations/projects/types";
import { saveAgentOutputAsAsset } from "@/integrations/projects/api";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Node types
type NodeType = 
  | "agent" 
  | "knowledge" 
  | "text" 
  | "image" 
  | "document" 
  | "link" 
  | "output";

interface CanvasNode {
  id: string;
  type: NodeType;
  title: string;
  content?: string;
  position: { x: number; y: number };
  agent?: AgentConfig;
  assetId?: string;
  isRunning?: boolean;
  output?: string;
  collapsed?: boolean;
}

// Output type templates
const outputTemplates = [
  { id: "vsl-copy", title: "VSL Copy", icon: Video, description: "Video sales letter script" },
  { id: "ad-strategy", title: "Ad Strategy", icon: Target, description: "Advertising strategy doc" },
  { id: "email-sequence", title: "Email Sequence", icon: Mail, description: "Email marketing flow" },
  { id: "landing-page", title: "Landing Page Copy", icon: Globe, description: "Conversion-focused copy" },
  { id: "go-to-market", title: "Go-to-Market", icon: Megaphone, description: "GTM strategy plan" },
  { id: "content-brief", title: "Content Brief", icon: FileText, description: "Content creation guide" },
  { id: "analytics-report", title: "Analytics Report", icon: BarChart3, description: "Data analysis summary" },
];

// Library item component
function LibraryItem({
  icon: Icon,
  title,
  subtitle,
  onDragStart,
  onClick,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  onDragStart?: () => void;
  onClick?: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 p-2.5 rounded-lg cursor-grab hover:bg-muted transition-colors border border-transparent hover:border-border"
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
    >
      <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// Canvas Node component
function CanvasNodeCard({
  node,
  onRemove,
  onRun,
  onToggleCollapse,
  onUpdateContent,
  onCopyOutput,
  onSaveAsAsset,
  onDragStart,
}: {
  node: CanvasNode;
  onRemove: () => void;
  onRun?: () => void;
  onToggleCollapse?: () => void;
  onUpdateContent?: (content: string) => void;
  onCopyOutput?: () => void;
  onSaveAsAsset?: () => void;
  onDragStart?: (event: ReactMouseEvent<HTMLDivElement>) => void;
}) {
  const getNodeIcon = () => {
    switch (node.type) {
      case "agent":
        return <Bot className="h-4 w-4" />;
      case "knowledge":
        return <Brain className="h-4 w-4" />;
      case "text":
        return <Type className="h-4 w-4" />;
      case "image":
        return <Image className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      case "link":
        return <Link2 className="h-4 w-4" />;
      case "output":
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Layers className="h-4 w-4" />;
    }
  };

  const getNodeColor = () => {
    switch (node.type) {
      case "agent":
        return "border-l-emerald-500";
      case "knowledge":
        return "border-l-blue-500";
      case "output":
        return "border-l-purple-500";
      default:
        return "border-l-amber-500";
    }
  };

  return (
    <Card
      className={`bg-card border border-border ${getNodeColor()} border-l-4 shadow-lg hover:shadow-xl transition-shadow`}
      style={{
        width: node.type === "output" && node.output ? 400 : 300,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 p-3 border-b border-border cursor-grab active:cursor-grabbing"
        onMouseDown={onDragStart}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
          {getNodeIcon()}
        </div>
        <span className="font-medium text-sm text-foreground flex-1 truncate">
          {node.title}
        </span>
        {node.type === "agent" && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 gap-1"
            onClick={onRun}
            disabled={node.isRunning}
          >
            {node.isRunning ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            Run
          </Button>
        )}
        {(node.type === "output" || node.type === "text") && onToggleCollapse && (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={onToggleCollapse}
          >
            {node.collapsed ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )}
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Content */}
      {!node.collapsed && (
        <div className="p-3">
          {node.type === "agent" && node.agent && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {node.agent.description || `Run ${node.agent.display_name} to generate output`}
              </p>
              {node.output && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Check className="h-3 w-3" />
                      Output
                    </Badge>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onCopyOutput}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onSaveAsAsset}>
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none max-h-48 overflow-y-auto">
                    <ReactMarkdown>{node.output}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}

          {node.type === "text" && (
            <Textarea
              placeholder="Enter your text content..."
              value={node.content || ""}
              onChange={(e) => onUpdateContent?.(e.target.value)}
              className="min-h-[80px] text-sm resize-none"
            />
          )}

          {node.type === "knowledge" && (
            <div className="text-xs text-muted-foreground">
              <p className="mb-2">Knowledge Base reference</p>
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <Database className="h-4 w-4 text-blue-500" />
                <span className="truncate">{node.content || "Connected to KB"}</span>
              </div>
            </div>
          )}

          {(node.type === "image" || node.type === "document" || node.type === "link") && (
            <Input
              placeholder={node.type === "link" ? "https://..." : "Paste URL or upload..."}
              value={node.content || ""}
              onChange={(e) => onUpdateContent?.(e.target.value)}
              className="text-sm"
            />
          )}

          {node.type === "output" && (
            <div className="space-y-2">
              {!node.output ? (
                <p className="text-xs text-muted-foreground">
                  Connect an agent and run it to generate content here.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">Generated</Badge>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onCopyOutput}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onSaveAsAsset}>
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none max-h-64 overflow-y-auto p-2 bg-muted rounded-lg">
                    <ReactMarkdown>{node.output}</ReactMarkdown>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

interface ProjectCanvasProps {
  projectId: string;
  clientId: string;
  agents: AgentConfig[];
  assets: ProjectAsset[];
  onAssetCreated: () => void;
}

export function ProjectCanvas({
  projectId,
  clientId,
  agents,
  assets,
  onAssetCreated,
}: ProjectCanvasProps) {
  const { toast } = useToast();
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [agentsOpen, setAgentsOpen] = useState(true);
  const [outputsOpen, setOutputsOpen] = useState(true);
  const [inputsOpen, setInputsOpen] = useState(true);
  const canvasViewportRef = useRef<HTMLDivElement>(null);
  const canvasContentRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<CanvasNode[]>([]);
  const draggingRef = useRef<{ nodeId: string | null; offsetX: number; offsetY: number }>({
    nodeId: null,
    offsetX: 0,
    offsetY: 0,
  });

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // Generate unique ID
  const generateId = () => `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add node to canvas
  const addNode = useCallback((type: NodeType, data: Partial<CanvasNode>) => {
    setNodes((prev) => {
      const viewport = canvasViewportRef.current;
      const offset = prev.length * 30;
      const baseX = viewport ? viewport.scrollLeft + viewport.clientWidth / 2 - 150 : 100;
      const baseY = viewport ? viewport.scrollTop + viewport.clientHeight / 2 - 80 : 100;

      const newNode: CanvasNode = {
        id: generateId(),
        type,
        title: data.title || "New Node",
        content: data.content,
        position: { x: baseX + offset, y: baseY + offset },
        agent: data.agent,
        assetId: data.assetId,
        collapsed: false,
      };
      return [...prev, newNode];
    });
  }, []);

  // Remove node
  const removeNode = useCallback((nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
  }, []);

  // Update node content
  const updateNodeContent = useCallback((nodeId: string, content: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, content } : n))
    );
  }, []);

  // Toggle node collapse
  const toggleNodeCollapse = useCallback((nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, collapsed: !n.collapsed } : n))
    );
  }, []);

  // Run agent node
  const runAgentNode = useCallback(async (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || !node.agent) return;

    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, isRunning: true } : n))
    );

    try {
      // Gather context from other nodes
      const context = nodes
        .filter((n) => n.id !== nodeId && n.content)
        .map((n) => `[${n.title}]: ${n.content}`)
        .join("\n\n");

      const payload = {
        query: `Project context:\n${context}\n\nPlease generate the requested output.`,
        context,
      };

      let response: any;
      if (node.agent.is_predefined && node.agent.webhook_url) {
        const result = await executeAgentWebhook({
          webhookUrl: node.agent.webhook_url,
          payload,
        });
        response = result.success ? result.result : { error: result.error };
      } else {
        const result = await runN8nWorkflow({
          connectionId: node.agent.connection_id,
          workflowId: node.agent.workflow_id,
          webhookUrl: node.agent.webhook_url || undefined,
          payload,
          waitTillFinished: true,
        });
        response = result.result;
      }

      // Extract output text
      let output = "";
      if (typeof response === "string") {
        output = response;
      } else if (response?.output) {
        output = response.output;
      } else if (response?.result) {
        output = typeof response.result === "string" ? response.result : JSON.stringify(response.result, null, 2);
      } else {
        output = JSON.stringify(response, null, 2);
      }

      setNodes((prev) =>
        prev.map((n) => (n.id === nodeId ? { ...n, isRunning: false, output } : n))
      );

      toast({ title: "Agent Complete", description: `${node.agent.display_name} generated output` });
    } catch (error: any) {
      setNodes((prev) =>
        prev.map((n) => (n.id === nodeId ? { ...n, isRunning: false, output: `Error: ${error?.message}` } : n))
      );
      toast({ title: "Error", description: error?.message || "Agent failed", variant: "destructive" });
    }
  }, [nodes, toast]);

  // Copy output to clipboard
  const copyOutput = useCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node?.output) {
      navigator.clipboard.writeText(node.output);
      toast({ title: "Copied", description: "Output copied to clipboard" });
    }
  }, [nodes, toast]);

  // Save output as project asset
  const saveAsAsset = useCallback(async (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node?.output) return;

    try {
      await saveAgentOutputAsAsset({
        projectId,
        clientId,
        agentConfigId: node.agent?.id || "manual",
        agentName: node.agent?.display_name || node.title,
        title: `${node.title} - ${new Date().toLocaleDateString()}`,
        content: node.output,
        assetType: "text",
      });
      toast({ title: "Saved", description: "Output saved as project asset" });
      onAssetCreated();
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to save asset", variant: "destructive" });
    }
  }, [nodes, projectId, toast, onAssetCreated]);

  // Dragging handlers
  const handleNodeDrag = useCallback((event: MouseEvent) => {
    const { nodeId, offsetX, offsetY } = draggingRef.current;
    if (!nodeId || !canvasContentRef.current) return;
    const bounds = canvasContentRef.current.getBoundingClientRect();
    const x = event.clientX - bounds.left - offsetX;
    const y = event.clientY - bounds.top - offsetY;
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, position: { x, y } } : n))
    );
  }, []);

  const handleNodeDragEnd = useCallback(() => {
    draggingRef.current = { nodeId: null, offsetX: 0, offsetY: 0 };
    window.removeEventListener("mousemove", handleNodeDrag);
    window.removeEventListener("mouseup", handleNodeDragEnd);
  }, [handleNodeDrag]);

  const handleNodeDragStart = useCallback((nodeId: string, event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const node = nodesRef.current.find((n) => n.id === nodeId);
    if (!node || !canvasContentRef.current) return;
    const bounds = canvasContentRef.current.getBoundingClientRect();
    draggingRef.current = {
      nodeId,
      offsetX: event.clientX - bounds.left - node.position.x,
      offsetY: event.clientY - bounds.top - node.position.y,
    };
    window.addEventListener("mousemove", handleNodeDrag);
    window.addEventListener("mouseup", handleNodeDragEnd);
  }, [handleNodeDrag, handleNodeDragEnd]);

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleNodeDrag);
      window.removeEventListener("mouseup", handleNodeDragEnd);
    };
  }, [handleNodeDrag, handleNodeDragEnd]);

  return (
    <div className="h-full flex">
      {/* Left Sidebar - Node Library */}
      <div className="w-72 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Node Library</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Click to add nodes to your canvas
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-4">
            {/* Agents Section */}
            <Collapsible open={agentsOpen} onOpenChange={setAgentsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  AI Agents
                </span>
                {agentsOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pt-1">
                {agents.map((agent) => (
                  <LibraryItem
                    key={agent.id}
                    icon={Bot}
                    title={agent.display_name || agent.agent_key}
                    subtitle={agent.display_role || "AI Agent"}
                    onClick={() =>
                      addNode("agent", {
                        title: agent.display_name || agent.agent_key,
                        agent,
                      })
                    }
                  />
                ))}
                {agents.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2">
                    No agents available
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Outputs Section */}
            <Collapsible open={outputsOpen} onOpenChange={setOutputsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Output Templates
                </span>
                {outputsOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pt-1">
                {outputTemplates.map((template) => (
                  <LibraryItem
                    key={template.id}
                    icon={template.icon}
                    title={template.title}
                    subtitle={template.description}
                    onClick={() =>
                      addNode("output", {
                        title: template.title,
                        content: template.description,
                      })
                    }
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Inputs Section */}
            <Collapsible open={inputsOpen} onOpenChange={setInputsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Input Nodes
                </span>
                {inputsOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pt-1">
                <LibraryItem
                  icon={Type}
                  title="Text Block"
                  subtitle="Add text content"
                  onClick={() => addNode("text", { title: "Text Block" })}
                />
                <LibraryItem
                  icon={Brain}
                  title="Knowledge Base"
                  subtitle="Reference KB items"
                  onClick={() => addNode("knowledge", { title: "Knowledge Reference" })}
                />
                <LibraryItem
                  icon={Image}
                  title="Image"
                  subtitle="Add image URL"
                  onClick={() => addNode("image", { title: "Image" })}
                />
                <LibraryItem
                  icon={FileText}
                  title="Document"
                  subtitle="Link document"
                  onClick={() => addNode("document", { title: "Document" })}
                />
                <LibraryItem
                  icon={Link2}
                  title="Link"
                  subtitle="External URL"
                  onClick={() => addNode("link", { title: "Link" })}
                />
              </CollapsibleContent>
            </Collapsible>

            {/* Existing Assets */}
            {assets.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2">
                  Project Assets
                </p>
                <div className="space-y-1">
                  {assets.slice(0, 5).map((asset) => (
                    <LibraryItem
                      key={asset.id}
                      icon={asset.asset_type === "text" ? Type : FileText}
                      title={asset.title}
                      subtitle={asset.status_name}
                      onClick={() =>
                        addNode(asset.asset_type as NodeType, {
                          title: asset.title,
                          content: asset.content || "",
                          assetId: asset.id,
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Canvas Area */}
      <div
        ref={canvasViewportRef}
        className="flex-1 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:20px_20px] overflow-auto"
      >
        <div
          ref={canvasContentRef}
          className="relative min-h-[1400px] min-w-[2200px] p-10"
        >
          {nodes.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
                <Zap className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Build Your Project
              </h2>
              <p className="text-muted-foreground max-w-md mb-8">
                Click nodes from the library to add them to your canvas. 
                Combine agents, knowledge, and inputs to generate marketing outputs.
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    if (agents[0]) {
                      addNode("agent", {
                        title: agents[0].display_name || agents[0].agent_key,
                        agent: agents[0],
                      });
                    }
                  }}
                  className="gap-2 pointer-events-auto"
                  disabled={agents.length === 0}
                >
                  <Bot className="h-4 w-4" />
                  Add Agent
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addNode("text", { title: "Project Brief" })}
                  className="gap-2 pointer-events-auto"
                >
                  <Type className="h-4 w-4" />
                  Add Brief
                </Button>
              </div>
            </div>
          ) : null}

          {nodes.map((node) => (
            <div
              key={node.id}
              className="absolute"
              style={{ left: node.position.x, top: node.position.y }}
            >
              <CanvasNodeCard
                node={node}
                onRemove={() => removeNode(node.id)}
                onRun={node.type === "agent" ? () => runAgentNode(node.id) : undefined}
                onToggleCollapse={() => toggleNodeCollapse(node.id)}
                onUpdateContent={(content) => updateNodeContent(node.id, content)}
                onCopyOutput={() => copyOutput(node.id)}
                onSaveAsAsset={() => saveAsAsset(node.id)}
                onDragStart={(event) => handleNodeDragStart(node.id, event)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

