import { useProject } from "@/contexts/ProjectContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Pencil, Trash2, Lightbulb, Users, DollarSign, FileText, Globe } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface StrategySection {
  id: string;
  title: string;
  content: string;
  category: string;
}

export default function Strategy() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<StrategySection | null>(null);
  const [formData, setFormData] = useState({
    category: "tips",
    title: "",
    content: "",
  });

  const { data: strategies = [] } = useQuery({
    queryKey: ["project-strategies", selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const { data, error } = await supabase
        .from("project_strategies")
        .select("*")
        .eq("project_id", selectedProjectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProjectId,
  });

  const createMutation = useMutation({
    mutationFn: async (section: Omit<StrategySection, "id">) => {
      const { error } = await supabase
        .from("project_strategies")
        .insert({
          project_id: selectedProjectId!,
          ...section,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-strategies"] });
      toast.success("Strategy section added");
      setIsDialogOpen(false);
      setFormData({ category: "tips", title: "", content: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...section }: StrategySection) => {
      const { error } = await supabase
        .from("project_strategies")
        .update(section)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-strategies"] });
      toast.success("Strategy section updated");
      setIsDialogOpen(false);
      setEditingSection(null);
      setFormData({ category: "tips", title: "", content: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_strategies")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-strategies"] });
      toast.success("Strategy section deleted");
    },
  });

  const handleSave = () => {
    if (!formData.title || !formData.content) {
      toast.error("Please fill in all fields");
      return;
    }

    if (editingSection) {
      updateMutation.mutate({ ...editingSection, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (section: StrategySection) => {
    setEditingSection(section);
    setFormData({
      category: section.category,
      title: section.title,
      content: section.content,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSection(null);
    setFormData({ category: "tips", title: "", content: "" });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "tips": return Lightbulb;
      case "audience": return Users;
      case "budget": return DollarSign;
      case "prompts": return FileText;
      case "platform": return Globe;
      default: return FileText;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "tips": return "Tips & Best Practices";
      case "audience": return "Audience Insights";
      case "budget": return "Budget Guidelines";
      case "prompts": return "Prompt Suggestions";
      case "platform": return "Platform Guidelines";
      default: return category;
    }
  };

  const groupedStrategies = strategies.reduce((acc, strategy) => {
    if (!acc[strategy.category]) {
      acc[strategy.category] = [];
    }
    acc[strategy.category].push(strategy);
    return acc;
  }, {} as Record<string, StrategySection[]>);

  if (!selectedProjectId) {
    return (
      <div className="p-6">
        <Card className="p-8">
          <p className="text-muted-foreground text-center">
            Please select a project to manage its strategy.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Strategy</h1>
          <p className="text-muted-foreground">Define strategic guidelines for this project</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSection ? "Edit" : "Add"} Strategy Section</DialogTitle>
              <DialogDescription>
                Create strategic guidelines for your project
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tips">Tips & Best Practices</SelectItem>
                    <SelectItem value="audience">Audience Insights</SelectItem>
                    <SelectItem value="budget">Budget Guidelines</SelectItem>
                    <SelectItem value="prompts">Prompt Suggestions</SelectItem>
                    <SelectItem value="platform">Platform Guidelines</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Section title"
                />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Strategic guidelines..."
                  rows={6}
                />
              </div>
              <Button onClick={handleSave} className="w-full">
                {editingSection ? "Update" : "Add"} Section
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {Object.keys(groupedStrategies).length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">No strategy sections yet</p>
            <p className="text-sm text-muted-foreground">
              Add strategic guidelines that will be available across all boards
            </p>
          </div>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {Object.entries(groupedStrategies).map(([category, sections]) => {
            const Icon = getCategoryIcon(category);
            return (
              <Card key={category} className="overflow-hidden">
                <div className="bg-muted/50 px-4 py-3 flex items-center gap-2">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="font-medium">{getCategoryLabel(category)}</span>
                </div>
                <div className="p-4 space-y-2">
                  {sections.map((section) => (
                    <Card key={section.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium mb-2">{section.title}</h3>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {section.content}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(section)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(section.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
