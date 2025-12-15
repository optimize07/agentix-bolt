import { BarChart3 } from "lucide-react";
import { MetricsGrid } from "@/components/analytics/MetricsGrid";
import { PlatformBreakdown } from "@/components/analytics/PlatformBreakdown";
import { EngagementChart } from "@/components/analytics/EngagementChart";
import { SentimentAnalyzer } from "@/components/analytics/SentimentAnalyzer";

export default function Overview() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-primary" />
          Social Analytics Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Your social media performance at a glance
        </p>
      </div>

      {/* Metrics Grid */}
      <MetricsGrid />

      {/* Charts and Analyzer Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Engagement Chart - Takes 2 columns */}
        <EngagementChart />
        
        {/* Platform Breakdown */}
        <PlatformBreakdown />
      </div>

      {/* Sentiment Analyzer - Full Width */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SentimentAnalyzer />
        
        {/* Recent Activity Placeholder */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Quick Insights</h2>
          <div className="space-y-3">
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm font-medium text-foreground">📈 Best performing day</p>
              <p className="text-2xl font-bold text-primary mt-1">Wednesday</p>
              <p className="text-xs text-muted-foreground">42% higher engagement than average</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm font-medium text-foreground">⏰ Optimal posting time</p>
              <p className="text-2xl font-bold text-primary mt-1">6:00 PM</p>
              <p className="text-xs text-muted-foreground">When your audience is most active</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm font-medium text-foreground">🎯 Top performing format</p>
              <p className="text-2xl font-bold text-primary mt-1">Reels</p>
              <p className="text-xs text-muted-foreground">3.2x more reach than static posts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
