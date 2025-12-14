import { StrategySidebar } from "@/components/StrategySidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

const StrategyKnowledgeBases = () => {
  return (
    <div className="flex h-screen w-full bg-background">
      <StrategySidebar />
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground">
              Knowledge Bases (FAQ, Offers)
            </h1>
            <p className="text-sm text-muted-foreground">
              Centralize FAQs and offer details for the entire organization.
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import Content
          </Button>
        </div>

        <Card className="border border-border bg-card p-6">
          <h3 className="text-lg font-bold text-foreground">Sources</h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Help Center / FAQs</li>
            <li>Offer pages and sales collateral</li>
            <li>Product docs and internal notes</li>
          </ul>
        </Card>
      </main>
    </div>
  );
};

export default StrategyKnowledgeBases;





