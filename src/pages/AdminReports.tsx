import { AdminSidebar } from "@/components/AdminSidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from "recharts";

const AdminReports = () => {
  const revenueByClient = [
    { client: "TechStart", revenue: 120_000 },
    { client: "HealthHub", revenue: 95_000 },
    { client: "Global AIC", revenue: 78_500 },
  ];

  const chartConfig = {
    revenue: { label: "Revenue", color: "hsl(var(--primary))" },
  } as const;

  const recentReports = [
    { id: "r-001", title: "Monthly Agency Performance", period: "Oct 2025", status: "Published" },
    { id: "r-002", title: "Client Retention & Churn", period: "Q3 2025", status: "Published" },
    { id: "r-003", title: "Channel Efficiency Benchmark", period: "Nov 2025", status: "Draft" },
  ];

  return (
    <div className="flex h-screen w-full" style={{ background: 'var(--page-bg)' }}>
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground">Agency Reports</h1>
          <p className="text-sm text-muted-foreground">Cross-client reporting and executive summaries.</p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="border border-border bg-card p-6">
            <h3 className="mb-3 text-base font-semibold text-foreground">Revenue by Client (last 30 days)</h3>
            <ChartContainer config={chartConfig}>
              <BarChart data={revenueByClient} barSize={24}>
                <CartesianGrid vertical={false} strokeOpacity={0.2} />
                <XAxis dataKey="client" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis width={40} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
          </Card>

          <Card className="border border-border bg-card p-6">
            <h3 className="mb-3 text-base font-semibold text-foreground">Recent Reports</h3>
            <div className="space-y-3">
              {recentReports.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-md border border-border p-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{r.title}</p>
                    <p className="text-xs text-muted-foreground">Period: {r.period}</p>
                  </div>
                  <Badge variant={r.status === "Published" ? "default" : "secondary"}>{r.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminReports;


