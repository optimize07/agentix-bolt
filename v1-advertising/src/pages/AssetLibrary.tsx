import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast as sonnerToast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Grid, List, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import AddAssetDialog from "@/components/AddAssetDialog";
import AssetCard from "@/components/AssetCard";
import { ContentGroupManager } from "@/components/ContentGroupManager";
import { BulkAssetUploader } from "@/components/BulkAssetUploader";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AssetLibrary() {
  const { selectedProjectId } = useProject();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedAssetGroupId, setSelectedAssetGroupId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [bulkUploadGroupId, setBulkUploadGroupId] = useState<string | null>(null);
  const [editAsset, setEditAsset] = useState<any>(null);
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assetGroups } = useQuery({
    queryKey: ["content-groups", "asset"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_groups")
        .select("*")
        .is("project_id", null)
        .eq("content_type", "asset")
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: assets } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .is("agent_board_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredAssets = assets?.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || asset.type === typeFilter;
    
    // Handle archived filter differently
    if (activeCategory === "archived") {
      const matchesGroup = selectedAssetGroupId === null || asset.group_id === selectedAssetGroupId;
      return matchesSearch && matchesType && asset.status === "archived" && matchesGroup;
    }
    
    // For other categories, exclude archived assets
    const matchesCategory = activeCategory === "all" || asset.category === activeCategory;
    const notArchived = asset.status !== "archived";
    const matchesGroup = selectedAssetGroupId === null || asset.group_id === selectedAssetGroupId;
    return matchesSearch && matchesType && matchesCategory && notArchived && matchesGroup;
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast({
        title: "Asset Deleted",
        description: "Asset has been removed from your library.",
      });
      setDeleteAssetId(null);
    },
  });

  const handleEdit = (asset: any) => {
    setEditAsset(asset);
    setAddDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setAddDialogOpen(open);
    if (!open) {
      setEditAsset(null);
    }
  };

  const moveAssetToGroupMutation = useMutation({
    mutationFn: async ({ assetId, groupId }: { assetId: string; groupId: string | null }) => {
      const { error } = await supabase
        .from("assets")
        .update({ group_id: groupId })
        .eq("id", assetId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      sonnerToast.success("Asset moved successfully");
    },
    onError: () => {
      sonnerToast.error("Failed to move asset");
    },
  });

  const handleDropAsset = (assetId: string, targetGroupId: string | null) => {
    moveAssetToGroupMutation.mutate({ assetId, groupId: targetGroupId });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-foreground">Asset Library</h1>
          <div className="flex gap-2">
            <div className="flex border border-border rounded-md">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={() => setBulkUploadOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Bulk Upload
            </Button>
            <Button onClick={() => { setEditAsset(null); setAddDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Asset
            </Button>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search assets..."
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="url">URLs</SelectItem>
              <SelectItem value="doc">Documents</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedProjectId && (
        <div className="px-6 pt-4">
          <ContentGroupManager
            projectId={selectedProjectId}
            contentType="asset"
            groups={assetGroups || []}
            selectedGroupId={selectedAssetGroupId}
            onSelectGroup={setSelectedAssetGroupId}
            onDropAsset={handleDropAsset}
          />
        </div>
      )}

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex-1 flex flex-col">
        <TabsList className="mx-6 mt-4 w-fit">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="brand_kit">Brand Kit</TabsTrigger>
          <TabsTrigger value="campaign">Campaign</TabsTrigger>
          <TabsTrigger value="ugc">UGC</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="flex-1 overflow-auto px-6 pb-6 mt-0">
          <div className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4"
              : "space-y-3 mt-4"
          }>
            {filteredAssets?.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No assets found</p>
              </div>
            ) : (
              filteredAssets?.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onEdit={handleEdit}
                  onDelete={setDeleteAssetId}
                  variant={viewMode === "list" ? "list" : "card"}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AddAssetDialog
        open={addDialogOpen}
        onOpenChange={handleCloseDialog}
        editAsset={editAsset}
      />

      <AlertDialog open={!!deleteAssetId} onOpenChange={() => setDeleteAssetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this asset? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAssetId && deleteAssetMutation.mutate(deleteAssetId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bulk Upload Assets</DialogTitle>
            <DialogDescription>
              Upload multiple images, videos, or documents at once
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <Label>Upload to Group</Label>
            <Select 
              value={bulkUploadGroupId || "ungrouped"} 
              onValueChange={(v) => setBulkUploadGroupId(v === "ungrouped" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ungrouped">No Group</SelectItem>
                {assetGroups?.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProjectId && (
            <BulkAssetUploader
              projectId={selectedProjectId}
              groupId={bulkUploadGroupId}
              onComplete={() => {
                queryClient.invalidateQueries({ queryKey: ["assets"] });
                setBulkUploadOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
