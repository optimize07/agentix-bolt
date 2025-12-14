export interface DataBinding {
  sheetId: string;
  range?: string;
  columns: {
    x?: string;
    y?: string;
    value?: string;
    label?: string;
  };
  filters?: DataFilter[];
  aggregation?: "sum" | "avg" | "count" | "min" | "max" | "none";
}

export interface DataFilter {
  column: string;
  operator: "equals" | "contains" | "greaterThan" | "lessThan";
  value: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  components: DashboardComponent[];
  createdAt: string;
  updatedAt: string;
}

export interface WidgetFormatting {
  prefix?: string;
  suffix?: string;
  decimals?: 0 | 1 | 2;
  useThousandsSeparator?: boolean;
}

export interface DashboardComponent {
  id: string;
  type: "statsCard" | "lineChart" | "barChart" | "pieChart" | "table" | "kpi";
  position: { x: number; y: number; w: number; h: number };
  dataBinding?: DataBinding;
  config: {
    title?: string;
    description?: string;
    value?: string;
    change?: string;
    trend?: "up" | "down";
    chartType?: string;
    colors?: string[];
    xAxisKey?: string;
    dataKey?: string;
    sheetData?: any[][];
    sheetConfig?: SheetConfig;
    formatting?: WidgetFormatting;
  };
}

export interface SheetConfig {
  visibleColumns?: string[];
  columnOrder?: string[];
  columnWidths?: Record<string, number>;
  columnNames?: Record<string, string>;
  columnTypes?: Record<string, "text" | "number" | "currency" | "percentage" | "date" | "boolean">;
  rowHeights?: Record<number, number>;
  filters?: FilterRule[];
  sorting?: SortRule;
  cellStyles?: Record<string, CellStyle>;
  defaultRowHeight?: number;
  rowsPerPage?: number;
}

export interface CellStyle {
  backgroundColor?: string;
  textColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface FilterRule {
  id: string;
  column: string;
  operator: "equals" | "contains" | "greaterThan" | "lessThan" | "isEmpty" | "isNotEmpty";
  value: any;
  logic?: "AND" | "OR";
}

export interface SortRule {
  column: string;
  direction: "asc" | "desc";
}
