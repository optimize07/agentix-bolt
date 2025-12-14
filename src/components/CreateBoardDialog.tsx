import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const isUuid = (value?: string) => !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
  department?: "marketing" | "advertising" | "operations" | "sales" | "strategy" | "financials";
}

export function CreateBoardDialog({ open, onOpenChange, clientId, department }: CreateBoardDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createBoardMutation = useMutation({
    mutationFn: async () => {
      const insertData: any = {
        name: name || "Untitled Board",
        description,
        goal,
        default_platform: "Meta/Facebook",
      };

      // Resolve client id: accept UUID directly, otherwise try slug lookup; fall back to no client if not found.
      let resolvedClientId: string | null = null;
      if (clientId) {
        if (isUuid(clientId)) {
          resolvedClientId = clientId;
        } else {
          const { data: client } = await (supabase as any)
            .from("clients")
            .select("id")
            .eq("slug", clientId)
            .maybeSingle();
          resolvedClientId = client?.id ?? null;
        }
      }
      if (resolvedClientId) {
        insertData.client_id = resolvedClientId;
      }

      const attemptInsert = async (payload: any) => {
        const { data, error } = await supabase
          .from("agent_boards")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data;
      };

      try {
        return await attemptInsert(insertData);
      } catch (error: any) {
        const needsRetryWithoutClient =
          resolvedClientId &&
          typeof error?.message === "string" &&
          error.message.toLowerCase().includes("client_id");

        if (needsRetryWithoutClient) {
          const retryPayload = { ...insertData };
          delete retryPayload.client_id;
          return await attemptInsert(retryPayload);
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agent-boards", clientId] });
      toast({
        title: "Project Created",
        description: `${data.name} has been created successfully.`,
      });
      onOpenChange(false);
      setName("");
      setDescription("");
      setGoal("");
      
      // Navigate to correct path based on context/department
      if (clientId) {
        if (department === "marketing") {
          navigate(`/client/${clientId}/marketing/projects/${data.id}/chat`);
        } else if (department === "advertising") {
          navigate(`/client/${clientId}/advertising/projects/${data.id}/chat`);
        } else {
          navigate(`/client/${clientId}/projects/${data.id}/chat`);
        }
      } else {
        navigate(`/projects/${data.id}/chat`);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create board: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBoardMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Agent Project</DialogTitle>
          <DialogDescription>
            Set up a new campaign workspace for your advertising goals.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Black Friday - US Campaign"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief overview of this campaign..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Campaign Goal</Label>
              <Input
                id="goal"
                placeholder="e.g. 500 conversions at $15 CPA"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createBoardMutation.isPending}>
              {createBoardMutation.isPending ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}



