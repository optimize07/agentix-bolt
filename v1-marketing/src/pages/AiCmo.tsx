import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

export default function AiCmo() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Lightbulb className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI CMO</h1>
          <p className="text-muted-foreground">Your AI marketing strategist</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Strategic Marketing Intelligence</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The AI CMO analyzes your campaigns, market trends, and performance data to provide
            strategic recommendations. This feature will help you make data-driven decisions
            about budget allocation, targeting, creative direction, and campaign optimization.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
