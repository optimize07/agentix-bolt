import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function AdSpyHeader() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Competitor Ads</h2>
        <p className="text-sm text-muted-foreground">Track and analyze competitor advertising</p>
      </div>
      <Button className="gap-2">
        <Plus className="w-4 h-4" />
        New Analysis
      </Button>
    </div>
  );
}
