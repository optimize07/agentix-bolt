export interface ColumnAnalysis {
  name: string;
  dataType: 'numeric' | 'date' | 'categorical' | 'text' | 'boolean';
  uniqueValues: number;
  nullCount: number;
  sampleValues: any[];
  isTimeSeries: boolean;
}

export interface DataAnalysis {
  columns: ColumnAnalysis[];
  rowCount: number;
  hasDateColumn: boolean;
  hasNumericColumn: boolean;
  hasCategoricalColumn: boolean;
  dateColumn?: string;
  numericColumns: string[];
  categoricalColumns: string[];
  textColumns: string[];
  suggestedChartTypes: string[];
}

export interface SmartPrompt {
  text: string;
  icon: string;
  chartType: 'lineChart' | 'barChart' | 'pieChart' | 'statsCard' | 'kpi';
  config?: any;
}

function detectDataType(values: any[]): 'numeric' | 'date' | 'categorical' | 'text' | 'boolean' {
  const nonNullValues = values.filter(v => v != null && v !== '');
  
  if (nonNullValues.length === 0) return 'text';
  
  // Check for boolean
  const booleanPattern = /^(true|false|yes|no|0|1)$/i;
  if (nonNullValues.every(v => booleanPattern.test(String(v)))) {
    return 'boolean';
  }
  
  // Check for numeric
  const numericCount = nonNullValues.filter(v => !isNaN(Number(v))).length;
  if (numericCount / nonNullValues.length > 0.9) {
    return 'numeric';
  }
  
  // Check for date
  const dateCount = nonNullValues.filter(v => {
    const parsed = Date.parse(String(v));
    return !isNaN(parsed);
  }).length;
  if (dateCount / nonNullValues.length > 0.8) {
    return 'date';
  }
  
  // Check for categorical (low unique values)
  const uniqueValues = new Set(nonNullValues.map(v => String(v))).size;
  if (uniqueValues < 20 && uniqueValues < nonNullValues.length * 0.5) {
    return 'categorical';
  }
  
  return 'text';
}

export function analyzeData(data: any[][]): DataAnalysis {
  if (!data || data.length === 0) {
    return {
      columns: [],
      rowCount: 0,
      hasDateColumn: false,
      hasNumericColumn: false,
      hasCategoricalColumn: false,
      numericColumns: [],
      categoricalColumns: [],
      textColumns: [],
      suggestedChartTypes: [],
    };
  }
  
  const headers = data[0];
  const rows = data.slice(1);
  
  const columns: ColumnAnalysis[] = headers.map((header, colIndex) => {
    const columnValues = rows.map(row => row[colIndex]);
    const nonNullValues = columnValues.filter(v => v != null && v !== '');
    const uniqueValues = new Set(nonNullValues).size;
    const nullCount = columnValues.length - nonNullValues.length;
    
    const dataType = detectDataType(columnValues);
    
    return {
      name: String(header),
      dataType,
      uniqueValues,
      nullCount,
      sampleValues: nonNullValues.slice(0, 5),
      isTimeSeries: dataType === 'date',
    };
  });
  
  const dateColumns = columns.filter(c => c.dataType === 'date');
  const numericColumns = columns.filter(c => c.dataType === 'numeric');
  const categoricalColumns = columns.filter(c => c.dataType === 'categorical');
  const textColumns = columns.filter(c => c.dataType === 'text');
  
  const suggestedChartTypes: string[] = [];
  
  if (dateColumns.length > 0 && numericColumns.length > 0) {
    suggestedChartTypes.push('lineChart');
  }
  
  if (categoricalColumns.length > 0 && numericColumns.length > 0) {
    suggestedChartTypes.push('barChart', 'pieChart');
  }
  
  if (numericColumns.length > 0) {
    suggestedChartTypes.push('statsCard', 'kpi');
  }
  
  return {
    columns,
    rowCount: rows.length,
    hasDateColumn: dateColumns.length > 0,
    hasNumericColumn: numericColumns.length > 0,
    hasCategoricalColumn: categoricalColumns.length > 0,
    dateColumn: dateColumns[0]?.name,
    numericColumns: numericColumns.map(c => c.name),
    categoricalColumns: categoricalColumns.map(c => c.name),
    textColumns: textColumns.map(c => c.name),
    suggestedChartTypes,
  };
}

export function generateSmartPrompts(analysis: DataAnalysis, widgetType?: string): SmartPrompt[] {
  const prompts: SmartPrompt[] = [];

  // Count all records
  prompts.push({
    text: `Count all ${analysis.rowCount} records`,
    icon: 'Hash',
    chartType: 'statsCard',
    config: {
      title: 'Total Records',
      formula: { type: 'aggregation', operation: 'COUNT' },
      formatting: { decimals: 0, useThousandsSeparator: true }
    }
  });

  // Time series analysis
  if (analysis.hasDateColumn && analysis.hasNumericColumn && analysis.dateColumn && analysis.numericColumns[0]) {
    prompts.push({
      text: `Show ${analysis.numericColumns[0]} trend over time`,
      icon: 'TrendingUp',
      chartType: 'lineChart',
      config: {
        dataBinding: {
          columns: { 
            x: analysis.dateColumn, 
            y: analysis.numericColumns[0] 
          }
        }
      }
    });
    
    prompts.push({
      text: `Compare ${analysis.numericColumns[0]} by month`,
      icon: 'Calendar',
      chartType: 'barChart',
      config: {
        dataBinding: {
          columns: { 
            x: analysis.dateColumn, 
            y: analysis.numericColumns[0] 
          }
        }
      }
    });
  }

  // Comparison analysis
  if (analysis.hasCategoricalColumn && analysis.hasNumericColumn && 
      analysis.categoricalColumns[0] && analysis.numericColumns[0]) {
    prompts.push({
      text: `Compare ${analysis.numericColumns[0]} by ${analysis.categoricalColumns[0]}`,
      icon: 'BarChart3',
      chartType: 'barChart',
      config: {
        dataBinding: {
          columns: { 
            x: analysis.categoricalColumns[0], 
            y: analysis.numericColumns[0] 
          }
        }
      }
    });
  }

  // Distribution analysis
  if (analysis.categoricalColumns.length > 0 && analysis.numericColumns.length > 0) {
    prompts.push({
      text: `Show ${analysis.categoricalColumns[0]} distribution`,
      icon: 'PieChart',
      chartType: 'pieChart',
      config: {
        dataBinding: {
          columns: { 
            label: analysis.categoricalColumns[0], 
            value: analysis.numericColumns[0] 
          }
        }
      }
    });
    
    if (analysis.categoricalColumns.length > 1) {
      prompts.push({
        text: `Group by ${analysis.categoricalColumns[1]}`,
        icon: 'Layers',
        chartType: 'pieChart',
        config: {
          dataBinding: {
            columns: { 
              label: analysis.categoricalColumns[1], 
              value: analysis.numericColumns[0] 
            }
          }
        }
      });
    }
  }

  // Aggregation prompts for numeric data
  if (analysis.numericColumns.length > 0) {
    const col = analysis.numericColumns[0];
    
    prompts.push({
      text: `Calculate total ${col}`,
      icon: 'DollarSign',
      chartType: 'statsCard',
      config: {
        title: `Total ${col}`,
        formula: { type: 'aggregation', operation: 'SUM', sourceColumn: col },
        formatting: { prefix: '$', decimals: 2, useThousandsSeparator: true }
      }
    });
    
    prompts.push({
      text: `Average ${col}`,
      icon: 'Calculator',
      chartType: 'kpi',
      config: {
        title: `Average ${col}`,
        formula: { type: 'aggregation', operation: 'AVG', sourceColumn: col },
        formatting: { prefix: '', decimals: 2, useThousandsSeparator: true }
      }
    });
    
    prompts.push({
      text: `Show highest ${col}`,
      icon: 'ArrowUp',
      chartType: 'kpi',
      config: {
        title: `Highest ${col}`,
        formula: { type: 'aggregation', operation: 'MAX', sourceColumn: col },
        formatting: { prefix: '', decimals: 2, useThousandsSeparator: true }
      }
    });
    
    prompts.push({
      text: `Show lowest ${col}`,
      icon: 'ArrowDown',
      chartType: 'kpi',
      config: {
        title: `Lowest ${col}`,
        formula: { type: 'aggregation', operation: 'MIN', sourceColumn: col },
        formatting: { prefix: '', decimals: 2, useThousandsSeparator: true }
      }
    });
  }

  // Filter by widget type if needed
  return prompts.filter(p => !widgetType || p.chartType === widgetType || ['statsCard', 'kpi'].includes(widgetType));
}
