import { useNavigate, useParams } from "react-router-dom";
import { SalesSidebar } from "@/components/SalesSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const SalesCrmIntegration = () => {
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
          <h1 className="text-3xl font-bold text-foreground">CRM Integration</h1>
          <p className="text-sm text-muted-foreground">Connect and sync deals, contacts, and activities.</p>
        </div>
        <Card className="border border-border bg-card p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {["Salesforce", "HubSpot"].map((crm) => (
              <div key={crm} className="rounded-md border border-border p-4">
                <p className="font-semibold text-foreground">{crm}</p>
                <p className="text-xs text-muted-foreground">Status: Connected</p>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default SalesCrmIntegration;





