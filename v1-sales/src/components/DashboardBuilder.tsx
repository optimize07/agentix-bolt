import { useState } from "react";
import { Button } from "./ui/button";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { Input } from "./ui/input";
import WidgetPalette from "./WidgetPalette";
import DashboardRenderer from "./DashboardRenderer";
import DataSourcePanel from "./dashboard/DataSourcePanel";
import PropertiesPanel from "./dashboard/PropertiesPanel";
import { DashboardComponent, Dashboard } from "@/types/dataBinding";
import { Sheet } from "@/types/dashboard";
import { useToast } from "@/hooks/use-toast";

interface DashboardBuilderProps {
  dashboard: Dashboard;
  sheets: Sheet[];
  onSave: (dashboard: Dashboard) => void;
  onBack: () => void;
  onCreateSheet?: () => void;
}

const DashboardBuilder = ({ dashboard, sheets, onSave, onBack, onCreateSheet }: DashboardBuilderProps) => {
  const [localDashboard, setLocalDashboard] = useState<Dashboard>(dashboard);
  const [selectedSheets, setSelectedSheets] = useState<string[]>(
    // Extract unique sheet IDs from existing components
    Array.from(new Set(dashboard.components
      .map(c => c.dataBinding?.sheetId)
      .filter(Boolean))) as string[]
  );
  const [selectedComponent, setSelectedComponent] = useState<DashboardComponent | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const { toast } = useToast();

  const handleAddComponent = (type: string) => {
    const newComponent: DashboardComponent = {
      id: `component-${Date.now()}`,
      type: type as any,
      position: { 
        x: 0, 
        y: localDashboard.components.length * 2, 
        w: type === 'statsCard' || type === 'kpi' ? 3 : 6, 
        h: type === 'statsCard' || type === 'kpi' ? 2 : 4 
      },
      config: {
        title: `New ${type.replace(/([A-Z])/g, ' $1').trim()}`,
      }
    };
    setLocalDashboard({
      ...localDashboard,
      components: [...localDashboard.components, newComponent]
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
      components: localDashboard.components.map(c =>
        c.id === updatedComponent.id ? updatedComponent : c
      )
    });
    setSelectedComponent(updatedComponent);
  };

  const handleDeleteComponent = () => {
    if (!selectedComponent) return;
    setLocalDashboard({
      ...localDashboard,
      components: localDashboard.components.filter(c => c.id !== selectedComponent.id)
    });
    setSelectedComponent(null);
    toast({
      title: "Component Removed",
      description: "Component has been deleted",
    });
  };

  const handleToggleSheet = (sheetId: string) => {
    setSelectedSheets(prev =>
      prev.includes(sheetId)
        ? prev.filter(id => id !== sheetId)
        : [...prev, sheetId]
    );
  };

  const handleSave = () => {
    onSave(localDashboard);
    toast({
      title: "Dashboard Saved",
      description: "Your dashboard has been saved successfully",
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Toolbar */}
      <div className="border-b bg-background px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <Input
              value={localDashboard.name}
              onChange={(e) => setLocalDashboard({ ...localDashboard, name: e.target.value })}
              className="text-xl font-bold border-none bg-transparent focus-visible:ring-0 px-0 h-auto"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsPreview(!isPreview)}>
            <Eye size={16} className="mr-2" />
            {isPreview ? 'Edit' : 'Preview'}
          </Button>
          <Button onClick={handleSave}>
            <Save size={16} className="mr-2" />
            Save Dashboard
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Data Sources & Components */}
        {!isPreview && (
          <div className="w-80 border-r overflow-y-auto">
            <div className="p-4 space-y-4">
              <DataSourcePanel
                sheets={sheets}
                selectedSheets={selectedSheets}
                onToggleSheet={handleToggleSheet}
                onCreateSheet={onCreateSheet}
              />
              <WidgetPalette onAddWidget={handleAddComponent} />
            </div>
          </div>
        )}

        {/* Center - Canvas */}
        <div className="flex-1 overflow-y-auto bg-muted/20">
          <div className="p-6">
            <DashboardRenderer 
              components={localDashboard.components} 
              sheets={sheets}
              onSelectComponent={setSelectedComponent}
              selectedComponentId={selectedComponent?.id}
            />
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        {!isPreview && (
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
        )}
      </div>
    </div>
  );
};

export default DashboardBuilder;
