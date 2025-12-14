import { useNavigate, useParams } from "react-router-dom";
import { SalesSidebar } from "@/components/SalesSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const SalesAnalytics = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen w-full bg-background">
      <SalesSidebar />
      <main className="flex-1 p-6 lg:p-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/client/${clientId}`)}
          className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Client Dashboard
        </Button>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Sales Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Insights into revenue, conversion rates, and pipeline health.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Monthly Revenue</p>
            <p className="mt-1 text-3xl font-bold text-foreground">$1.25M</p>
          </Card>
          <Card className="border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Close Rate</p>
            <p className="mt-1 text-3xl font-bold text-foreground">28.5%</p>
          </Card>
          <Card className="border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">New Leads</p>
            <p className="mt-1 text-3xl font-bold text-foreground">842</p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SalesAnalytics;





