export type DepartmentAgentRow = {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  status: "online" | "busy" | "offline";
  ongoingProjects: string[];
  lastActive: string;
};

export type DepartmentKpi = {
  label: string;
  value: string;
  trend?: {
    direction: "up" | "down";
    value: string;
  };
};

// Specialized rows for the Sales department
export type SalesAgentRow = {
  id: string;
  name: string;
  avatarUrl?: string;
  status: "online" | "busy" | "offline";
  salesVolume: string; // e.g., "$75k"
  salesPercent: number; // 0-100 for progress display
  closeRate: string; // e.g., "35%"
  activeLeads: number;
};

export type OptimizationProject = {
  name: string;
  status: "in-progress" | "completed";
  progress: number; // 0-100
  avatarUrl?: string;
};


