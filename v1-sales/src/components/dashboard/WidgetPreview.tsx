import { DataBinding } from "@/types/dataBinding";
import StatsCard from "../StatsCard";
import DashboardBarChart from "../charts/DashboardBarChart";
import DashboardLineChart from "../charts/DashboardLineChart";
import DashboardPieChart from "../charts/DashboardPieChart";
import { Badge } from "../ui/badge";
import { TrendingUp } from "lucide-react";

interface WidgetPreviewProps {
  type: 'statsCard' | 'kpi' | 'lineChart' | 'barChart' | 'pieChart' | 'table' | 'sheet';
  config: {
    title?: string;
    description?: string;
    value?: string;
    change?: string;
    trend?: 'up' | 'down';
    formatting?: {
      prefix?: string;
      suffix?: string;
      decimals?: 0 | 1 | 2;
      useThousandsSeparator?: boolean;
    };
  };
  formula?: {
    type: 'aggregation';
    operation: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
    sourceColumn: string;
  };
  dataBinding?: DataBinding;
  previewData?: any[][];
}

export const WidgetPreview = ({ type, config, formula, dataBinding, previewData }: WidgetPreviewProps) => {
  // Extract chart data from preview data
  let chartData: any[] = [];
  if (previewData && previewData.length > 1) {
    const headers = previewData[0] || [];
    chartData = previewData.slice(1, 6).map((row) => {
      const obj: any = {};
      headers.forEach((header, idx) => {
        const columnKey = header && header.trim() !== '' ? header : `Column ${String.fromCharCode(65 + idx)}`;
        obj[columnKey] = row[idx];
      });
      return obj;
    }).filter(row => Object.values(row).some(val => val !== undefined && val !== ''));
  } else {
    // Sample data for preview when no real data
    chartData = [
      { name: 'Jan', value: 400 },
      { name: 'Feb', value: 300 },
      { name: 'Mar', value: 500 },
      { name: 'Apr', value: 450 },
    ];
  }

  const renderWidget = () => {
    switch (type) {
      case 'statsCard':
      case 'kpi':
        return (
          <StatsCard
            title={config.title || "Metric"}
            value={config.value || "0"}
            comparison={config.description || "vs last period"}
            change={config.change || "+0%"}
            trend={config.trend || "up"}
            icon={TrendingUp}
            formula={formula}
            sheetData={previewData}
            component={{ config: { formatting: config.formatting } }}
          />
        );
      case 'lineChart':
        return (
          <DashboardLineChart
            data={chartData}
            title={config.title || "Line Chart"}
            dataKey={dataBinding?.columns.y || 'value'}
            xAxisKey={dataBinding?.columns.x || 'name'}
          />
        );
      case 'barChart':
        return (
          <DashboardBarChart
            data={chartData}
            title={config.title || "Bar Chart"}
            dataKey={dataBinding?.columns.y || 'value'}
            xAxisKey={dataBinding?.columns.x || 'name'}
          />
        );
      case 'pieChart':
        return (
          <DashboardPieChart
            data={chartData}
            title={config.title || "Pie Chart"}
            dataKey={dataBinding?.columns.value || 'value'}
          />
        );
      case 'table':
      case 'sheet':
        return (
          <div className="p-4 border rounded-lg bg-card">
            <h3 className="text-sm font-semibold mb-2">{config.title || "Data Table"}</h3>
            <div className="text-xs text-muted-foreground">
              Table preview with {chartData.length} rows
            </div>
          </div>
        );
      default:
        return <div>Unknown widget type</div>;
    }
  };

  return (
    <div className="relative">
      <Badge className="absolute top-2 right-2 z-10 bg-primary/90">Preview</Badge>
      <div className="transform scale-90 origin-top-left">
        {renderWidget()}
      </div>
    </div>
  );
};
