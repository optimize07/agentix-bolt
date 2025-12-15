import { createContext, useContext, useState, ReactNode } from "react";

interface ProjectContextType {
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  isTransitioning: boolean;
  setIsTransitioning: (value: boolean) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  return (
    <ProjectContext.Provider value={{ selectedProjectId, setSelectedProjectId, isTransitioning, setIsTransitioning }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
