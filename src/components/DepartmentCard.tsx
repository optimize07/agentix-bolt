import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface DepartmentCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  agentCount: number;
}

export const DepartmentCard = ({
  title,
  description,
  icon: Icon,
  agentCount,
}: DepartmentCardProps) => {
  return (
    <Card className="group cursor-pointer border border-card-border bg-card p-6 transition-all hover:border-primary">
      <div className="flex flex-col gap-4">
        {/* Icon */}
        <Icon className="h-8 w-8 text-foreground" />

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          <p className="text-xs text-accent-foreground">
            {agentCount} {agentCount === 1 ? 'agent' : 'agents'} available
          </p>
        </div>
      </div>
    </Card>
  );
};
