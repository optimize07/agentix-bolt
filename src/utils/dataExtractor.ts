import { DataBinding } from "@/types/dataBinding";

export interface Sheet {
  id: string;
  name: string;
  data: any[][];
}

export const extractData = (sheets: Sheet[], binding?: DataBinding) => {
  if (!binding) return [];

  const sheet = sheets.find((s) => s.id === binding.sheetId);
  if (!sheet) return [];

  const data = sheet.data;
  if (!data || data.length === 0) return [];

  // Parse range if provided (e.g., "A1:B10")
  let startRow = 0;
  let endRow = data.length;
  let startCol = 0;
  let endCol = data[0]?.length || 0;

  if (binding.range) {
    const rangeMatch = binding.range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
    if (rangeMatch) {
      startCol = columnToIndex(rangeMatch[1]);
      startRow = parseInt(rangeMatch[2]) - 1;
      endCol = columnToIndex(rangeMatch[3]) + 1;
      endRow = parseInt(rangeMatch[4]);
    }
  }

  // Extract data based on column mappings
  const result: any[] = [];
  const headers = data[0] || [];

  // Find column indices
  const xColIndex = binding.columns.x ? findColumnIndex(headers, binding.columns.x) : -1;
  const yColIndex = binding.columns.y ? findColumnIndex(headers, binding.columns.y) : -1;
  const valueColIndex = binding.columns.value ? findColumnIndex(headers, binding.columns.value) : -1;
  const labelColIndex = binding.columns.label ? findColumnIndex(headers, binding.columns.label) : -1;

  // Extract rows
  for (let i = Math.max(startRow, 1); i < Math.min(endRow, data.length); i++) {
    const row = data[i];
    if (!row) continue;

    const item: any = {};

    if (xColIndex >= 0 && row[xColIndex] !== undefined) {
      item.x = row[xColIndex];
    }
    if (yColIndex >= 0 && row[yColIndex] !== undefined) {
      item.y = row[yColIndex];
    }
    if (valueColIndex >= 0 && row[valueColIndex] !== undefined) {
      item.value = row[valueColIndex];
    }
    if (labelColIndex >= 0 && row[labelColIndex] !== undefined) {
      item.label = row[labelColIndex];
    }

    // Apply filters
    if (binding.filters && binding.filters.length > 0) {
      let passesFilters = true;
      for (const filter of binding.filters) {
        const colIndex = findColumnIndex(headers, filter.column);
        if (colIndex >= 0) {
          const cellValue = row[colIndex];
          if (!applyFilter(cellValue, filter.operator, filter.value)) {
            passesFilters = false;
            break;
          }
        }
      }
      if (!passesFilters) continue;
    }

    result.push(item);
  }

  // Apply aggregation if needed
  if (binding.aggregation && binding.aggregation !== "none") {
    return applyAggregation(result, binding.aggregation);
  }

  return result;
};

const columnToIndex = (col: string): number => {
  let index = 0;
  for (let i = 0; i < col.length; i++) {
    index = index * 26 + (col.charCodeAt(i) - 64);
  }
  return index - 1;
};

const findColumnIndex = (headers: any[], columnName: string): number => {
  // Try exact match first
  const exactIndex = headers.findIndex((h) => h === columnName);
  if (exactIndex >= 0) return exactIndex;

  // Try case-insensitive match
  const lowerColumnName = columnName.toLowerCase();
  const caseInsensitiveIndex = headers.findIndex(
    (h) => typeof h === "string" && h.toLowerCase() === lowerColumnName
  );
  if (caseInsensitiveIndex >= 0) return caseInsensitiveIndex;

  // Try column letter (A, B, C, etc.)
  if (/^[A-Z]+$/.test(columnName)) {
    return columnToIndex(columnName);
  }

  return -1;
};

const applyFilter = (value: any, operator: string, filterValue: string): boolean => {
  const strValue = String(value).toLowerCase();
  const strFilterValue = filterValue.toLowerCase();

  switch (operator) {
    case "equals":
      return strValue === strFilterValue;
    case "contains":
      return strValue.includes(strFilterValue);
    case "greaterThan":
      return parseFloat(value) > parseFloat(filterValue);
    case "lessThan":
      return parseFloat(value) < parseFloat(filterValue);
    default:
      return true;
  }
};

const applyAggregation = (data: any[], type: string): any[] => {
  if (data.length === 0) return [];

  const values = data.map((d) => parseFloat(d.value || d.y || 0)).filter((v) => !isNaN(v));

  let result = 0;
  switch (type) {
    case "sum":
      result = values.reduce((a, b) => a + b, 0);
      break;
    case "avg":
      result = values.reduce((a, b) => a + b, 0) / values.length;
      break;
    case "count":
      result = data.length;
      break;
    case "min":
      result = Math.min(...values);
      break;
    case "max":
      result = Math.max(...values);
      break;
  }

  return [{ value: result }];
};

export const getAvailableSheets = (sheets: Sheet[]) => {
  return sheets.map((s) => ({
    id: s.id,
    name: s.name,
    columns: s.data[0] || [],
  }));
};

export const getSheetColumns = (sheets: Sheet[], sheetId: string): string[] => {
  const sheet = sheets.find((s) => s.id === sheetId);
  if (!sheet || !sheet.data[0]) return [];
  return sheet.data[0].map((col: any, index: number) => col || `Column ${String.fromCharCode(65 + index)}`);
};
