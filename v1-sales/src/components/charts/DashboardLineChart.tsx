import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganization } from "@/contexts/OrganizationContext";

interface DashboardLineChartProps {
  title?: string;
  data?: any[];
  dataKey?: string;
  xAxisKey?: string;
}

const defaultData = [
  { month: 'Jan', revenue: 4000 },
  { month: 'Feb', revenue: 3000 },
  { month: 'Mar', revenue: 5000 },
  { month: 'Apr', revenue: 4500 },
  { month: 'May', revenue: 6000 },
  { month: 'Jun', revenue: 5500 },
];

const DashboardLineChart = ({ 
  title = 'Line Chart', 
  data = defaultData,
  dataKey = 'revenue',
  xAxisKey = 'month'
}: DashboardLineChartProps) => {
  const { getLabel } = useOrganization();
  
  // Translate data keys if they're business term keys
  const translateKey = (key: string) => {
    const isTermKey = key.includes('.') && (
      key.startsWith('metric.') || 
      key.startsWith('entity.') || 
      key.startsWith('activity.') || 
      key.startsWith('stage.')
    );
    return isTermKey ? (getLabel(key) || key) : key;
  };
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey={xAxisKey} className="text-muted-foreground" />
            <YAxis className="text-muted-foreground" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))' }}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default DashboardLineChart;
