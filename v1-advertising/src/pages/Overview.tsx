import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Eye, MousePointerClick, TrendingUp, RotateCcw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProject } from "@/contexts/ProjectContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function Overview() {
  const { selectedProjectId } = useProject();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: boards } = useQuery({
    queryKey: ["agent-boards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_boards")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: creativeCards } = useQuery({
    queryKey: ["creative-cards-overview", selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const { data, error } = await supabase
        .from("creative_cards")
        .select("*")
        .eq("agent_board_id", selectedProjectId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProjectId,
  });

  const restoreMutation = useMutation({
    mutationFn: async (boardId: string) => {
      const { error } = await supabase
        .from("agent_boards")
        .update({ group_name: null })
        .eq("id", boardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-boards"] });
      toast({
        title: "Project Restored",
        description: "The project has been moved to 'All'.",
      });
    },
  });

  const activeBoards = boards?.filter(b => b.group_name !== 'archive') || [];
  const archivedBoards = boards?.filter(b => b.group_name === 'archive') || [];

  const stats = [
    { title: "Total Spend", value: "$12,450", icon: DollarSign, change: "+12.5%" },
    { title: "Impressions", value: "1.2M", icon: Eye, change: "+18.2%" },
    { title: "Click Rate", value: "2.4%", icon: MousePointerClick, change: "+5.1%" },
    { title: "ROAS", value: "4.2x", icon: TrendingUp, change: "+8.3%" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Overview</h1>
        <p className="text-muted-foreground">Your advertising performance at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-primary">{stat.change} from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Active Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {activeBoards.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No active projects</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeBoards.map((board) => (
                <Card
                  key={board.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => navigate("/projects")}
                >
                  <CardHeader>
                    <CardTitle className="text-base">{board.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {board.description || "No description"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Goal: {board.goal || "Not set"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archived Projects */}
      {archivedBoards.length > 0 && (
        <Collapsible>
          <Card>
            <CardHeader>
              <CollapsibleTrigger className="flex items-center justify-between w-full group">
                <CardTitle className="flex items-center gap-2">
                  Archived Projects
                  <span className="text-sm font-normal text-muted-foreground">
                    ({archivedBoards.length})
                  </span>
                </CardTitle>
                <span className="text-xs text-muted-foreground group-data-[state=open]:hidden">
                  Click to expand
                </span>
                <span className="text-xs text-muted-foreground hidden group-data-[state=open]:inline">
                  Click to collapse
                </span>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-3">
                  {archivedBoards.map((board) => (
                    <div
                      key={board.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/30 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{board.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {board.description || "No description"}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreMutation.mutate(board.id)}
                        disabled={restoreMutation.isPending}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restore
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Top Performing Ads */}
      {selectedProjectId && creativeCards && creativeCards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Ads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {creativeCards.map((card) => (
                <div key={card.id} className="flex items-center gap-4 p-3 border border-border rounded-lg">
                  {card.image_url && (
                    <img
                      src={card.image_url}
                      alt={card.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{card.title}</p>
                    <p className="text-sm text-muted-foreground">{card.headline}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">Status: {card.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
