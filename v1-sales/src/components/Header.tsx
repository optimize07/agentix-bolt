import { History, Share2, Save, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useOrganization } from "@/contexts/OrganizationContext";
import { DashboardSaveIndicator } from "./DashboardSaveIndicator";
import { ShareDashboardDialog } from "./dashboard/ShareDashboardDialog";
import { DashboardSelector } from "./dashboard/DashboardSelector";
import { PermissionGate } from "./PermissionGate";
import { useState } from "react";

interface HeaderProps {
  saveStatus?: {
    state: 'idle' | 'saving' | 'saved' | 'error';
    lastSaved?: Date;
    error?: string;
  };
}

const Header = ({ saveStatus }: HeaderProps) => {
  const { getLabel, role, user } = useOrganization();
  const [currentDashboardId, setCurrentDashboardId] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(false);

  const handleDashboardChange = (dashboardId: string) => {
    setCurrentDashboardId(dashboardId);
    // Dashboard reload would be handled via prop callback
  };

  const handleShare = (shareType: 'personal' | 'team' | 'org_default') => {
    setIsDefault(shareType === 'org_default');
  };
  
  return (
    <header className="fixed top-0 left-64 right-0 bg-background border-b border-border z-40">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
            {saveStatus && <DashboardSaveIndicator saveStatus={saveStatus} />}
          </div>
          <DashboardSelector 
            currentDashboardId={currentDashboardId}
            onSelect={handleDashboardChange}
          />
        </div>
        <div className="flex items-center gap-2">
          <PermissionGate required="dashboard.edit">
            <Button variant="ghost" size="sm">
              <History className="h-4 w-4 mr-2" />
              Version History
            </Button>
          </PermissionGate>

          <PermissionGate required="dashboard.share">
            {currentDashboardId && (
              <ShareDashboardDialog
                dashboardId={currentDashboardId}
                currentUserId={user?.id || null}
                isDefault={isDefault}
                onShare={handleShare}
              />
            )}
          </PermissionGate>

          <PermissionGate required="dashboard.edit">
            <Button variant="default" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </PermissionGate>

          <div className="flex items-center gap-2">
            {role && <Badge variant="outline">{role.name}</Badge>}
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">U</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
