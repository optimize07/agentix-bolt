import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

const Leaderboards = () => {
  return (
    <AppLayout>
      <div className="fixed top-0 left-64 right-0 bg-background border-b border-border z-40">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-foreground">Leaderboards</h1>
        </div>
      </div>
      <div className="pt-[73px] p-6">
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-primary" />
                <CardTitle>Sales Leaderboards</CardTitle>
              </div>
              <CardDescription>Top performers and rankings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Leaderboards functionality coming soon
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Leaderboards;
