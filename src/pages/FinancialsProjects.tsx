import { FinancialsSidebar } from "@/components/FinancialsSidebar";

const FinancialsProjects = () => {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <FinancialsSidebar />
      <main className="flex-1 p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Financial Projects</h1>
          <p className="text-muted-foreground">Manage FP&A and finance automation projects.</p>
          <div className="mt-8 rounded-lg border border-border bg-card p-8 text-muted-foreground">
            Project management views coming soon.
          </div>
        </div>
      </main>
    </div>
  );
};

export default FinancialsProjects;





