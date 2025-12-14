import { Progress } from "@/components/ui/progress";

interface UsageIndicatorProps {
  current: number;
  total: number;
  label: string;
}

export const UsageIndicator = ({ current, total, label }: UsageIndicatorProps) => {
  const percentage = (current / total) * 100;

  return (
    <div className="bg-muted/30 border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-foreground">Usage This Month</p>
        <p className="text-sm text-muted-foreground">
          {label}: {current.toLocaleString()} / {total.toLocaleString()}
        </p>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
};
