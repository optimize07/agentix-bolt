import { useMemo, useState, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdvertisingSidebar } from "@/components/AdvertisingSidebar";
import { MetricCard } from "@/components/advertising/MetricCard";
import { CampaignsTable } from "@/components/advertising/CampaignsTable";
import { ProjectCard } from "@/components/advertising/ProjectCard";
import { UsageIndicator } from "@/components/advertising/UsageIndicator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Download,
  MousePointer,
  Target,
  TrendingUp,
  DollarSign,
  Eye,
  Play,
} from "lucide-react";

const PerformanceChart = lazy(() =>
  import("@/components/advertising/PerformanceChart").then((module) => ({
    default: module.PerformanceChart,
  })),
);

const CampaignManager = () => {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const [timeRange, setTimeRange] = useState("7d");
  const [compareRange, setCompareRange] = useState("previous");

  // TODO: Replace mock data with client-scoped API/Supabase data when available.
  const metrics = useMemo(
    () => [
      {
        icon: DollarSign,
        label: "Total Spend",
        value: "$18,420",
        comparison: "+9.8% vs last period",
        trend: "up" as const,
      },
      {
        icon: Eye,
        label: "Impressions",
        value: "1.9M",
        comparison: "+6.2% vs last period",
        trend: "up" as const,
      },
      {
        icon: MousePointer,
        label: "CTR",
        value: "3.27%",
        comparison: "-1.4% vs last period",
        trend: "down" as const,
      },
      {
        icon: TrendingUp,
        label: "ROAS",
        value: "4.5x",
        comparison: "+12.1% vs last period",
        trend: "up" as const,
      },
    ],
    [],
  );

  const activeCampaignOutputs = [
    {
      icon: Target,
      name: "Summer Sale 2025",
      description: "Paid social & search | Multi-ad set experiment",
      status: "Active" as const,
      spend: "$6,120",
      roas: "6.1x",
    },
    {
      icon: Play,
      name: "Product Demo Launch",
      description: "YouTube + Meta video creative test",
      status: "Testing" as const,
      spend: "$4,380",
      roas: "3.4x",
    },
    {
      icon: Target,
      name: "Fitness Challenge",
      description: "App install + retention cohort",
      status: "Paused" as const,
      spend: "$1,890",
      roas: "2.9x",
    },
  ];

  return (
    <div className="flex min-h-screen w-full" style={{ background: "var(--page-bg)" }}>
      <AdvertisingSidebar />

      <main className="flex-1 p-6 lg:p-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(`/client/${clientId}/advertising`)}
          className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Advertising
        </Button>

        {/* Header + Controls */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Campaign Manager</h1>
              <p className="text-muted-foreground">
                Track live campaigns, KPIs, and outputs across your ad accounts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>

              <Select value={compareRange} onValueChange={setCompareRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="previous">Previous period</SelectItem>
                  <SelectItem value="year">Same period last year</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {metrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>

        {/* Performance & Outputs */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2">
            <Suspense fallback={<div className="flex h-64 items-center justify-center text-muted-foreground">Loading performance...</div>}>
              <PerformanceChart />
            </Suspense>
          </div>
          <div>
            <div
              className="rounded-lg p-6 h-full flex flex-col gap-4"
              style={{
                background: "var(--card-bg)",
                border: "var(--card-border-width) solid var(--card-border)",
                boxShadow: "var(--card-shadow)",
              }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Active Campaign Outputs</h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {activeCampaignOutputs.map((output, index) => (
                  <ProjectCard key={index} {...output} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Table */}
        <div className="mb-8">
          <CampaignsTable />
        </div>

        {/* Usage / API indicator */}
        <UsageIndicator current={1842} total={5000} label="API Calls" />
      </main>
    </div>
  );
};

export default CampaignManager;

