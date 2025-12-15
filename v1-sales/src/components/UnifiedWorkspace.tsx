import { Tab } from "@/types/tab";
import { TabBar } from "./TabBar";
import { UnifiedCanvas } from "./UnifiedCanvas";
import { useOrganization } from "@/contexts/OrganizationContext";

interface UnifiedWorkspaceProps {
  tabs: Tab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onAddTab: () => void;
  onReorderTabs: (tabs: Tab[]) => void;
  onRenameTab: (id: string) => void;
  onDuplicateTab: (id: string) => void;
  onDeleteTab: (id: string) => void;
  onUpdateTab: (tab: Tab) => void;
  onCreateSheet: () => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  isEditMode: boolean;
  onEditModeChange: (isEditMode: boolean) => void;
}

export const UnifiedWorkspace = ({
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onReorderTabs,
  onRenameTab,
  onDuplicateTab,
  onDeleteTab,
  onUpdateTab,
  onFullscreenChange,
  isEditMode,
  onEditModeChange,
}: UnifiedWorkspaceProps) => {
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const { hasPermission } = useOrganization();
  const canEdit = hasPermission('dashboard.edit');

  if (!activeTab) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={onSelectTab}
        onAddTab={onAddTab}
        onReorderTabs={onReorderTabs}
        onRenameTab={onRenameTab}
        onDuplicateTab={onDuplicateTab}
        onDeleteTab={onDeleteTab}
        isEditMode={isEditMode}
      />

      <UnifiedCanvas 
        tab={activeTab} 
        onUpdateTab={onUpdateTab}
        onFullscreenChange={onFullscreenChange}
        isEditMode={isEditMode}
        onEditModeChange={onEditModeChange}
      />
    </div>
  );
};
