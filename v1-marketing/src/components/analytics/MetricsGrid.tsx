import { Eye, Users, TrendingUp, Heart, MessageCircle, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Metric {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
}

const metrics: Metric[] = [
  { title: "Total Impressions", value: "2.4M", change: "+18.2%", changeType: "positive", icon: Eye },
  { title: "Total Reach", value: "890K", change: "+12.5%", changeType: "positive", icon: Users },
  { title: "Engagement Rate", value: "4.8%", change: "+0.6%", changeType: "positive", icon: TrendingUp },
  { title: "Total Likes", value: "156K", change: "+22.3%", changeType: "positive", icon: Heart },
  { title: "Total Comments", value: "24.5K", change: "+8.1%", changeType: "positive", icon: MessageCircle },
  { title: "Total Shares", value: "18.2K", change: "-2.4%", changeType: "negative", icon: Share2 },
];

export function MetricsGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
            <metric.icon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metric.value}</div>
            <p className={`text-xs ${
              metric.changeType === 'positive' ? 'text-green-500' : 
              metric.changeType === 'negative' ? 'text-red-500' : 
              'text-muted-foreground'
            }`}>
              {metric.change} from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
