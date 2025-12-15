import { TrendingUp, Flame, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Trend {
  title: string;
  description: string;
  angle: string;
  urgency: string;
}

interface TrendingSectionProps {
  trends: Trend[];
  onUseTrend: (trend: Trend) => void;
  isLoading?: boolean;
}

export function TrendingSection({ trends, onUseTrend, isLoading }: TrendingSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className="w-5 h-5 text-orange-500" />
            Trending in Your Niche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 rounded-lg bg-muted/50 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-full mb-1" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="w-5 h-5 text-orange-500" />
          Trending in Your Niche
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {trends.length === 0 ? (
          <p className="text-sm text-muted-foreground">Generate ideas to see trending topics</p>
        ) : (
          trends.map((trend, index) => (
            <div
              key={index}
              className="p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-medium text-sm">{trend.title}</h4>
                <Badge 
                  variant={trend.urgency === 'high' ? 'destructive' : trend.urgency === 'medium' ? 'default' : 'secondary'}
                  className="text-xs shrink-0"
                >
                  {trend.urgency}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{trend.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-primary">
                  <TrendingUp className="w-3 h-3" />
                  <span className="line-clamp-1">{trend.angle}</span>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onUseTrend(trend)}
                >
                  Use <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
