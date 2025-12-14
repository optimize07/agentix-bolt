import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Send, Copy, Link } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface PushToClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
  assetType: "knowledge_base" | "template" | "offer" | "swipe";
  assetTitle: string;
}

export const PushToClientModal: React.FC<PushToClientModalProps> = ({
  open,
  onOpenChange,
  assetId,
  assetType,
  assetTitle,
}) => {
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [pushMode, setPushMode] = useState<"link" | "copy">("link");
  const queryClient = useQueryClient();

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: existingAssignments } = useQuery({
    queryKey: ["asset-assignments", assetId, assetType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_client_assignments")
        .select("client_id, is_copy")
        .eq("asset_id", assetId)
        .eq("asset_type", assetType);
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const pushMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const assignments = selectedClients.map((clientId) => ({
        asset_type: assetType,
        asset_id: assetId,
        client_id: clientId,
        pushed_by: userData.user.id,
        is_copy: pushMode === "copy",
      }));

      const { error } = await supabase
        .from("asset_client_assignments")
        .upsert(assignments, { onConflict: "asset_type,asset_id,client_id" });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Asset pushed successfully",
        description: `"${assetTitle}" has been pushed to ${selectedClients.length} client(s).`,
      });
      queryClient.invalidateQueries({ queryKey: ["asset-assignments"] });
      onOpenChange(false);
      setSelectedClients([]);
    },
    onError: (error) => {
      toast({
        title: "Error pushing asset",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleClient = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  const selectAll = () => {
    if (clients) {
      setSelectedClients(clients.map((c) => c.id));
    }
  };

  const deselectAll = () => {
    setSelectedClients([]);
  };

  const getAssignmentStatus = (clientId: string) => {
    const assignment = existingAssignments?.find((a) => a.client_id === clientId);
    if (!assignment) return null;
    return assignment.is_copy ? "copy" : "linked";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Push to Clients
          </DialogTitle>
          <DialogDescription>
            Select which clients should receive "{assetTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Push Mode</Label>
            <RadioGroup value={pushMode} onValueChange={(v) => setPushMode(v as "link" | "copy")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="link" id="link" />
                <Label htmlFor="link" className="flex items-center gap-2 font-normal cursor-pointer">
                  <Link className="h-4 w-4" />
                  Link (read-only, syncs with agency)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="copy" id="copy" />
                <Label htmlFor="copy" className="flex items-center gap-2 font-normal cursor-pointer">
                  <Copy className="h-4 w-4" />
                  Copy (editable by client)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between">
            <Label>Select Clients</Label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={deselectAll}>
                Clear
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[200px] border rounded-md p-2">
            {clientsLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : clients?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No clients found
              </p>
            ) : (
              <div className="space-y-2">
                {clients?.map((client) => {
                  const status = getAssignmentStatus(client.id);
                  return (
                    <div
                      key={client.id}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50"
                    >
                      <Checkbox
                        id={client.id}
                        checked={selectedClients.includes(client.id)}
                        onCheckedChange={() => toggleClient(client.id)}
                      />
                      <Label
                        htmlFor={client.id}
                        className="flex-1 cursor-pointer font-normal"
                      >
                        {client.name}
                      </Label>
                      {status && (
                        <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                          {status === "linked" ? "Linked" : "Copied"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => pushMutation.mutate()}
            disabled={selectedClients.length === 0 || pushMutation.isPending}
          >
            {pushMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Push to {selectedClients.length} Client(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
