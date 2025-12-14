import { StrategySidebar } from "@/components/StrategySidebar";
import { Card } from "@/components/ui/card";
import { useParams } from "react-router-dom";

const KPIS = [
  { label: "Total Agents", value: "12", trend: "+2%" },
  { label: "Active Projects", value: "5", trend: "-5%" },
  { label: "Department Capacity", value: "85%", trend: "+1.2%" },
];

const Strategy = () => {
  const { clientId } = useParams();
  // clientId reserved for future data loading
  return (
    <div className="flex min-h-screen w-full" style={{ background: 'var(--page-bg)' }}>
      <StrategySidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="mb-1 text-3xl font-bold text-foreground">Strategy Overview</h1>
          <p className="text-sm text-muted-foreground">
            Manage strategic planning, knowledge systems, and the company brain.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {KPIS.map((kpi) => (
            <Card key={kpi.label} className="border border-border bg-card p-6">
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
                <span className="text-xs text-muted-foreground">{kpi.trend}</span>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <Card className="border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground">Strategic Priorities</h3>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Refine market positioning across segments</li>
              <li>Consolidate knowledge bases and FAQs</li>
              <li>Operationalize RAG company brain for teams</li>
            </ul>
          </Card>
          <Card className="border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground">Recent Activities</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>Updated competitor matrices (Q4)</li>
              <li>Imported latest product FAQs</li>
              <li>Retrained RAG on new knowledge sources</li>
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Strategy;





