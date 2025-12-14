import { Card } from "@/components/ui/card";
import { TrendingUp, Play, CheckCircle2, AlertCircle } from "lucide-react";

interface AdOptimizerDashboardProps {
  runs: any[];
}

const AdOptimizerDashboard = ({ runs }: AdOptimizerDashboardProps) => {
  const totalRuns = runs.length;
  const completedRuns = runs.filter(r => r.status === 'completed').length;
  const failedRuns = runs.filter(r => r.status === 'failed').length;
  const lastRun = runs[0];

  const stats = [
    {
      title: "Total Runs",
      value: totalRuns,
      icon: Play,
      color: "text-primary",
    },
    {
      title: "Completed",
      value: completedRuns,
      icon: CheckCircle2,
      color: "text-green-500",
    },
    {
      title: "Failed",
      value: failedRuns,
      icon: AlertCircle,
      color: "text-red-500",
    },
    {
      title: "Success Rate",
      value: totalRuns > 0 ? `${Math.round((completedRuns / totalRuns) * 100)}%` : '0%',
      icon: TrendingUp,
      color: "text-accent",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="p-6 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
              </div>
              <stat.icon className={`h-10 w-10 ${stat.color}`} />
            </div>
          </Card>
        ))}
      </div>

      {lastRun && (
        <Card className="p-6 bg-card border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Last Run</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className={`font-medium ${
                lastRun.status === 'completed' ? 'text-green-500' :
                lastRun.status === 'failed' ? 'text-red-500' :
                'text-yellow-500'
              }`}>
                {lastRun.status.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trigger:</span>
              <span className="text-foreground">{lastRun.trigger_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time Window:</span>
              <span className="text-foreground">{lastRun.time_window_days} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Started:</span>
              <span className="text-foreground">
                {new Date(lastRun.started_at).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdOptimizerDashboard;