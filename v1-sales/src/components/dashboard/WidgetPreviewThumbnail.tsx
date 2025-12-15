import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface WidgetPreviewThumbnailProps {
  componentType: 'statsCard' | 'barChart' | 'lineChart' | 'pieChart';
  title: string;
  formula?: {
    operation: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
    sourceColumn: string;
  };
}

const generateSampleData = (type: string, operation?: string) => {
  if (type === 'statsCard') {
    const baseValue = operation === 'COUNT' ? 1247 : operation === 'AVG' ? 3542 : 125847;
    return { value: baseValue, trend: 12.5 };
  }
  
  if (type === 'barChart') {
    return [
      { name: 'A', value: 4000 },
      { name: 'B', value: 3000 },
      { name: 'C', value: 2000 },
      { name: 'D', value: 2780 },
      { name: 'E', value: 1890 },
    ];
  }
  
  if (type === 'lineChart') {
    return [
      { name: 'Jan', value: 4000 },
      { name: 'Feb', value: 3000 },
      { name: 'Mar', value: 5000 },
      { name: 'Apr', value: 4500 },
      { name: 'May', value: 6000 },
      { name: 'Jun', value: 5500 },
    ];
  }
  
  if (type === 'pieChart') {
    return [
      { name: 'A', value: 400 },
      { name: 'B', value: 300 },
      { name: 'C', value: 200 },
      { name: 'D', value: 100 },
    ];
  }
  
  return [];
};

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--primary) / 0.7)', 'hsl(var(--primary) / 0.5)', 'hsl(var(--primary) / 0.3)'];

export const WidgetPreviewThumbnail = ({ componentType, title, formula }: WidgetPreviewThumbnailProps) => {
  const data = generateSampleData(componentType, formula?.operation);
  
  if (componentType === 'statsCard') {
    const statsData = data as { value: number; trend: number };
    return (
      <div className="w-[140px] h-[90px] bg-card border border-border rounded-lg p-3 flex flex-col justify-between">
        <div className="text-[10px] text-muted-foreground truncate font-medium">
          {title}
        </div>
        <div>
          <div className="text-xl font-bold text-foreground">
            {statsData.value.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-primary">
            <TrendingUp size={10} />
            <span>{statsData.trend}%</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (componentType === 'barChart') {
    const barData = data as { name: string; value: number }[];
    return (
      <div className="w-[140px] h-[90px] bg-card border border-border rounded-lg p-2">
        <div className="text-[9px] text-muted-foreground truncate mb-1 font-medium px-1">
          {title}
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
  
  if (componentType === 'lineChart') {
    const lineData = data as { name: string; value: number }[];
    return (
      <div className="w-[140px] h-[90px] bg-card border border-border rounded-lg p-2">
        <div className="text-[9px] text-muted-foreground truncate mb-1 font-medium px-1">
          {title}
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={lineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
  
  if (componentType === 'pieChart') {
    const pieData = data as { name: string; value: number }[];
    return (
      <div className="w-[140px] h-[90px] bg-card border border-border rounded-lg p-2">
        <div className="text-[9px] text-muted-foreground truncate mb-1 font-medium px-1">
          {title}
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={18}
              outerRadius={28}
              paddingAngle={2}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }
  
  return null;
};
