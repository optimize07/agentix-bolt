import { useParams } from "react-router-dom";
import { OperationsSidebar } from "@/components/OperationsSidebar";
import { Card } from "@/components/ui/card";

const KPIS = [
  { label: "Active Agents", value: "10 / 12" },
  { label: "Automation Success", value: "94%" },
  { label: "Team Efficiency", value: "88%" },
];

const Operations = () => {
  const { clientId } = useParams();
  // clientId kept for parity and potential future loading
  return (
    <div className="flex min-h-screen w-full" style={{ background: 'var(--page-bg)' }}>
      <OperationsSidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="mb-1 text-3xl font-bold text-foreground">Operations Overview</h1>
          <p className="text-sm text-muted-foreground">
            Monitor workflow automation, team efficiency, and agent performance.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {KPIS.map((kpi) => (
            <Card key={kpi.label} className="border border-border bg-card p-6">
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{kpi.value}</p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <Card className="border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground">Workflow Efficiency</h3>
            <div className="mt-4 flex h-60 items-end gap-2 rounded-md bg-muted p-4">
              {["60%", "80%", "95%", "85%", "75%", "88%"].map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t-md bg-primary ${i !== 2 ? "opacity-30" : ""}`}
                  style={{ height: h }}
                />
              ))}
            </div>
          </Card>

          <Card className="border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground">Team Health Pulse</h3>
            <div className="mt-4 flex items-center justify-center">
              <div className="relative h-48 w-48">
                <svg viewBox="0 0 36 36" className="h-full w-full">
                  <path className="text-red-500/30" stroke="currentColor" strokeWidth="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-yellow-400/30" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="90,100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-primary/30" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="70,100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-red-500" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="10,100" strokeDashoffset="-90" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-yellow-400" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="20,100" strokeDashoffset="-70" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-primary" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="70,100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-foreground">Good</span>
                  <span className="text-xs text-muted-foreground">Overall</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Operations;





