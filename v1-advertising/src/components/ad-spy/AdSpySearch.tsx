import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, X, Trash2, Grid3x3, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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

interface AdSpySearchProps {
  competitors: Array<{ id: string; name: string; count: number }>;
  selectedCompetitors: string[];
  onCompetitorToggle: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showAll: boolean;
  onShowAllToggle: () => void;
  selectedChannel: string;
  onChannelChange: (channel: string) => void;
  viewMode: "card" | "line";
  onViewModeChange: (mode: "card" | "line") => void;
}

const CHANNELS = [
  { id: "all", name: "All Channels" },
  { id: "facebook", name: "Facebook" },
  { id: "instagram", name: "Instagram" },
  { id: "tiktok", name: "TikTok" },
  { id: "youtube", name: "YouTube" },
  { id: "google", name: "Google" },
];

export function AdSpySearch({
  competitors,
  selectedCompetitors,
  onCompetitorToggle,
  searchQuery,
  onSearchChange,
  showAll,
  onShowAllToggle,
  selectedChannel,
  onChannelChange,
  viewMode,
  onViewModeChange,
}: AdSpySearchProps) {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [competitorToDelete, setCompetitorToDelete] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (competitorId: string) => {
      const { error } = await supabase
        .from("ad_spy_competitors")
        .delete()
        .eq("id", competitorId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-spy-competitors"] });
      queryClient.invalidateQueries({ queryKey: ["ad-spy-ads"] });
      toast.success("Competitor deleted successfully");
      setDeleteDialogOpen(false);
      setCompetitorToDelete(null);
    },
    onError: () => {
      toast.error("Failed to delete competitor");
    },
  });

  const handleDeleteClick = (competitorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompetitorToDelete(competitorId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (competitorToDelete) {
      deleteMutation.mutate(competitorToDelete);
    }
  };

  return (
    <div className="space-y-4 mb-6">
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Competitor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this competitor? This action cannot be undone.
              All ads associated with this competitor will remain but will be orphaned.
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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by competitor name or URL..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-12 bg-card border-border"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge
          variant={showAll ? "default" : "outline"}
          className="cursor-pointer hover:bg-primary/90 transition-colors gap-2 px-3 py-1.5"
          onClick={onShowAllToggle}
        >
          All Competitors
          {showAll && <X className="w-3 h-3" />}
        </Badge>
        {competitors.map((competitor) => {
          const isSelected = selectedCompetitors.includes(competitor.id);
          return (
            <Badge
              key={competitor.id}
              variant={isSelected ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/90 transition-colors gap-2 px-3 py-1.5 group"
              onClick={() => onCompetitorToggle(competitor.id)}
            >
              {competitor.name}
              <span className="text-xs opacity-70">({competitor.count})</span>
              {isSelected && <X className="w-3 h-3" />}
              <Trash2 
                className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" 
                onClick={(e) => handleDeleteClick(competitor.id, e)}
              />
            </Badge>
          );
        })}
      </div>

      {/* View Toggle & Channel Filters Row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* View Toggle - Left */}
        <div className="flex items-center border border-border rounded-md">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0 rounded-r-none",
              viewMode === "card" && "bg-muted"
            )}
            onClick={() => onViewModeChange("card")}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0 rounded-l-none",
              viewMode === "line" && "bg-muted"
            )}
            onClick={() => onViewModeChange("line")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>

        {/* Channel Filters - Right */}
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map((channel) => (
            <Badge
              key={channel.id}
              variant={selectedChannel === channel.id ? "secondary" : "outline"}
              className="cursor-pointer hover:bg-secondary/90 transition-colors px-3 py-1.5"
              onClick={() => onChannelChange(channel.id)}
            >
              {channel.name}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
