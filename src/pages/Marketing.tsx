import { lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BarChart3, ArrowLeft } from "lucide-react";
import { MarketingSidebar } from "@/components/MarketingSidebar";
import { Button } from "@/components/ui/button";
import { MetricsGrid } from "@/components/analytics/MetricsGrid";
import { PlatformBreakdown } from "@/components/analytics/PlatformBreakdown";
import { SentimentAnalyzer } from "@/components/analytics/SentimentAnalyzer";

const EngagementChart = lazy(() =>
  import("@/components/analytics/EngagementChart").then((module) => ({
    default: module.EngagementChart,
  })),
);

const Marketing = () => {
  const navigate = useNavigate();
  const { clientId } = useParams();

  return (
    <div className="flex min-h-screen w-full" style={{ background: "var(--page-bg)" }}>
      <MarketingSidebar />

      <main className="flex-1 p-6 lg:p-8 space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/client/${clientId}`)}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Client Dashboard
        </Button>

        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            Social Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Your social media performance at a glance
          </p>
        </div>

        <MetricsGrid />

        <div className="grid gap-6 lg:grid-cols-3">
          <Suspense fallback={<div className="flex h-64 items-center justify-center text-muted-foreground">Loading engagement...</div>}>
            <EngagementChart />
          </Suspense>
          <PlatformBreakdown />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SentimentAnalyzer />
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
      </main>
    </div>
  );
};

export default Marketing;





