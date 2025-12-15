import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganization } from "@/contexts/OrganizationContext";

interface DashboardBarChartProps {
  title?: string;
  data?: any[];
  dataKey?: string;
  xAxisKey?: string;
}

const defaultData = [
  { product: 'Product A', sales: 4000 },
  { product: 'Product B', sales: 3000 },
  { product: 'Product C', sales: 2000 },
  { product: 'Product D', sales: 2780 },
  { product: 'Product E', sales: 1890 },
];

const DashboardBarChart = ({ 
  title = 'Bar Chart', 
  data = defaultData,
  dataKey = 'sales',
  xAxisKey = 'product'
}: DashboardBarChartProps) => {
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
          <BarChart data={data}>
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
            <Bar dataKey={dataKey} fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} isAnimationActive={true} animationDuration={800} animationEasing="ease-out" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default DashboardBarChart;
