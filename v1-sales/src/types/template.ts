export interface WidgetTemplate {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  widgetType: 'lineChart' | 'barChart' | 'pieChart' | 'statsCard' | 'sheet' | 'kpi' | 'table';
  config: any;
  sampleData?: any[][];
  defaultSize?: { w: number; h: number };
  suggestedBindings?: {
    columnHint?: string;
    aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
  };
  formula?: {
    type?: 'aggregation';
    operation?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
    sourceColumn?: string;
  };
}

export interface WidgetTemplateCategory {
  [widgetType: string]: WidgetTemplate[];
}
