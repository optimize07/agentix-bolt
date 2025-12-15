import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganization } from "@/contexts/OrganizationContext";

const Analytics = () => {
  return (
    <AppLayout>
      <Header />
      
      <main className="mt-20 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive insights into your business performance</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <Card className="bg-card/50 backdrop-blur-xl border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Sales Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Sales analytics coming soon...</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Growth analytics coming soon...</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Customer Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Customer analytics coming soon...</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Revenue analytics coming soon...</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppLayout>
  );
};

export default Analytics;
