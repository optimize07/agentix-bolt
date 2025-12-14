import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const BRAND_GROUP_COLORS = [
  "160 58% 18%",    // Primary
  "112 63% 24.5%",  // Secondary
  "160 56% 23.3%",  // Accent
  "185 12% 60%",    // Chart-4
  "223 35% 88%",    // Chart-5
];

interface ContentGroup {
  id: string;
  name: string;
  color: string | null;
  content_type: string;
  project_id: string;
  position: number | null;
}

interface ContentGroupManagerProps {
  projectId: string | null;
  contentType: string;
  groups: ContentGroup[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  onDropAsset?: (assetId: string, targetGroupId: string | null) => void;
}

export function ContentGroupManager({
  projectId,
  contentType,
  groups,
  selectedGroupId,
  onSelectGroup,
  onDropAsset,
}: ContentGroupManagerProps) {
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, groupId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverGroup(groupId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverGroup(null);
  };

  const handleDrop = (e: React.DragEvent, groupId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverGroup(null);

    const assetId = e.dataTransfer.getData("application/asset-id");
    if (assetId && onDropAsset) {
      onDropAsset(assetId, groupId === "ungrouped" ? null : groupId);
    }
  };
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ContentGroup | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      // Auto-assign color from brand palette based on existing groups count
      const colorIndex = groups.length % BRAND_GROUP_COLORS.length;
      const autoColor = BRAND_GROUP_COLORS[colorIndex];
      
      const { error } = await supabase.from("content_groups").insert({
        name: data.name,
        color: autoColor,
        content_type: contentType,
        project_id: projectId || null, // Support global groups when projectId is null
        position: groups.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-groups"] });
      toast.success("Group created successfully");
      setIsCreateDialogOpen(false);
      setFormData({ name: "" });
    },
    onError: (error) => {
      toast.error("Failed to create group");
      console.error(error);
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async (data: { id: string; name: string }) => {
      const { error } = await supabase
        .from("content_groups")
        .update({ name: data.name })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-groups"] });
      toast.success("Group updated successfully");
      setIsEditDialogOpen(false);
      setEditingGroup(null);
    },
    onError: (error) => {
      toast.error("Failed to update group");
      console.error(error);
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      // First, set all items in this group to ungrouped based on content type
      if (contentType === "knowledge") {
        await supabase.from("knowledge_entries").update({ group_id: null }).eq("group_id", groupId);
      } else if (contentType === "swipe") {
        await supabase.from("swipe_files").update({ group_id: null }).eq("group_id", groupId);
      } else if (contentType === "asset") {
        await supabase.from("assets").update({ group_id: null }).eq("group_id", groupId);
      } else if (contentType === "research") {
        await supabase.from("market_research").update({ group_id: null }).eq("group_id", groupId);
      } else if (contentType === "strategy") {
        await supabase.from("project_strategies").update({ group_id: null }).eq("group_id", groupId);
      } else if (contentType === "tool") {
        await supabase.from("project_tools").update({ group_id: null }).eq("group_id", groupId);
      } else if (contentType === "prompt") {
        await supabase.from("prompt_templates").update({ group_id: null }).eq("group_id", groupId);
      } else if (contentType === "role") {
        await supabase.from("ai_roles").update({ group_id: null }).eq("group_id", groupId);
      } else if (contentType === "offer") {
        await supabase.from("offers").update({ group_id: null }).eq("group_id", groupId);
      }

      // Then delete the group
      const { error } = await supabase.from("content_groups").delete().eq("id", groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-groups"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-entries"] });
      queryClient.invalidateQueries({ queryKey: ["swipe-files"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["market-research"] });
      queryClient.invalidateQueries({ queryKey: ["project-strategies"] });
      queryClient.invalidateQueries({ queryKey: ["project-tools"] });
      queryClient.invalidateQueries({ queryKey: ["prompt-templates"] });
      queryClient.invalidateQueries({ queryKey: ["ai-roles"] });
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      toast.success("Group deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeletingGroupId(null);
      if (selectedGroupId === deletingGroupId) {
        onSelectGroup(null);
      }
    },
    onError: (error) => {
      toast.error("Failed to delete group");
      console.error(error);
    },
  });

  const handleCreateGroup = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a group name");
      return;
    }
    createGroupMutation.mutate({ name: formData.name });
  };

  const handleEditGroup = () => {
    if (!editingGroup || !formData.name.trim()) {
      toast.error("Please enter a group name");
      return;
    }
    updateGroupMutation.mutate({
      id: editingGroup.id,
      name: formData.name,
    });
  };

  const openEditDialog = (group: ContentGroup) => {
    setEditingGroup(group);
    setFormData({ name: group.name });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (groupId: string) => {
    setDeletingGroupId(groupId);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6 border-b border-border pb-0 overflow-x-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCreateDialogOpen(true)}
          className="gap-2 shrink-0 mb-3"
        >
          <Plus className="h-4 w-4" />
          Create Group
        </Button>

        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectGroup(null)}
          onKeyDown={(e) => e.key === 'Enter' && onSelectGroup(null)}
          onDragOver={(e) => handleDragOver(e, null)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
          className={cn(
            "pb-3 px-4 text-sm font-medium transition-colors shrink-0 rounded-t-md cursor-pointer",
            selectedGroupId === null
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground",
            dragOverGroup === null && "bg-primary/10"
          )}
        >
          All
        </div>

        {groups
          .sort((a, b) => (a.position || 0) - (b.position || 0))
          .map((group) => (
            <div
              key={group.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectGroup(group.id)}
              onKeyDown={(e) => e.key === 'Enter' && onSelectGroup(group.id)}
              onDragOver={(e) => handleDragOver(e, group.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, group.id)}
              className={cn(
                "flex items-center gap-2 pb-3 px-4 text-sm font-medium transition-colors group relative shrink-0 rounded-t-md cursor-pointer",
                selectedGroupId === group.id
                  ? "text-foreground border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground",
                dragOverGroup === group.id && "bg-primary/10"
              )}
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: `hsl(${group.color || "221 83% 53%"})` }}
              />
              {group.name}
              
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  openEditDialog(group); 
                }}
                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded"
              >
                <Edit2 className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          ))}

        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectGroup("ungrouped")}
          onKeyDown={(e) => e.key === 'Enter' && onSelectGroup("ungrouped")}
          onDragOver={(e) => handleDragOver(e, "ungrouped")}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, "ungrouped")}
          className={cn(
            "pb-3 px-4 text-sm font-medium transition-colors shrink-0 rounded-t-md cursor-pointer",
            selectedGroupId === "ungrouped"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground",
            dragOverGroup === "ungrouped" && "bg-primary/10"
          )}
        >
          Ungrouped
        </div>
      </div>

      {/* Create Group Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
            <DialogDescription>
              Create a new group to organize your content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                placeholder="e.g., Product Info, Research"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={createGroupMutation.isPending}>
              {createGroupMutation.isPending ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>Update the group name</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-group-name">Group Name</Label>
              <Input
                id="edit-group-name"
                placeholder="e.g., Product Info, Research"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                if (editingGroup) {
                  setIsEditDialogOpen(false);
                  openDeleteDialog(editingGroup.id);
                }
              }}
              className="sm:mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Group
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditGroup} disabled={updateGroupMutation.isPending}>
                {updateGroupMutation.isPending ? "Updating..." : "Update Group"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this group? Items in this group will become
              ungrouped but will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingGroupId && deleteGroupMutation.mutate(deletingGroupId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteGroupMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

