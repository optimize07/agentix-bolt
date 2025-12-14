import { FinancialsSidebar } from "@/components/FinancialsSidebar";

const FinancialsAnalytics = () => {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <FinancialsSidebar />
      <main className="flex-1 p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Financial Analytics</h1>
          <p className="text-muted-foreground">Charts and analysis coming soon.</p>
          <div className="mt-8 rounded-lg border border-border bg-card p-8 text-muted-foreground">
            Placeholder for analytics dashboards.
          </div>
        </div>
      </main>
    </div>
  );
};

export default FinancialsAnalytics;





