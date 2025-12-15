import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function MarketResearch() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Market Research</h1>
          <p className="text-muted-foreground">Industry insights and trend analysis</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Market Intelligence</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Stay ahead of market trends with comprehensive research tools. Analyze audience
            behavior, identify emerging opportunities, understand seasonal patterns, and
            discover untapped market segments. Use data-driven insights to inform your
            advertising strategy and stay competitive.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
