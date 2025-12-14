import { useNavigate, useParams } from "react-router-dom";
import { SalesSidebar } from "@/components/SalesSidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SalesAgentsTable } from "@/components/departments/sales/SalesAgentsTable";
import { getDepartmentConfig } from "@/components/departments/config";

const SalesAgents = () => {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const { salesRows } = getDepartmentConfig("sales");

  return (
    <div className="flex min-h-screen w-full" style={{ background: 'var(--page-bg)' }}>
      <SalesSidebar />

      <main className="flex-1 p-6 lg:p-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(`/client/${clientId}`)}
          className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Client Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Agents</h1>
          <p className="text-muted-foreground">Monitor agent activity, performance and workload</p>
        </div>

        <SalesAgentsTable rows={salesRows || []} />
      </main>
    </div>
  );
};

export default SalesAgents;





