import { useProject } from "@/contexts/ProjectContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type KanbanColumn = {
  id: string;
  title: string;
  status: string;
};

const columns: KanbanColumn[] = [
  { id: "draft", title: "AI Generated Drafts", status: "AI_DRAFT" },
  { id: "reviewed", title: "Reviewed & Approved", status: "REVIEWED" },
  { id: "ready", title: "Ready to Launch", status: "READY_TO_LAUNCH" },
  { id: "launched", title: "Launched", status: "LAUNCHED" },
];

export default function CampaignManager() {
  const { selectedProjectId } = useProject();

  const { data: cards } = useQuery({
    queryKey: ["creative-cards", selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const { data, error } = await supabase
        .from("creative_cards")
        .select("*")
        .eq("agent_board_id", selectedProjectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const getCardsForColumn = (status: string) => {
    return cards?.filter((card) => card.status === status) || [];
  };

  if (!selectedProjectId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Please select a project to view campaigns.</p>
      </div>
    );
  }

  return (
    <div className="h-full p-6 bg-muted/10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Campaign Manager</h1>
        <p className="text-muted-foreground">Manage your ad creative pipeline</p>
      </div>

      <div className="grid grid-cols-4 gap-4 h-[calc(100vh-200px)]">
        {columns.map((column) => {
          const columnCards = getCardsForColumn(column.status);

          return (
            <Card key={column.id} className="flex flex-col bg-card/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  {column.title}
                  <Badge variant="secondary" className="ml-2">
                    {columnCards.length}
                  </Badge>
                </CardTitle>
              </CardHeader>

              <ScrollArea className="flex-1 px-4 pb-4">
                <div className="space-y-3">
                  {columnCards.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      No cards yet
                    </p>
                  ) : (
                    columnCards.map((card) => (
                      <Card
                        key={card.id}
                        className="p-3 cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        {card.image_url && (
                          <img
                            src={card.image_url}
                            alt={card.title}
                            className="w-full h-32 object-cover rounded-md mb-2"
                          />
                        )}
                        <p className="text-sm font-medium text-foreground line-clamp-2">
                          {card.title}
                        </p>
                        {card.headline && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {card.headline}
                          </p>
                        )}
                        {card.tags && card.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {card.tags.map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
