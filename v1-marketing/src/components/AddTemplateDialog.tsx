import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AddTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTemplate?: {
    id: string;
    name: string;
    content: string;
    tags: string[] | null;
    group_id?: string | null;
  };
  groups?: Array<{ id: string; name: string; color: string | null }>;
}

export default function AddTemplateDialog({ open, onOpenChange, editTemplate, groups }: AddTemplateDialogProps) {
  const [name, setName] = useState(editTemplate?.name || "");
  const [content, setContent] = useState(editTemplate?.content || "");
  const [tags, setTags] = useState(editTemplate?.tags?.join(", ") || "");
  const [groupId, setGroupId] = useState<string | null>(editTemplate?.group_id || null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const templateData = {
        name,
        content,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        group_id: groupId,
      };

      if (editTemplate) {
        const { error } = await supabase
          .from("prompt_templates")
          .update(templateData)
          .eq("id", editTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("prompt_templates").insert([templateData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompt-templates"] });
      toast({
        title: editTemplate ? "Template Updated" : "Template Added",
        description: editTemplate
          ? "Template has been updated successfully."
          : "New template has been added to your library.",
      });
      resetForm();
      onOpenChange(false);
    },
  });

  const resetForm = () => {
    setName("");
    setContent("");
    setTags("");
    setGroupId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editTemplate ? "Edit Template" : "Add Prompt Template"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Name</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter template name..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-content">Content</Label>
            <Textarea
              id="template-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter prompt template content..."
              rows={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-tags">Tags (comma-separated)</Label>
            <Input
              id="template-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. creative, social, email"
            />
          </div>

          <div className="space-y-2">
            <Label>Group (Optional)</Label>
            <Select
              value={groupId || "none"}
              onValueChange={(value) => setGroupId(value === "none" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="No group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No group</SelectItem>
                {groups?.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={!name || !content || saveMutation.isPending}>
            {editTemplate ? "Update" : "Add"} Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
