import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SaveToBoardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adId: string;
}

export function SaveToBoardModal({ open, onOpenChange, adId }: SaveToBoardModalProps) {
  const [selectedBoards, setSelectedBoards] = useState<string[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const queryClient = useQueryClient();

  const { data: boards = [] } = useQuery({
    queryKey: ['ad-spy-boards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_spy_boards')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: existingBoardItems = [] } = useQuery({
    queryKey: ['ad-spy-board-items', adId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_spy_board_items')
        .select('board_id')
        .eq('ad_id', adId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: open
  });

  const createBoardMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('ad_spy_boards')
        .insert({ name: newBoardName })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newBoard) => {
      queryClient.invalidateQueries({ queryKey: ['ad-spy-boards'] });
      setSelectedBoards([...selectedBoards, newBoard.id]);
      setIsCreatingNew(false);
      setNewBoardName("");
      toast({ title: "Board created successfully" });
    }
  });

  const saveToBoardsMutation = useMutation({
    mutationFn: async () => {
      const existingBoardIds = existingBoardItems.map(item => item.board_id);
      const toAdd = selectedBoards.filter(id => !existingBoardIds.includes(id));
      const toRemove = existingBoardIds.filter(id => !selectedBoards.includes(id));

      const promises = [];
      
      if (toAdd.length > 0) {
        const items = toAdd.map(boardId => ({ board_id: boardId, ad_id: adId }));
        promises.push(supabase.from('ad_spy_board_items').insert(items));
      }
      
      if (toRemove.length > 0) {
        promises.push(
          supabase
            .from('ad_spy_board_items')
            .delete()
            .eq('ad_id', adId)
            .in('board_id', toRemove)
        );
      }

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-spy-board-items'] });
      toast({ title: "Saved to boards successfully" });
      onOpenChange(false);
      setSelectedBoards([]);
    }
  });

  const handleToggleBoard = (boardId: string) => {
    setSelectedBoards(prev => 
      prev.includes(boardId) 
        ? prev.filter(id => id !== boardId)
        : [...prev, boardId]
    );
  };

  const handleSave = () => {
    saveToBoardsMutation.mutate();
  };

  const handleCreateBoard = () => {
    if (newBoardName.trim()) {
      createBoardMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to Boards</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {boards.length === 0 && !isCreatingNew ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No boards yet. Create one to get started.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {boards.map(board => (
                <div key={board.id} className="flex items-center space-x-2 p-2 rounded hover:bg-accent">
                  <Checkbox
                    id={board.id}
                    checked={selectedBoards.includes(board.id)}
                    onCheckedChange={() => handleToggleBoard(board.id)}
                  />
                  <label
                    htmlFor={board.id}
                    className="flex-1 text-sm cursor-pointer"
                  >
                    {board.name}
                  </label>
                </div>
              ))}
            </div>
          )}

          {isCreatingNew ? (
            <div className="space-y-3 p-3 border rounded-lg bg-accent/50">
              <div>
                <Label htmlFor="board-name">Board Name</Label>
                <Input
                  id="board-name"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="e.g., Best Creatives"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreatingNew(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateBoard}
                  disabled={!newBoardName.trim() || createBoardMutation.isPending}
                  className="flex-1"
                >
                  Create
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsCreatingNew(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Board
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={selectedBoards.length === 0 || saveToBoardsMutation.isPending}
          >
            Save to {selectedBoards.length} board{selectedBoards.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
