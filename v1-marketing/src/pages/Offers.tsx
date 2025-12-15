import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Plus, Search } from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { supabase } from "@/integrations/supabase/client";
import { ContentGroupManager } from "@/components/ContentGroupManager";
import { AddOfferDialog } from "@/components/AddOfferDialog";
import { OfferCard } from "@/components/OfferCard";
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
import { toast as sonnerToast } from "sonner";

export default function Offers() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editOffer, setEditOffer] = useState<any>(null);
  const [deleteOfferId, setDeleteOfferId] = useState<string | null>(null);

  // Fetch content groups for offers
  const { data: contentGroups } = useQuery({
    queryKey: ["content-groups", "offer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_groups")
        .select("*")
        .is("project_id", null)
        .eq("content_type", "offer")
        .order("position");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch offers
  const { data: offers, isLoading } = useQuery({
    queryKey: ["offers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select(`
          *,
          offer_assets(*)
        `)
        .is("project_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Filter offers
  const filteredOffers = offers?.filter((offer) => {
    const matchesSearch = offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGroup = selectedGroupId === null || 
      (selectedGroupId === "ungrouped" ? !offer.group_id : offer.group_id === selectedGroupId);
    
    return matchesSearch && matchesGroup;
  });

  // Delete offer mutation
  const deleteOfferMutation = useMutation({
    mutationFn: async (offerId: string) => {
      const { error } = await supabase.from("offers").delete().eq("id", offerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      sonnerToast.success("Offer deleted successfully");
      setDeleteOfferId(null);
    },
    onError: (error) => {
      sonnerToast.error("Failed to delete offer");
      console.error("Delete error:", error);
    },
  });

  const handleEdit = (offer: any) => {
    setEditOffer(offer);
    setIsAddDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setTimeout(() => setEditOffer(null), 200);
  };


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Offers</h1>
            <p className="text-muted-foreground">Manage your product offers and promotions</p>
          </div>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Offer
        </Button>
      </div>

      {/* Search & Groups */}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search offers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <ContentGroupManager
          projectId={selectedProjectId}
          contentType="offer"
          groups={contentGroups || []}
          selectedGroupId={selectedGroupId}
          onSelectGroup={setSelectedGroupId}
        />
      </div>

      {/* Offers Grid */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Loading offers...</div>
      ) : filteredOffers && filteredOffers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOffers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              groups={contentGroups || []}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteOfferId(id)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {searchTerm || selectedGroupId ? "No offers found matching your filters." : "No offers yet. Create your first offer!"}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <AddOfferDialog
        open={isAddDialogOpen}
        onOpenChange={handleCloseDialog}
        projectId={selectedProjectId}
        groups={contentGroups || []}
        editOffer={editOffer}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteOfferId} onOpenChange={() => setDeleteOfferId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Offer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this offer? This action cannot be undone and will also delete all associated assets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteOfferId && deleteOfferMutation.mutate(deleteOfferId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
