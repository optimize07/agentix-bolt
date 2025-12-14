import { FinancialsSidebar } from "@/components/FinancialsSidebar";

const FinancialsReports = () => {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <FinancialsSidebar />
      <main className="flex-1 p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Finance Reports</h1>
          <p className="text-muted-foreground">Generate and download departmental reports.</p>
          <div className="mt-8 rounded-lg border border-border bg-card p-8 text-muted-foreground">
            Reporting utilities coming soon.
          </div>
        </div>
      </main>
    </div>
  );
};

export default FinancialsReports;





