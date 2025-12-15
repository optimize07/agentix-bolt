import { DashboardComponent, DataBinding, DataFilter, SheetConfig } from './dataBinding';

export type TabType = 'canvas';

export interface DataSource {
  id: string;
  name: string;
  data: any[][];
}

export interface WidgetFormatting {
  prefix?: string;
  suffix?: string;
  decimals?: 0 | 1 | 2;
  useThousandsSeparator?: boolean;
}

export interface CanvasComponent {
  id: string;
  type: 'table' | 'lineChart' | 'barChart' | 'pieChart' | 'statsCard' | 'kpi' | 'sheet';
  position: { x: number; y: number; w: number; h: number };
  config: {
    title?: string;
    description?: string;
    value?: string;
    change?: string;
    trend?: 'up' | 'down';
    chartType?: string;
    colors?: string[];
    xAxisKey?: string;
    dataKey?: string;
    sheetData?: any[][];
    sheetConfig?: SheetConfig;
    formatting?: WidgetFormatting;
  };
  dataBinding?: DataBinding;
  formula?: {
    type: 'aggregation';
    operation: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
    sourceColumn: string;
    timeGrouping?: 'day' | 'week' | 'month' | 'year';
    filters?: {
      column: string;
      operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty';
      value: any;
    }[];
  };
  cellHistory?: Array<{
    row: number;
    col: number;
    oldValue: any;
    newValue: any;
    timestamp: number;
  }>;
  historyIndex?: number;
}

export interface Tab {
  id: string;
  name: string;
  type: 'canvas';
  order: number;
  components: CanvasComponent[];
  dataSources: DataSource[];
}
