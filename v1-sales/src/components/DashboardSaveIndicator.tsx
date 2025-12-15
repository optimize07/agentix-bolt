import { Badge } from "@/components/ui/badge";
import { Save, Check, AlertCircle } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { formatDistanceToNow } from "date-fns";

interface SaveStatus {
  state: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  error?: string;
}

interface DashboardSaveIndicatorProps {
  saveStatus: SaveStatus;
}

export const DashboardSaveIndicator = ({ saveStatus }: DashboardSaveIndicatorProps) => {
  const { getLabel } = useOrganization();

  const getStatusDisplay = () => {
    switch (saveStatus.state) {
      case 'saving':
        return {
          icon: <Save className="h-3 w-3 animate-pulse" />,
          text: getLabel('dashboard.saving'),
          variant: 'secondary' as const
        };
      case 'saved':
        return {
          icon: <Check className="h-3 w-3" />,
          text: saveStatus.lastSaved 
            ? `${getLabel('dashboard.last_saved')} ${formatDistanceToNow(saveStatus.lastSaved, { addSuffix: true })}`
            : getLabel('dashboard.last_saved'),
          variant: 'outline' as const
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          text: getLabel('dashboard.unsaved'),
          variant: 'destructive' as const
        };
      default:
        return null;
    }
  };

  const display = getStatusDisplay();
  if (!display) return null;

  return (
    <Badge variant={display.variant} className="gap-1 text-xs">
      {display.icon}
      <span>{display.text}</span>
    </Badge>
  );
};