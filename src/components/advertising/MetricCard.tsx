import { LucideIcon, ArrowUp, ArrowDown } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  comparison: string;
  trend: "up" | "down";
}

export const MetricCard = ({ icon: Icon, label, value, comparison, trend }: MetricCardProps) => {
  const trendColor = trend === "up" ? "text-green-500" : "text-red-500";
  const TrendIcon = trend === "up" ? ArrowUp : ArrowDown;

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
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <p className="text-3xl font-bold text-foreground mb-2">{value}</p>
        <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
          <TrendIcon className="h-3 w-3" />
          <span>{comparison}</span>
        </div>
      </div>
    </div>
  );
};
