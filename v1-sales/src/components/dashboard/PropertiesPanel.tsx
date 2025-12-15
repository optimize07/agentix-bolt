import { Settings, Trash2, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardComponent } from "@/types/dataBinding";
import { getSheetColumns } from "@/utils/dataExtractor";

interface Sheet {
  id: string;
  name: string;
  data: any[][];
}

interface PropertiesPanelProps {
  component: DashboardComponent | null;
  sheets: Sheet[];
  selectedSheets: string[];
  onUpdateComponent: (component: DashboardComponent) => void;
  onDeleteComponent: () => void;
  onClose?: () => void;
}

const PropertiesPanel = ({
  component,
  sheets,
  selectedSheets,
  onUpdateComponent,
  onDeleteComponent,
  onClose,
}: PropertiesPanelProps) => {
  if (!component) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings size={16} />
            Properties
          </CardTitle>
          <CardDescription className="text-xs">
            Select a component to configure
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const availableSheets = sheets.filter(s => selectedSheets.includes(s.id));
  const selectedSheetId = component.dataBinding?.sheetId || availableSheets[0]?.id;
  const columns = selectedSheetId ? getSheetColumns(sheets, selectedSheetId) : [];

  const updateConfig = (key: string, value: any) => {
    onUpdateComponent({
      ...component,
      config: { ...component.config, [key]: value },
    });
  };

  const updateDataBinding = (key: string, value: any) => {
    const currentBinding = component.dataBinding || {
      sheetId: selectedSheetId,
      columns: {}
    };
    onUpdateComponent({
      ...component,
      dataBinding: {
        ...currentBinding,
        [key]: value,
      },
    });
  };

  const updateDataBindingColumn = (columnType: string, value: string) => {
    const currentBinding = component.dataBinding || {
      sheetId: selectedSheetId,
      columns: {}
    };
    onUpdateComponent({
      ...component,
      dataBinding: {
        ...currentBinding,
        columns: {
          ...currentBinding.columns,
          [columnType]: value,
        },
      },
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings size={16} />
              Properties
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Configure {component.type}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onDeleteComponent} className="h-8 w-8">
              <Trash2 size={16} className="text-destructive" />
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X size={16} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-xs">Title</Label>
          <Input
            id="title"
            value={component.config.title || ""}
            onChange={(e) => updateConfig("title", e.target.value)}
            placeholder="Component title"
            className="h-8 text-sm"
          />
        </div>

        {/* Data Source */}
        {availableSheets.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="dataSource" className="text-xs">Data Source</Label>
            <Select
              value={selectedSheetId}
              onValueChange={(value) => updateDataBinding("sheetId", value)}
            >
              <SelectTrigger id="dataSource" className="h-8 text-sm">
                <SelectValue placeholder="Select sheet" />
              </SelectTrigger>
              <SelectContent>
                {availableSheets.map((sheet) => (
                  <SelectItem key={sheet.id} value={sheet.id}>
                    {sheet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Column Mappings - Only for charts */}
        {columns.length > 0 && ['lineChart', 'barChart', 'pieChart'].includes(component.type) && (
          <>
            <div className="space-y-2">
              <Label htmlFor="xColumn" className="text-xs">X-Axis Column</Label>
              <Select
                value={component.dataBinding?.columns?.x || ""}
                onValueChange={(value) => updateDataBindingColumn("x", value)}
              >
                <SelectTrigger id="xColumn" className="h-8 text-sm">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col, index) => (
                    <SelectItem key={index} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="yColumn" className="text-xs">Y-Axis Column</Label>
              <Select
                value={component.dataBinding?.columns?.y || ""}
                onValueChange={(value) => updateDataBindingColumn("y", value)}
              >
                <SelectTrigger id="yColumn" className="h-8 text-sm">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col, index) => (
                    <SelectItem key={index} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Value Column - For stats cards and KPIs */}
        {columns.length > 0 && ['statsCard', 'kpi'].includes(component.type) && (
          <div className="space-y-2">
            <Label htmlFor="valueColumn" className="text-xs">Value Column</Label>
            <Select
              value={component.dataBinding?.columns?.value || ""}
              onValueChange={(value) => updateDataBindingColumn("value", value)}
            >
              <SelectTrigger id="valueColumn" className="h-8 text-sm">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col, index) => (
                  <SelectItem key={index} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Aggregation - For stats cards */}
        {component.type === 'statsCard' && (
          <div className="space-y-2">
            <Label htmlFor="aggregation" className="text-xs">Aggregation</Label>
            <Select
              value={component.dataBinding?.aggregation || "sum"}
              onValueChange={(value) => updateDataBinding("aggregation", value)}
            >
              <SelectTrigger id="aggregation" className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sum">Sum</SelectItem>
                <SelectItem value="avg">Average</SelectItem>
                <SelectItem value="count">Count</SelectItem>
                <SelectItem value="min">Minimum</SelectItem>
                <SelectItem value="max">Maximum</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertiesPanel;
