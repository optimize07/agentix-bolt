import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ChatSidebar } from "@/components/ChatSidebar";
import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { departmentsData } from "@/data/departments";
import { ClientSwitcher } from "@/components/ClientSwitcher";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from "recharts";

const ClientAnalytics = () => {
  const { clientId } = useParams();

  const departmentsSummary = useMemo(() => {
    const rows = departmentsData.map((d) => ({
      id: d.id,
      title: d.title,
      agentCount: d.agents.length || d.agentCount,
      activeAgents: d.agents.filter((a) => a.status === "Active").length,
      dailyAgents: d.agents.filter((a) => a.schedule === "daily").length,
    }));
    return {
      rows,
      totals: {
        departments: rows.length,
        agents: rows.reduce((acc, r) => acc + r.agentCount, 0),
        active: rows.reduce((acc, r) => acc + r.activeAgents, 0),
        daily: rows.reduce((acc, r) => acc + r.dailyAgents, 0),
      },
    };
  }, []);

  const agentsByDeptData = useMemo(
    () =>
      departmentsSummary.rows.map((r) => ({
        department: r.title,
        agents: r.agentCount,
        active: r.activeAgents,
      })),
    [departmentsSummary.rows],
  );

  const efficiencyTrend = useMemo(
    () => [
      { month: "Jun", efficiency: 82 },
      { month: "Jul", efficiency: 84 },
      { month: "Aug", efficiency: 87 },
      { month: "Sep", efficiency: 90 },
      { month: "Oct", efficiency: 92 },
      { month: "Nov", efficiency: 94 },
    ],
    [],
  );

  const chartConfig = {
    agents: { label: "Agents", color: "hsl(var(--primary))" },
    active: { label: "Active", color: "hsl(var(--chart-2))" },
    efficiency: { label: "Efficiency", color: "hsl(var(--primary))" },
  } as const;

  return (
    <div className="flex h-screen w-full bg-background">
      <ChatSidebar />
      <main className="flex-1 overflow-auto">
        <div className="border-b border-border bg-background">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
              <span className="text-sm text-muted-foreground">for</span>
              <ClientSwitcher />
            </div>
          </div>
        </div>

        <div className="p-10">
          <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
            <Card className="border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Departments</p>
              <p className="text-2xl font-bold text-foreground">{departmentsSummary.totals.departments}</p>
            </Card>
            <Card className="border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Agents</p>
              <p className="text-2xl font-bold text-foreground">{departmentsSummary.totals.agents}</p>
            </Card>
            <Card className="border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Active Agents</p>
              <p className="text-2xl font-bold text-foreground">{departmentsSummary.totals.active}</p>
            </Card>
            <Card className="border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Daily Schedules</p>
              <p className="text-2xl font-bold text-foreground">{departmentsSummary.totals.daily}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="border border-border bg-card p-6">
              <h3 className="mb-4 text-base font-semibold text-foreground">Agents by Department</h3>
              <ChartContainer config={chartConfig}>
                <BarChart data={agentsByDeptData}>
                  <CartesianGrid vertical={false} strokeOpacity={0.2} />
                  <XAxis dataKey="department" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis width={30} />
                  <Bar dataKey="agents" fill="var(--color-agents)" radius={4} />
                  <Bar dataKey="active" fill="var(--color-active)" radius={4} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </BarChart>
              </ChartContainer>
            </Card>

            <Card className="border border-border bg-card p-6">
              <h3 className="mb-4 text-base font-semibold text-foreground">Efficiency Trend</h3>
              <ChartContainer config={chartConfig}>
                <LineChart data={efficiencyTrend}>
                  <CartesianGrid strokeOpacity={0.2} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis width={30} domain={[70, 100]} />
                  <Line
                    type="monotone"
                    dataKey="efficiency"
                    stroke="var(--color-efficiency)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </LineChart>
              </ChartContainer>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientAnalytics;


