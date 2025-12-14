import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface AdOptimizerRunCardProps {
  run: any;
  onClick: () => void;
}

const AdOptimizerRunCard = ({ run, onClick }: AdOptimizerRunCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'analyzing':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <Card 
      className="p-6 bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(run.status)}>
              {run.status}
            </Badge>
            <Badge variant="outline" className="border-border">
              {run.trigger_type}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(run.created_at), 'MMM dd, yyyy')}</span>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{format(new Date(run.created_at), 'hh:mm a')}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>{run.time_window_days} day window</span>
            </div>
          </div>

          {run.status === 'analyzing' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-pulse h-2 w-2 bg-yellow-500 rounded-full" />
              <span>Analysis in progress...</span>
            </div>
          )}

          {run.error_message && (
            <p className="text-sm text-red-500">{run.error_message}</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AdOptimizerRunCard;