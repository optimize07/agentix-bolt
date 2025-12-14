import { useMemo, useState, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SalesSidebar } from "@/components/SalesSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, Trash2, LayoutDashboard, Wand2, BarChart3, LineChart, PieChart, Grid3x3, ArrowLeft } from "lucide-react";
import { useSalesDashboards } from "@/hooks/useSalesDashboards";
import type { DashboardComponent } from "@/types/dataBinding";

const DashboardRenderer = lazy(() => import("@/components/dashboard/DashboardRenderer"));

const Sales = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { dashboards, sheets, isLoading, createDashboard, updateDashboard, deleteDashboard, saveState } =
    useSalesDashboards({ clientId });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);

  const activeDashboard = useMemo(() => {
    if (!dashboards.length) return null;
    const found = dashboards.find((d) => d.id === activeId);
    return found || dashboards[0];
  }, [dashboards, activeId]);

  const handleCreate = () => {
    const id = createDashboard();
    setActiveId(id);
  };

  const handleDelete = () => {
    if (!activeDashboard) return;
    deleteDashboard(activeDashboard.id);
    setActiveId(null);
  };

  const handleRename = (name: string) => {
    if (!activeDashboard) return;
    updateDashboard({ ...activeDashboard, name });
  };

  const addWidget = (type: DashboardComponent["type"]) => {
    if (!activeDashboard) return;
    const position = {
      x: 0,
      y: activeDashboard.components.length * 2,
      w: type === "statsCard" || type === "kpi" ? 3 : 6,
      h: type === "statsCard" || type === "kpi" ? 2 : 4,
    };

    const newComponent: DashboardComponent = {
      id: `component-${Date.now()}`,
      type,
      position,
      config: {
        title:
          type === "statsCard"
            ? "Revenue"
            : type === "lineChart"
            ? "Revenue Trend"
            : type === "barChart"
            ? "Product Performance"
            : type === "pieChart"
            ? "Share"
            : "Metric",
        change: "+5%",
        trend: "up",
        dataKey: type === "pieChart" ? "Revenue" : "Revenue",
        xAxisKey: "Month",
      },
      dataBinding:
        type === "statsCard" || type === "kpi"
          ? {
              sheetId: "ds-1",
              columns: { value: "Revenue" },
              aggregation: "sum",
            }
          : type === "lineChart" || type === "barChart"
          ? {
              sheetId: "ds-1",
              columns: { x: "Month", y: "Revenue" },
            }
          : type === "pieChart"
          ? {
              sheetId: "ds-1",
              columns: { x: "Month", value: "Revenue" },
            }
          : undefined,
    };

    const updated = {
      ...activeDashboard,
      components: [...activeDashboard.components, newComponent],
    };
    updateDashboard(updated);
    setAddWidgetOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <SalesSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading dashboards...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full" style={{ background: "var(--page-bg)" }}>
      <SalesSidebar />

      <main className="flex-1 p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LayoutDashboard className="h-4 w-4" />
              Sales Dashboard
            </div>
            <h1 className="text-3xl font-bold text-foreground leading-tight">Custom Sales Dashboards</h1>
            <p className="text-muted-foreground text-sm">
              Manage widgets and analytics views for your sales team within the Sales department.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/client/${clientId}`)}
              className="gap-2 text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Client
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete} disabled={!activeDashboard}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button onClick={handleCreate} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Dashboard
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <Tabs value={activeDashboard?.id || dashboards[0]?.id} onValueChange={setActiveId}>
                  <TabsList className="flex flex-wrap gap-1">
                    {dashboards.map((d) => (
                      <TabsTrigger key={d.id} value={d.id} className="text-sm">
                        {d.name}
                      </TabsTrigger>
                    ))}
                    {dashboards.length === 0 && (
                      <span className="text-sm text-muted-foreground px-2">No dashboards yet</span>
                    )}
                  </TabsList>
                </Tabs>
              </div>
              <div className="text-xs text-muted-foreground">
                {saveState === "saving" ? "Saving..." : saveState === "error" ? "Save error" : "Saved"}
              </div>
            </div>
            {activeDashboard && (
              <div className="mt-3">
                <input
                  className="w-full bg-transparent text-lg font-semibold focus:outline-none"
                  value={activeDashboard.name}
                  onChange={(e) => handleRename(e.target.value)}
                />
                {activeDashboard.description && (
                  <p className="text-sm text-muted-foreground">{activeDashboard.description}</p>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {activeDashboard ? (
              <Suspense fallback={<div className="flex h-64 items-center justify-center text-muted-foreground">Loading dashboard...</div>}>
                <DashboardRenderer components={activeDashboard.components} sheets={sheets} />
              </Suspense>
            ) : (
              <div className="text-center text-muted-foreground py-10">
                Create your first dashboard to start visualizing sales data.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="fixed bottom-6 right-6 flex items-center gap-3">
          <Button variant="outline" size="lg">
            <Wand2 className="h-4 w-4 mr-2" />
            Ask AI
          </Button>
          <Button size="lg" onClick={() => setAddWidgetOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Widget
          </Button>
        </div>

        <Dialog open={addWidgetOpen} onOpenChange={setAddWidgetOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Widget</DialogTitle>
              <DialogDescription>Select a widget to place on the dashboard.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[320px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <WidgetCard
                  icon={Grid3x3}
                  title="KPI / Stat"
                  description="Single value with change"
                  onClick={() => addWidget("statsCard")}
                />
                <WidgetCard
                  icon={LineChart}
                  title="Line Chart"
                  description="Trend over time"
                  onClick={() => addWidget("lineChart")}
                />
                <WidgetCard
                  icon={BarChart3}
                  title="Bar Chart"
                  description="Compare categories"
                  onClick={() => addWidget("barChart")}
                />
                <WidgetCard
                  icon={PieChart}
                  title="Pie Chart"
                  description="Distribution view"
                  onClick={() => addWidget("pieChart")}
                />
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

const WidgetCard = ({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: any;
  title: string;
  description: string;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border border-border bg-card p-4 hover:border-primary/70 hover:shadow-sm transition"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="text-primary h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </button>
  );
};

export default Sales;


