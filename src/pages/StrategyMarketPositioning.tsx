import { StrategySidebar } from "@/components/StrategySidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

const StrategyMarketPositioning = () => {
  return (
    <div className="flex h-screen w-full bg-background">
      <StrategySidebar />
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground">
              Market Positioning Plan
            </h1>
            <p className="text-sm text-muted-foreground">
              Define positioning, audience segments, and differentiators.
            </p>
          </div>
          <Button className="gap-2">
            <Play className="h-4 w-4" />
            Run Plan
          </Button>
        </div>

        <Card className="border border-border bg-card p-6">
          <h3 className="text-lg font-bold text-foreground">Outline</h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Value proposition</li>
            <li>Target personas and segments</li>
            <li>Competitive landscape</li>
            <li>Messaging pillars</li>
            <li>Go-to-market recommendations</li>
          </ul>
        </Card>
      </main>
    </div>
  );
};

export default StrategyMarketPositioning;





