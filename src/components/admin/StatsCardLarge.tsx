import { LucideIcon } from "lucide-react";

interface StatsCardLargeProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
}

export const StatsCardLarge = ({ title, value, change, icon: Icon }: StatsCardLargeProps) => {
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
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">{title}</p>
        <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
        <p className="text-xs text-muted-foreground">{change}</p>
      </div>
    </div>
  );
};
