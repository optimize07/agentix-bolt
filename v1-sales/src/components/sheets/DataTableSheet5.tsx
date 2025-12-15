import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Maximize2, Download, Upload, Trash2, Settings, Plus, PlusCircle, GripVertical, Type, Calculator, Undo, Redo, ArrowUpDown, Paintbrush, X, MoreVertical } from "lucide-react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "../ui/context-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import React from "react";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { SheetConfig, CellStyle } from "@/types/dataBinding";
import { SheetMaximizeDialog } from "../dashboard/SheetMaximizeDialog";
import { formatFormulaValue } from "@/hooks/useFormulaCalculation";
import { toast } from "sonner";

interface DataTableProps {
  data: any[][];
  config?: SheetConfig;
  title?: string;
  isEditMode?: boolean;
  onCellChange: (rowIndex: number, colIndex: number, value: any) => void;
  onCellClick: (rowIndex: number, colIndex: number) => void;
  activeCell: { row: number; col: number } | null;
  onDeleteRow: (rowIndex: number) => void;
  onImportData?: (data: any[][], showAiSuggestions?: boolean) => void;
  onDelete?: () => void;
  onOpenConfig?: () => void;
  onUpdateConfig?: (config: SheetConfig) => void;
  onTitleChange?: (newTitle: string) => void;
  cellHistory?: Array<{ row: number; col: number; oldValue: any; newValue: any; timestamp: number }>;
  historyIndex?: number;
  onHistoryChange?: (history: Array<{ row: number; col: number; oldValue: any; newValue: any; timestamp: number }>, index: number) => void;
}

const DataTableSheet5 = ({ data, config, title, isEditMode = true, onCellChange, onCellClick, activeCell, onDeleteRow, onImportData, onDelete, onOpenConfig, onUpdateConfig, onTitleChange, cellHistory: externalHistory, historyIndex: externalHistoryIndex, onHistoryChange }: DataTableProps) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title || 'Untitled Sheet');
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<{ index: number; startX: number; startWidth: number } | null>(null);
  const [columnWidthsLocal, setColumnWidthsLocal] = useState<Record<string, number> | null>(null);
  const [rowNumbersWidth, setRowNumbersWidth] = useState<number>(40);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectedColumns, setSelectedColumns] = useState<Set<number>>(new Set());
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [lastClickedCell, setLastClickedCell] = useState<{ row: number; col: number } | null>(null);
  const [editingHeader, setEditingHeader] = useState<number | null>(null);
  const [cellStyles, setCellStyles] = useState<Record<string, CellStyle>>({});
  const [editingRowLabel, setEditingRowLabel] = useState<number | null>(null);
  const [rowLabels, setRowLabels] = useState<Record<number, string>>({});
  const [cellHistory, setCellHistory] = useState<Array<{ row: number; col: number; oldValue: any; newValue: any; timestamp: number }>>(externalHistory || []);
  const [historyIndex, setHistoryIndex] = useState(externalHistoryIndex ?? -1);
  const [showFormulaBuilder, setShowFormulaBuilder] = useState(false);
  const [formulaTargetCell, setFormulaTargetCell] = useState<{ row: number; col: number } | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [resizingRowNumbers, setResizingRowNumbers] = useState<{ startX: number; startWidth: number } | null>(null);
  const [bgColorPicker, setBgColorPicker] = useState('#ffffff');
  const [textColorPicker, setTextColorPicker] = useState('#000000');
  const [editingValue, setEditingValue] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement>(null);
  
  // Sync color pickers with selected cells
  useEffect(() => {
    if (selectedCells.size === 1) {
      const [cellKey] = Array.from(selectedCells);
      const existingStyle = cellStyles[cellKey];
      if (existingStyle?.backgroundColor) {
        setBgColorPicker(existingStyle.backgroundColor);
      } else {
        setBgColorPicker('#ffffff');
      }
      if (existingStyle?.textColor) {
        setTextColorPicker(existingStyle.textColor);
      } else {
        setTextColorPicker('#000000');
      }
    } else if (selectedCells.size === 0) {
      setBgColorPicker('#ffffff');
      setTextColorPicker('#000000');
    }
  }, [selectedCells, cellStyles]);
  
  // Focus input when entering edit mode and initialize editing value
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      const currentValue = data[editingCell.row]?.[editingCell.col] ?? '';
      setEditingValue(String(currentValue));
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell, data]);
  
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  const handleExport = () => {
    const csv = data.map(row => 
      row.map(cell => {
        const str = String(cell || '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'sheet'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): any[][] => {
    const lines = text.split(/\r?\n/);
    const result: any[][] = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const row: any[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      row.push(current.trim());
      result.push(row);
    }
    
    if (result.length > 0) {
      const maxCols = result[0].length;
      for (let i = 1; i < result.length; i++) {
        while (result[i].length < maxCols) {
          result[i].push('');
        }
      }
    }
    
    return result;
  };

  const handleImport = (showAiSuggestions?: boolean) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const rows = parseCSV(text);
        
        if (onImportData && rows.length > 0) {
          onImportData(rows, showAiSuggestions);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  useEffect(() => {
    if (config?.columnWidths) {
      setColumnWidthsLocal(config.columnWidths);
    }
  }, [config]);

  useEffect(() => {
    if (config?.cellStyles) {
      setCellStyles(config.cellStyles);
    }
  }, [config?.cellStyles]);

  const handleAddRow = () => {
    if (!onImportData) return;
    const baseData = (data && data.length > 0) ? data : processedDataSource;
    if (!baseData) return;
    const columnCount = baseData[0]?.length || 5;
    const newRow = Array(columnCount).fill('');
    const updatedData = [...baseData, newRow];
    onImportData(updatedData, false);
    toast.success("Row added");
  };

  const handleAddColumn = () => {
    if (!onImportData || !data || data.length === 0) return;
    
    const updatedData = data.map((row, idx) => {
      const newColumnName = idx === 0 ? `Column ${row.length + 1}` : '';
      return [...row, newColumnName];
    });
    
    onImportData(updatedData, false);
    
    if (onUpdateConfig) {
      const headerRow = updatedData[0] || [];
      const newHeaderName = headerRow[headerRow.length - 1];
      let nextConfig = { ...(config || {}) };
      const currentVisible = nextConfig.visibleColumns || headerRow.slice(0, -1);
      nextConfig.visibleColumns = [...currentVisible, newHeaderName];
      onUpdateConfig(nextConfig);
    }
    
    toast.success(`Column added`);
  };

  const handleRemoveColumn = (colIndex: number) => {
    if (!onImportData || !data) return;
    if (data[0].length <= 1) {
      toast.error("Cannot delete the last column");
      return;
    }
    
    const headerName = data[0][colIndex];
    const updatedData = data.map(row => row.filter((_, idx) => idx !== colIndex));
    onImportData(updatedData, false);
    toast.success(`Column deleted`);
    
    if (onUpdateConfig) {
      let nextConfig = { ...(config || {}) };
      
      if (nextConfig.visibleColumns) {
        nextConfig.visibleColumns = nextConfig.visibleColumns.filter(col => col !== headerName);
      }
      
      if (nextConfig.columnWidths) {
        const { [headerName]: _, ...rest } = nextConfig.columnWidths;
        nextConfig.columnWidths = rest;
      }
      
      if (nextConfig.columnNames) {
        const { [headerName]: _, ...rest } = nextConfig.columnNames;
        nextConfig.columnNames = rest;
      }

      if (nextConfig.columnTypes) {
        const { [headerName]: _, ...rest } = nextConfig.columnTypes;
        nextConfig.columnTypes = rest;
      }
      
      if (nextConfig.filters) {
        nextConfig.filters = nextConfig.filters.filter(f => f.column !== headerName);
      }
      
      if (nextConfig.sorting?.column === headerName) {
        nextConfig.sorting = undefined;
      }
      
      onUpdateConfig(nextConfig);
    }
  };

  const handleHeaderRename = (colIndex: number, newValue: string) => {
    if (!onImportData || !data) return;
    const oldHeaderName = data[0][colIndex];
    const updatedData = data.map((row, idx) => {
      if (idx === 0) {
        return row.map((cell, idx) => idx === colIndex ? newValue : cell);
      }
      return row;
    });
    onImportData(updatedData, false);
    
    if (onUpdateConfig && oldHeaderName !== newValue) {
      let nextConfig = { ...(config || {}) };
      
      if (nextConfig.visibleColumns) {
        nextConfig.visibleColumns = nextConfig.visibleColumns.map(col => 
          col === oldHeaderName ? newValue : col
        );
      }
      
      if (nextConfig.columnWidths?.[oldHeaderName]) {
        const { [oldHeaderName]: width, ...rest } = nextConfig.columnWidths;
        nextConfig.columnWidths = { ...rest, [newValue]: width };
      }
      
      if (nextConfig.columnNames?.[oldHeaderName]) {
        const { [oldHeaderName]: name, ...rest } = nextConfig.columnNames;
        nextConfig.columnNames = { ...rest, [newValue]: name };
      }

      if (nextConfig.columnTypes?.[oldHeaderName]) {
        const { [oldHeaderName]: type, ...rest } = nextConfig.columnTypes;
        nextConfig.columnTypes = { ...rest, [newValue]: type };
      }
      
      if (nextConfig.filters) {
        nextConfig.filters = nextConfig.filters.map(f => 
          f.column === oldHeaderName ? { ...f, column: newValue } : f
        );
      }
      
      if (nextConfig.sorting?.column === oldHeaderName) {
        nextConfig.sorting = { ...nextConfig.sorting, column: newValue };
      }
      
      onUpdateConfig(nextConfig);
    }
  };

  let processedDataSource = data;
  if (!data || data.length === 0) {
    const starterHeaders = ['Column 1', 'Column 2', 'Column 3', 'Column 4', 'Column 5'];
    const starterRows = Array.from({ length: 15 }, () => Array(starterHeaders.length).fill(''));
    processedDataSource = [starterHeaders, ...starterRows];
    
    if (onImportData) {
      setTimeout(() => onImportData(processedDataSource, false), 0);
    }
  }

  const applyFilters = (rows: any[][]) => {
    if (!config?.filters || config.filters.length === 0) return rows;
    
    const headers = data[0] || [];
    return rows.filter((row, index) => {
      if (index === 0) return true;
      
      let result = true;
      config.filters?.forEach((filter, filterIndex) => {
        const colIndex = headers.indexOf(filter.column);
        if (colIndex === -1) return;
        
        const cellValue = String(row[colIndex] || '').toLowerCase();
        const filterValue = String(filter.value || '').toLowerCase();
        
        let matches = false;
        switch (filter.operator) {
          case 'equals':
            matches = cellValue === filterValue;
            break;
          case 'contains':
            matches = cellValue.includes(filterValue);
            break;
          case 'greaterThan':
            matches = parseFloat(cellValue) > parseFloat(filterValue);
            break;
          case 'lessThan':
            matches = parseFloat(cellValue) < parseFloat(filterValue);
            break;
          case 'isEmpty':
            matches = cellValue === '';
            break;
          case 'isNotEmpty':
            matches = cellValue !== '';
            break;
        }
        
        if (filterIndex === 0) {
          result = matches;
        } else {
          result = filter.logic === 'OR' ? result || matches : result && matches;
        }
      });
      
      return result;
    });
  };

  const applySorting = (rows: any[][]) => {
    if (!config?.sorting) return rows;
    
    const headers = data[0] || [];
    const colIndex = headers.indexOf(config.sorting.column);
    if (colIndex === -1) return rows;
    
    const headerRow = rows[0];
    const dataRows = rows.slice(1);
    
    const sorted = [...dataRows].sort((a, b) => {
      const aVal = a[colIndex];
      const bVal = b[colIndex];
      
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return config.sorting!.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      if (config.sorting!.direction === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
    
    return [headerRow, ...sorted];
  };

  const applyColumnConfig = (rows: any[][]) => {
    if (!config?.visibleColumns || config.visibleColumns.length === 0) return rows;
    
    const headers = data[0] || [];
    const visibleIndices = config.visibleColumns
      .map(col => headers.indexOf(col))
      .filter(idx => idx !== -1);
    
    if (visibleIndices.length === 0) return rows;
    
    return rows.map(row => visibleIndices.map(idx => row[idx]));
  };

  let processedData = [...processedDataSource];
  processedData = applyFilters(processedData);
  processedData = applySorting(processedData);
  processedData = applyColumnConfig(processedData);

  const headers = processedData[0] || [];

  const handleCellDoubleClick = (row: number, col: number) => {
    setEditingCell({ row, col });
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const handleInputChange = (row: number, col: number, value: string) => {
    if (row === 0) {
      handleHeaderRename(col, value);
    } else {
      const numValue = !isNaN(Number(value)) && value !== "" ? Number(value) : value;
      onCellChange(row, col, numValue);
    }
  };

  const formatCellValue = (cell: any, headerName: string, rowIndex: number) => {
    if (rowIndex === 0) return cell;
    if (cell === null || cell === undefined || cell === '') return '\u00A0';
    
    const dataType = config?.columnTypes?.[headerName];
    
    switch (dataType) {
      case 'currency':
        const currencyNum = typeof cell === 'number' ? cell : parseFloat(cell);
        return isNaN(currencyNum) ? cell : `$${currencyNum.toFixed(2)}`;
      case 'percentage':
        const percentNum = typeof cell === 'number' ? cell : parseFloat(cell);
        return isNaN(percentNum) ? cell : `${(percentNum * 100).toFixed(1)}%`;
      case 'date':
        const date = new Date(cell);
        return isNaN(date.getTime()) ? cell : date.toLocaleDateString();
      case 'boolean':
        return cell ? 'Yes' : 'No';
      case 'number':
        const num = typeof cell === 'number' ? cell : parseFloat(cell);
        return isNaN(num) ? cell : num.toLocaleString();
      default:
        if (typeof cell === "number" && (headerName.toLowerCase().includes('revenue') || headerName.toLowerCase().includes('price') || headerName.toLowerCase().includes('amount') || headerName.toLowerCase().includes('cost'))) {
          return `$${cell.toFixed(2)}`;
        }
        return cell;
    }
  };

  const startColumnResize = (e: React.MouseEvent, colIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const headerName = headers[colIndex];
    const currentWidth = columnWidthsLocal?.[headerName] || config?.columnWidths?.[headerName] || 150;
    setResizingColumn({ index: colIndex, startX: e.clientX, startWidth: currentWidth });
  };

  const startRowNumbersResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingRowNumbers({ startX: e.clientX, startWidth: rowNumbersWidth });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingColumn) {
        const delta = e.clientX - resizingColumn.startX;
        const newWidth = Math.max(50, resizingColumn.startWidth + delta);
        const headerName = headers[resizingColumn.index];
        
        setColumnWidthsLocal(prev => ({
          ...(prev || {}),
          [headerName]: newWidth,
        }));
      } else if (resizingRowNumbers) {
        const delta = e.clientX - resizingRowNumbers.startX;
        const newWidth = Math.max(30, Math.min(100, resizingRowNumbers.startWidth + delta));
        setRowNumbersWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (resizingColumn && onUpdateConfig) {
        const updatedConfig = {
          ...(config || {}),
          columnWidths: columnWidthsLocal || config?.columnWidths,
        };
        onUpdateConfig(updatedConfig);
      } else if (resizingRowNumbers) {
        toast.success(`Row numbers column width set to ${rowNumbersWidth}px`);
      }
      setResizingColumn(null);
      setResizingRowNumbers(null);
    };

    if (resizingColumn || resizingRowNumbers) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingColumn, resizingRowNumbers, headers, onUpdateConfig, columnWidthsLocal, rowNumbersWidth]);

  // Formula parsing and calculation
  const parseFormula = (cell: any): { isFormula: boolean; operation?: string; column?: string } => {
    if (typeof cell !== 'string' || !cell.startsWith('=')) {
      return { isFormula: false };
    }
    const match = cell.match(/^=(SUM|AVG|COUNT|MIN|MAX)\(([^)]+)\)$/i);
    if (match) {
      return { isFormula: true, operation: match[1].toUpperCase(), column: match[2] };
    }
    return { isFormula: false };
  };

  const calculateFormula = (formula: string, rowIndex: number, colIndex: number): number | null => {
    const parsed = parseFormula(formula);
    if (!parsed.isFormula || !parsed.operation || !parsed.column) return null;

    const headers = processedDataSource[0];
    const columnIndex = headers.indexOf(parsed.column);
    if (columnIndex === -1) return null;

    const rows = processedDataSource.slice(1);
    const values = rows.map(row => parseFloat(String(row[columnIndex]))).filter(v => !isNaN(v));

    switch (parsed.operation) {
      case 'SUM':
        return values.reduce((acc, val) => acc + val, 0);
      case 'AVG':
        return values.length > 0 ? values.reduce((acc, val) => acc + val, 0) / values.length : 0;
      case 'COUNT':
        return values.length;
      case 'MIN':
        return values.length > 0 ? Math.min(...values) : 0;
      case 'MAX':
        return values.length > 0 ? Math.max(...values) : 0;
      default:
        return null;
    }
  };


  // Bulk actions
  const toggleRowSelection = (rowIndex: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowIndex)) {
      newSelected.delete(rowIndex);
    } else {
      newSelected.add(rowIndex);
    }
    setSelectedRows(newSelected);
  };

  const toggleColumnSelection = (colIndex: number) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(colIndex)) {
      newSelected.delete(colIndex);
    } else {
      newSelected.add(colIndex);
    }
    setSelectedColumns(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedRows.size === 0) return;
    
    const sortedIndexes = Array.from(selectedRows).sort((a, b) => b - a);
    sortedIndexes.forEach(index => {
      onDeleteRow(index);
    });
    setSelectedRows(new Set());
    toast.success(`Deleted ${sortedIndexes.length} rows`);
  };

  const handleBulkDeleteColumns = () => {
    if (selectedColumns.size === 0) return;
    const sortedIndexes = Array.from(selectedColumns).sort((a, b) => b - a);
    sortedIndexes.forEach(index => {
      handleRemoveColumn(index);
    });
    setSelectedColumns(new Set());
    toast.success(`Deleted ${sortedIndexes.length} columns`);
  };

  const handleCellColorChange = useCallback((color: string, type: 'background' | 'text') => {
    // Build complete set of cells to color (including row/column selections)
    const cellsToColor = new Set(selectedCells);
    
    // Add all cells from selected rows
    selectedRows.forEach(rowIndex => {
      headers.forEach((_, colIndex) => {
        cellsToColor.add(`${rowIndex}-${colIndex}`);
      });
    });
    
    // Add all cells from selected columns
    selectedColumns.forEach(colIndex => {
      processedData.slice(1).forEach((_, dataRowIndex) => {
        const rowIndex = dataRowIndex + 1;
        cellsToColor.add(`${rowIndex}-${colIndex}`);
      });
    });
    
    if (cellsToColor.size === 0) return;
    
    const newStyles = { ...cellStyles };
    cellsToColor.forEach(cellKey => {
      if (!newStyles[cellKey]) {
        newStyles[cellKey] = {};
      }
      if (type === 'background') {
        newStyles[cellKey].backgroundColor = color;
      } else {
        newStyles[cellKey].textColor = color;
      }
    });
    
    setCellStyles(newStyles);
    
    if (onUpdateConfig) {
      onUpdateConfig({
        ...config,
        cellStyles: newStyles,
      });
    }
    
    toast.success(`Applied ${type} color to ${cellsToColor.size} cells`);
  }, [selectedCells, selectedRows, selectedColumns, cellStyles, config, onUpdateConfig, headers, processedData]);

  const handleClearFormatting = useCallback(() => {
    // Build complete set of cells to clear (including row/column selections)
    const cellsToClear = new Set(selectedCells);
    
    // Add all cells from selected rows
    selectedRows.forEach(rowIndex => {
      headers.forEach((_, colIndex) => {
        cellsToClear.add(`${rowIndex}-${colIndex}`);
      });
    });
    
    // Add all cells from selected columns
    selectedColumns.forEach(colIndex => {
      processedData.slice(1).forEach((_, dataRowIndex) => {
        const rowIndex = dataRowIndex + 1;
        cellsToClear.add(`${rowIndex}-${colIndex}`);
      });
    });
    
    if (cellsToClear.size === 0) return;
    
    const newStyles = { ...cellStyles };
    cellsToClear.forEach(cellKey => {
      delete newStyles[cellKey];
    });
    
    setCellStyles(newStyles);
    setSelectedCells(new Set());
    setSelectedRows(new Set());
    setSelectedColumns(new Set());
    
    if (onUpdateConfig) {
      onUpdateConfig({
        ...config,
        cellStyles: newStyles,
      });
    }
    
    toast.success(`Cleared formatting from ${cellsToClear.size} cells`);
  }, [selectedCells, selectedRows, selectedColumns, cellStyles, config, onUpdateConfig, headers, processedData]);

  const handleMultiCellEdit = useCallback((value: any) => {
    if (selectedCells.size === 0) return;
    
    if (!onImportData || !data) return;
    
    const updatedData = data.map((row, rowIndex) => 
      row.map((cell, colIndex) => {
        const cellKey = `${rowIndex}-${colIndex}`;
        return selectedCells.has(cellKey) ? value : cell;
      })
    );
    
    onImportData(updatedData, false);
    setSelectedCells(new Set());
    toast.success(`Updated ${selectedCells.size} cells`);
  }, [selectedCells, data, onImportData]);

  const handleDeleteSelectedCells = useCallback(() => {
    if (selectedCells.size === 0) return;
    
    if (!onImportData || !data) return;
    
    const updatedData = data.map((row, rowIndex) => 
      row.map((cell, colIndex) => {
        const cellKey = `${rowIndex}-${colIndex}`;
        return selectedCells.has(cellKey) ? '' : cell;
      })
    );
    
    onImportData(updatedData, false);
    setSelectedCells(new Set());
    toast.success(`Cleared ${selectedCells.size} cells`);
  }, [selectedCells, data, onImportData]);

  // Combined drag and drop handler
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const activeId = String(active.id);
      const overId = String(over.id);
      
      // Check if dragging a column (ID starts with 'col-')
      if (activeId.startsWith('col-')) {
        const oldIndex = parseInt(activeId.replace('col-', ''));
        const newIndex = parseInt(overId.replace('col-', ''));
        
        if (!onImportData || !data) return;
        
        // Reorder all rows including header
        const reorderedData = data.map(row => {
          const newRow = [...row];
          const [movedItem] = newRow.splice(oldIndex, 1);
          newRow.splice(newIndex, 0, movedItem);
          return newRow;
        });
        
        onImportData(reorderedData, false);
        
        // Update config if needed
        if (onUpdateConfig && config) {
          const headerRow = data[0];
          const newHeaderRow = reorderedData[0];
          
          let nextConfig = { ...config };
          
          // Update column widths
          if (nextConfig.columnWidths) {
            const newWidths: Record<string, number> = {};
            newHeaderRow.forEach((header, idx) => {
              const oldHeader = headerRow[idx];
              if (nextConfig.columnWidths?.[oldHeader]) {
                newWidths[header] = nextConfig.columnWidths[oldHeader];
              }
            });
            nextConfig.columnWidths = newWidths;
          }
          
          // Update column types
          if (nextConfig.columnTypes) {
            const newTypes: Record<string, any> = {};
            newHeaderRow.forEach((header, idx) => {
              const oldHeader = headerRow[idx];
              if (nextConfig.columnTypes?.[oldHeader]) {
                newTypes[header] = nextConfig.columnTypes[oldHeader];
              }
            });
            nextConfig.columnTypes = newTypes;
          }
          
          // Update visible columns
          if (nextConfig.visibleColumns) {
            nextConfig.visibleColumns = arrayMove(
              nextConfig.visibleColumns,
              oldIndex,
              newIndex
            );
          }
          
          onUpdateConfig(nextConfig);
        }
        
        toast.success("Column reordered");
      } else {
        // Dragging a row
        const oldIndex = parseInt(activeId);
        const newIndex = parseInt(overId);
        
        if (!onImportData || !data) return;
        
        const headerRow = data[0];
        const dataRows = data.slice(1);
        const reorderedRows = arrayMove(dataRows, oldIndex - 1, newIndex - 1);
        const updatedData = [headerRow, ...reorderedRows];
        
        onImportData(updatedData, false);
        toast.success("Row reordered");
      }
    }
  }, [data, onImportData, config, onUpdateConfig]);

  // Cell history and undo/redo
  const recordChange = useCallback((row: number, col: number, oldValue: any, newValue: any) => {
    const newHistory = cellHistory.slice(0, historyIndex + 1);
    newHistory.push({ row, col, oldValue, newValue, timestamp: Date.now() });
    const newIndex = newHistory.length - 1;
    setCellHistory(newHistory);
    setHistoryIndex(newIndex);
    
    // Notify parent about history change
    if (onHistoryChange) {
      onHistoryChange(newHistory, newIndex);
    }
  }, [cellHistory, historyIndex, onHistoryChange]);

  const handleUndo = useCallback(() => {
    if (historyIndex < 0) return;
    const change = cellHistory[historyIndex];
    onCellChange(change.row, change.col, change.oldValue);
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    
    // Notify parent
    if (onHistoryChange) {
      onHistoryChange(cellHistory, newIndex);
    }
    toast.success("Undone");
  }, [historyIndex, cellHistory, onCellChange, onHistoryChange]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= cellHistory.length - 1) return;
    const change = cellHistory[historyIndex + 1];
    onCellChange(change.row, change.col, change.newValue);
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    
    // Notify parent
    if (onHistoryChange) {
      onHistoryChange(cellHistory, newIndex);
    }
    toast.success("Redone");
  }, [historyIndex, cellHistory, onCellChange, onHistoryChange]);


  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if we're in edit mode - let the input handle keys
      if (editingCell) return;
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Escape') {
        setSelectedCells(new Set());
        setSelectedRows(new Set());
        setSelectedColumns(new Set());
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const allCells = new Set<string>();
        processedData.slice(1).forEach((row, rowIdx) => {
          row.forEach((_, colIdx) => {
            allCells.add(`${rowIdx + 1}-${colIdx}`);
          });
        });
        setSelectedCells(allCells);
      } else if (e.key === 'Delete' && selectedCells.size > 0) {
        e.preventDefault();
        handleDeleteSelectedCells();
      } else if (e.key === 'Enter' && activeCell && !editingCell) {
        e.preventDefault();
        setEditingCell({ row: activeCell.row, col: activeCell.col });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, processedData, selectedCells, handleDeleteSelectedCells, editingCell, activeCell]);

  useEffect(() => {
    if (config?.cellStyles) {
      setCellStyles(config.cellStyles);
    }
  }, [config?.cellStyles]);

  // Quick column type selector
  const handleColumnTypeChange = useCallback((colIndex: number, type: 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'boolean') => {
    if (!onUpdateConfig) return;
    const headerName = headers[colIndex];
    const nextConfig = {
      ...(config || {}),
      columnTypes: {
        ...(config?.columnTypes || {}),
        [headerName]: type,
      },
    };
    onUpdateConfig(nextConfig);
    toast.success(`Column type set to ${type}`);
  }, [config, headers, onUpdateConfig]);


  // Sortable row component
  const SortableRow = ({ rowIndex, row, children }: { rowIndex: number; row: any[]; children: React.ReactNode }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: rowIndex });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <tr
        ref={setNodeRef}
        style={style}
        className="hover:bg-accent/20 transition-colors group/row relative"
      >
        <td 
          style={{ width: `${rowNumbersWidth}px`, minWidth: `${rowNumbersWidth}px` }}
          className={`sticky left-0 px-1 py-2 text-xs text-center font-mono border-r border-b border-border/40 group/rownum z-10 cursor-pointer ${
            selectedRows.has(rowIndex) 
              ? 'bg-primary/30 border-r-2 border-primary' 
              : 'bg-accent/10'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (e.ctrlKey || e.metaKey) {
              toggleRowSelection(rowIndex);
            } else if (e.shiftKey && selectedRows.size > 0) {
              const lastSelected = Math.max(...Array.from(selectedRows));
              const start = Math.min(lastSelected, rowIndex);
              const end = Math.max(lastSelected, rowIndex);
              const newSelected = new Set(selectedRows);
              for (let i = start; i <= end; i++) {
                newSelected.add(i);
              }
              setSelectedRows(newSelected);
            } else {
              setSelectedRows(new Set([rowIndex]));
            }
          }}
        >
          <div className="flex items-center justify-center gap-1">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing opacity-0 group-hover/row:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <GripVertical size={12} className="text-muted-foreground" />
            </div>
            {editingRowLabel === rowIndex ? (
              <Input
                type="text"
                value={rowLabels[rowIndex] || String(rowIndex)}
                onChange={(e) => setRowLabels(prev => ({ ...prev, [rowIndex]: e.target.value }))}
                onBlur={() => setEditingRowLabel(null)}
                className="h-5 w-12 text-xs text-center p-0"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingRowLabel(rowIndex);
                }}
                className="cursor-pointer hover:text-accent min-w-[16px]"
              >
                {rowLabels[rowIndex] || rowIndex}
              </span>
            )}
          </div>
        </td>
        {children}
      </tr>
    );
  };

  // Sortable column header component
  const SortableHeader = ({ 
    colIndex, 
    headerName, 
    displayName, 
    columnWidth, 
    children 
  }: { 
    colIndex: number; 
    headerName: string;
    displayName: string;
    columnWidth?: number;
    children: React.ReactNode;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: `col-${colIndex}` });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      ...(columnWidth ? { width: `${columnWidth}px`, minWidth: `${columnWidth}px` } : {}),
    };

    const isEditing = editingHeader === colIndex;

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <td
            ref={setNodeRef}
            style={style}
            className={`px-4 py-3 text-sm border-b border-border/40 relative font-semibold group/header cursor-pointer ${
              selectedColumns.has(colIndex)
                ? 'bg-primary/30 border-b-2 border-primary'
                : 'bg-accent/10'
            }`}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (!target.closest('button') && !target.closest('input') && !(target as HTMLElement).classList.contains('cursor-col-resize')) {
                if (e.ctrlKey || e.metaKey) {
                  toggleColumnSelection(colIndex);
                } else {
                  setSelectedColumns(new Set([colIndex]));
                }
              }
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingHeader(colIndex);
            }}
          >
            <div className="flex items-center justify-between gap-2" {...attributes} {...listeners}>
              <div className="flex items-center gap-2 flex-1">
                {isEditing ? (
                  <Input
                    type="text"
                    value={displayName}
                    onChange={(e) => handleHeaderRename(colIndex, e.target.value)}
                    onBlur={() => setEditingHeader(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingHeader(null);
                      if (e.key === 'Escape') setEditingHeader(null);
                      e.stopPropagation();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="h-6 text-sm font-semibold px-2"
                    autoFocus
                  />
                ) : (
                  <span>{displayName}</span>
                )}
              </div>
              {children}
            </div>
          </td>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => setEditingHeader(colIndex)}>
            Rename Column
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleRemoveColumn(colIndex)}>
            Delete Column
          </ContextMenuItem>
          <ContextMenuItem onClick={() => {
            if (!onImportData || !data) return;
            const updatedData = data.map((row, idx) => {
              const newRow = [...row];
              const newValue = idx === 0 ? `Column ${row.length + 1}` : '';
              newRow.splice(colIndex, 0, newValue);
              return newRow;
            });
            onImportData(updatedData, false);
            toast.success("Column inserted");
          }}>
            Insert Column Left
          </ContextMenuItem>
          <ContextMenuItem onClick={() => {
            if (!onImportData || !data) return;
            const updatedData = data.map((row, idx) => {
              const newRow = [...row];
              const newValue = idx === 0 ? `Column ${row.length + 1}` : '';
              newRow.splice(colIndex + 1, 0, newValue);
              return newRow;
            });
            onImportData(updatedData, false);
            toast.success("Column inserted");
          }}>
            Insert Column Right
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  // Sync title changes
  useEffect(() => {
    setEditedTitle(title || 'Untitled Sheet');
  }, [title]);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (onTitleChange && editedTitle !== title) {
      onTitleChange(editedTitle);
    }
  };

  return (
    <Card className="h-full flex flex-col group relative overflow-hidden border-0 shadow-2xl backdrop-blur-xl bg-background/40">
      <TooltipProvider>
        {/* Redesigned toolbar - all left-aligned */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-lg">
          <div className="flex items-center gap-3 px-4 py-2.5">
            {/* Editable Title */}
            {isEditMode && onTitleChange ? (
              isEditingTitle ? (
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTitleBlur();
                    }
                  }}
                  className="h-7 text-sm font-semibold max-w-xs"
                  autoFocus
                />
              ) : (
                <div
                  onClick={() => setIsEditingTitle(true)}
                  className="text-sm font-semibold cursor-pointer hover:text-primary transition-colors px-2 py-1 rounded hover:bg-accent/20"
                >
                  {editedTitle}
                </div>
              )
            ) : (
              <div className="text-sm font-semibold px-2 py-1">
                {title || 'Untitled Sheet'}
              </div>
            )}
            <Separator orientation="vertical" className="h-5" />
            {isEditMode && onImportData && (
              <>
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleAddRow}>
                  <Plus size={14} className="mr-1" />
                  Row
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleAddColumn}>
                  <PlusCircle size={14} className="mr-1" />
                  Column
                </Button>
                <Separator orientation="vertical" className="h-5" />
              </>
            )}
            
            {/* Undo/Redo */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={handleUndo}
                  disabled={historyIndex < 0}
                >
                  <Undo size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={handleRedo}
                  disabled={historyIndex >= cellHistory.length - 1}
                >
                  <Redo size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
            </Tooltip>
            
            <Separator orientation="vertical" className="h-5" />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowTypeSelector(true)}>
                  <Type size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Column Types</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowFormulaBuilder(true)}>
                  <Calculator size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Formula Builder</TooltipContent>
            </Tooltip>
            
            <Separator orientation="vertical" className="h-5" />
            
            {onOpenConfig && isEditMode && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onOpenConfig}>
                    <Settings size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Configure</TooltipContent>
              </Tooltip>
            )}
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExport}>
                  <Download size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export CSV</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleImport(true)}>
                  <Upload size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Import CSV</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMaximized(true)}>
                  <Maximize2 size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Maximize</TooltipContent>
            </Tooltip>
            
            {onDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={onDelete}>
                    <Trash2 size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Sheet</TooltipContent>
              </Tooltip>
            )}
            
            <Separator orientation="vertical" className="h-5" />
            
            {/* Cell Styling Tools */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 relative overflow-hidden"
                    disabled={selectedCells.size === 0 && selectedRows.size === 0 && selectedColumns.size === 0}
                  >
                    <Paintbrush size={14} />
                    <div 
                      className="absolute bottom-0 left-1 right-1 h-1 rounded-full"
                      style={{ backgroundColor: bgColorPicker }}
                    />
                  </Button>
                  <input
                    type="color"
                    value={bgColorPicker}
                    className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    disabled={selectedCells.size === 0 && selectedRows.size === 0 && selectedColumns.size === 0}
                    onChange={(e) => {
                      setBgColorPicker(e.target.value);
                      handleCellColorChange(e.target.value, 'background');
                    }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>Cell Background Color</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    disabled={selectedCells.size === 0 && selectedRows.size === 0 && selectedColumns.size === 0}
                    style={{
                      color: selectedCells.size > 0 ? textColorPicker : 'currentColor'
                    }}
                  >
                    <Type size={14} />
                  </Button>
                  <input
                    type="color"
                    value={textColorPicker}
                    className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    disabled={selectedCells.size === 0 && selectedRows.size === 0 && selectedColumns.size === 0}
                    onChange={(e) => {
                      setTextColorPicker(e.target.value);
                      handleCellColorChange(e.target.value, 'text');
                    }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>Text Color</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  disabled={selectedCells.size === 0 && selectedRows.size === 0 && selectedColumns.size === 0}
                  onClick={handleClearFormatting}
                >
                  <X size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear Formatting</TooltipContent>
            </Tooltip>
            
            <Separator orientation="vertical" className="h-5" />


            {(selectedRows.size > 0 || selectedColumns.size > 0) && (
              <>
                <span className="text-sm text-muted-foreground">
                  {selectedRows.size > 0 && `${selectedRows.size} rows`}
                  {selectedRows.size > 0 && selectedColumns.size > 0 && ', '}
                  {selectedColumns.size > 0 && `${selectedColumns.size} columns`} selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (selectedRows.size > 0) handleBulkDelete();
                    if (selectedColumns.size > 0) handleBulkDeleteColumns();
                  }}
                  className="h-7"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </>
            )}
            
            {title && (
              <>
                <Separator orientation="vertical" className="h-5" />
                <span className="text-sm font-semibold">{title}</span>
              </>
            )}
          </div>
        </div>
      </TooltipProvider>
      
      <CardContent className="p-0 flex-1 relative">
        <div className="absolute inset-0 overflow-scroll sheet-scroll-container">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table className="w-full border-collapse min-w-[1000px]">
              <tbody>
                {/* Header row with sortable columns */}
                {processedData.length > 0 && (
                  <tr className="sticky top-0 z-20">
                    <td 
                      style={{ width: `${rowNumbersWidth}px`, minWidth: `${rowNumbersWidth}px` }}
                      className="sticky left-0 px-1 py-2 text-xs text-center font-mono bg-accent/10 border-r border-b border-border/40 z-30 relative"
                    >
                      #
                      {isEditMode && (
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1.5 bg-border/40 hover:bg-primary/60 cursor-col-resize transition-colors z-10"
                          onMouseDown={(e) => startRowNumbersResize(e)}
                        />
                      )}
                    </td>
                    
                    <SortableContext items={processedData[0].map((_, idx) => `col-${idx}`)}>
                      {processedData[0].map((cell, colIndex) => {
                        const headerName = headers[colIndex];
                        const displayName = config?.columnNames?.[headerName] || headerName;
                        const columnWidth = columnWidthsLocal?.[headerName] || config?.columnWidths?.[headerName];

                        return (
                          <SortableHeader
                            key={colIndex}
                            colIndex={colIndex}
                            headerName={headerName}
                            displayName={displayName}
                            columnWidth={columnWidth}
                          >
                            {isEditMode && (
                              <div 
                                className="absolute right-0 top-0 bottom-0 w-1.5 bg-border/40 hover:bg-primary/60 cursor-col-resize transition-colors z-10"
                                onMouseDown={(e) => startColumnResize(e, colIndex)}
                              />
                            )}
                          </SortableHeader>
                        );
                      })}
                    </SortableContext>
                  </tr>
                )}
                
                {/* Data rows with drag and drop */}
                <SortableContext items={processedData.slice(1).map((_, idx) => idx + 1)} strategy={verticalListSortingStrategy}>
                  {processedData.slice(1).map((row, dataRowIndex) => {
                    const rowIndex = dataRowIndex + 1;
                    
                    return (
                      <SortableRow key={rowIndex} rowIndex={rowIndex} row={row}>
                        {row.map((cell, colIndex) => {
                          const isEditing = isEditMode && editingCell?.row === rowIndex && editingCell?.col === colIndex;
                          const isActive = activeCell?.row === rowIndex && activeCell?.col === colIndex;
                          const headerName = headers[colIndex];
                          const columnWidth = columnWidthsLocal?.[headerName] || config?.columnWidths?.[headerName];
                          const cellKey = `${rowIndex}-${colIndex}`;
                          const cellStyle = cellStyles[cellKey];

                          return (
                            <td
                              key={colIndex}
                              style={{
                                ...(columnWidth ? { width: `${columnWidth}px`, minWidth: `${columnWidth}px` } : {}),
                                ...(cellStyle?.backgroundColor && {
                                  backgroundColor: cellStyle.backgroundColor,
                                }),
                                ...(cellStyle?.textColor && {
                                  color: cellStyle.textColor,
                                }),
                              }}
                              className={`text-sm border-b border-r border-border/40 relative transition-colors ${
                                isEditing
                                  ? "p-0 ring-2 ring-primary"
                                  : "px-4 py-2 " + (selectedCells.has(cellKey)
                                    ? "ring-2 ring-primary ring-inset bg-primary/5" 
                                    : isActive 
                                      ? "ring-1 ring-primary ring-inset bg-primary/5" 
                                      : (selectedRows.has(rowIndex) || selectedColumns.has(colIndex))
                                        ? "bg-primary/10"
                                        : "hover:bg-accent/5")
                              }`}
                              onClick={(e) => {
                                // Detect double-click via click count
                                if (e.detail === 2 && isEditMode) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setEditingCell({ row: rowIndex, col: colIndex });
                                  return;
                                }
                                
                                if (e.shiftKey && lastClickedCell) {
                                  // Shift+Click: Select rectangular range
                                  e.stopPropagation();
                                  const minRow = Math.min(lastClickedCell.row, rowIndex);
                                  const maxRow = Math.max(lastClickedCell.row, rowIndex);
                                  const minCol = Math.min(lastClickedCell.col, colIndex);
                                  const maxCol = Math.max(lastClickedCell.col, colIndex);
                                  const newSelected = new Set(selectedCells);
                                  for (let r = minRow; r <= maxRow; r++) {
                                    for (let c = minCol; c <= maxCol; c++) {
                                      newSelected.add(`${r}-${c}`);
                                    }
                                  }
                                  setSelectedCells(newSelected);
                                } else if (e.ctrlKey || e.metaKey) {
                                  // Ctrl+Click: Toggle individual cell
                                  e.stopPropagation();
                                  const newSelected = new Set(selectedCells);
                                  if (newSelected.has(cellKey)) {
                                    newSelected.delete(cellKey);
                                  } else {
                                    newSelected.add(cellKey);
                                  }
                                  setSelectedCells(newSelected);
                                  setLastClickedCell({ row: rowIndex, col: colIndex });
                                } else {
                                  // Single click: Select this cell
                                  const cellKey = `${rowIndex}-${colIndex}`;
                                  setSelectedCells(new Set([cellKey]));
                                  onCellClick(rowIndex, colIndex);
                                  setLastClickedCell({ row: rowIndex, col: colIndex });
                                }
                              }}
                              onDoubleClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditingCell({ row: rowIndex, col: colIndex });
                              }}
                            >
                              {isEditing ? (
                                <Input
                                  ref={editInputRef}
                                  type="text"
                                  value={editingValue}
                                  onChange={(e) => {
                                    setEditingValue(e.target.value);
                                  }}
                                  onBlur={() => {
                                    const oldValue = data[editingCell!.row]?.[editingCell!.col];
                                    handleInputChange(editingCell!.row, editingCell!.col, editingValue);
                                    recordChange(editingCell!.row, editingCell!.col, oldValue, editingValue);
                                    setEditingCell(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      const oldValue = data[editingCell!.row]?.[editingCell!.col];
                                      handleInputChange(editingCell!.row, editingCell!.col, editingValue);
                                      recordChange(editingCell!.row, editingCell!.col, oldValue, editingValue);
                                      setEditingCell(null);
                                      onCellClick(rowIndex + 1, colIndex);
                                    } else if (e.key === "Tab") {
                                      e.preventDefault();
                                      const oldValue = data[editingCell!.row]?.[editingCell!.col];
                                      handleInputChange(editingCell!.row, editingCell!.col, editingValue);
                                      recordChange(editingCell!.row, editingCell!.col, oldValue, editingValue);
                                      setEditingCell(null);
                                      onCellClick(rowIndex, colIndex + 1);
                                    } else if (e.key === "Escape") {
                                      setEditingCell(null);
                                    }
                                  }}
                                  className="h-full w-full text-sm px-3 py-2 border-0 rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                              ) : (
                                <div className={`${isEditMode ? "cursor-pointer" : ""}`}>
                                  {(() => {
                                    const parsed = parseFormula(cell);
                                    if (parsed.isFormula && parsed.operation && parsed.column) {
                                      const result = calculateFormula(cell, rowIndex, colIndex);
                                      return result !== null ? formatFormulaValue(result, parsed.operation) : '—';
                                    }
                                    return formatCellValue(cell, headerName, rowIndex);
                                  })()}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </SortableRow>
                    );
                  })}
                </SortableContext>
              </tbody>
            </table>
          </DndContext>
        </div>
      </CardContent>
      
      <SheetMaximizeDialog
        open={isMaximized}
        onOpenChange={setIsMaximized}
        title={title || "Sheet Data"}
        data={data}
        config={config}
      />
      
      {/* Type Selector Dialog */}
      <Dialog open={showTypeSelector} onOpenChange={setShowTypeSelector}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Column Types</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {headers.map((header, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                <span className="text-sm font-medium">{header}</span>
                <Select
                  value={config?.columnTypes?.[header] || 'text'}
                  onValueChange={(value) => {
                    if (onUpdateConfig) {
                      onUpdateConfig({
                        ...config,
                        columnTypes: {
                          ...config?.columnTypes,
                          [header]: value as any
                        }
                      });
                    }
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="currency">Currency</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Formula Builder Dialog */}
      <Dialog open={showFormulaBuilder} onOpenChange={setShowFormulaBuilder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Formula Builder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Target Cell</label>
              <div className="flex gap-2 mt-2">
                <Select
                  value={String(formulaTargetCell?.row ?? '')}
                  onValueChange={(value) => setFormulaTargetCell(prev => ({ row: parseInt(value), col: prev?.col ?? 0 }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Row" />
                  </SelectTrigger>
                  <SelectContent>
                    {processedData.slice(1).map((_, idx) => (
                      <SelectItem key={idx + 1} value={String(idx + 1)}>Row {idx + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={String(formulaTargetCell?.col ?? '')}
                  onValueChange={(value) => setFormulaTargetCell(prev => ({ row: prev?.row ?? 1, col: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((header, idx) => (
                      <SelectItem key={idx} value={String(idx)}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Formula</label>
              <Select
                onValueChange={(formula) => {
                  if (formulaTargetCell) {
                    handleInputChange(formulaTargetCell.row, formulaTargetCell.col, formula);
                    setShowFormulaBuilder(false);
                    toast.success("Formula applied");
                  }
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select formula" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map((header, idx) => (
                    <React.Fragment key={idx}>
                      <SelectItem value={`=SUM(${header})`}>SUM({header})</SelectItem>
                      <SelectItem value={`=AVG(${header})`}>AVG({header})</SelectItem>
                      <SelectItem value={`=COUNT(${header})`}>COUNT({header})</SelectItem>
                      <SelectItem value={`=MIN(${header})`}>MIN({header})</SelectItem>
                      <SelectItem value={`=MAX(${header})`}>MAX({header})</SelectItem>
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default DataTableSheet5;
