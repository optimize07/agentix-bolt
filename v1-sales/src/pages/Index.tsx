import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tab, TabType, DataSource } from "@/types/tab";
import { AppLayout } from "@/components/AppLayout";
import { NewTabDialog } from "@/components/NewTabDialog";
import { UnifiedWorkspace } from "@/components/UnifiedWorkspace";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useDashboardPersistence } from "@/hooks/useDashboardPersistence";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialTabs: Tab[] = [
  {
    id: "canvas-1",
    name: "Sales Dashboard",
    type: "canvas",
    order: 0,
    components: [],
    dataSources: [
      {
        id: "ds-1",
        name: "Sales Data",
        data: [
          ["Month", "Revenue", "Orders", "Customers"],
          ["January", "12500", "234", "189"],
          ["February", "15200", "289", "234"],
          ["March", "18900", "342", "287"],
        ],
      },
      {
        id: "ds-2",
        name: "Price Tracker",
        data: [
          ["Product", "Price", "Date", "Change"],
          ["Product A", "99.99", "2024-01-15", "5"],
          ["Product B", "149.99", "2024-01-15", "-3"],
          ["Product C", "79.99", "2024-01-15", "2"],
        ],
      },
    ],
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { organization, loading: orgLoading } = useOrganization();
  const { tabs, setTabs, saveStatus, isLoading: dashboardLoading } = useDashboardPersistence();
  const [activeTabId, setActiveTabId] = useState("");
  const [newTabDialogOpen, setNewTabDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tabToRename, setTabToRename] = useState<string | null>(null);
  const [tabToDelete, setTabToDelete] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) || null;

  // Set initial active tab once tabs are loaded
  useEffect(() => {
    if (tabs.length > 0 && !activeTabId) {
      setActiveTabId(tabs[0].id);
    }
  }, [tabs, activeTabId]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session && import.meta.env.PROD) {
        navigate('/auth');
        return;
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, organization, orgLoading]);

  const handleCreateTab = (name: string) => {
    const newTab: Tab = {
      id: `canvas-${Date.now()}`,
      name,
      type: 'canvas',
      order: tabs.length,
      components: [],
      dataSources: [
        {
          id: `ds-${Date.now()}`,
          name: 'Data Source 1',
          data: [
            ["Column A", "Column B", "Column C"],
            ["", "", ""],
            ["", "", ""],
          ],
        },
      ],
    };

    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
    toast.success('Canvas created successfully');
  };

  const handleReorderTabs = (reorderedTabs: Tab[]) => {
    setTabs(reorderedTabs);
  };

  const handleRenameTab = (id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (tab) {
      setTabToRename(id);
      setNewName(tab.name);
      setRenameDialogOpen(true);
    }
  };

  const confirmRename = () => {
    if (tabToRename && newName.trim()) {
      setTabs(tabs.map(tab => 
        tab.id === tabToRename ? { ...tab, name: newName.trim() } : tab
      ));
      toast.success("Tab renamed successfully");
      setRenameDialogOpen(false);
      setTabToRename(null);
      setNewName("");
    }
  };

  const handleDuplicateTab = (id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (tab) {
      const newTab: Tab = {
        ...tab,
        id: `canvas-${Date.now()}`,
        name: `${tab.name} (Copy)`,
        order: tabs.length,
        components: [...tab.components],
        dataSources: tab.dataSources.map(ds => ({
          ...ds,
          id: `ds-${Date.now()}-${ds.id}`,
          data: ds.data.map(row => [...row]),
        })),
      };
      setTabs([...tabs, newTab]);
      toast.success("Canvas duplicated successfully");
    }
  };

  const handleDeleteTab = (id: string) => {
    setTabToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (tabToDelete) {
      const newTabs = tabs.filter(tab => tab.id !== tabToDelete);
      setTabs(newTabs);
      
      if (activeTabId === tabToDelete && newTabs.length > 0) {
        setActiveTabId(newTabs[0].id);
      }
      
      toast.success("Tab deleted successfully");
      setDeleteDialogOpen(false);
      setTabToDelete(null);
    }
  };

  const handleUpdateTab = (updatedTab: Tab) => {
    setTabs(prev => prev.map(tab => tab.id === updatedTab.id ? updatedTab : tab));
  };

  const handleQuickRename = (name: string) => {
    if (activeTab) {
      handleUpdateTab({ ...activeTab, name });
    }
  };

  const handleCreateSheetFromBuilder = () => {
    handleCreateTab(`Canvas ${tabs.length + 1}`);
  };

  if (orgLoading || dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>DataViz Pro - Unified Workspace</title>
        <meta name="description" content="Create and manage data sheets and dashboards in a unified workspace with drag-and-drop organization" />
      </Helmet>
      
      {isCanvasFullscreen ? (
        <div className="min-h-screen">
          <UnifiedWorkspace
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={setActiveTabId}
            onAddTab={() => setNewTabDialogOpen(true)}
            onReorderTabs={handleReorderTabs}
            onRenameTab={handleRenameTab}
            onDuplicateTab={handleDuplicateTab}
            onDeleteTab={handleDeleteTab}
            onUpdateTab={handleUpdateTab}
            onCreateSheet={handleCreateSheetFromBuilder}
            onFullscreenChange={setIsCanvasFullscreen}
            isEditMode={isEditMode}
            onEditModeChange={setIsEditMode}
          />
        </div>
      ) : (
        <AppLayout saveStatus={saveStatus}>
          <UnifiedWorkspace
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={setActiveTabId}
            onAddTab={() => setNewTabDialogOpen(true)}
            onReorderTabs={handleReorderTabs}
            onRenameTab={handleRenameTab}
            onDuplicateTab={handleDuplicateTab}
            onDeleteTab={handleDeleteTab}
            onUpdateTab={handleUpdateTab}
            onCreateSheet={handleCreateSheetFromBuilder}
            onFullscreenChange={setIsCanvasFullscreen}
            isEditMode={isEditMode}
            onEditModeChange={setIsEditMode}
          />
        </AppLayout>
      )}

      <NewTabDialog
        open={newTabDialogOpen}
        onOpenChange={setNewTabDialogOpen}
        onCreateTab={handleCreateTab}
      />

      <AlertDialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Tab</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2 mt-4">
                <Label htmlFor="rename-input">New name</Label>
                <Input
                  id="rename-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirmRename()}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRename}>Rename</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tab</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tab? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Index;
