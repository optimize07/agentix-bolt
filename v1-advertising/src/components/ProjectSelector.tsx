import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProject } from "@/contexts/ProjectContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export function ProjectSelector() {
  const { selectedProjectId, setSelectedProjectId, setIsTransitioning } = useProject();
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
    
    // Check if we're on a project route and navigate accordingly
    const projectRouteMatch = location.pathname.match(/^\/projects\/([^\/]+)\/(.+)$/);
    if (projectRouteMatch) {
      setIsTransitioning(true);
      const currentTab = projectRouteMatch[2]; // e.g., "canvas", "chat", "kanban"
      
      // Short delay for smooth transition
      setTimeout(() => {
        navigate(`/projects/${newProjectId}/${currentTab}`);
        setTimeout(() => setIsTransitioning(false), 500);
      }, 300);
    }
  };

  // Auto-select first project if none selected
  useEffect(() => {
    if (!selectedProjectId && boards && boards.length > 0) {
      setSelectedProjectId(boards[0].id);
    }
  }, [boards, selectedProjectId, setSelectedProjectId]);

  if (!boards || boards.length === 0) {
    return null;
  }

  return (
    <Select value={selectedProjectId || undefined} onValueChange={handleProjectChange}>
      <SelectTrigger className="w-[250px]">
        <SelectValue placeholder="Select a project" />
      </SelectTrigger>
      <SelectContent>
        {boards.map((board) => (
          <SelectItem key={board.id} value={board.id}>
            {board.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
