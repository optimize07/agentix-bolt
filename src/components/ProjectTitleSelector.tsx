import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { useProject } from "@/contexts/ProjectContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectTitleSelectorProps {
  currentBoardId: string;
  currentBoardName: string;
  currentBoardDescription?: string | null;
}

export function ProjectTitleSelector({ 
  currentBoardId, 
  currentBoardName, 
  currentBoardDescription 
}: ProjectTitleSelectorProps) {
  const [open, setOpen] = useState(false);
  const { setSelectedProjectId, setIsTransitioning } = useProject();
  const navigate = useNavigate();
  const location = useLocation();

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

  const handleProjectChange = (newProjectId: string) => {
    setSelectedProjectId(newProjectId);
    setOpen(false);
    
    const projectRouteMatch = location.pathname.match(/^\/projects\/([^\/]+)\/(.+)$/);
    if (projectRouteMatch) {
      setIsTransitioning(true);
      const currentTab = projectRouteMatch[2];
      
      setTimeout(() => {
        navigate(`/projects/${newProjectId}/${currentTab}`);
        setTimeout(() => setIsTransitioning(false), 500);
      }, 300);
    }
  };

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="group flex items-center gap-2 text-left transition-colors hover:text-foreground/80 cursor-pointer border-none bg-transparent p-0">
            <h2 className="text-2xl font-bold text-foreground">{currentBoardName}</h2>
            <ChevronDown className="w-5 h-5 text-muted-foreground transition-all group-hover:text-foreground opacity-0 group-hover:opacity-100" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-2" align="start">
          <div className="space-y-1">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Switch Project
            </div>
            {boards?.map((board) => (
              <Button
                key={board.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2 h-auto py-2 px-2",
                  board.id === currentBoardId && "bg-accent"
                )}
                onClick={() => handleProjectChange(board.id)}
              >
                <Check 
                  className={cn(
                    "w-4 h-4 shrink-0",
                    board.id === currentBoardId ? "opacity-100" : "opacity-0"
                  )} 
                />
                <div className="flex-1 text-left">
                  <div className="font-medium">{board.name}</div>
                  {board.description && (
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {board.description}
                    </div>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      {currentBoardDescription && (
        <p className="text-sm text-muted-foreground mt-1">{currentBoardDescription}</p>
      )}
    </div>
  );
}

