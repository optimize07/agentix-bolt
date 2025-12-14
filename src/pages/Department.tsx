import { useMemo } from "react";
import { useParams, Navigate } from "react-router-dom";
import { ChatSidebar } from "@/components/ChatSidebar";
import { DepartmentHeader } from "@/components/departments/DepartmentHeader";
import { DepartmentKPIs } from "@/components/departments/DepartmentKPIs";
import { DepartmentAgentsTable } from "@/components/departments/DepartmentAgentsTable";
import { departmentsData } from "@/data/departments";
import { getDepartmentConfig } from "@/components/departments/config";
import { SalesAgentsTable } from "@/components/departments/sales/SalesAgentsTable";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const Department = () => {
  const { clientId, departmentId } = useParams();

  const departmentMeta = useMemo(
    () => departmentsData.find((d) => d.id === departmentId),
    [departmentId],
  );

  // If no client id, bounce to root redirect logic
  if (!clientId) {
    return <Navigate to="/" replace />;
  }

  // Render a simple not found state if department does not exist in our data map
  if (!departmentMeta) {
    return (
      <div className="flex h-screen w-full bg-background">
        <ChatSidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-10">
            <h1 className="text-2xl font-bold text-foreground">Department not found</h1>
            <p className="text-sm text-muted-foreground">
              The requested department does not exist or is not yet configured.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const { kpis, rows, salesRows, healthPulse, projects } = getDepartmentConfig(departmentMeta.id);

  return (
    <div className="flex h-screen w-full bg-background">
      <ChatSidebar />
      <main className="flex-1 overflow-auto">
        {/* Top section with header and actions */}
        <div className="border-b border-border bg-background">
          <div className="p-6">
            <DepartmentHeader
              title={`${departmentMeta.title} Department`}
              subtitle="Manage agents and view department-wide analytics."
            />
          </div>
        </div>

        {departmentMeta.id === "sales" ? (
          <div className="p-10">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="space-y-8 lg:col-span-2">
                <section>
                  <DepartmentKPIs kpis={kpis} />
                </section>
                <section>
                  <SalesAgentsTable rows={salesRows || []} />
                </section>
              </div>
              <aside className="space-y-6 lg:col-span-1">
                <Card className="border border-border bg-card p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-base font-medium text-foreground">Department Health Pulse</p>
                    <p className="text-lg font-bold text-primary">{(healthPulse ?? 0).toString()}%</p>
                  </div>
                  <Progress value={healthPulse ?? 0} className="h-2" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    Team morale and performance metrics are strong.
                  </p>
                </Card>

                <Card className="border border-border bg-card p-6">
                  <h2 className="mb-4 text-[22px] font-bold leading-tight tracking-tight text-foreground">
                    Optimization Projects
                  </h2>
                  <div className="flex flex-col gap-5">
                    {(projects || []).map((p, idx) => (
                      <div key={idx} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground">{p.name}</p>
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                              p.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {p.status === "completed" ? "Completed" : "In Progress"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-full">
                            <Progress value={p.progress} className="h-1.5" />
                          </div>
                          <Avatar className="-ml-2 h-6 w-6">
                            {p.avatarUrl ? <AvatarImage src={p.avatarUrl} alt="project owner" /> : null}
                            <AvatarFallback>PO</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </aside>
            </div>
          </div>
        ) : (
          <div className="space-y-8 p-10">
            <section>
              <h3 className="mb-4 text-lg font-semibold text-foreground">Health Pulse Overview</h3>
              <DepartmentKPIs kpis={kpis} />
            </section>
            <section>
              <DepartmentAgentsTable rows={rows} />
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default Department;


