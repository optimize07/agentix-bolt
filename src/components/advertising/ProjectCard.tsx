import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProjectCardProps {
  icon: LucideIcon;
  name: string;
  description: string;
  status: "Active" | "Testing" | "Paused";
  spend: string;
  roas: string;
}

export const ProjectCard = ({ icon: Icon, name, description, status, spend, roas }: ProjectCardProps) => {
  const statusVariant = {
    Active: "default" as const,
    Testing: "secondary" as const,
    Paused: "outline" as const,
  }[status];

  const statusColor = {
    Active: "bg-green-500/20 text-green-500 border-green-500/50",
    Testing: "bg-yellow-500/20 text-yellow-500 border-yellow-500/50",
    Paused: "bg-gray-500/20 text-gray-500 border-gray-500/50",
  }[status];

  return (
    <div 
      className="rounded-lg p-6 hover:border-primary/50 transition-colors"
      style={{
        background: 'var(--card-bg)',
        border: 'var(--card-border-width) solid var(--card-border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 flex-shrink-0">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-foreground truncate">{name}</h3>
            <Badge variant={statusVariant} className={statusColor}>
              {status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Spend</p>
          <p className="text-lg font-semibold text-foreground">{spend}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-1">ROAS</p>
          <p className="text-lg font-semibold text-primary">{roas}</p>
        </div>
      </div>
    </div>
  );
};
