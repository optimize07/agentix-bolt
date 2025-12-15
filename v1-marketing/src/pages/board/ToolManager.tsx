import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Settings2, Globe, Database, Bot, Trash2, Edit, Plug, Brain, FolderOpen, Search, TrendingUp, Gauge, MessageCircle, Palette, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ToolType = "internal" | "api" | "data_source" | "ai_model" | "custom";

interface Tool {
  id: string;
  agent_board_id: string;
  name: string;
  description: string | null;
  type: string;
  config: any;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface FormData {
  name: string;
  description: string;
  config: Record<string, any>;
}

const INTERNAL_TOOL_TYPES = [
  { id: "knowledge_base", icon: Brain, label: "Knowledge Base", description: "Query your knowledge base", available: true },
  { id: "assets", icon: FolderOpen, label: "Company Assets", description: "Access company assets", available: true },
  { id: "ad_spy", icon: Search, label: "Ad Spy", description: "Competitor ad insights", available: true },
  { id: "market_research", icon: TrendingUp, label: "Market Research", description: "Market research data", available: true },
  { id: "ad_optimizer", icon: Gauge, label: "Ad Optimizer", description: "Ad optimization insights", available: true },
  { id: "sentiment", icon: MessageCircle, label: "Sentiment Analyzer", description: "Analyze sentiment", available: true },
  { id: "branding", icon: Palette, label: "Branding", description: "Coming soon", available: false },
  { id: "compliance", icon: ShieldCheck, label: "Compliance", description: "Coming soon", available: false },
];

export default function ToolManager() {
  const { boardId } = useParams();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ToolType>("internal");
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    config: {},
  });

  const { data: tools = [], isLoading } = useQuery({
    queryKey: ["board-tools", boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("board_tools")
        .select("*")
        .eq("agent_board_id", boardId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Tool[];
    },
    enabled: !!boardId,
  });

  const createToolMutation = useMutation({
    mutationFn: async (toolData: { name: string; description: string; type: string; config: any }) => {
      const { data, error } = await supabase
        .from("board_tools")
        .insert({
          agent_board_id: boardId!,
          name: toolData.name,
          description: toolData.description,
          type: toolData.type,
          config: toolData.config,
          enabled: true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-tools", boardId] });
      toast.success("Tool created successfully");
      handleDialogClose();
    },
    onError: (error) => {
      toast.error("Failed to create tool");
      console.error(error);
    },
  });

  const updateToolMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Tool> }) => {
      const { data, error } = await supabase
        .from("board_tools")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-tools", boardId] });
      toast.success("Tool updated successfully");
      handleDialogClose();
    },
    onError: (error) => {
      toast.error("Failed to update tool");
      console.error(error);
    },
  });

  const deleteToolMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("board_tools").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-tools", boardId] });
      toast.success("Tool deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete tool");
      console.error(error);
    },
  });

  const toggleToolMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("board_tools").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-tools", boardId] });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", config: {} });
    setEditingTool(null);
  };

  const handleDialogClose = () => {
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const openEditDialog = (tool: Tool) => {
    setEditingTool(tool);
    setFormData({
      name: tool.name,
      description: tool.description || "",
      config: tool.config || {},
    });
    setSelectedType(tool.type as ToolType);
    setIsCreateDialogOpen(true);
  };

  const openCreateDialogForInternalType = (internalTypeId: string) => {
    setSelectedType("internal");
    setFormData({
      name: "",
      description: "",
      config: { internalType: internalTypeId },
    });
    setIsCreateDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("Tool name is required");
      return;
    }

    if (editingTool) {
      updateToolMutation.mutate({
        id: editingTool.id,
        updates: {
          name: formData.name,
          description: formData.description,
          config: formData.config,
        },
      });
    } else {
      createToolMutation.mutate({
        name: formData.name,
        description: formData.description,
        type: selectedType,
        config: formData.config,
      });
    }
  };

  const updateConfig = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      config: { ...prev.config, [key]: value },
    }));
  };

  const getTypeIcon = (type: string, config?: any) => {
    if (type === "internal" && config?.internalType) {
      switch (config.internalType) {
        case "knowledge_base": return Brain;
        case "assets": return FolderOpen;
        case "ad_spy": return Search;
        case "market_research": return TrendingUp;
        case "ad_optimizer": return Gauge;
        case "sentiment": return MessageCircle;
        case "branding": return Palette;
        case "compliance": return ShieldCheck;
        default: return Plug;
      }
    }
    switch (type) {
      case "internal":
        return Plug;
      case "api":
        return Globe;
      case "data_source":
        return Database;
      case "ai_model":
        return Bot;
      default:
        return Settings2;
    }
  };

  const getTypeLabel = (type: string, config?: any) => {
    if (type === "internal" && config?.internalType) {
      const labels: Record<string, string> = {
        knowledge_base: "Knowledge Base",
        assets: "Company Assets",
        ad_spy: "Ad Spy",
        market_research: "Market Research",
        ad_optimizer: "Ad Optimizer",
        sentiment: "Sentiment Analyzer",
        branding: "Branding",
        compliance: "Compliance"
      };
      return labels[config.internalType] || "Internal Tool";
    }
    switch (type) {
      case "internal":
        return "Internal Tool";
      case "api":
        return "API Integration";
      case "data_source":
        return "Data Source";
      case "ai_model":
        return "AI Model";
      case "custom":
        return "Custom Function";
      default:
        return type;
    }
  };

  const renderConfigForm = () => {
    switch (selectedType) {
      case "internal":
        return (
          <div className="space-y-4">
            {/* Show selected tool type */}
            {formData.config.internalType && (
              <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-3">
                {(() => {
                  const selectedTool = INTERNAL_TOOL_TYPES.find(t => t.id === formData.config.internalType);
                  if (!selectedTool) return null;
                  const Icon = selectedTool.icon;
                  return (
                    <>
                      <Icon className="w-5 h-5 text-primary" />
                      <span className="font-medium">{selectedTool.label}</span>
                    </>
                  );
                })()}
              </div>
            )}
            
            {/* Tool-specific configuration options */}
            {formData.config.internalType === "knowledge_base" && (
              <div className="space-y-2">
                <Label>Query Strategy</Label>
                <Select 
                  value={formData.config.queryStrategy || "semantic"}
                  onValueChange={(value) => updateConfig("queryStrategy", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semantic">Semantic Search</SelectItem>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="relevant">Most Relevant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {formData.config.internalType === "assets" && (
              <div className="space-y-2">
                <Label>Asset Types to Include</Label>
                <Input
                  placeholder="e.g., images, text, urls (comma-separated)"
                  value={formData.config.assetTypes || ""}
                  onChange={(e) => updateConfig("assetTypes", e.target.value)}
                />
              </div>
            )}
            
            {formData.config.internalType === "sentiment" && (
              <div className="space-y-2">
                <Label>Analysis Scope</Label>
                <Select
                  value={formData.config.analysisScope || "comments"}
                  onValueChange={(value) => updateConfig("analysisScope", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comments">Ad Comments</SelectItem>
                    <SelectItem value="reviews">Customer Reviews</SelectItem>
                    <SelectItem value="social">Social Mentions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 This tool will automatically pull data from your {getTypeLabel("internal", formData.config)} 
                and make it available to the AI agent during conversations.
              </p>
            </div>
          </div>
        );

      case "api":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>API Endpoint URL</Label>
              <Input
                placeholder="https://api.example.com/v1"
                value={formData.config.endpoint || ""}
                onChange={(e) => updateConfig("endpoint", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Authentication Type</Label>
              <Select
                value={formData.config.authType || "none"}
                onValueChange={(value) => updateConfig("authType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="api_key">API Key</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>API Key / Token</Label>
              <Input
                type="password"
                placeholder="sk-..."
                value={formData.config.apiKey || ""}
                onChange={(e) => updateConfig("apiKey", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Headers (JSON)</Label>
              <Textarea
                placeholder='{"Content-Type": "application/json"}'
                value={formData.config.headers || ""}
                onChange={(e) => updateConfig("headers", e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          </div>
        );

      case "data_source":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Source Type</Label>
              <Select
                value={formData.config.sourceType || "webhook"}
                onValueChange={(value) => updateConfig("sourceType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="rss">RSS Feed</SelectItem>
                  <SelectItem value="csv">CSV URL</SelectItem>
                  <SelectItem value="google_sheets">Google Sheets</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Source URL</Label>
              <Input
                placeholder="https://..."
                value={formData.config.sourceUrl || ""}
                onChange={(e) => updateConfig("sourceUrl", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Refresh Interval</Label>
              <Select
                value={formData.config.refreshInterval || "manual"}
                onValueChange={(value) => updateConfig("refreshInterval", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "ai_model":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Model Provider</Label>
              <Select
                value={formData.config.provider || "openai"}
                onValueChange={(value) => updateConfig("provider", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="google">Google AI</SelectItem>
                  <SelectItem value="custom">Custom Endpoint</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Model Name</Label>
              <Input
                placeholder="gpt-4, claude-3, etc."
                value={formData.config.modelName || ""}
                onChange={(e) => updateConfig("modelName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                placeholder="Your API key"
                value={formData.config.apiKey || ""}
                onChange={(e) => updateConfig("apiKey", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>System Prompt (Optional)</Label>
              <Textarea
                placeholder="Default system instructions..."
                value={formData.config.systemPrompt || ""}
                onChange={(e) => updateConfig("systemPrompt", e.target.value)}
              />
            </div>
          </div>
        );

      case "custom":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Input Parameters (JSON Schema)</Label>
              <Textarea
                placeholder='{"input": {"type": "string", "description": "The input text"}}'
                value={formData.config.parameters || ""}
                onChange={(e) => updateConfig("parameters", e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input
                placeholder="https://your-webhook.com/execute"
                value={formData.config.webhookUrl || ""}
                onChange={(e) => updateConfig("webhookUrl", e.target.value)}
              />
            </div>
          </div>
        );
    }
  };

  const toolsByType = {
    internal: tools.filter((t) => t.type === "internal"),
    api: tools.filter((t) => t.type === "api"),
    data_source: tools.filter((t) => t.type === "data_source"),
    ai_model: tools.filter((t) => t.type === "ai_model"),
    custom: tools.filter((t) => t.type === "custom"),
  };

  const renderToolCard = (tool: Tool) => {
    const Icon = getTypeIcon(tool.type, tool.config);
    return (
      <Card key={tool.id} className="relative">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3 flex-1">
            <div
              className={cn(
                "p-2 rounded-lg",
                tool.enabled ? "bg-primary/10" : "bg-muted"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5",
                  tool.enabled ? "text-primary" : "text-muted-foreground"
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base">{tool.name}</CardTitle>
              <CardDescription className="line-clamp-1">
                {tool.description || "No description"}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={tool.enabled}
              onCheckedChange={(enabled) =>
                toggleToolMutation.mutate({ id: tool.id, enabled })
              }
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEditDialog(tool)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (confirm("Are you sure you want to delete this tool?")) {
                  deleteToolMutation.mutate(tool.id);
                }
              }}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </CardHeader>
        {tool.config && Object.keys(tool.config).length > 0 && (
          <CardContent>
            <div className="text-xs text-muted-foreground space-y-1">
              {tool.type === "internal" && tool.config.internalType && (
                <>
                  <div>Type: {getTypeLabel(tool.type, tool.config)}</div>
                  {tool.config.queryStrategy && (
                    <div>Strategy: {tool.config.queryStrategy}</div>
                  )}
                  {tool.config.assetTypes && (
                    <div>Assets: {tool.config.assetTypes}</div>
                  )}
                  {tool.config.analysisScope && (
                    <div>Scope: {tool.config.analysisScope}</div>
                  )}
                </>
              )}
              {tool.type === "api" && tool.config.endpoint && (
                <span>Endpoint: {tool.config.endpoint}</span>
              )}
              {tool.type === "data_source" && tool.config.sourceUrl && (
                <span>Source: {tool.config.sourceUrl}</span>
              )}
              {tool.type === "ai_model" && tool.config.modelName && (
                <span>Model: {tool.config.modelName}</span>
              )}
              {tool.type === "custom" && tool.config.webhookUrl && (
                <span>Webhook: {tool.config.webhookUrl}</span>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading tools...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Tool Manager</h3>
          <p className="text-muted-foreground">
            Configure tools and integrations for this project
          </p>
        </div>
      </div>

      <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as ToolType)}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="internal" className="gap-2">
              <Plug className="w-4 h-4" />
              Internal
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Globe className="w-4 h-4" />
              API
            </TabsTrigger>
            <TabsTrigger value="data_source" className="gap-2">
              <Database className="w-4 h-4" />
              Data
            </TabsTrigger>
            <TabsTrigger value="ai_model" className="gap-2">
              <Bot className="w-4 h-4" />
              AI
            </TabsTrigger>
            <TabsTrigger value="custom" className="gap-2">
              <Settings2 className="w-4 h-4" />
              Custom
            </TabsTrigger>
          </TabsList>
          {selectedType !== "internal" && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Tool
            </Button>
          )}
        </div>

        <TabsContent value="internal" className="space-y-6">
          {/* Internal Tool Type Cards - Always Visible */}
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Add Internal Tool</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {INTERNAL_TOOL_TYPES.map(tool => (
                <Card 
                  key={tool.id}
                  className={cn(
                    "p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50",
                    !tool.available && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => tool.available && openCreateDialogForInternalType(tool.id)}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 rounded-lg bg-muted">
                      <tool.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tool.label}</p>
                      <p className="text-xs text-muted-foreground">{tool.description}</p>
                    </div>
                    {!tool.available && (
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded">Coming Soon</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Existing Tools Section */}
          {toolsByType.internal.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">Active Tools</h4>
              <div className="space-y-4">
                {toolsByType.internal.map(renderToolCard)}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          {toolsByType.api.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Globe className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No API integrations configured yet
                </p>
              </CardContent>
            </Card>
          ) : (
            toolsByType.api.map(renderToolCard)
          )}
        </TabsContent>

        <TabsContent value="data_source" className="space-y-4">
          {toolsByType.data_source.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Database className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No data sources configured yet
                </p>
              </CardContent>
            </Card>
          ) : (
            toolsByType.data_source.map(renderToolCard)
          )}
        </TabsContent>

        <TabsContent value="ai_model" className="space-y-4">
          {toolsByType.ai_model.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Bot className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No AI models configured yet
                </p>
              </CardContent>
            </Card>
          ) : (
            toolsByType.ai_model.map(renderToolCard)
          )}
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          {toolsByType.custom.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Settings2 className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No custom functions configured yet
                </p>
              </CardContent>
            </Card>
          ) : (
            toolsByType.custom.map(renderToolCard)
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={isCreateDialogOpen || !!editingTool}
        onOpenChange={(open) => {
          if (!open) handleDialogClose();
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTool ? "Edit Tool" : "Create New Tool"}
            </DialogTitle>
            <DialogDescription>
              Configure your {getTypeLabel(selectedType, formData.config)} tool
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tool Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="My API Tool"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe what this tool does..."
              />
            </div>

            {renderConfigForm()}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name.trim() || createToolMutation.isPending || updateToolMutation.isPending}
            >
              {editingTool ? "Update" : "Create"} Tool
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
