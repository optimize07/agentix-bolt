import { useParams } from "react-router-dom";
import { FinancialsSidebar } from "@/components/FinancialsSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function FinancialsComingSoon() {
  const { clientId } = useParams();

  return (
    <div className="flex h-screen w-full bg-background">
      <FinancialsSidebar />
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Construction className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Coming Soon</CardTitle>
            <CardDescription className="text-base">
              The Financials department is currently under development. We're building comprehensive financial management tools for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Stay tuned for financial analytics, reporting, and project tracking features.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
