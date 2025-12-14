import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trash2, Upload, Plus } from "lucide-react";
import { AdSpyAdCard } from "../AdSpyAdCard";
import { PushToCanvasModal } from "../PushToCanvasModal";
import { CreateBoardDialog } from "../CreateBoardDialog";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export function BoardsTab() {
  const [selectedBoardId, setSelectedBoardId] = useState<string>("all");
  const [selectedAds, setSelectedAds] = useState<string[]>([]);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
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

  const { data: boardItems = [] } = useQuery({
    queryKey: ['ad-spy-board-items', selectedBoardId],
    queryFn: async () => {
      if (selectedBoardId === 'all') return [];
      
      const { data, error } = await supabase
        .from('ad_spy_board_items')
        .select(`
          *,
          ad:ad_spy_ads(
            *,
            competitor:ad_spy_competitors(*)
          )
        `)
        .eq('board_id', selectedBoardId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: selectedBoardId !== 'all'
  });

  const deleteBoardMutation = useMutation({
    mutationFn: async (boardId: string) => {
      const { error } = await supabase
        .from('ad_spy_boards')
        .delete()
        .eq('id', boardId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-spy-boards'] });
      toast({ title: "Board deleted successfully" });
      setSelectedBoardId('all');
    }
  });

  const handleToggleAd = (adId: string) => {
    setSelectedAds(prev =>
      prev.includes(adId) ? prev.filter(id => id !== adId) : [...prev, adId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAds.length === boardItems.length) {
      setSelectedAds([]);
    } else {
      setSelectedAds(boardItems.map(item => item.ad_id));
    }
  };

  return (
    <>
      <Tabs value={selectedBoardId} onValueChange={setSelectedBoardId}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">All Boards</TabsTrigger>
            {boards.map((board) => (
              <TabsTrigger key={board.id} value={board.id}>
                {board.name}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button size="sm" onClick={() => setIsCreateBoardOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-2" />
            Create Board
          </Button>
        </div>

        <TabsContent value="all" className="mt-0">
          {boards.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
              <p className="text-muted-foreground">No boards created yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create a board to organize your ad collections.
              </p>
              <Button className="mt-4" onClick={() => setIsCreateBoardOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Board
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground mb-4">
                {boards.length} {boards.length === 1 ? 'board' : 'boards'} • Select a board to view ads
              </div>
              <div className="grid gap-2">
                {boards.map((board) => (
                  <div
                    key={board.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedBoardId(board.id)}
                  >
                    <div>
                      <h3 className="font-medium">{board.name}</h3>
                      {board.description && (
                        <p className="text-sm text-muted-foreground mt-1">{board.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBoardId(board.id);
                      }}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {boards.map((board) => (
          <TabsContent key={board.id} value={board.id} className="mt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{board.name}</h2>
                  <Badge variant="secondary">{boardItems.length} ads</Badge>
                </div>
                <div className="flex gap-2">
                  {selectedAds.length > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                      >
                        {selectedAds.length === boardItems.length ? 'Deselect All' : 'Select All'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setIsPushModalOpen(true)}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Push to Canvas ({selectedAds.length})
                      </Button>
                    </>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteBoardMutation.mutate(board.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Board
                  </Button>
                </div>
              </div>

              {boardItems.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-lg">
                  <p className="text-muted-foreground">No ads saved to this board yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Go to the Ads tab and save ads to this board.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {boardItems.map((item: any) => (
                    <div key={item.id} className="relative">
                      <div className="absolute top-2 left-2 z-10">
                        <Checkbox
                          checked={selectedAds.includes(item.ad_id)}
                          onCheckedChange={() => handleToggleAd(item.ad_id)}
                          className="bg-background"
                        />
                      </div>
                      <AdSpyAdCard ad={item.ad} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <PushToCanvasModal
        open={isPushModalOpen}
        onOpenChange={setIsPushModalOpen}
        selectedAdIds={selectedAds}
        onSuccess={() => {
          setSelectedAds([]);
          setIsPushModalOpen(false);
        }}
      />

      <CreateBoardDialog 
        open={isCreateBoardOpen}
        onOpenChange={setIsCreateBoardOpen}
      />
    </>
  );
}



