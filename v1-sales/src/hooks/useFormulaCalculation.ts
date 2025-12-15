import { useMemo } from 'react';

export interface FormulaFilter {
  column: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty';
  value: any;
}

export interface Formula {
  type: 'aggregation';
  operation: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
  sourceColumn: string;
  filters?: FormulaFilter[];
}

export const useFormulaCalculation = (formula: Formula | undefined, sheetData: any[][] | undefined) => {
  return useMemo(() => {
    if (!formula || !sheetData || sheetData.length === 0) {
      return null;
    }

    const headers = sheetData[0];
    const rows = sheetData.slice(1);
    const columnIndex = headers.indexOf(formula.sourceColumn);

    if (columnIndex === -1) {
      console.warn(`Column "${formula.sourceColumn}" not found in sheet`);
      return null;
    }

    // Extract values and apply filters
    let values = rows.map((row, rowIdx) => {
      const cellValue = row[columnIndex];
      
      // Apply filters
      if (formula.filters && formula.filters.length > 0) {
        let matches = true;
        for (const filter of formula.filters) {
          const filterColIndex = headers.indexOf(filter.column);
          if (filterColIndex === -1) continue;
          
          const filterValue = String(row[filterColIndex] || '').toLowerCase();
          const targetValue = String(filter.value || '').toLowerCase();
          
          let filterMatches = false;
          switch (filter.operator) {
            case 'equals':
              filterMatches = filterValue === targetValue;
              break;
            case 'contains':
              filterMatches = filterValue.includes(targetValue);
              break;
            case 'greaterThan':
              filterMatches = parseFloat(filterValue) > parseFloat(targetValue);
              break;
            case 'lessThan':
              filterMatches = parseFloat(filterValue) < parseFloat(targetValue);
              break;
            case 'isEmpty':
              filterMatches = filterValue === '';
              break;
            case 'isNotEmpty':
              filterMatches = filterValue !== '';
              break;
          }
          
          matches = matches && filterMatches;
        }
        
        if (!matches) return null;
      }
      
      return cellValue;
    }).filter(val => val !== null);

    // Convert to numbers for numeric operations
    const numericValues = values.map(v => parseFloat(String(v))).filter(v => !isNaN(v));

    // Perform calculation
    switch (formula.operation) {
      case 'SUM':
        return numericValues.reduce((acc, val) => acc + val, 0);
      case 'AVG':
        return numericValues.length > 0 
          ? numericValues.reduce((acc, val) => acc + val, 0) / numericValues.length 
          : 0;
      case 'COUNT':
        return values.length;
      case 'MIN':
        return numericValues.length > 0 ? Math.min(...numericValues) : 0;
      case 'MAX':
        return numericValues.length > 0 ? Math.max(...numericValues) : 0;
      default:
        return null;
    }
  }, [formula, sheetData]);
};

export const formatFormulaValue = (
  value: number | null, 
  operation: string,
  formatting?: {
    prefix?: string;
    suffix?: string;
    decimals?: 0 | 1 | 2;
    useThousandsSeparator?: boolean;
  }
): string => {
  if (value === null) return '—';
  
  // Use custom formatting if provided
  if (formatting) {
    const { 
      prefix = '', 
      suffix = '', 
      decimals = 2, 
      useThousandsSeparator = true 
    } = formatting;
    
    const formatted = useThousandsSeparator 
      ? value.toLocaleString('en-US', { 
          minimumFractionDigits: decimals, 
          maximumFractionDigits: decimals 
        })
      : value.toFixed(decimals);
      
    return `${prefix}${formatted}${suffix}`;
  }
  
  // Default formatting based on operation type
  switch (operation) {
    case 'COUNT':
      return value.toFixed(0);
    case 'SUM':
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'AVG':
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    default:
      return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
};
