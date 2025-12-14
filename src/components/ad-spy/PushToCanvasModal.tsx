import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface PushToCanvasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAdIds: string[];
  onSuccess?: () => void;
}

export function PushToCanvasModal({ open, onOpenChange, selectedAdIds, onSuccess }: PushToCanvasModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['agent-boards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_boards')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: open
  });

  const { data: ads = [] } = useQuery({
    queryKey: ['selected-ads', selectedAdIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_spy_ads')
        .select('*')
        .in('id', selectedAdIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: open && selectedAdIds.length > 0
  });

  const pushToCanvasMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProjectId) throw new Error("No project selected");

      const canvasBlocks = ads.map((ad, index) => ({
        agent_board_id: selectedProjectId,
        type: 'image',
        title: ad.title,
        url: ad.media_url || ad.thumbnail_url,
        content: ad.hook,
        position_x: (index % 3) * 350 + 100,
        position_y: Math.floor(index / 3) * 400 + 100,
        width: 300,
        height: 350,
        metadata: {
          source: 'ad_spy',
          ad_id: ad.id,
          competitor_id: ad.competitor_id,
          channel: ad.channel
        }
      }));

      const { error } = await supabase
        .from('canvas_blocks')
        .insert(canvasBlocks);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canvas-blocks'] });
      toast({
        title: "Successfully pushed to canvas!",
        description: `${selectedAdIds.length} ads added to your canvas project.`
      });
      onSuccess?.();
      onOpenChange(false);
      setSelectedProjectId("");
    },
    onError: (error) => {
      toast({
        title: "Failed to push to canvas",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handlePush = () => {
    if (!selectedProjectId) {
      toast({
        title: "Please select a project",
        variant: "destructive"
      });
      return;
    }
    pushToCanvasMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Push to Canvas Project</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Select a canvas project to add {selectedAdIds.length} ad{selectedAdIds.length !== 1 ? 's' : ''} as image blocks.
          </p>

          {isLoadingProjects ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No canvas projects found. Create a project first.
              </p>
            </div>
          ) : (
            <RadioGroup value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent">
                    <RadioGroupItem value={project.id} id={project.id} />
                    <Label
                      htmlFor={project.id}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium">{project.name}</div>
                      {project.description && (
                        <div className="text-xs text-muted-foreground">{project.description}</div>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handlePush}
            disabled={!selectedProjectId || pushToCanvasMutation.isPending || projects.length === 0}
          >
            {pushToCanvasMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Pushing...
              </>
            ) : (
              'Push to Canvas'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



