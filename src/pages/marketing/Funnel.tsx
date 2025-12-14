import { GitBranch } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketingSidebar } from "@/components/MarketingSidebar";

const MarketingFunnel = () => {
  return (
    <div className="flex min-h-screen w-full" style={{ background: "var(--page-bg)" }}>
      <MarketingSidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Funnel</h1>
          <p className="text-muted-foreground">Design and optimize your marketing funnels</p>
        </div>

        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>Funnel builder and optimization tools are under development.</CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            Build, visualize, and optimize your customer journey funnels.
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MarketingFunnel;
