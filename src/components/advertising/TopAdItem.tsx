import { LucideIcon } from "lucide-react";

interface TopAdItemProps {
  icon: LucideIcon;
  name: string;
  type: string;
  project: string;
  roas: string;
}

export const TopAdItem = ({ icon: Icon, name, type, project, roas }: TopAdItemProps) => {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 flex-shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground">{type} • {project}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-lg font-bold text-primary">{roas}</p>
        <p className="text-xs text-muted-foreground">ROAS</p>
      </div>
    </div>
  );
};
