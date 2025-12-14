import { useParams, useNavigate } from "react-router-dom";
import { OperationsSidebar } from "@/components/OperationsSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const OperationsAutomation = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen w-full bg-background">
      <OperationsSidebar />
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
          <h1 className="text-3xl font-bold text-foreground">Process Automation</h1>
          <p className="text-sm text-muted-foreground">Configure and monitor automation workflows.</p>
        </div>
        <Card className="border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Automation Center</p>
          <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-md border border-border p-4">
              <p className="font-semibold text-foreground">New Automation</p>
              <p className="text-xs text-muted-foreground">Create a workflow to automate a process</p>
            </div>
            <div className="rounded-md border border-border p-4">
              <p className="font-semibold text-foreground">Active Runs</p>
              <p className="text-xs text-muted-foreground">View and manage current executions</p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default OperationsAutomation;





