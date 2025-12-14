import { useState } from "react";
import { useParams } from "react-router-dom";
import { FinancialsSidebar } from "@/components/FinancialsSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DollarSign,
  BarChart2,
  PieChart,
  TrendingUp,
  Download,
  Plus,
} from "lucide-react";

const Financials = () => {
  const { clientId } = useParams();
  const [timeRange, setTimeRange] = useState("Q3");

  const metrics = [
    { icon: DollarSign, label: "Total Revenue", value: "$1,250,000", comparison: "+5.2% QoQ", trend: "up" as const },
    { icon: BarChart2, label: "Operating Margin", value: "24.5%", comparison: "+1.1% QoQ", trend: "up" as const },
    { icon: PieChart, label: "Budget Utilization", value: "92%", comparison: "-2% vs plan", trend: "down" as const },
    { icon: TrendingUp, label: "Forecast Accuracy", value: "96%", comparison: "+3% QoQ", trend: "up" as const },
  ];

  const projects = [
    { name: "Q3 Revenue Projection", status: "In Progress", owner: "Olivia Rhye", progress: 72 },
    { name: "Expense Report Automation", status: "In Review", owner: "Lana Steiner", progress: 58 },
    { name: "Client Portfolio Analysis", status: "Completed", owner: "Demi Wilkinson", progress: 100 },
  ];

  return (
    <div className="flex min-h-screen w-full" style={{ background: 'var(--page-bg)' }}>
      <FinancialsSidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Financials Overview</h1>
            <p className="text-muted-foreground">Monitor financial performance and manage FP&A projects</p>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((m, idx) => (
              <Card key={idx} className="border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <m.icon className="h-5 w-5 text-primary" />
                    <p className="text-base font-medium text-muted-foreground">{m.label}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-bold leading-tight tracking-tight text-foreground">{m.value}</p>
                  <p className={`text-sm font-medium ${m.trend === "up" ? "text-emerald-500" : "text-amber-500"}`}>{m.comparison}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">FP&A Projects</h2>
            <div className="flex gap-2">
              <Button variant="outline" className="border-border">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {projects.map((p, idx) => (
              <Card key={idx} className="border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{p.name}</p>
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                      p.status === "Completed" ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <div className="mt-3 text-sm text-muted-foreground">Owner: {p.owner}</div>
                <div className="mt-3 h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${p.progress}%` }} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Financials;





