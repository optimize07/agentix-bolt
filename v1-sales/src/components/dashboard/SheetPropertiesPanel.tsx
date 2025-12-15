import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Settings2, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CanvasComponent } from "@/types/tab";
import { SheetConfig, FilterRule } from "@/types/dataBinding";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface SheetPropertiesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  component: CanvasComponent;
  onUpdateComponent: (component: CanvasComponent) => void;
  onDeleteComponent: () => void;
}

export const SheetPropertiesPanel = ({
  open,
  onOpenChange,
  component,
  onUpdateComponent,
  onDeleteComponent,
}: SheetPropertiesPanelProps) => {
  if (!component) return null;
  const sheetData = component.config.sheetData || [];
  const headers = sheetData[0] || [];
  const config = component.config.sheetConfig || {};
  
  const [expandedColumn, setExpandedColumn] = useState<string | null>(null);

  const updateConfig = (updates: Partial<SheetConfig>) => {
    onUpdateComponent({
      ...component,
      config: {
        ...component.config,
        sheetConfig: { ...config, ...updates },
      },
    });
  };

  const updateTitle = (title: string) => {
    onUpdateComponent({
      ...component,
      config: { ...component.config, title },
    });
  };

  const toggleColumnVisibility = (column: string) => {
    const visibleColumns = config.visibleColumns || headers;
    const newVisible = visibleColumns.includes(column)
      ? visibleColumns.filter((c) => c !== column)
      : [...visibleColumns, column];
    updateConfig({ visibleColumns: newVisible });
  };

  const updateColumnName = (column: string, newName: string) => {
    updateConfig({
      columnNames: { ...config.columnNames, [column]: newName },
    });
  };

  const updateColumnWidth = (column: string, width: number) => {
    updateConfig({
      columnWidths: { ...config.columnWidths, [column]: width },
    });
  };

  const updateColumnType = (column: string, type: 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'boolean') => {
    updateConfig({
      columnTypes: { ...config.columnTypes, [column]: type },
    });
  };

  const addFilter = () => {
    const newFilter: FilterRule = {
      id: `filter-${Date.now()}`,
      column: headers[0] || "",
      operator: "equals",
      value: "",
      logic: "AND",
    };
    updateConfig({ filters: [...(config.filters || []), newFilter] });
  };

  const removeFilter = (filterId: string) => {
    updateConfig({
      filters: (config.filters || []).filter((f) => f.id !== filterId),
    });
  };

  const updateFilter = (filterId: string, updates: Partial<FilterRule>) => {
    updateConfig({
      filters: (config.filters || []).map((f) =>
        f.id === filterId ? { ...f, ...updates } : f
      ),
    });
  };

  const updateSorting = (column: string, direction: 'asc' | 'desc') => {
    updateConfig({ sorting: { column, direction } });
  };

  const clearSorting = () => {
    updateConfig({ sorting: undefined });
  };

  const visibleColumns = config.visibleColumns || headers;
  const visibleCount = visibleColumns.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sheet Configuration</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateConfig({ visibleColumns: headers })}
          >
            Show All Columns
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateConfig({ filters: [] })}
            disabled={!config.filters || config.filters.length === 0}
          >
            Clear Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateConfig({ columnWidths: {} })}
            disabled={!config.columnWidths || Object.keys(config.columnWidths).length === 0}
          >
            Reset Widths
          </Button>
        </div>

        <Separator />

        {/* Title */}
        <div className="space-y-2">
          <Label>Sheet Title</Label>
          <Input
            value={component.config.title || ""}
            onChange={(e) => updateTitle(e.target.value)}
            placeholder="Enter sheet title"
          />
        </div>

        <Separator />

        {/* Columns Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base">Columns</Label>
            <Badge variant="secondary" className="text-xs">
              {visibleCount} visible
            </Badge>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-auto">
            {headers.map((header: string, index: number) => {
              const isVisible = visibleColumns.includes(header);
              const displayName = config.columnNames?.[header] || header;
              const isExpanded = expandedColumn === header;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <Checkbox
                      checked={isVisible}
                      onCheckedChange={() => toggleColumnVisibility(header)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{displayName}</p>
                        {config.columnTypes?.[header] && (
                          <Badge variant="secondary" className="text-xs">
                            {config.columnTypes[header]}
                          </Badge>
                        )}
                      </div>
                      {displayName !== header && (
                        <p className="text-xs text-muted-foreground truncate">{header}</p>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={() => setExpandedColumn(isExpanded ? null : header)}
                    >
                      <Settings2 size={16} />
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="ml-8 p-3 space-y-3 border rounded-lg bg-muted/30">
                      <div className="space-y-2">
                        <Label className="text-xs">Display Name</Label>
                        <Input
                          value={displayName}
                          onChange={(e) => updateColumnName(header, e.target.value)}
                          placeholder={header}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Column Width (px)</Label>
                        <Input
                          type="number"
                          value={config.columnWidths?.[header] || 150}
                          onChange={(e) => updateColumnWidth(header, parseInt(e.target.value) || 150)}
                          placeholder="150"
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Data Type</Label>
                        <Select
                          value={config.columnTypes?.[header] || 'text'}
                          onValueChange={(value: any) => updateColumnType(header, value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="currency">Currency ($)</SelectItem>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="boolean">Yes/No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Filters Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base">Filters</Label>
            <Badge variant="secondary" className="text-xs">
              {config.filters?.length || 0} active
            </Badge>
          </div>
          
          <div className="space-y-2">
            {(config.filters || []).map((filter) => (
              <div key={filter.id} className="p-3 border rounded-lg bg-card space-y-2">
                <div className="flex items-center gap-2">
                  <Select
                    value={filter.column}
                    onValueChange={(value) => updateFilter(filter.id, { column: value })}
                  >
                    <SelectTrigger className="h-8 flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((h: string) => (
                        <SelectItem key={h} value={h}>{config.columnNames?.[h] || h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0"
                    onClick={() => removeFilter(filter.id)}
                  >
                    <X size={16} />
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Select
                    value={filter.operator}
                    onValueChange={(value: any) => updateFilter(filter.id, { operator: value })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="greaterThan">Greater Than</SelectItem>
                      <SelectItem value="lessThan">Less Than</SelectItem>
                      <SelectItem value="isEmpty">Is Empty</SelectItem>
                      <SelectItem value="isNotEmpty">Is Not Empty</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {filter.operator !== 'isEmpty' && filter.operator !== 'isNotEmpty' && (
                    <Input
                      value={filter.value}
                      onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                      placeholder="Filter value"
                      className="h-8 flex-1"
                    />
                  )}
                </div>

                {config.filters && config.filters.length > 1 && (
                  <Select
                    value={filter.logic}
                    onValueChange={(value: any) => updateFilter(filter.id, { logic: value })}
                  >
                    <SelectTrigger className="h-8 w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">AND</SelectItem>
                      <SelectItem value="OR">OR</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={addFilter}
              className="w-full"
            >
              <Plus size={16} className="mr-2" />
              Add Filter
            </Button>
          </div>
        </div>

        <Separator />

        {/* Sorting Section */}
        <div className="space-y-3">
          <Label className="text-base">Sort By</Label>
          
          {config.sorting ? (
            <div className="p-3 border rounded-lg bg-card space-y-2">
              <div className="flex gap-2">
                <Select
                  value={config.sorting.column}
                  onValueChange={(value) => updateSorting(value, config.sorting!.direction)}
                >
                  <SelectTrigger className="h-8 flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h: string) => (
                      <SelectItem key={h} value={h}>{config.columnNames?.[h] || h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={config.sorting.direction}
                  onValueChange={(value: any) => updateSorting(config.sorting!.column, value)}
                >
                  <SelectTrigger className="h-8 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={clearSorting}
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateSorting(headers[0], 'asc')}
              className="w-full"
            >
              <Plus size={16} className="mr-2" />
              Add Sorting
            </Button>
          )}
        </div>

        <Separator />

        {/* Configuration Preview */}
        <div className="space-y-2">
          <Label className="text-base">Summary</Label>
          <div className="p-3 rounded-lg border bg-muted/30 space-y-1 text-xs">
            <p><strong>Visible Columns:</strong> {visibleCount} of {headers.length}</p>
            <p><strong>Active Filters:</strong> {config.filters?.length || 0}</p>
            <p><strong>Sorting:</strong> {config.sorting ? `${config.columnNames?.[config.sorting.column] || config.sorting.column} (${config.sorting.direction})` : 'None'}</p>
            <p><strong>Custom Names:</strong> {Object.keys(config.columnNames || {}).length}</p>
            <p><strong>Custom Types:</strong> {Object.keys(config.columnTypes || {}).length}</p>
          </div>
        </div>

        <Separator />

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            <X size={16} className="mr-2" />
            Close
          </Button>
          
          <Button
            variant="destructive"
            onClick={() => {
              onDeleteComponent();
              onOpenChange(false);
            }}
          >
            <Trash2 size={16} className="mr-2" />
            Delete Sheet
          </Button>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
