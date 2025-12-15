import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateBoardDialog } from "@/components/CreateBoardDialog";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { SortableProjectItem } from "@/components/SortableProjectItem";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

const PROTECTED_GROUPS = ["top5", "active"];

export default function Projects() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createGroupDialogOpen, setCreateGroupDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [groupToDelete, setGroupToDelete] = useState<{ slug: string; name: string; count: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: groups } = useQuery({
    queryKey: ["project-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_groups")
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: boards } = useQuery({
    queryKey: ["agent-boards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_boards")
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: boardStats } = useQuery({
    queryKey: ["board-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creative_cards")
        .select("agent_board_id, status");
      if (error) throw error;
      
      const stats: Record<string, { drafts: number; ready: number }> = {};
      data?.forEach((card) => {
        if (!stats[card.agent_board_id]) {
          stats[card.agent_board_id] = { drafts: 0, ready: 0 };
        }
        if (card.status === "AI_DRAFT") stats[card.agent_board_id].drafts++;
        if (card.status === "READY_TO_LAUNCH") stats[card.agent_board_id].ready++;
      });
      return stats;
    },
  });

  const deleteBoardMutation = useMutation({
    mutationFn: async (boardId: string) => {
      const { error } = await supabase
        .from("agent_boards")
        .delete()
        .eq("id", boardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-boards"] });
      toast({
        title: "Project Deleted",
        description: "The project has been deleted successfully.",
      });
    },
  });

  const moveToGroupMutation = useMutation({
    mutationFn: async ({
      boardId,
      groupSlug,
    }: {
      boardId: string;
      groupSlug: string | null;
    }) => {
      const { error } = await supabase
        .from("agent_boards")
        .update({ group_name: groupSlug })
        .eq("id", boardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-boards"] });
      toast({
        title: "Project Moved",
        description: "The project has been moved successfully.",
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; position: number }[]) => {
      const promises = updates.map(({ id, position }) =>
        supabase
          .from("agent_boards")
          .update({ position })
          .eq("id", id)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-boards"] });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupSlug: string) => {
      // First, move all projects in this group back to "All"
      await supabase
        .from("agent_boards")
        .update({ group_name: null })
        .eq("group_name", groupSlug);
      
      // Then delete the group
      const { error } = await supabase
        .from("project_groups")
        .delete()
        .eq("slug", groupSlug);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-groups"] });
      queryClient.invalidateQueries({ queryKey: ["agent-boards"] });
      setSelectedGroup("all");
      toast({
        title: "Group Deleted",
        description: "All projects have been moved to 'All'.",
      });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const filteredBoards = getFilteredBoards();
    const oldIndex = filteredBoards.findIndex((b) => b.id === active.id);
    const newIndex = filteredBoards.findIndex((b) => b.id === over.id);

    const reordered = arrayMove(filteredBoards, oldIndex, newIndex);
    
    // Update positions
    const updates = reordered.map((board, index) => ({
      id: board.id,
      position: index,
    }));

    reorderMutation.mutate(updates);
  };

  const getFilteredBoards = () => {
    if (!boards) return [];
    
    if (selectedGroup === "all") {
      return boards;
    }
    
    return boards.filter((board) => board.group_name === selectedGroup);
  };

  const filteredBoards = getFilteredBoards();

  const getGroupCount = (groupSlug: string) => {
    if (!boards) return 0;
    if (groupSlug === "all") return boards.length;
    return boards.filter((b) => b.group_name === groupSlug).length;
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agent Projects</h1>
          <p className="text-muted-foreground mt-1">
            Campaign workspaces for your advertising goals
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      <Tabs value={selectedGroup} onValueChange={setSelectedGroup}>
        <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 gap-6">
          <TabsTrigger 
            value="all"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3"
          >
            All
            <Badge variant="outline" className="ml-2 text-xs bg-primary/10 text-primary border-primary/30">
              {getGroupCount("all")}
            </Badge>
          </TabsTrigger>
          {groups?.map((group) => (
            <TabsTrigger 
              key={group.id} 
              value={group.slug}
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 group"
            >
              {group.name}
              <Badge variant="outline" className="ml-2 text-xs bg-primary/10 text-primary border-primary/30">
                {getGroupCount(group.slug)}
              </Badge>
              {!PROTECTED_GROUPS.includes(group.slug) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setGroupToDelete({
                      slug: group.slug,
                      name: group.name,
                      count: getGroupCount(group.slug),
                    });
                  }}
                  className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-destructive/20 rounded"
                >
                  <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </button>
              )}
            </TabsTrigger>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCreateGroupDialogOpen(true)}
            className="ml-2 h-9"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Group
          </Button>
        </TabsList>

        <TabsContent value={selectedGroup} className="mt-6">
          <div className="border rounded-lg divide-y bg-card">
            {filteredBoards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Target className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {selectedGroup === "all"
                    ? "No projects yet"
                    : `No projects in ${groups?.find((g) => g.slug === selectedGroup)?.name || "this group"}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedGroup === "all"
                    ? "Create your first project to get started"
                    : "Drag projects here or use the menu to add them"}
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredBoards.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredBoards.map((board) => {
                    const stats = boardStats?.[board.id] || { drafts: 0, ready: 0 };
                    return (
                      <SortableProjectItem
                        key={board.id}
                        board={board}
                        stats={stats}
                        groups={groups || []}
                        onDelete={(id) => deleteBoardMutation.mutate(id)}
                        onMoveToGroup={(boardId, groupSlug) =>
                          moveToGroupMutation.mutate({ boardId, groupSlug })
                        }
                      />
                    );
                  })}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <CreateBoardDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <CreateGroupDialog open={createGroupDialogOpen} onOpenChange={setCreateGroupDialogOpen} />

      <AlertDialog open={!!groupToDelete} onOpenChange={() => setGroupToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{groupToDelete?.name}"? All {groupToDelete?.count || 0} project{groupToDelete?.count !== 1 ? 's' : ''} in this group will be moved to "All".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (groupToDelete) {
                  deleteGroupMutation.mutate(groupToDelete.slug);
                  setGroupToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
