import { Target, Megaphone, Users, Settings, DollarSign, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface DepartmentHealthCardProps {
  name: string;
  teamSize: number;
  activeTasks: number;
  agentHealth: number;
}

const departmentIcons: Record<string, any> = {
  Strategy: Target,
  Advertising: Megaphone,
  Sales: Users,
  Operations: Settings,
  Financials: DollarSign,
  Marketing: TrendingUp,
};

export const DepartmentHealthCard = ({ name, teamSize, activeTasks, agentHealth }: DepartmentHealthCardProps) => {
  const Icon = departmentIcons[name] || Target;
  
  return (
    <div 
      className="rounded-lg p-6"
      style={{
        background: 'var(--card-bg)',
        border: 'var(--card-border-width) solid var(--card-border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{name}</h3>
            <p className="text-xs text-muted-foreground">Team of {teamSize}</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-xs text-muted-foreground">Active Tasks</span>
            <span className="text-xs font-semibold text-foreground">{activeTasks}</span>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-xs text-muted-foreground">Agent Health</span>
            <span className="text-xs font-semibold text-foreground">{agentHealth}%</span>
          </div>
          <Progress value={agentHealth} className="h-2" />
        </div>
        
        <Button variant="outline" size="sm" className="w-full mt-2 border-border text-foreground hover:bg-sidebar-accent">
          View Department Details
        </Button>
      </div>
    </div>
  );
};
