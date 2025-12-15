import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Lightbulb, Target, DollarSign, TrendingUp, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

interface StrategySection {
  id: string;
  title: string;
  content: string;
  category: "tips" | "audience" | "budget" | "prompts" | "platform";
}

export default function Strategy() {
  const { boardId } = useParams();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<StrategySection | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "tips" as StrategySection["category"],
  });

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

  // Parse strategies from goal field (with validation)
  const strategies = (() => {
    if (!board?.goal) return [];
    try {
      const parsed = JSON.parse(board.goal);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // goal field contains non-JSON text, return empty array
      return [];
    }
  })() as StrategySection[];

  const updateStrategyMutation = useMutation({
    mutationFn: async (newStrategies: StrategySection[]) => {
      const { error } = await supabase
        .from("agent_boards")
        .update({ goal: JSON.stringify(newStrategies) })
        .eq("id", boardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-board", boardId] });
      toast.success(editingSection ? "Strategy updated" : "Strategy added");
      handleCloseDialog();
    },
  });

  const handleSave = () => {
    const newSection: StrategySection = {
      id: editingSection?.id || crypto.randomUUID(),
      title: formData.title,
      content: formData.content,
      category: formData.category,
    };

    const updatedStrategies = editingSection
      ? strategies.map(s => s.id === editingSection.id ? newSection : s)
      : [...strategies, newSection];

    updateStrategyMutation.mutate(updatedStrategies);
  };

  const handleDelete = (id: string) => {
    const updatedStrategies = strategies.filter(s => s.id !== id);
    updateStrategyMutation.mutate(updatedStrategies);
    toast.success("Strategy section deleted");
  };

  const handleEdit = (section: StrategySection) => {
    setEditingSection(section);
    setFormData({
      title: section.title,
      content: section.content,
      category: section.category,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSection(null);
    setFormData({ title: "", content: "", category: "tips" });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "tips": return <Lightbulb className="w-4 h-4" />;
      case "audience": return <Target className="w-4 h-4" />;
      case "budget": return <DollarSign className="w-4 h-4" />;
      case "prompts": return <Edit className="w-4 h-4" />;
      case "platform": return <TrendingUp className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "tips": return "Media Buying Tips & Tricks";
      case "audience": return "Target Audience";
      case "budget": return "Budget Strategy";
      case "prompts": return "Key Prompts";
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Strategy & Guidelines</h3>
          <p className="text-muted-foreground">Define your overall strategy and media buying approach</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Section
        </Button>
      </div>

      {strategies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lightbulb className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No strategy defined yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add media buying tips, target audience notes, budget strategies, and more
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Section
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {Object.entries(groupedStrategies).map(([category, sections]) => (
            <AccordionItem key={category} value={category} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(category)}
                  <span className="font-semibold">{getCategoryLabel(category)}</span>
                  <span className="text-xs text-muted-foreground">({sections.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {sections.map((section) => (
                    <Card key={section.id}>
                      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-base">{section.title}</CardTitle>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEdit(section)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDelete(section.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {section.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSection ? "Edit Strategy Section" : "Add Strategy Section"}</DialogTitle>
            <DialogDescription>
              Define your media buying strategy, tips, and guidelines
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as StrategySection["category"] })}
              >
                <option value="tips">Media Buying Tips & Tricks</option>
                <option value="audience">Target Audience</option>
                <option value="budget">Budget Strategy</option>
                <option value="prompts">Key Prompts</option>
                <option value="platform">Platform Guidelines</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Facebook Ad Best Practices"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter your strategy notes, tips, or guidelines..."
                rows={8}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formData.title || !formData.content}>
              {editingSection ? "Update" : "Add"} Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
