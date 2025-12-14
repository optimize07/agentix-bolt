import { StrategySidebar } from "@/components/StrategySidebar";
import { DepartmentAgentsTable } from "@/components/departments/DepartmentAgentsTable";
import { getDepartmentConfig } from "@/components/departments/config";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function StrategyAgents() {
  const { rows } = getDepartmentConfig("strategy");

  return (
    <div className="flex h-screen w-full" style={{ background: 'var(--page-bg)' }}>
      <StrategySidebar />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-border" style={{ background: 'var(--page-bg)' }}>
          <div className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground">
                  Strategy Agents
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage strategic agents and their current work.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Agent
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-8">
          <DepartmentAgentsTable rows={rows} />
        </div>
      </main>
    </div>
  );
}





