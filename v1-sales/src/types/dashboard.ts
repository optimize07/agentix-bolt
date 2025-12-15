// Sheet is now just for data - no dashboard type
export interface Sheet {
  id: string;
  name: string;
  data: any[][];
}

// Dashboard templates for initial creation
export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: 'sales' | 'analytics' | 'finance' | 'ecommerce' | 'blank';
  preview: string;
  widgets: any[]; // Will use DashboardWidget from dataBinding.ts
}

// Main widget interface
export interface DashboardWidget {
  id: string;
  type: 'statsCard' | 'lineChart' | 'barChart' | 'pieChart' | 'table' | 'kpi';
  position: { x: number; y: number; w: number; h: number };
  config: WidgetConfig;
  dataSource?: string;
}

export interface WidgetConfig {
  title?: string;
  description?: string;
  value?: string;
  change?: string;
  trend?: 'up' | 'down';
  chartType?: string;
  dataKey?: string;
  xAxisKey?: string;
  yAxisKey?: string;
  colors?: string[];
}

// Legacy aliases for backward compatibility
export type DashboardComponent = DashboardWidget;
export type ComponentConfig = WidgetConfig;
