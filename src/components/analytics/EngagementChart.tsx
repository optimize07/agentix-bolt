import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const data7Days = [
  { name: "Mon", impressions: 4000, engagement: 2400, reach: 2400 },
  { name: "Tue", impressions: 3000, engagement: 1398, reach: 2210 },
  { name: "Wed", impressions: 2000, engagement: 9800, reach: 2290 },
  { name: "Thu", impressions: 2780, engagement: 3908, reach: 2000 },
  { name: "Fri", impressions: 1890, engagement: 4800, reach: 2181 },
  { name: "Sat", impressions: 2390, engagement: 3800, reach: 2500 },
  { name: "Sun", impressions: 3490, engagement: 4300, reach: 2100 },
];

const data30Days = [
  { name: "Week 1", impressions: 14000, engagement: 9400, reach: 8400 },
  { name: "Week 2", impressions: 18000, engagement: 11398, reach: 12210 },
  { name: "Week 3", impressions: 22000, engagement: 19800, reach: 15290 },
  { name: "Week 4", impressions: 26780, engagement: 23908, reach: 18000 },
];

export function EngagementChart() {
  const [period, setPeriod] = useState<"7d" | "30d">("7d");

  const data = period === "7d" ? data7Days : data30Days;

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Engagement Trends</CardTitle>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as "7d" | "30d")}>
          <TabsList className="h-8">
            <TabsTrigger value="7d" className="text-xs">7 Days</TabsTrigger>
            <TabsTrigger value="30d" className="text-xs">30 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="name" 
              className="text-xs fill-muted-foreground"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis 
              className="text-xs fill-muted-foreground"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--foreground))",
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="impressions" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="engagement" 
              stroke="hsl(var(--secondary))" 
              strokeWidth={2}
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="reach" 
              stroke="hsl(var(--accent))" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
