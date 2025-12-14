import { useState, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdvertisingSidebar } from "@/components/AdvertisingSidebar";
import { MetricCard } from "@/components/advertising/MetricCard";
import { ProjectCard } from "@/components/advertising/ProjectCard";
import { TopAdItem } from "@/components/advertising/TopAdItem";
import { CampaignsTable } from "@/components/advertising/CampaignsTable";
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
  DollarSign,
  Eye,
  MousePointer,
  TrendingUp,
  RotateCw,
  Download,
  Plus,
  Target,
  Layers,
  Smartphone,
  Image,
  Video,
  Layout,
  ArrowLeft,
} from "lucide-react";

const PerformanceChart = lazy(() =>
  import("@/components/advertising/PerformanceChart").then((module) => ({
    default: module.PerformanceChart,
  })),
);

const Advertising = () => {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const [timeRange, setTimeRange] = useState("7d");
  const [compareRange, setCompareRange] = useState("previous");

  const metrics = [
    {
      icon: DollarSign,
      label: "Total Spend",
      value: "$24,847",
      comparison: "+12.5% vs $22,098 last period",
      trend: "up" as const,
    },
    {
      icon: Eye,
      label: "Impressions",
      value: "2.4M",
      comparison: "+8.3% vs 2.2M last period",
      trend: "up" as const,
    },
    {
      icon: MousePointer,
      label: "Click Rate",
      value: "3.42%",
      comparison: "-2.1% vs 3.49% last period",
      trend: "down" as const,
    },
    {
      icon: TrendingUp,
      label: "ROAS",
      value: "4.2x",
      comparison: "+15.7% vs 3.6x last period",
      trend: "up" as const,
    },
  ];

  const projects = [
    {
      icon: Target,
      name: "E-commerce Store",
      description: "Fashion and lifestyle products targeting millennials",
      status: "Active" as const,
      spend: "$12,450",
      roas: "4.8x",
    },
    {
      icon: Layers,
      name: "SaaS Platform",
      description: "B2B software solution for project management",
      status: "Testing" as const,
      spend: "$8,920",
      roas: "3.2x",
    },
    {
      icon: Smartphone,
      name: "Fitness App",
      description: "Mobile fitness tracking and workout planning",
      status: "Paused" as const,
      spend: "$3,477",
      roas: "2.8x",
    },
  ];

  const topAds = [
    {
      icon: Image,
      name: "Summer Collection Launch",
      type: "Image",
      project: "E-commerce Store",
      roas: "6.8x",
    },
    {
      icon: Video,
      name: "Product Demo Video",
      type: "Video",
      project: "SaaS Platform",
      roas: "5.2x",
    },
    {
      icon: Layout,
      name: "Workout Challenge",
      type: "Carousel",
      project: "Fitness App",
      roas: "4.1x",
    },
  ];

  return (
    <div className="flex min-h-screen w-full" style={{ background: 'var(--page-bg)' }}>
      <AdvertisingSidebar />
      
      <main className="flex-1 p-6 lg:p-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/client/${clientId}`)}
          className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Client Dashboard
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h1>
              <p className="text-muted-foreground">Monitor your advertising performance and manage campaigns</p>
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

              <Button variant="outline" size="icon">
                <RotateCw className="h-4 w-4" />
              </Button>

              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>

              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <Select defaultValue="ecommerce">
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ecommerce">E-commerce Store</SelectItem>
                <SelectItem value="saas">SaaS Platform</SelectItem>
                <SelectItem value="fitness">Fitness App</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {metrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>

        {/* Active Projects */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Active Projects</h2>
            <Button variant="link" className="text-primary">View All</Button>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {projects.map((project, index) => (
              <ProjectCard key={index} {...project} />
            ))}
          </div>
        </div>

        {/* Performance Trends & Top Ads */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2">
            <Suspense fallback={<div className="flex h-64 items-center justify-center text-muted-foreground">Loading performance...</div>}>
              <PerformanceChart />
            </Suspense>
          </div>
          <div>
            <div className="rounded-lg p-6" style={{ background: 'var(--card-bg)', border: 'var(--card-border-width) solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Top Performing Ads</h2>
              </div>
              <div className="space-y-4">
                {topAds.map((ad, index) => (
                  <TopAdItem key={index} {...ad} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="mb-8">
          <CampaignsTable />
        </div>

        {/* Usage Indicator */}
        <UsageIndicator current={2847} total={5000} label="API Calls" />
      </main>
    </div>
  );
};

export default Advertising;
