import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ClientPortfolioCardProps {
  clientId: string;
  name: string;
  type: string;
  projects: number;
  revenue: string;
  tasks: number;
}

export const ClientPortfolioCard = ({ clientId, name, type, projects, revenue, tasks }: ClientPortfolioCardProps) => {
  const navigate = useNavigate();

  return (
    <div 
      className="rounded-lg p-6"
      style={{
        background: 'var(--card-bg)',
        border: 'var(--card-border-width) solid var(--card-border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
          <span className="text-lg font-bold text-primary">{name.charAt(0)}</span>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground mb-1">{name}</h3>
          <Badge variant="outline" className="border-border text-muted-foreground text-xs">
            {type}
          </Badge>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Status</span>
          <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10">
            Active
          </Badge>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Projects</span>
          <span className="text-foreground font-semibold">{projects}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Revenue</span>
          <span className="text-foreground font-semibold">{revenue}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Tasks</span>
          <span className="text-foreground font-semibold">{tasks}</span>
        </div>
      </div>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => navigate(`/client/${clientId}`)}
        className="w-full gap-2 border-border text-foreground hover:bg-sidebar-accent"
      >
        View Client Dashboard
        <ArrowRight className="h-3 w-3" />
      </Button>
    </div>
  );
};
