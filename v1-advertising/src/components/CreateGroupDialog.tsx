import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BRAND_GROUP_COLORS = [
  "160 58% 18%",    // Primary
  "112 63% 24.5%",  // Secondary
  "160 56% 23.3%",  // Accent
  "185 12% 60%",    // Chart-4
  "223 35% 88%",    // Chart-5
];

export const CreateGroupDialog = ({ open, onOpenChange }: CreateGroupDialogProps) => {
  const [groupName, setGroupName] = useState("");
  const queryClient = useQueryClient();

  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      // Get the highest position and count for color assignment
      const { data: groups } = await supabase
        .from("project_groups")
        .select("position")
        .order("position", { ascending: false })
        .limit(1);

      const nextPosition = groups && groups.length > 0 ? groups[0].position + 1 : 0;
      
      // Auto-assign color from brand palette
      const colorIndex = (groups?.length || 0) % BRAND_GROUP_COLORS.length;
      const autoColor = BRAND_GROUP_COLORS[colorIndex];

      const { error } = await supabase
        .from("project_groups")
        .insert({
          name: data.name,
          slug: data.slug,
          color: autoColor,
          position: nextPosition,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-groups"] });
      toast.success("Group created successfully");
      setGroupName("");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to create group");
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    const slug = groupName.toLowerCase().replace(/\s+/g, "_");
    createGroupMutation.mutate({ name: groupName, slug });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>
            Create a custom group to organize your projects.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                placeholder="e.g., Q1 2024, High Priority"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createGroupMutation.isPending}>
              {createGroupMutation.isPending ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
