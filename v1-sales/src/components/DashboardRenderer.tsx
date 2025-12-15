import { DashboardComponent } from "@/types/dataBinding";
import { Sheet } from "@/types/dashboard";
import StatsCard from "./StatsCard";
import DashboardLineChart from "./charts/DashboardLineChart";
import DashboardBarChart from "./charts/DashboardBarChart";
import DashboardPieChart from "./charts/DashboardPieChart";
import { extractData } from "@/utils/dataExtractor";
import { TrendingUp, DollarSign, Activity } from "lucide-react";
import { ComponentActions } from "./dashboard/ComponentActions";
import { useOrganization } from "@/contexts/OrganizationContext";

interface DashboardRendererProps {
  components: DashboardComponent[];
  sheets?: Sheet[];
  onSelectComponent?: (component: DashboardComponent) => void;
  selectedComponentId?: string;
  isEditMode?: boolean;
  onUpdateComponent?: (component: DashboardComponent) => void;
  onDeleteComponent?: (componentId: string) => void;
  onDuplicateComponent?: (componentId: string) => void;
}

const DashboardRenderer = ({ 
  components, 
  sheets = [], 
  onSelectComponent,
  selectedComponentId,
  isEditMode = false,
  onUpdateComponent,
  onDeleteComponent,
  onDuplicateComponent,
}: DashboardRendererProps) => {
  const { getLabel } = useOrganization();
  
  // Only translate business term keys (metric.*, entity.*, activity.*, stage.*)
  const translateIfTermKey = (str: string | undefined) => {
    if (!str) return str;
    const isTermKey = str.includes('.') && (
      str.startsWith('metric.') || 
      str.startsWith('entity.') || 
      str.startsWith('activity.') || 
      str.startsWith('stage.')
    );
    return isTermKey ? (getLabel(str) || str) : str;
  };
  
  const getIconForType = (type: string) => {
    const icons: any = {
      statsCard: DollarSign,
      kpi: TrendingUp,
      lineChart: Activity,
      barChart: Activity,
      pieChart: Activity,
    };
    return icons[type] || DollarSign;
  };

  const renderComponent = (component: DashboardComponent) => {
    const data = component.dataBinding ? extractData(sheets, component.dataBinding) : [];
    
    switch (component.type) {
      case 'statsCard':
      case 'kpi':
        const value = data[0]?.value || component.config.value || '0';
        return (
          <StatsCard
            title={translateIfTermKey(component.config.title) || 'Metric'}
            value={String(value)}
            change={component.config.change || '0%'}
            comparison="vs last period"
            icon={getIconForType(component.type)}
            trend={component.config.trend || 'up'}
          />
        );
      
      case 'lineChart':
        const xKeyLine = component.dataBinding?.columns?.x || component.config.xAxisKey || 'month';
        const yKeyLine = component.dataBinding?.columns?.y || component.config.dataKey || 'revenue';
        
        const lineData = data.map(d => ({
          [xKeyLine]: d.x,
          [yKeyLine]: d.y
        }));
        return (
          <DashboardLineChart
            title={translateIfTermKey(component.config.title) || component.config.title}
            data={lineData.length > 0 ? lineData : undefined}
            dataKey={yKeyLine}
            xAxisKey={xKeyLine}
          />
        );
      
      case 'barChart':
        const xKeyBar = component.dataBinding?.columns?.x || component.config.xAxisKey || 'product';
        const yKeyBar = component.dataBinding?.columns?.y || component.config.dataKey || 'sales';
        
        const barData = data.map(d => ({
          [xKeyBar]: d.x,
          [yKeyBar]: d.y
        }));
        return (
          <DashboardBarChart
            title={translateIfTermKey(component.config.title) || component.config.title}
            data={barData.length > 0 ? barData : undefined}
            dataKey={yKeyBar}
            xAxisKey={xKeyBar}
          />
        );
      
      case 'pieChart':
        const valueKey = component.dataBinding?.columns?.value || component.config.dataKey || 'value';
        
        const pieData = data.map(d => ({
          name: d.x || d.label,
          [valueKey]: d.y || d.value
        }));
        return (
          <DashboardPieChart
            title={translateIfTermKey(component.config.title) || component.config.title}
            data={pieData.length > 0 ? pieData : undefined}
            dataKey={valueKey}
          />
        );
      
      default:
        return <div>Unknown component type: {component.type}</div>;
    }
  };

  if (components.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Add widgets from the palette to build your dashboard</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-12 gap-4 auto-rows-fr relative ${
      isEditMode ? 'bg-[linear-gradient(to_right,hsl(var(--muted))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted))_1px,transparent_1px)] bg-[size:20px_20px]' : ''
    }`}>
      {components.map((component) => (
        <div
          key={component.id}
          className={`relative transition-all ${
            selectedComponentId === component.id 
              ? 'ring-2 ring-primary ring-offset-2 shadow-lg' 
              : isEditMode 
                ? 'hover:ring-2 hover:ring-primary/50 hover:shadow-md' 
                : ''
          } ${isEditMode ? 'cursor-move' : ''} rounded-lg`}
          style={{
            gridColumn: `span ${Math.min(component.position.w, 12)}`,
            minHeight: `${component.position.h * 100}px`,
          }}
          onClick={() => isEditMode && onSelectComponent?.(component)}
        >
          {/* Component Actions in Edit Mode */}
          {isEditMode && selectedComponentId === component.id && (
            <ComponentActions
              onCopy={() => onDuplicateComponent?.(component.id)}
              onDelete={() => onDeleteComponent?.(component.id)}
            />
          )}

          {/* Edit Mode Indicator */}
          {isEditMode && (
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-primary/10 backdrop-blur-sm rounded text-[10px] font-medium text-primary">
              {component.type}
            </div>
          )}

          {renderComponent(component)}
        </div>
      ))}
    </div>
  );
};

export default DashboardRenderer;
