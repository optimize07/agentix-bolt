import { useState, useEffect } from "react";
import { Outlet, useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MessageSquare, PenTool, Columns3, Settings, Maximize2, Minimize2, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProject } from "@/contexts/ProjectContext";
import { ProjectTitleSelector } from "@/components/ProjectTitleSelector";

export default function BoardLayout() {
  const { boardId, clientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isTransitioning } = useProject();

  const { data: board } = useQuery({
    queryKey: ["agent-board", boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_boards")
        .select("*")
        .eq("id", boardId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const currentTab = location.pathname.split("/").pop();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const handleTabChange = (value: string) => {
    if (clientId) {
      const isMarketing = location.pathname.includes("/marketing/");
      const isAdvertising = location.pathname.includes("/advertising/");
      if (isMarketing) {
        navigate(`/client/${clientId}/marketing/projects/${boardId}/${value}`);
        return;
      }
      if (isAdvertising) {
        navigate(`/client/${clientId}/advertising/projects/${boardId}/${value}`);
        return;
      }
      navigate(`/client/${clientId}/projects/${boardId}/${value}`);
    } else {
      navigate(`/projects/${boardId}/${value}`);
    }
  };

  const layoutContent = (
    <div className={cn("flex flex-col h-full", isFullscreen && "fixed inset-0 z-50 bg-background")}>
      {/* Board Header */}
      <div className="border-b border-border bg-card">
        <div className="p-4 flex justify-between items-start">
          {board && (
            <ProjectTitleSelector
              currentBoardId={board.id}
              currentBoardName={board.name}
              currentBoardDescription={board.description}
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit fullscreen (ESC)" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>

        <Tabs value={currentTab} onValueChange={handleTabChange} className="px-4">
          <TabsList className="bg-muted/30">
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="canvas" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Canvas
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-2">
              <Columns3 className="w-4 h-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 ml-auto">
              <Settings className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto relative">
        <Outlet />
        
        {isTransitioning && (
          <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center animate-fade-in">
            <div className="flex flex-col items-center gap-4 animate-scale-in">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-1">Agentix</h2>
                <p className="text-sm text-muted-foreground">Loading project...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return layoutContent;
}

