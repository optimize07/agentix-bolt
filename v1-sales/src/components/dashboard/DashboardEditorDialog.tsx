import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import WidgetPalette from "@/components/WidgetPalette";
import DashboardRenderer from "@/components/DashboardRenderer";
import DataSourcePanel from "./DataSourcePanel";
import PropertiesPanel from "./PropertiesPanel";
import { DashboardComponent, Dashboard } from "@/types/dataBinding";
import { DataSource } from "@/types/tab";
import { useToast } from "@/hooks/use-toast";

interface DashboardEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboard: Dashboard;
  sheets: DataSource[];
  onSave: (dashboard: Dashboard) => void;
}

export const DashboardEditorDialog = ({
  open,
  onOpenChange,
  dashboard,
  sheets,
  onSave,
}: DashboardEditorDialogProps) => {
  const [localDashboard, setLocalDashboard] = useState<Dashboard>(dashboard);
  const [selectedSheets, setSelectedSheets] = useState<string[]>(
    Array.from(
      new Set(
        dashboard.components?.map((c) => c.dataBinding?.sheetId).filter(Boolean)
      )
    ) as string[]
  );
  const [selectedComponent, setSelectedComponent] =
    useState<DashboardComponent | null>(null);
  const { toast } = useToast();

  const handleAddComponent = (type: string) => {
    const newComponent: DashboardComponent = {
      id: `component-${Date.now()}`,
      type: type as any,
      position: {
        x: 0,
        y: (localDashboard.components?.length || 0) * 2,
        w: type === "statsCard" || type === "kpi" ? 3 : 6,
        h: type === "statsCard" || type === "kpi" ? 2 : 4,
      },
      config: {
        title: `New ${type.replace(/([A-Z])/g, " $1").trim()}`,
      },
    };
    setLocalDashboard({
      ...localDashboard,
      components: [...(localDashboard.components || []), newComponent],
    });
    setSelectedComponent(newComponent);
    toast({
      title: "Component Added",
      description: "Configure the component using the properties panel",
    });
  };

  const handleUpdateComponent = (updatedComponent: DashboardComponent) => {
    setLocalDashboard({
      ...localDashboard,
      components: (localDashboard.components || []).map((c) =>
        c.id === updatedComponent.id ? updatedComponent : c
      ),
    });
    setSelectedComponent(updatedComponent);
  };

  const handleDeleteComponent = () => {
    if (!selectedComponent) return;
    setLocalDashboard({
      ...localDashboard,
      components: (localDashboard.components || []).filter(
        (c) => c.id !== selectedComponent.id
      ),
    });
    setSelectedComponent(null);
    toast({
      title: "Component Removed",
      description: "Component has been deleted",
    });
  };

  const handleToggleSheet = (sheetId: string) => {
    setSelectedSheets((prev) =>
      prev.includes(sheetId)
        ? prev.filter((id) => id !== sheetId)
        : [...prev, sheetId]
    );
  };

  const handleSave = () => {
    onSave(localDashboard);
    onOpenChange(false);
    toast({
      title: "Dashboard Saved",
      description: "Your dashboard has been saved successfully",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[90vh] p-0 gap-0">
        <DialogHeader className="border-b px-6 py-4 flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-4 flex-1">
            <DialogTitle>Edit Dashboard</DialogTitle>
            <Input
              value={localDashboard.name}
              onChange={(e) =>
                setLocalDashboard({ ...localDashboard, name: e.target.value })
              }
              className="max-w-xs"
              placeholder="Dashboard name"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} size="sm">
              <Save size={16} className="mr-2" />
              Save
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X size={20} />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Data Sources & Components */}
          <div className="w-80 border-r overflow-y-auto">
            <div className="p-4 space-y-4">
              <DataSourcePanel
                sheets={sheets}
                selectedSheets={selectedSheets}
                onToggleSheet={handleToggleSheet}
              />
              <WidgetPalette onAddWidget={handleAddComponent} />
            </div>
          </div>

          {/* Center - Canvas */}
          <div className="flex-1 overflow-y-auto bg-muted/20">
            <div className="p-6">
              <DashboardRenderer
                components={localDashboard.components || []}
                sheets={sheets}
                onSelectComponent={setSelectedComponent}
                selectedComponentId={selectedComponent?.id}
              />
            </div>
          </div>

          {/* Right Sidebar - Properties */}
          <div className="w-80 border-l overflow-y-auto">
            <div className="p-4">
              <PropertiesPanel
                component={selectedComponent}
                sheets={sheets}
                selectedSheets={selectedSheets}
                onUpdateComponent={handleUpdateComponent}
                onDeleteComponent={handleDeleteComponent}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
