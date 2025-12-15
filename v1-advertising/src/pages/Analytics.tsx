import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Analytics() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Deep dive into your advertising performance</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Advanced analytics dashboard coming soon. This will include detailed charts,
            conversion tracking, ROI analysis, and performance trends across all your campaigns.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
