import { Card } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";
import { DepartmentKpi } from "./types";

interface Props {
  kpis: DepartmentKpi[];
}

export const DepartmentKPIs = ({ kpis }: Props) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {kpis.map((kpi, idx) => {
        const TrendIcon = kpi.trend?.direction === "down" ? ArrowDown : ArrowUp;
        const trendColor =
          kpi.trend?.direction === "down" ? "text-amber-500" : "text-emerald-500";
        const trendBg =
          kpi.trend?.direction === "down" ? "bg-amber-500/10" : "bg-emerald-500/10";
        return (
          <Card key={idx} className="border border-border bg-card p-6">
            <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
            <div className="mt-1 text-3xl font-bold text-foreground">{kpi.value}</div>
            {kpi.trend ? (
              <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${trendBg} ${trendColor}`}>
                <TrendIcon className="h-3.5 w-3.5" />
                <span>{kpi.trend.value}</span>
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
};


