import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge } from "lucide-react";

export default function AdOptimizer() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Gauge className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ad Optimizer</h1>
          <p className="text-muted-foreground">AI-powered performance optimization</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Optimization Engine</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The Ad Optimizer analyzes your campaign performance and provides actionable
            recommendations. Get suggestions for improving targeting, adjusting budgets,
            optimizing creative elements, and scaling winning campaigns. The AI learns from
            your best performers to continuously improve results.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
