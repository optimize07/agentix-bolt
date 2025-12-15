import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProject } from "@/contexts/ProjectContext";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Brain, FolderOpen, Search, TrendingUp, Gauge, MessageCircle, Palette, ShieldCheck, Globe, Database, Bot, Settings2 } from "lucide-react";
import { toast } from "sonner";

interface ToolsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Tool {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  type: string;
  config: any;
  enabled: boolean;
}

export function ToolsDrawer({ open, onOpenChange }: ToolsDrawerProps) {
  const { boardId } = useParams();
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();

  const { data: tools = [] } = useQuery({
    queryKey: ["project-tools"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tools")
        .select("*")
        .is("project_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Tool[];
    },
  });

  const toggleToolMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("project_tools")
        .update({ enabled })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tools", selectedProjectId] });
      toast.success("Tool updated");
    },
    onError: () => {
      toast.error("Failed to update tool");
    },
  });

  const getToolIcon = (type: string, config?: any) => {
    if (type === "internal" && config?.internalType) {
      switch (config.internalType) {
        case "knowledge_base": return Brain;
        case "assets": return FolderOpen;
        case "ad_spy": return Search;
        case "market_research": return TrendingUp;
        case "ad_optimizer": return Gauge;
        case "sentiment": return MessageCircle;
        case "branding": return Palette;
        case "compliance": return ShieldCheck;
        default: return Settings2;
      }
    }
    switch (type) {
      case "api": return Globe;
      case "data_source": return Database;
      case "ai_model": return Bot;
      default: return Settings2;
    }
  };

  const enabledCount = tools.filter(t => t.enabled).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Tools
            <Badge variant="secondary" className="text-xs">
              {enabledCount} active
            </Badge>
          </SheetTitle>
          <SheetDescription>
            Enable or disable tools available to the AI agent
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="space-y-2 pr-4">
            {tools.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">
                  No tools configured yet
                </p>
              </div>
            ) : (
              tools.map((tool) => {
                const Icon = getToolIcon(tool.type, tool.config);
                return (
                  <div
                    key={tool.id}
                    className="flex items-start gap-3 p-4 border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="mt-1">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{tool.name}</h4>
                          {tool.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {tool.description}
                            </p>
                          )}
                        </div>
                        <Switch
                          checked={tool.enabled}
                          onCheckedChange={(checked) =>
                            toggleToolMutation.mutate({ id: tool.id, enabled: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
