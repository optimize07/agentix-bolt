import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { BarChart3, LineChart, PieChart, Table2, TrendingUp, Grid3x3 } from "lucide-react";

interface WidgetPaletteProps {
  onAddWidget: (type: string) => void;
}

const widgets = [
  { type: 'statsCard', name: 'Stats Card', icon: TrendingUp, description: 'Single metric with trend' },
  { type: 'lineChart', name: 'Line Chart', icon: LineChart, description: 'Time series data' },
  { type: 'barChart', name: 'Bar Chart', icon: BarChart3, description: 'Compare values' },
  { type: 'pieChart', name: 'Pie Chart', icon: PieChart, description: 'Show proportions' },
  { type: 'table', name: 'Data Table', icon: Table2, description: 'Detailed records' },
  { type: 'kpi', name: 'KPI Indicator', icon: Grid3x3, description: 'Goal tracking' },
];

const WidgetPalette = ({ onAddWidget }: WidgetPaletteProps) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Widgets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {widgets.map((widget) => {
          const Icon = widget.icon;
          return (
            <Button
              key={widget.type}
              variant="outline"
              className="w-full justify-start h-auto p-3"
              onClick={() => onAddWidget(widget.type)}
            >
              <div className="flex items-start gap-3 text-left">
                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="text-primary" size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{widget.name}</div>
                  <div className="text-xs text-muted-foreground">{widget.description}</div>
                </div>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default WidgetPalette;
