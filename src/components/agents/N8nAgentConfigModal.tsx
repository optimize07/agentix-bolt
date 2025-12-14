import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { N8nScope, listN8nConnections, listN8nWorkflows } from "@/integrations/n8n/api";
import { RuntimeField, upsertAgentConfig, ExecutionMode, OutputBehavior, FieldType, AgentConfig } from "@/integrations/n8n/agents";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Settings, Zap } from "lucide-react";

interface N8nAgentConfigModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  scope: N8nScope;
  clientId?: string;
  area: string;
  agentKey?: string;
  title?: string;
  onSaved?: () => void;
  initialConfig?: AgentConfig | null;
}

export function N8nAgentConfigModal({
  open,
  onOpenChange,
  scope,
  clientId,
  area,
  agentKey,
  title = "Configure Agent",
  onSaved,
  initialConfig,
}: N8nAgentConfigModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Basic info
  const [agentName, setAgentName] = useState<string>(agentKey || "");
  const [role, setRole] = useState<string>("Automation Workflow");
  const [description, setDescription] = useState<string>("");
  const [avatar, setAvatar] = useState<string>("");
  
  // Execution config
  const [executionMode, setExecutionMode] = useState<ExecutionMode>("n8n");
  const [outputBehavior, setOutputBehavior] = useState<OutputBehavior>("modal_display");
  
  // n8n connection
  const [connections, setConnections] = useState<any[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>("");
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("");
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  
  // Input fields schema
  const [fields, setFields] = useState<RuntimeField[]>([]);

  // Fetch connections on open
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const results = [];
        const a = await listN8nConnections({ scope: "agency" });
        results.push(...(a?.connections ?? []));
        if (clientId) {
          const c = await listN8nConnections({ scope: "client", clientId });
          results.push(...(c?.connections ?? []));
        }
        setConnections(results);
      } catch (e) {
        console.error(e);
        setConnections([]);
      }
    })();
  }, [open, clientId]);

  // Fetch workflows when connection changes
  useEffect(() => {
    (async () => {
      setWorkflows([]);
      setSelectedWorkflowId("");
      if (!selectedConnectionId) return;
      try {
        const { workflows } = await listN8nWorkflows({ connectionId: selectedConnectionId });
        setWorkflows(Array.isArray(workflows) ? workflows : []);
      } catch (e) {
        console.error(e);
        setWorkflows([]);
      }
    })();
  }, [selectedConnectionId]);

  const handleAddField = () => {
    setFields((prev) => [...prev, { 
      key: "", 
      label: "", 
      type: "text" as FieldType, 
      required: false,
      placeholder: ""
    }]);
  };

  const handleRemoveField = (idx: number) => {
    setFields((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateField = (idx: number, updates: Partial<RuntimeField>) => {
    setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...updates } : f)));
  };

  useEffect(() => {
    if (!open) return;
    if (initialConfig) {
      setAgentName(initialConfig.display_name || initialConfig.agent_key || agentKey || "");
      setRole(initialConfig.display_role || "Automation Workflow");
      setDescription(initialConfig.description || "");
      setAvatar(initialConfig.avatar_url || "");
      setExecutionMode(initialConfig.execution_mode || "n8n");
      setOutputBehavior(initialConfig.output_behavior || "modal_display");
      setWebhookUrl(initialConfig.webhook_url || "");
      setSelectedConnectionId(initialConfig.connection_id || "");
      setSelectedWorkflowId(initialConfig.workflow_id || "");
      if (initialConfig.input_schema?.fields?.length) {
        setFields(initialConfig.input_schema.fields);
      } else if (initialConfig.input_mapping?.requiredFields?.length) {
        setFields(initialConfig.input_mapping.requiredFields);
      } else {
        setFields([]);
      }
    } else {
      setAgentName(agentKey || "");
      setRole("Automation Workflow");
      setDescription("");
      setAvatar("");
      setExecutionMode("n8n");
      setOutputBehavior("modal_display");
      setWebhookUrl("");
      setSelectedConnectionId("");
      setSelectedWorkflowId("");
      setFields([]);
    }
  }, [open, initialConfig, agentKey]);

  const handleSave = async () => {
    const nameToUse = agentKey || agentName;
    if (!nameToUse) {
      toast({ title: "Missing agent name", description: "Please provide an agent name", variant: "destructive" });
      return;
    }
    
    // For n8n mode, require connection and workflow (or webhook URL)
    if (executionMode === "n8n") {
      if (!webhookUrl && (!selectedConnectionId || !selectedWorkflowId)) {
        toast({ 
          title: "Missing configuration", 
          description: "Please provide a webhook URL or select a connection and workflow", 
          variant: "destructive" 
        });
        return;
      }
    }

    setLoading(true);
    try {
      const slug = (nameToUse || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      await upsertAgentConfig({
        scope,
        clientId,
        area,
        agentKey: slug,
        displayName: agentName || nameToUse,
        displayRole: role || undefined,
        description,
        avatarUrl: avatar || undefined,
        connectionId: selectedConnectionId || undefined,
        workflowId: selectedWorkflowId || undefined,
        webhookUrl: webhookUrl || undefined,
        inputSchema: fields.filter((f) => f.key && f.label).length ? { fields: fields.filter((f) => f.key && f.label) } : undefined,
        requiredFields: fields.filter((f) => f.key && f.label),
        outputBehavior,
        executionMode,
      });
      toast({ title: "Saved", description: "Agent configuration saved" });
      onOpenChange(false);
      onSaved?.();
      // Reset form
      setFields([]);
      setSelectedWorkflowId("");
      setSelectedConnectionId("");
      setWebhookUrl("");
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to save agent config", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="gap-2">
              <Settings className="h-4 w-4" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="execution" className="gap-2">
              <Zap className="h-4 w-4" />
              Execution
            </TabsTrigger>
            <TabsTrigger value="inputs">Inputs</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto py-4">
            <TabsContent value="basic" className="mt-0 space-y-4">
              {!agentKey && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Agent Name</Label>
                    <Input 
                      placeholder="e.g., Market Research Bot" 
                      value={agentName} 
                      onChange={(e) => setAgentName(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role (optional)</Label>
                    <Input 
                      placeholder="e.g., Automation Workflow" 
                      value={role} 
                      onChange={(e) => setRole(e.target.value)} 
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  placeholder="Describe what this agent does..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Avatar URL (optional)</Label>
                <Input
                  placeholder="https://example.com/avatar.png"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Provide a small square image URL to represent this agent in tables and chats.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Output Behavior</Label>
                <Select value={outputBehavior} onValueChange={(v) => setOutputBehavior(v as OutputBehavior)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chat_stream">Chat Interface</SelectItem>
                    <SelectItem value="modal_display">Result Modal</SelectItem>
                    <SelectItem value="field_populate">Populate Fields</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {outputBehavior === "chat_stream" 
                    ? "Agent responses appear in a chat interface"
                    : outputBehavior === "modal_display"
                    ? "Results display in a popup modal with copy option"
                    : "Results fill in form fields (advanced)"}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="execution" className="mt-0 space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Execution Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    {executionMode === "n8n" 
                      ? "Execute via n8n webhook or API"
                      : "Execute via internal Mastra agent"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${executionMode === "internal" ? "text-foreground" : "text-muted-foreground"}`}>
                    Internal
                  </span>
                  <Switch
                    checked={executionMode === "n8n"}
                    onCheckedChange={(checked) => setExecutionMode(checked ? "n8n" : "internal")}
                  />
                  <span className={`text-sm ${executionMode === "n8n" ? "text-foreground" : "text-muted-foreground"}`}>
                    n8n
                  </span>
                </div>
              </div>

              {executionMode === "n8n" && (
                <>
                  <div className="space-y-2">
                    <Label>Webhook URL (Direct Trigger)</Label>
                    <Input 
                      placeholder="https://your-n8n.app.n8n.cloud/webhook/..." 
                      value={webhookUrl} 
                      onChange={(e) => setWebhookUrl(e.target.value)} 
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter a production webhook URL for direct triggering. This bypasses connection/workflow selection.
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or use connection</span>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Connection</Label>
                      <Select value={selectedConnectionId} onValueChange={setSelectedConnectionId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a connection" />
                        </SelectTrigger>
                        <SelectContent>
                          {connections.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {(c.label || c.base_url) + (c.scope === "client" && c.client_id ? ` · client` : " · agency")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Workflow</Label>
                      <Select 
                        value={selectedWorkflowId} 
                        onValueChange={setSelectedWorkflowId} 
                        disabled={!selectedConnectionId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={selectedConnectionId ? "Select a workflow" : "Select connection first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {workflows.map((w) => (
                            <SelectItem key={String(w.id)} value={String(w.id)}>
                              {w.name || w.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {executionMode === "internal" && (
                <Card className="border-dashed border-2 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Internal (Mastra) execution is coming soon. Configure this agent to use n8n for now.
                  </p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="inputs" className="mt-0 space-y-4">
              <div className="text-sm text-muted-foreground">
                Define the input fields that users will fill out before running this agent.
              </div>
              
              <div className="space-y-3">
                {fields.map((f, idx) => (
                  <Card key={idx} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Field {idx + 1}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveField(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid gap-3 md:grid-cols-3">
                      <Input 
                        placeholder="Key (e.g., query)" 
                        value={f.key} 
                        onChange={(e) => updateField(idx, { key: e.target.value })} 
                      />
                      <Input 
                        placeholder="Label" 
                        value={f.label} 
                        onChange={(e) => updateField(idx, { label: e.target.value })} 
                      />
                      <Select 
                        value={f.type} 
                        onValueChange={(v) => updateField(idx, { type: v as FieldType })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="textarea">Text Area</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="boolean">Boolean</SelectItem>
                          <SelectItem value="select">Dropdown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <Input 
                        placeholder="Placeholder text..." 
                        value={f.placeholder || ""} 
                        onChange={(e) => updateField(idx, { placeholder: e.target.value })} 
                      />
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={f.required || false}
                            onCheckedChange={(v) => updateField(idx, { required: v })}
                          />
                          <Label className="text-sm">Required</Label>
                        </div>
                      </div>
                    </div>

                    {f.type === "select" && (
                      <div className="space-y-2">
                        <Label className="text-xs">Options (comma-separated)</Label>
                        <Input 
                          placeholder="Option 1, Option 2, Option 3" 
                          value={(f.options || []).join(", ")} 
                          onChange={(e) => updateField(idx, { 
                            options: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                          })} 
                        />
                      </div>
                    )}
                  </Card>
                ))}

                <Button variant="outline" className="w-full gap-2" onClick={handleAddField}>
                  <Plus className="h-4 w-4" />
                  Add Input Field
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="border-t border-border pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Configuration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
