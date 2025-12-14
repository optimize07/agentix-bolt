import { DashboardComponent } from "@/types/dataBinding";
import { Sheet, extractData } from "@/utils/dataExtractor";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface DashboardRendererProps {
  components: DashboardComponent[];
  sheets?: Sheet[];
}

const DashboardMetricCard = ({
  title,
  value,
  change,
  trend,
}: {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down";
}) => (
  <Card className="h-full">
    <CardContent className="p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        {change && (
          <span
            className={`text-xs inline-flex items-center gap-1 ${
              trend === "down" ? "text-destructive" : "text-emerald-500"
            }`}
          >
            {trend === "down" ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
            {change}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
    </CardContent>
  </Card>
);

const ChartCard = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="text-sm font-semibold">{title || "Chart"}</CardTitle>
    </CardHeader>
    <CardContent className="h-[220px]">{children}</CardContent>
  </Card>
);

export const DashboardRenderer = ({ components, sheets = [] }: DashboardRendererProps) => {
  if (!components?.length) {
    return (
      <div className="flex items-center justify-center h-64 rounded-lg border border-dashed border-border text-muted-foreground">
        Add widgets from the palette to build your dashboard
      </div>
    );
  }

  const renderComponent = (component: DashboardComponent) => {
    const data = component.dataBinding ? extractData(sheets, component.dataBinding) : [];

    switch (component.type) {
      case "statsCard":
      case "kpi": {
        const value = (data[0]?.value ?? component.config.value ?? "0").toString();
        return (
          <DashboardMetricCard
            title={component.config.title || "Metric"}
            value={value}
            change={component.config.change}
            trend={component.config.trend || "up"}
          />
        );
      }
      case "lineChart": {
        const xKey = component.dataBinding?.columns?.x || component.config.xAxisKey || "x";
        const yKey = component.dataBinding?.columns?.y || component.config.dataKey || "y";
        const lineData = data.map((d) => ({
          [xKey]: d.x,
          [yKey]: d.y,
        }));
        return (
          <ChartCard title={component.config.title}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData.length ? lineData : [{ [xKey]: "N/A", [yKey]: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey={xKey} className="text-muted-foreground text-xs" />
                <YAxis className="text-muted-foreground text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
                <Line type="monotone" dataKey={yKey} stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        );
      }
      case "barChart": {
        const xKey = component.dataBinding?.columns?.x || component.config.xAxisKey || "x";
        const yKey = component.dataBinding?.columns?.y || component.config.dataKey || "y";
        const barData = data.map((d) => ({
          [xKey]: d.x,
          [yKey]: d.y,
        }));
        return (
          <ChartCard title={component.config.title}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData.length ? barData : [{ [xKey]: "N/A", [yKey]: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey={xKey} className="text-muted-foreground text-xs" />
                <YAxis className="text-muted-foreground text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey={yKey} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        );
      }
      case "pieChart": {
        const valueKey = component.dataBinding?.columns?.value || component.config.dataKey || "value";
        const pieData = data.map((d) => ({
          name: d.x || d.label,
          [valueKey]: d.y || d.value,
        }));
        const colors = component.config.colors || ["hsl(var(--primary))", "hsl(var(--secondary))", "#94a3b8", "#f97316"];
        return (
          <ChartCard title={component.config.title}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData.length ? pieData : [{ name: "N/A", [valueKey]: 1 }]}
                  dataKey={valueKey}
                  nameKey="name"
                  outerRadius={80}
                  label
                >
                  {(pieData.length ? pieData : [{ name: "N/A", [valueKey]: 1 }]).map((_, idx) => (
                    <Cell key={idx} fill={colors[idx % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        );
      }
      case "table": {
        const tableRows = component.config.sheetData || data;
        const rows = Array.isArray(tableRows) ? tableRows : [];
        const headers = rows[0] || ["Column A", "Column B", "Column C"];
        const body = rows.slice(1, 6);
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">{component.config.title || "Table"}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    {headers.map((h: any, idx: number) => (
                      <th key={idx} className="py-2 pr-4">
                        {h || `Col ${idx + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {body.length === 0 ? (
                    <tr>
                      <td className="py-3 text-muted-foreground" colSpan={headers.length}>
                        No data
                      </td>
                    </tr>
                  ) : (
                    body.map((row: any[], rIdx: number) => (
                      <tr key={rIdx} className="border-t border-border/60">
                        {row.map((cell: any, cIdx: number) => (
                          <td key={cIdx} className="py-2 pr-4 text-foreground">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        );
      }
      default:
        return (
          <Card className="h-full">
            <CardContent className="flex h-full items-center justify-center text-muted-foreground">
              <Activity size={16} className="mr-2" />
              Unsupported widget type: {component.type}
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 auto-rows-fr">
      {components.map((component) => (
        <div
          key={component.id}
          className="rounded-lg"
          style={{
            gridColumn: `span ${Math.min(component.position.w, 12)}`,
            minHeight: `${component.position.h * 90}px`,
          }}
        >
          {renderComponent(component)}
        </div>
      ))}
    </div>
  );
};

export default DashboardRenderer;
