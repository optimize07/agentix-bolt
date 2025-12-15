import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Tab, CanvasComponent, DataSource } from "@/types/tab";
import { SheetPropertiesPanel } from "./dashboard/SheetPropertiesPanel";
import { InlineWidgetPalette } from "./dashboard/InlineWidgetPalette";
import { StatsRow } from "./dashboard/StatsRow";
import { WidgetTemplate } from "@/types/template";
import DashboardLineChart from "./charts/DashboardLineChart";
import DashboardBarChart from "./charts/DashboardBarChart";
import DashboardPieChart from "./charts/DashboardPieChart";
import StatsCard from "./StatsCard";
import { Button } from "./ui/button";
import { Minimize2, Plus, Trash2, Copy, Settings, Maximize2, Save, TrendingUp, X, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import DataTable from "./DataTable";
import GridLayout, { WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import { AiSuggestionsDialog } from "./dashboard/AiSuggestionsDialog";
import { AiChatDialog } from "./dashboard/AiChatDialog";
import { UnifiedPropertiesPanel } from "./dashboard/UnifiedPropertiesPanel";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { cn } from "@/lib/utils";

const ResponsiveGridLayout = WidthProvider(GridLayout);
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UnifiedCanvasProps {
  tab: Tab;
  onUpdateTab: (tab: Tab) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  isEditMode: boolean;
  onEditModeChange: (isEditMode: boolean) => void;
}

export const UnifiedCanvas = ({ tab, onUpdateTab, onFullscreenChange, isEditMode, onEditModeChange }: UnifiedCanvasProps) => {
  const { glossaryTerms, organization } = useOrganization();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [configPanelComponentId, setConfigPanelComponentId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [componentToDelete, setComponentToDelete] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [unsavedWarningOpen, setUnsavedWarningOpen] = useState(false);
  const [sheetConfigDialogOpen, setSheetConfigDialogOpen] = useState(false);
  const [configComponentId, setConfigComponentId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [pendingSheetData, setPendingSheetData] = useState<any[][] | null>(null);
  
  // Deduplicate components by ID to prevent React key warnings and overlap issues
  const uniqueComponents = useMemo(() => {
    const seen = new Set<string>();
    return tab.components.filter(c => {
      if (seen.has(c.id)) {
        console.warn(`Duplicate component ID detected: ${c.id}, skipping duplicate`);
        return false;
      }
      seen.add(c.id);
      return true;
    });
  }, [tab.components]);
  
  // Use refs for history to avoid re-renders
  const historyRef = useRef<Tab[]>([]);
  const futureRef = useRef<Tab[]>([]);
  const pendingUpdateRef = useRef<NodeJS.Timeout | null>(null);

  // Track if we have changes
  const prevTabRef = useRef<Tab>(tab);
  
  // Reset history when switching tabs
  useEffect(() => {
    historyRef.current = [];
    futureRef.current = [];
    prevTabRef.current = tab;
    setSelectedComponent(null);
  }, [tab.id]);

  // Sync prevTabRef when tab content changes from parent (e.g., after save roundtrip)
  useEffect(() => {
    const currentTabJson = JSON.stringify(prevTabRef.current);
    const incomingTabJson = JSON.stringify(tab);
    
    // Only sync if content differs and we don't have pending updates
    if (currentTabJson !== incomingTabJson && !pendingUpdateRef.current) {
      prevTabRef.current = tab;
    }
  }, [tab]);

  // Debounced update to persistence layer (300ms)
  const debouncedUpdate = useCallback((updatedTab: Tab) => {
    if (pendingUpdateRef.current) {
      clearTimeout(pendingUpdateRef.current);
    }
    pendingUpdateRef.current = setTimeout(() => {
      onUpdateTab(updatedTab);
      pendingUpdateRef.current = null;
    }, 300);
  }, [onUpdateTab]);

  // Record history and update (limits history to 50 entries)
  const applyChange = useCallback((updatedTab: Tab) => {
    // Add current state to history (limit to 50)
    historyRef.current = [...historyRef.current.slice(-49), prevTabRef.current];
    futureRef.current = [];
    
    // Update prev ref
    prevTabRef.current = updatedTab;
    
    // Trigger debounced save
    debouncedUpdate(updatedTab);
  }, [debouncedUpdate]);

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    
    const previous = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    futureRef.current = [...futureRef.current, prevTabRef.current];
    
    prevTabRef.current = previous;
    onUpdateTab(previous);
    toast.success("Undo");
  }, [onUpdateTab]);

  const handleRedo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    
    const next = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);
    historyRef.current = [...historyRef.current, prevTabRef.current];
    
    prevTabRef.current = next;
    onUpdateTab(next);
    toast.success("Redo");
  }, [onUpdateTab]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);
  
  // Auto-save on unmount and navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current);
        onUpdateTab(prevTabRef.current);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      handleBeforeUnload();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [onUpdateTab]);

  const handleSave = () => {
    if (pendingUpdateRef.current) {
      clearTimeout(pendingUpdateRef.current);
    }
    onUpdateTab(prevTabRef.current);
    setSaveDialogOpen(false);
    toast.success("Changes saved successfully");
  };

  const handleSaveClick = () => {
    setSaveDialogOpen(true);
  };

  const handleViewToggle = () => {
    onEditModeChange(!isEditMode);
  };

  // Find next available position in grid to prevent overlaps
  const findNextAvailablePosition = useCallback((
    components: CanvasComponent[], 
    width: number, 
    height: number
  ) => {
    const GRID_COLS = 12;
    const occupied = new Set<string>();
    
    // Mark all occupied cells
    components.forEach(comp => {
      for (let y = comp.position.y; y < comp.position.y + comp.position.h; y++) {
        for (let x = comp.position.x; x < comp.position.x + comp.position.w; x++) {
          occupied.add(`${x},${y}`);
        }
      }
    });
    
    // Scan grid row by row to find first available slot
    for (let y = 0; y < 100; y++) {
      for (let x = 0; x <= GRID_COLS - width; x++) {
        let fits = true;
        
        // Check if widget fits in this position
        for (let dy = 0; dy < height; dy++) {
          for (let dx = 0; dx < width; dx++) {
            if (occupied.has(`${x + dx},${y + dy}`)) {
              fits = false;
              break;
            }
          }
          if (!fits) break;
        }
        
        if (fits) {
          return { x, y };
        }
      }
    }
    
    // Fallback: place at bottom
    const maxY = Math.max(...components.map(c => c.position.y + c.position.h), 0);
    return { x: 0, y: maxY };
  }, []);

  const handleSelectTemplate = (template: WidgetTemplate) => {
    const currentTab = prevTabRef.current;
    const width = template.defaultSize?.w || 4;
    const height = template.defaultSize?.h || 2;
    const position = findNextAvailablePosition(currentTab.components, width, height);
    
    const newComponent: CanvasComponent = {
      id: `component-${Date.now()}`,
      type: template.widgetType as any,
      position: { 
        x: position.x, 
        y: position.y, 
        w: width, 
        h: height 
      },
      config: template.config,
    };

    const updatedTab = {
      ...currentTab,
      components: [...currentTab.components, newComponent],
    };
    applyChange(updatedTab);
    setIsPaletteOpen(false);
    toast.success("Component added successfully");
  };

  const handleUpdateComponent = useCallback((updatedComponent: CanvasComponent) => {
    const currentTab = prevTabRef.current;
    const updatedTab = {
      ...currentTab,
      components: currentTab.components.map((c) =>
        c.id === updatedComponent.id ? updatedComponent : c
      ),
    };
    applyChange(updatedTab);
  }, [applyChange]);

  const handleDeleteComponent = (id: string) => {
    const currentTab = prevTabRef.current;
    const updatedTab = {
      ...currentTab,
      components: currentTab.components.filter((c) => c.id !== id),
    };
    applyChange(updatedTab);
    setSelectedComponent(null);
    toast.success("Component deleted");
  };

  const confirmDelete = () => {
    if (componentToDelete) {
      handleDeleteComponent(componentToDelete);
      setDeleteDialogOpen(false);
      setComponentToDelete(null);
    }
  };

  const handleDuplicateComponent = (id: string) => {
    const currentTab = prevTabRef.current;
    const GRID_COLS = 12;
    const component = currentTab.components.find((c) => c.id === id);
    if (component) {
      const { x, y, w, h } = component.position;
      
      let newX = x + w;
      let newY = y;
      
      if (newX + w > GRID_COLS) {
        newX = 0;
        newY = y + h;
      }
      
      const newComponent = {
        ...component,
        id: `component-${Date.now()}`,
        position: { 
          x: newX, 
          y: newY,
          w,
          h
        },
      };
      const updatedTab = {
        ...currentTab,
        components: [...currentTab.components, newComponent],
      };
      applyChange(updatedTab);
    }
  };

  const handleToggleFullscreen = () => {
    const newFullscreenState = !isFullscreen;
    setIsFullscreen(newFullscreenState);
    onFullscreenChange?.(newFullscreenState);
  };

  const handleLayoutChange = (layout: any[]) => {
    if (!isEditMode) return;
    
    const currentTab = prevTabRef.current;
    const updatedComponents = currentTab.components.map((c) => {
      const layoutItem = layout.find((l) => l.i === c.id);
      return layoutItem
        ? { ...c, position: { x: layoutItem.x, y: layoutItem.y, w: layoutItem.w, h: layoutItem.h } }
        : c;
    });
    
    const updatedTab = {
      ...currentTab,
      components: updatedComponents,
    };
    applyChange(updatedTab);
  };

  const handleAnalyzeSheet = async (sheetData: any[][], showDialog = true) => {
    if (!sheetData || sheetData.length === 0) return;
    
    const headers = sheetData[0];
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-sheet', {
        body: {
          csvHeaders: headers,
          glossaryTerms: glossaryTerms,
          sheetData: sheetData
        }
      });

      if (error) throw error;

      if (data?.suggestions && data.suggestions.length > 0) {
        setAiSuggestions(data.suggestions);
        setPendingSheetData(sheetData);
        if (showDialog) {
          setAiSuggestionsOpen(true);
        }
      } else {
        toast.info("No AI suggestions available for this data.");
      }
    } catch (error) {
      console.error('Error analyzing sheet:', error);
      toast.error('Failed to analyze sheet. Please try again.');
    }
  };

  const handleAcceptSingleComponent = (suggestion: any, passedSheetData?: any[][]) => {
    const currentTab = prevTabRef.current;
    // Use passed sheet data OR existing pendingSheetData OR first existing sheet
    const sheetDataToUse = passedSheetData || pendingSheetData;
    
    console.log('🔍 handleAcceptSingleComponent - Data passed:', {
      hasPassedData: !!passedSheetData,
      hasPendingData: !!pendingSheetData,
      dataRows: sheetDataToUse?.length || 0,
      existingDataSources: currentTab.dataSources.length
    });
    
    let targetSheetId: string;
    let updatedDataSources: DataSource[];
    
    if (sheetDataToUse && sheetDataToUse.length > 0) {
      // We have new data to store - create or update data source
      if (currentTab.dataSources.length > 0) {
        // Update existing data source with new data
        targetSheetId = currentTab.dataSources[0].id;
        updatedDataSources = currentTab.dataSources.map((ds, index) => 
          index === 0 ? { ...ds, data: sheetDataToUse, name: 'Uploaded Data' } : ds
        );
        console.log('✅ Updated existing data source with new data:', targetSheetId);
      } else {
        // Create new data source
        targetSheetId = `sheet-${Date.now()}`;
        updatedDataSources = [{
          id: targetSheetId,
          name: 'Uploaded Data',
          data: sheetDataToUse
        }];
        console.log('✅ Created new data source:', targetSheetId);
      }
    } else {
      // No new data - use existing if available
      targetSheetId = currentTab.dataSources[0]?.id || `sheet-${Date.now()}`;
      updatedDataSources = currentTab.dataSources.length > 0 
        ? currentTab.dataSources 
        : [{ id: targetSheetId, name: 'Sheet 1', data: [] }];
      console.log('⚠️ No new data, using existing data sources');
    }

    const componentType = suggestion.widgetType || suggestion.componentType;
    const isSheetWidget = componentType === 'sheet' || componentType === 'table';
    
    const newComponent: CanvasComponent = {
      id: `component-${Date.now()}`,
      type: componentType as any,
      position: {
        x: (currentTab.components.length % 3) * 4,
        y: Math.floor(currentTab.components.length / 3) * 5,
        w: (suggestion.widgetType === 'statsCard' || suggestion.componentType === 'statsCard') ? 2 
           : (suggestion.widgetType === 'pieChart' || suggestion.componentType === 'pieChart') ? 4 
           : 6,
        h: (suggestion.widgetType === 'statsCard' || suggestion.componentType === 'statsCard') ? 3 : 5,
      },
      config: {
        title: suggestion.title,
        description: suggestion.description,
        ...(isSheetWidget && sheetDataToUse ? { sheetData: sheetDataToUse } : {}),
      },
      dataBinding: suggestion.dataBinding ? {
        sheetId: targetSheetId,
        columns: suggestion.dataBinding.columns || {},
        aggregation: suggestion.formula?.operation?.toLowerCase() as any,
      } : undefined,
      formula: isSheetWidget ? undefined : suggestion.formula,
    };

    console.log('📊 Creating component with dataBinding:', newComponent.dataBinding);

    const updatedTab = {
      ...currentTab,
      components: [...currentTab.components, newComponent],
      dataSources: updatedDataSources,
    };
    applyChange(updatedTab);

    setPendingSheetData(null);
  };

  const handleAcceptSuggestions = (suggestions: any[]) => {
    const currentTab = prevTabRef.current;
    console.log('🔍 handleAcceptSuggestions - Data available:', {
      hasPendingData: !!pendingSheetData,
      dataRows: pendingSheetData?.length || 0,
      existingDataSources: currentTab.dataSources.length
    });
    
    let targetSheetId: string;
    let updatedDataSources: DataSource[];
    
    if (pendingSheetData && pendingSheetData.length > 0) {
      // We have new data to store - create or update data source
      if (currentTab.dataSources.length > 0) {
        // Update existing data source with new data
        targetSheetId = currentTab.dataSources[0].id;
        updatedDataSources = currentTab.dataSources.map((ds, index) => 
          index === 0 ? { ...ds, data: pendingSheetData, name: 'Uploaded Data' } : ds
        );
        console.log('✅ Updated existing data source with new data:', targetSheetId);
      } else {
        // Create new data source
        targetSheetId = `sheet-${Date.now()}`;
        updatedDataSources = [{
          id: targetSheetId,
          name: 'Uploaded Data',
          data: pendingSheetData
        }];
        console.log('✅ Created new data source:', targetSheetId);
      }
    } else {
      // No new data - use existing if available
      targetSheetId = currentTab.dataSources[0]?.id || `sheet-${Date.now()}`;
      updatedDataSources = currentTab.dataSources.length > 0 
        ? currentTab.dataSources 
        : [{ id: targetSheetId, name: 'Sheet 1', data: [] }];
      console.log('⚠️ No new data, using existing data sources');
    }

    const newComponents: CanvasComponent[] = suggestions.map((suggestion, index) => {
      const isSheetWidget = suggestion.componentType === 'sheet' || suggestion.componentType === 'table';
      const sheetDataToMap = updatedDataSources[0]?.data;
      
      return {
        id: `component-${Date.now()}-${index}`,
        type: suggestion.componentType as any,
        position: {
          x: (index % 3) * 4,
          y: Math.floor(index / 3) * 3,
          w: suggestion.componentType === 'statsCard' ? 3 : 4,
          h: suggestion.componentType === 'statsCard' ? 2 : 3
        },
        config: {
          title: suggestion.title,
          description: suggestion.description,
          ...(isSheetWidget && sheetDataToMap ? { sheetData: sheetDataToMap } : {}),
        },
        dataBinding: suggestion.dataBinding ? {
          sheetId: targetSheetId,
          ...suggestion.dataBinding
        } : undefined,
        formula: isSheetWidget ? undefined : suggestion.formula
      };
    });

    console.log('📊 Creating components with dataBinding to:', targetSheetId);

    const updatedTab = {
      ...currentTab,
      components: [...currentTab.components, ...newComponents],
      dataSources: updatedDataSources
    };
    applyChange(updatedTab);
    
    setAiSuggestionsOpen(false);
    setPendingSheetData(null);
    toast.success(`Added ${newComponents.length} AI-generated component(s)`);
  };

  const renderComponent = (component: CanvasComponent) => {
    // Extract data from bound data source
    let data: any[] = [];
    if (component.dataBinding?.sheetId) {
      const dataSource = tab.dataSources.find(
        (ds) => ds.id === component.dataBinding?.sheetId
      );
      if (dataSource) {
        const headers = dataSource.data[0] || [];
        data = dataSource.data.slice(1).map((row) => {
          const obj: any = {};
          headers.forEach((header, idx) => {
            // Skip empty headers or use column letter as fallback
            const columnKey = header && header.trim() !== '' 
              ? header 
              : `Column ${String.fromCharCode(65 + idx)}`;
            obj[columnKey] = row[idx];
          });
          return obj;
        }).filter(row => Object.values(row).some(val => val !== undefined && val !== ''));
      }
    }

    switch (component.type) {
      case "lineChart":
        console.log('LineChart data preview', {
          title: component.config.title,
          xAxisKey: component.config.xAxisKey || component.dataBinding?.columns.x,
          dataSample: data.slice(0, 5),
        });
        return (
          <DashboardLineChart
            data={data}
            title={component.config.title}
            dataKey={component.config.dataKey || component.dataBinding?.columns.y}
            xAxisKey={component.config.xAxisKey || component.dataBinding?.columns.x}
          />
        );
      case "barChart":
        console.log('BarChart data preview', {
          title: component.config.title,
          xAxisKey: component.config.xAxisKey || component.dataBinding?.columns.x,
          dataSample: data.slice(0, 5),
        });
        return (
          <DashboardBarChart
            data={data}
            title={component.config.title}
            dataKey={component.config.dataKey || component.dataBinding?.columns.y}
            xAxisKey={component.config.xAxisKey || component.dataBinding?.columns.x}
          />
        );
      case "pieChart":
        return (
          <DashboardPieChart
            data={data}
            title={component.config.title}
            dataKey={component.config.dataKey || component.dataBinding?.columns.value}
          />
        );
      case "statsCard":
      case 'kpi':
        // Use data from bound data source (same as charts)
        let statsData: any[][] | undefined;
        if (component.dataBinding?.sheetId) {
          // Check dataSources first
          const dataSource = tab.dataSources.find(
            (ds) => ds.id === component.dataBinding?.sheetId
          );
          if (dataSource) {
            statsData = dataSource.data;
          } else {
            // Also check sheet components by ID
            const sheetComponent = tab.components.find(c => c.id === component.dataBinding?.sheetId);
            if (sheetComponent?.config.sheetData) {
              statsData = sheetComponent.config.sheetData;
            }
          }
        }
        // Fallback to looking for any sheet component (legacy behavior)
        if (!statsData && component.formula) {
          const sheetComponent = tab.components.find(c => c.type === 'sheet');
          statsData = sheetComponent?.config.sheetData;
        }
        
        return (
          <StatsCard
            title={component.config.title || "KPI"}
            value={component.config.value || "0"}
            comparison={component.config.description || "vs last period"}
            change={component.config.change || "+0%"}
            trend={component.config.trend || "up"}
            icon={TrendingUp}
            formula={component.formula}
            sheetData={statsData}
            component={component}
          />
        );
      case 'sheet':
      case 'table':
        const currentData = component.config.sheetData && component.config.sheetData.length > 0
          ? component.config.sheetData
          : Array.from({ length: 15 }, (_, i) => 
              i === 0 
                ? ['Column A', 'Column B', 'Column C', 'Column D', 'Column E']
                : ['', '', '', '', '']
            );
        
        console.log('Render sheet component', {
          componentId: component.id,
          cols: currentData[0]?.length,
          headers: currentData[0],
        });
            
        return (
          <DataTable
            key={`${component.id}-${currentData[0]?.length || 0}`}
            data={currentData}
            config={component.config.sheetConfig}
            title={component.config.title}
            isEditMode={isEditMode}
            cellHistory={component.cellHistory}
            historyIndex={component.historyIndex}
            onHistoryChange={(history, index) => {
              const latestComponent = prevTabRef.current.components.find(c => c.id === component.id);
              if (!latestComponent) return;
              handleUpdateComponent({
                ...latestComponent,
                cellHistory: history,
                historyIndex: index,
              });
            }}
            onCellChange={(rowIndex, colIndex, value) => {
              const latestComponent = prevTabRef.current.components.find(c => c.id === component.id);
              if (!latestComponent) return;
              
              const latestData = latestComponent.config.sheetData && latestComponent.config.sheetData.length > 0
                ? latestComponent.config.sheetData
                : currentData;
              
              const updatedData = latestData.map((row, rIdx) => 
                rIdx === rowIndex 
                  ? row.map((cell, cIdx) => cIdx === colIndex ? value : cell)
                  : row
              );
              handleUpdateComponent({
                ...latestComponent,
                config: { ...latestComponent.config, sheetData: updatedData },
              });
            }}
            onCellClick={() => {}}
            activeCell={null}
            onDeleteRow={(rowIndex) => {
              const latestComponent = prevTabRef.current.components.find(c => c.id === component.id);
              if (!latestComponent) return;
              
              const latestData = latestComponent.config.sheetData && latestComponent.config.sheetData.length > 0
                ? latestComponent.config.sheetData
                : currentData;
              
              const updatedData = latestData.filter((_, idx) => idx !== rowIndex);
              handleUpdateComponent({
                ...latestComponent,
                config: { ...latestComponent.config, sheetData: updatedData },
              });
            }}
            onImportData={(importedData, showAiSuggestions) => {
              const latestComponent = prevTabRef.current.components.find(c => c.id === component.id);
              if (!latestComponent) return;
              
              const latestData = latestComponent.config.sheetData && latestComponent.config.sheetData.length > 0
                ? latestComponent.config.sheetData
                : currentData;
              
              const oldColumnCount = latestData[0]?.length || 0;
              const newColumnCount = importedData[0]?.length || 0;
              
              console.log('onImportData (sheet):', {
                componentId: latestComponent.id,
                oldCols: oldColumnCount,
                newCols: newColumnCount,
                headers: importedData[0],
              });
              
              let updatedConfig = { ...latestComponent.config };
              
              // If columns were added, auto-update visibleColumns
              if (newColumnCount > oldColumnCount) {
                const newHeaders = importedData[0] || [];
                const existingVisible = latestComponent.config.sheetConfig?.visibleColumns || [];
                const allHeaders = newHeaders.filter(h => !existingVisible.includes(h));
                
                updatedConfig.sheetConfig = {
                  ...latestComponent.config.sheetConfig,
                  visibleColumns: [...existingVisible, ...allHeaders],
                };
              }
              
              updatedConfig.sheetData = importedData;
              
              handleUpdateComponent({
                ...latestComponent,
                config: updatedConfig,
              });
              
              if (showAiSuggestions) {
                handleAnalyzeSheet(importedData);
              }
            }}
            onUpdateConfig={(updatedConfig) => {
              const latestComponent = prevTabRef.current.components.find(c => c.id === component.id);
              if (!latestComponent) return;
              handleUpdateComponent({
                ...latestComponent,
                config: { ...latestComponent.config, sheetConfig: updatedConfig },
              });
            }}
            onAskAi={() => handleAnalyzeSheet(currentData, true)}
            onTitleChange={(newTitle) => {
              const latestComponent = prevTabRef.current.components.find(c => c.id === component.id);
              if (!latestComponent) return;
              handleUpdateComponent({ ...latestComponent, config: { ...latestComponent.config, title: newTitle } });
            }}
          />
        );
      default:
        return <div>Unknown component type</div>;
    }
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border bg-background">
            <h2 className="text-lg font-semibold">{tab.name}</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={handleToggleFullscreen}
            >
              <Minimize2 size={16} className="mr-2" />
              Exit Presentation
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-12 gap-4">
            {tab.components.map((component) => (
              <div
                key={component.id}
                style={{
                  gridColumn: `span ${component.position.w}`,
                  gridRow: `span ${component.position.h}`,
                }}
                className="bg-card border rounded-lg overflow-hidden animate-widget-enter transition-all duration-200 ease-out hover:shadow-lg"
              >
                {renderComponent(component)}
              </div>
            ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <div className="flex items-center justify-between p-4 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">
            {tab.name}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {isEditMode && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleUndo}
                disabled={historyRef.current.length === 0}
                title="Undo (Ctrl+Z)"
              >
                <span className="text-sm">↶</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRedo}
                disabled={futureRef.current.length === 0}
                title="Redo (Ctrl+Shift+Z)"
              >
                <span className="text-sm">↷</span>
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={handleSaveClick}
              >
                <Save size={16} className="mr-2" />
                Save
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant={isEditMode ? "secondary" : "default"}
            onClick={handleViewToggle}
          >
            {isEditMode ? <Check size={16} /> : <Settings size={16} />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleToggleFullscreen}
          >
            <Maximize2 size={16} />
          </Button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <InlineWidgetPalette
          onSelectTemplate={handleSelectTemplate}
          isOpen={isPaletteOpen && isEditMode}
        />

        <div className="h-full overflow-auto p-6">
          {tab.components.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center pointer-events-none">
              <div className="p-6 rounded-lg border border-dashed border-border bg-muted/20 max-w-md">
                <p className="text-muted-foreground mb-4">
                  No widgets yet. Click 'Add Widget' in the bottom-right to get started.
                </p>
              </div>
            </div>
          ) : (
            <>
              <StatsRow
                statsCards={uniqueComponents.filter(c => c.type === 'statsCard' || c.type === 'kpi')}
                onAddStatsCard={() => {
                  const newStatsCard: CanvasComponent = {
                    id: `stats-${Date.now()}`,
                    type: 'statsCard',
                    position: { x: 0, y: 0, w: 1, h: 1 },
                    config: {
                      title: 'New Metric',
                      value: '0',
                      change: '+0%',
                      trend: 'up',
                    },
                  };
                  const updatedTab = {
                    ...prevTabRef.current,
                    components: [...prevTabRef.current.components, newStatsCard],
                  };
                  applyChange(updatedTab);
                }}
                onSelectComponent={(id) => {
                  setSelectedComponent(id);
                  setConfigPanelComponentId(id);
                }}
                onDeleteComponent={(id) => {
                  setComponentToDelete(id);
                  setDeleteDialogOpen(true);
                }}
                onDuplicateComponent={handleDuplicateComponent}
                onAskAi={setConfigPanelComponentId}
                selectedComponentId={selectedComponent}
                isEditMode={isEditMode}
                sheetData={tab.components.find(c => c.type === 'sheet')?.config?.sheetData}
              />
              
              <ResponsiveGridLayout
                className="layout"
                layout={uniqueComponents
                  .filter(c => c.type !== 'statsCard' && c.type !== 'kpi')
                  .map((c) => ({
                    i: c.id,
                    x: c.position.x,
                    y: c.position.y,
                    w: c.position.w,
                    h: c.position.h,
                  }))}
                cols={12}
                rowHeight={60}
                margin={[8, 8]}
                containerPadding={[12, 12]}
                compactType="vertical"
                preventCollision={false}
                isDraggable={isEditMode}
                isResizable={isEditMode}
                onLayoutChange={handleLayoutChange}
                onResizeStart={() => setIsResizing(true)}
                onResizeStop={() => setIsResizing(false)}
                draggableHandle=".drag-handle"
                transformScale={1}
                autoSize={true}
              >
                {uniqueComponents
                  .filter(c => c.type !== 'statsCard' && c.type !== 'kpi')
                  .map((component) => (
                <div
                  key={component.id}
                  className={cn(
                    "bg-card border rounded-lg group animate-spring-in transition-all duration-200 ease-out will-change-transform hover:shadow-lg hover:-translate-y-1",
                    component.type === 'sheet' ? 'overflow-auto flex flex-col' : 'overflow-hidden',
                    selectedComponent === component.id && isEditMode && "ring-2 ring-primary"
                  )}
                  onClick={() => isEditMode && setSelectedComponent(component.id)}
                >
                  {isEditMode && (
                    <div className="drag-handle absolute top-2 left-2 z-10 cursor-move opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 p-1 rounded">
                      <div className="flex gap-0.5">
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                      </div>
                    </div>
                  )}
                 {isEditMode && component.type !== 'sheet' && (
                    <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button
                         size="icon"
                         variant="ghost"
                         className="h-8 w-8 bg-background/80 backdrop-blur"
                         onClick={(e) => {
                           e.stopPropagation();
                           setConfigPanelComponentId(component.id);
                         }}
                       >
                         <Sparkles size={14} />
                       </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 bg-background/80 backdrop-blur"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateComponent(component.id);
                        }}
                      >
                        <Copy size={14} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 bg-background/80 backdrop-blur hover:bg-destructive hover:text-destructive-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          setComponentToDelete(component.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                  {renderComponent(component)}
                </div>
                ))}
              </ResponsiveGridLayout>
            </>
          )}
        </div>

        {/* Add Widget button anchored to bottom-right of viewport */}
        {isEditMode && (
          <div className="fixed bottom-6 right-6 z-30 flex gap-2">
            <Button
              size="lg"
              variant="outline"
              onClick={() => setAiChatOpen(true)}
              className="shadow-lg"
            >
              <Sparkles size={20} className="mr-2" />
              Ask AI
            </Button>
            <Button
              size="lg"
              onClick={() => setIsPaletteOpen(!isPaletteOpen)}
              className="shadow-lg"
            >
              <Plus size={20} className="mr-2" />
              Add Widget
            </Button>
          </div>
        )}
      </div>

      {/* Unified Configuration Panel for non-sheet widgets */}
      <UnifiedPropertiesPanel
        open={!!configPanelComponentId && tab.components.find(c => c.id === configPanelComponentId)?.type !== 'sheet'}
        onOpenChange={(open) => !open && setConfigPanelComponentId(null)}
        component={tab.components.find(c => c.id === configPanelComponentId) || null}
        tab={tab}
        onUpdateComponent={(updatedComponent) => {
          handleUpdateComponent(updatedComponent);
          setConfigPanelComponentId(null);
        }}
        onDeleteComponent={() => {
          if (configPanelComponentId) {
            handleDeleteComponent(configPanelComponentId);
            setConfigPanelComponentId(null);
          }
        }}
      />

      {/* Sheet Configuration Dialog */}
      <SheetPropertiesPanel
        open={sheetConfigDialogOpen}
        onOpenChange={setSheetConfigDialogOpen}
        component={tab.components.find(c => c.id === configComponentId)!}
        onUpdateComponent={handleUpdateComponent}
        onDeleteComponent={() => {
          if (configComponentId) {
            handleDeleteComponent(configComponentId);
            setSheetConfigDialogOpen(false);
            setConfigComponentId(null);
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Component</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this component? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Confirmation Dialog */}
      <AlertDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Canvas</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save these changes? This will update the canvas with your modifications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Suggestions Dialog */}
      <AiSuggestionsDialog
        open={aiSuggestionsOpen}
        onOpenChange={setAiSuggestionsOpen}
        suggestions={aiSuggestions}
        onAccept={handleAcceptSuggestions}
        onReject={() => {
          setAiSuggestionsOpen(false);
          setPendingSheetData(null);
        }}
      />

      {/* AI Chat Dialog */}
      <AiChatDialog
        open={aiChatOpen}
        onOpenChange={setAiChatOpen}
        sheetData={tab.components.find(c => c.type === 'sheet')?.config.sheetData}
        glossaryTerms={glossaryTerms}
        existingWidgets={tab.components}
        onAcceptWidget={handleAcceptSingleComponent}
      />
    </div>
  );
};
