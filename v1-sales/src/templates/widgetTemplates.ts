import { WidgetTemplate } from '@/types/template';

export const widgetTemplates: WidgetTemplate[] = [
  // Sheet templates
  {
    id: 'sheet-basic',
    name: 'Basic Sheet',
    description: 'Display raw data in a table format',
    icon: 'Table',
    widgetType: 'sheet',
    config: {
      title: 'Data Sheet',
    },
    defaultSize: { w: 6, h: 4 },
  },
  
  // Stats Card Templates
  {
    id: 'statscard-revenue',
    name: 'Total Revenue',
    description: 'Sum of revenue column',
    icon: 'DollarSign',
    widgetType: 'statsCard',
    config: {
      title: 'Total Revenue',
      formatting: { prefix: '$', decimals: 2, useThousandsSeparator: true }
    },
    suggestedBindings: {
      columnHint: 'revenue|amount|sales|price|total',
      aggregation: 'sum',
    },
    formula: {
      type: 'aggregation',
      operation: 'SUM',
    },
    defaultSize: { w: 2, h: 1 },
  },
  {
    id: 'statscard-users',
    name: 'Record Count',
    description: 'Count total records',
    icon: 'Users',
    widgetType: 'statsCard',
    config: {
      title: 'Total Records',
      formatting: { prefix: '', decimals: 0, useThousandsSeparator: true }
    },
    suggestedBindings: {
      aggregation: 'count',
    },
    formula: {
      type: 'aggregation',
      operation: 'COUNT',
    },
    defaultSize: { w: 2, h: 1 },
  },
  {
    id: 'statscard-conversion',
    name: 'Conversion Rate',
    description: 'Average as percentage',
    icon: 'Percent',
    widgetType: 'statsCard',
    config: {
      title: 'Conversion Rate',
      formatting: { prefix: '', suffix: '%', decimals: 1, useThousandsSeparator: false }
    },
    suggestedBindings: {
      columnHint: 'rate|percent|conversion|ratio',
      aggregation: 'avg',
    },
    formula: {
      type: 'aggregation',
      operation: 'AVG',
    },
    defaultSize: { w: 2, h: 1 },
  },
  {
    id: 'statscard-avg-order',
    name: 'Average Value',
    description: 'Calculate average',
    icon: 'Calculator',
    widgetType: 'statsCard',
    config: {
      title: 'Average Value',
      formatting: { prefix: '$', decimals: 2, useThousandsSeparator: true }
    },
    suggestedBindings: {
      columnHint: 'value|amount|price|cost',
      aggregation: 'avg',
    },
    formula: {
      type: 'aggregation',
      operation: 'AVG',
    },
    defaultSize: { w: 2, h: 1 },
  },
  
  // KPI Templates
  {
    id: 'kpi-growth',
    name: 'Growth Rate',
    description: 'Show percentage growth with trend',
    icon: 'TrendingUp',
    widgetType: 'kpi',
    config: {
      title: 'Growth Rate',
      formatting: { prefix: '', suffix: '%', decimals: 1, useThousandsSeparator: false }
    },
    defaultSize: { w: 2, h: 1 },
  },
  {
    id: 'kpi-target',
    name: 'Average Sale',
    description: 'Average value with currency',
    icon: 'Target',
    widgetType: 'kpi',
    config: {
      title: 'Average Sale',
      formatting: { prefix: '$', decimals: 2, useThousandsSeparator: true }
    },
    suggestedBindings: {
      columnHint: 'value|amount|price|cost',
      aggregation: 'avg',
    },
    formula: {
      type: 'aggregation',
      operation: 'AVG',
    },
    defaultSize: { w: 2, h: 1 },
  },
  {
    id: 'kpi-max',
    name: 'Maximum Value',
    description: 'Highest value in column',
    icon: 'ArrowUp',
    widgetType: 'kpi',
    config: {
      title: 'Peak Value',
      formatting: { prefix: '', decimals: 2, useThousandsSeparator: true }
    },
    suggestedBindings: {
      columnHint: 'value|amount|sales|quantity',
      aggregation: 'max',
    },
    formula: {
      type: 'aggregation',
      operation: 'MAX',
    },
    defaultSize: { w: 2, h: 1 },
  },
  {
    id: 'kpi-min',
    name: 'Minimum Value',
    description: 'Lowest value in column',
    icon: 'ArrowDown',
    widgetType: 'kpi',
    config: {
      title: 'Lowest Value',
      formatting: { prefix: '', decimals: 2, useThousandsSeparator: true }
    },
    suggestedBindings: {
      columnHint: 'value|amount|sales|quantity',
      aggregation: 'min',
    },
    formula: {
      type: 'aggregation',
      operation: 'MIN',
    },
    defaultSize: { w: 2, h: 1 },
  },

  // Line Chart templates
  {
    id: 'line-basic',
    name: 'Basic Line Chart',
    description: 'Show trends over time',
    icon: 'LineChart',
    widgetType: 'lineChart',
    config: {
      title: 'Trend Analysis',
      chartType: 'line',
    },
    defaultSize: { w: 4, h: 3 },
  },
  {
    id: 'line-performance',
    name: 'Performance Dashboard',
    description: 'Track performance metrics over time',
    icon: 'Activity',
    widgetType: 'lineChart',
    config: {
      title: 'Performance Metrics',
      chartType: 'line',
    },
    defaultSize: { w: 6, h: 3 },
  },
  {
    id: 'line-revenue',
    name: 'Revenue Trend',
    description: 'Track revenue over time',
    icon: 'DollarSign',
    widgetType: 'lineChart',
    config: {
      title: 'Revenue Trend',
      chartType: 'line',
    },
    defaultSize: { w: 6, h: 3 },
  },

  // Bar Chart templates
  {
    id: 'bar-basic',
    name: 'Basic Bar Chart',
    description: 'Compare values across categories',
    icon: 'BarChart3',
    widgetType: 'barChart',
    config: {
      title: 'Category Comparison',
      chartType: 'bar',
    },
    defaultSize: { w: 4, h: 3 },
  },
  {
    id: 'bar-monthly',
    name: 'Monthly Comparison',
    description: 'Compare metrics by month',
    icon: 'Calendar',
    widgetType: 'barChart',
    config: {
      title: 'Monthly Performance',
      chartType: 'bar',
    },
    defaultSize: { w: 6, h: 3 },
  },
  {
    id: 'bar-horizontal',
    name: 'Category Breakdown',
    description: 'Horizontal bar chart for rankings',
    icon: 'BarChart2',
    widgetType: 'barChart',
    config: {
      title: 'Top Categories',
      chartType: 'bar',
    },
    defaultSize: { w: 4, h: 3 },
  },
  {
    id: 'bar-sales',
    name: 'Sales by Region',
    description: 'Compare sales across regions',
    icon: 'MapPin',
    widgetType: 'barChart',
    config: {
      title: 'Sales by Region',
      chartType: 'bar',
    },
    defaultSize: { w: 6, h: 3 },
  },

  // Pie Chart templates
  {
    id: 'pie-basic',
    name: 'Basic Pie Chart',
    description: 'Show distribution of categories',
    icon: 'PieChart',
    widgetType: 'pieChart',
    config: {
      title: 'Distribution',
      chartType: 'pie',
    },
    defaultSize: { w: 3, h: 3 },
  },
  {
    id: 'pie-revenue-region',
    name: 'Revenue by Region',
    description: 'Regional revenue distribution',
    icon: 'MapPin',
    widgetType: 'pieChart',
    config: {
      title: 'Revenue by Region',
      chartType: 'pie',
    },
    defaultSize: { w: 4, h: 3 },
  },
  {
    id: 'pie-market-share',
    name: 'Market Share',
    description: 'Show market share distribution',
    icon: 'Target',
    widgetType: 'pieChart',
    config: {
      title: 'Market Share',
      chartType: 'pie',
    },
    defaultSize: { w: 4, h: 3 },
  },

  // Table Templates
  {
    id: 'table-basic',
    name: 'Basic Table',
    description: 'Display data in table format',
    icon: 'Table',
    widgetType: 'table',
    config: {
      title: 'Data Table',
    },
    defaultSize: { w: 6, h: 4 },
  },
];

export const getTemplatesByType = (type: string): WidgetTemplate[] => {
  return widgetTemplates.filter(t => t.widgetType === type);
};
