import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SaveToAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  type: "image" | "text" | "url" | "doc";
  defaultName?: string;
}

export default function SaveToAssetDialog({
  open,
  onOpenChange,
  content,
  type,
  defaultName = "",
}: SaveToAssetDialogProps) {
  const [name, setName] = useState(defaultName);
  const [tags, setTags] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveAssetMutation = useMutation({
    mutationFn: async () => {
      const assetData: any = {
        name,
        type,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      };

      if (type === "text") {
        assetData.text_content = content;
      } else {
        assetData.url_or_path = content;
      }

      const { error } = await supabase.from("assets").insert([assetData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast({
        title: "Saved to Asset Library",
        description: "Asset has been added to your library.",
      });
      setName("");
      setTags("");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save to Asset Library</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="asset-name">Name</Label>
            <Input
              id="asset-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter asset name..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="asset-tags">Tags (comma-separated)</Label>
            <Input
              id="asset-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. campaign, meta, product"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => saveAssetMutation.mutate()} disabled={!name || saveAssetMutation.isPending}>
            Save Asset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
