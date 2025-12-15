import { useProject } from "@/contexts/ProjectContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Wrench, Code, Database, Globe, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Tool {
  id: string;
  name: string;
  description: string;
  type: string;
  config: any;
  enabled: boolean;
}

export default function Tools() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "custom",
  });

  const { data: tools = [] } = useQuery({
    queryKey: ["project-tools"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tools")
        .select("*")
        .is("project_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (tool: Omit<Tool, "id" | "enabled" | "config">) => {
      const { error } = await supabase
        .from("project_tools")
        .insert({
          project_id: selectedProjectId!,
          ...tool,
          enabled: true,
          config: {},
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tools"] });
      toast.success("Tool added");
      setIsDialogOpen(false);
      setFormData({ name: "", description: "", type: "custom" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...tool }: Partial<Tool> & { id: string }) => {
      const { error } = await supabase
        .from("project_tools")
        .update(tool)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tools"] });
      toast.success("Tool updated");
      setIsDialogOpen(false);
      setEditingTool(null);
      setFormData({ name: "", description: "", type: "custom" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_tools")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tools"] });
      toast.success("Tool deleted");
    },
  });

  const toggleToolMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("project_tools")
        .update({ enabled })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tools"] });
    },
  });

  const handleSave = () => {
    if (!formData.name) {
      toast.error("Please enter a tool name");
      return;
    }

    if (editingTool) {
      updateMutation.mutate({ id: editingTool.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (tool: Tool) => {
    setEditingTool(tool);
    setFormData({
      name: tool.name,
      description: tool.description || "",
      type: tool.type,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTool(null);
    setFormData({ name: "", description: "", type: "custom" });
  };

  const getToolIcon = (type: string) => {
    switch (type) {
      case "api": return Globe;
      case "database": return Database;
      case "code": return Code;
      case "automation": return Zap;
      default: return Wrench;
    }
  };

  if (!selectedProjectId) {
    return (
      <div className="p-6">
        <Card className="p-8">
          <p className="text-muted-foreground text-center">
            Please select a project to manage its tools.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tools</h1>
          <p className="text-muted-foreground">Configure tools available to your AI agents</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Tool
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTool ? "Edit" : "Add"} Tool</DialogTitle>
              <DialogDescription>
                Configure a tool that your AI agents can use
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tool Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom Tool</SelectItem>
                    <SelectItem value="api">API Integration</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="code">Code Execution</SelectItem>
                    <SelectItem value="automation">Automation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Tool name"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What does this tool do?"
                  rows={4}
                />
              </div>
              <Button onClick={handleSave} className="w-full">
                {editingTool ? "Update" : "Add"} Tool
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tools.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">No tools configured yet</p>
            <p className="text-sm text-muted-foreground">
              Add tools that will be available to AI agents across all boards
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tools.map((tool) => {
            const Icon = getToolIcon(tool.type);
            return (
              <Card key={tool.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{tool.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {tool.type}
                        </span>
                      </div>
                      {tool.description && (
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                      )}
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
                      onClick={() => handleEdit(tool)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(tool.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
