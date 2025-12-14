import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const mockData = {
  spend: [
    { date: "Jan 1", value: 3200 },
    { date: "Jan 2", value: 3400 },
    { date: "Jan 3", value: 3100 },
    { date: "Jan 4", value: 3800 },
    { date: "Jan 5", value: 4200 },
    { date: "Jan 6", value: 3900 },
    { date: "Jan 7", value: 4500 },
  ],
  roas: [
    { date: "Jan 1", value: 3.8 },
    { date: "Jan 2", value: 4.1 },
    { date: "Jan 3", value: 3.9 },
    { date: "Jan 4", value: 4.3 },
    { date: "Jan 5", value: 4.2 },
    { date: "Jan 6", value: 4.5 },
    { date: "Jan 7", value: 4.8 },
  ],
  ctr: [
    { date: "Jan 1", value: 3.2 },
    { date: "Jan 2", value: 3.4 },
    { date: "Jan 3", value: 3.1 },
    { date: "Jan 4", value: 3.6 },
    { date: "Jan 5", value: 3.5 },
    { date: "Jan 6", value: 3.8 },
    { date: "Jan 7", value: 3.4 },
  ],
};

export const PerformanceChart = () => {
  const [activeTab, setActiveTab] = useState("spend");

  return (
    <div 
      className="rounded-lg p-6"
      style={{
        background: 'var(--card-bg)',
        border: 'var(--card-border-width) solid var(--card-border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <h2 className="text-xl font-semibold text-foreground mb-4">Performance Trends</h2>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="spend">Spend</TabsTrigger>
          <TabsTrigger value="roas">ROAS</TabsTrigger>
          <TabsTrigger value="ctr">CTR</TabsTrigger>
        </TabsList>

        {["spend", "roas", "ctr"].map((metric) => (
          <TabsContent key={metric} value={metric} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockData[metric as keyof typeof mockData]}>
                <defs>
                  <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill={`url(#gradient-${metric})`}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
