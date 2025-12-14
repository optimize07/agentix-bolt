import { AdminSidebar } from "@/components/AdminSidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AdminNotifications = () => {
  const notifications = [
    { id: "n-001", title: "Ops automation failed on HealthHub", severity: "High", time: "2h ago" },
    { id: "n-002", title: "New client onboarded: ImagineSpace Ltd", severity: "Info", time: "1d ago" },
    { id: "n-003", title: "Revenue forecast updated", severity: "Medium", time: "3d ago" },
  ];

  return (
    <div className="flex h-screen w-full" style={{ background: 'var(--page-bg)' }}>
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">Agency-wide alerts and updates.</p>
        </div>

        <Card className="border border-border bg-card p-6">
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-center justify-between rounded-md border border-border p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.time}</p>
                </div>
                <Badge variant={n.severity === "High" ? "destructive" : n.severity === "Medium" ? "secondary" : "default"}>
                  {n.severity}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default AdminNotifications;


