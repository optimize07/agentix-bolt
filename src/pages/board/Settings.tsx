import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Save } from "lucide-react";

export default function Settings() {
  const { boardId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [boardName, setBoardName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [budgetCapNote, setBudgetCapNote] = useState("");
  const [creativeStyleNotes, setCreativeStyleNotes] = useState("");
  const [facebookAdAccountId, setFacebookAdAccountId] = useState("");
  const [redtrackWorkspaceId, setRedtrackWorkspaceId] = useState("");

  const { data: board } = useQuery({
    queryKey: ["agent-board", boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_boards")
        .select("*")
        .eq("id", boardId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (board) {
      setBoardName(board.name || "");
      setDescription(board.description || "");
      setGoal(board.goal || "");
      setBudgetCapNote(board.budget_cap_note || "");
      setCreativeStyleNotes(board.creative_style_notes || "");
      setFacebookAdAccountId(board.facebook_ad_account_id || "");
      setRedtrackWorkspaceId(board.redtrack_workspace_id || "");
    }
  }, [board]);

  const updateBoardMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("agent_boards")
        .update({
          name: boardName,
          description,
          goal,
          budget_cap_note: budgetCapNote,
          creative_style_notes: creativeStyleNotes,
          facebook_ad_account_id: facebookAdAccountId,
          redtrack_workspace_id: redtrackWorkspaceId,
        })
        .eq("id", boardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-board", boardId] });
      queryClient.invalidateQueries({ queryKey: ["agent-boards"] });
      toast({ title: "Project settings saved successfully" });
    },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Project Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure project details, creative guidelines, and integration settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Configuration</CardTitle>
          <CardDescription>Configure campaign details and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              placeholder="e.g., Black Friday - US"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this campaign"
            />
          </div>

          <div>
            <Label htmlFor="goal">Campaign Goal</Label>
            <Textarea
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What is the objective of this campaign?"
              className="min-h-[80px]"
            />
          </div>

          <div>
            <Label htmlFor="budget">Budget Cap Note</Label>
            <Input
              id="budget"
              value={budgetCapNote}
              onChange={(e) => setBudgetCapNote(e.target.value)}
              placeholder="e.g., $10,000 daily budget"
            />
          </div>

          <div>
            <Label htmlFor="style">Creative Style Notes</Label>
            <Textarea
              id="style"
              value={creativeStyleNotes}
              onChange={(e) => setCreativeStyleNotes(e.target.value)}
              placeholder="Describe the style, tone, and creative direction..."
              className="min-h-[120px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ad Platform Integrations</CardTitle>
          <CardDescription>Configure where ads should be pushed for this project</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="facebook">Facebook Ad Account ID</Label>
            <Input
              id="facebook"
              value={facebookAdAccountId}
              onChange={(e) => setFacebookAdAccountId(e.target.value)}
              placeholder="act_123456789"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter your Facebook Ad Account ID to push creatives directly
            </p>
          </div>

          <div>
            <Label htmlFor="redtrack">RedTrack Workspace ID</Label>
            <Input
              id="redtrack"
              value={redtrackWorkspaceId}
              onChange={(e) => setRedtrackWorkspaceId(e.target.value)}
              placeholder="workspace_abc123"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter your RedTrack Workspace ID for campaign tracking
            </p>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={() => updateBoardMutation.mutate()}
        disabled={updateBoardMutation.isPending}
        size="lg"
        className="w-full"
      >
        <Save className="w-4 h-4 mr-2" />
        Save Settings
      </Button>
    </div>
  );
}

