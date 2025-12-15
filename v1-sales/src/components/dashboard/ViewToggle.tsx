import { FileSpreadsheet, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewToggleProps {
  viewMode: 'sheets' | 'dashboard';
  onViewModeChange: (mode: 'sheets' | 'dashboard') => void;
}

export const ViewToggle = ({ viewMode, onViewModeChange }: ViewToggleProps) => {
  return (
    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
      <Button
        variant={viewMode === 'sheets' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('sheets')}
        className="gap-2"
      >
        <FileSpreadsheet size={16} />
        Sheet Data
      </Button>
      <Button
        variant={viewMode === 'dashboard' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('dashboard')}
        className="gap-2"
      >
        <LayoutDashboard size={16} />
        Dashboard View
      </Button>
    </div>
  );
};
