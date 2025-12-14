import { useParams } from "react-router-dom";
import { StrategySidebar } from "@/components/StrategySidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function StrategyComingSoon() {
  const { clientId } = useParams();

  return (
    <div className="flex h-screen w-full bg-background">
      <StrategySidebar />
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Construction className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Coming Soon</CardTitle>
            <CardDescription className="text-base">
              The Strategy department is currently under development. We're working hard to bring you powerful strategy tools and insights.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Stay tuned for market positioning, competitive analysis, and strategic planning features.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
