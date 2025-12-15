import { useState, useEffect } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export default function BrandSettings() {
  const { selectedProjectId } = useProject();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: board } = useQuery({
    queryKey: ["agent-board", selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return null;
      const { data, error } = await supabase
        .from("agent_boards")
        .select("*")
        .eq("id", selectedProjectId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: appSettings } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const [formData, setFormData] = useState({
    name: board?.name || "",
    description: board?.description || "",
    goal: board?.goal || "",
    creative_style_notes: board?.creative_style_notes || "",
    budget_cap_note: board?.budget_cap_note || "",
  });

  const [apiKeys, setApiKeys] = useState({
    nanobanan_api_key: "",
    redtrack_api_key: "",
    composio_config_json: "",
    openrouter_api_key: "",
  });

  // Initialize apiKeys when appSettings loads
  useEffect(() => {
    if (appSettings) {
      setApiKeys({
        nanobanan_api_key: appSettings.nanobanan_api_key || "",
        redtrack_api_key: appSettings.redtrack_api_key || "",
        composio_config_json: appSettings.composio_config_json 
          ? (typeof appSettings.composio_config_json === 'string' 
              ? appSettings.composio_config_json 
              : JSON.stringify(appSettings.composio_config_json, null, 2))
          : "",
        openrouter_api_key: appSettings.openrouter_api_key || "",
      });
    }
  }, [appSettings]);

  const updateBoardMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!selectedProjectId) throw new Error("No project selected");
      const { error } = await supabase
        .from("agent_boards")
        .update(data)
        .eq("id", selectedProjectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-board", selectedProjectId] });
      toast({
        title: "Settings saved",
        description: "Brand settings have been updated successfully.",
      });
    },
  });

  const updateApiKeysMutation = useMutation({
    mutationFn: async (data: typeof apiKeys) => {
      const settingsData = {
        nanobanan_api_key: data.nanobanan_api_key || null,
        redtrack_api_key: data.redtrack_api_key || null,
        composio_config_json: data.composio_config_json ? JSON.parse(data.composio_config_json) : null,
        openrouter_api_key: data.openrouter_api_key || null,
      };

      const { error } = await supabase
        .from("app_settings")
        .upsert(settingsData, { onConflict: "id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast({
        title: "API keys saved",
        description: "API integrations have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving API keys",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateBoardMutation.mutate(formData);
  };

  const handleSaveApiKeys = () => {
    updateApiKeysMutation.mutate(apiKeys);
  };

  if (!selectedProjectId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Please select a project to configure settings.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Brand Details</h1>
        <p className="text-muted-foreground">Configure your project settings and brand guidelines</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Campaign Goal</Label>
            <Input
              id="goal"
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              placeholder="e.g., Generate 1000 leads, $50k revenue"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Creative Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="style">Creative Style Notes</Label>
            <Textarea
              id="style"
              value={formData.creative_style_notes}
              onChange={(e) => setFormData({ ...formData, creative_style_notes: e.target.value })}
              placeholder="Brand voice, tone, visual style preferences..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget Cap Notes</Label>
            <Input
              id="budget"
              value={formData.budget_cap_note}
              onChange={(e) => setFormData({ ...formData, budget_cap_note: e.target.value })}
              placeholder="e.g., Max $100/day per campaign"
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>LLM Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Configure AI model providers for enhanced chat capabilities.
          </p>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openrouter">OpenRouter API Key</Label>
              <Input
                id="openrouter"
                type="password"
                placeholder="Enter OpenRouter API key..."
                value={apiKeys.openrouter_api_key}
                onChange={(e) => setApiKeys({ ...apiKeys, openrouter_api_key: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                {appSettings?.openrouter_api_key ? "✓ Configured" : "Not configured"} • Get your key at{" "}
                <a 
                  href="https://openrouter.ai/keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  openrouter.ai/keys
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Configure external service integrations for ad generation and tracking.
          </p>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nanobanan">Nanobanan API Key</Label>
              <Input
                id="nanobanan"
                type="password"
                placeholder="Enter Nanobanan API key..."
                value={apiKeys.nanobanan_api_key}
                onChange={(e) => setApiKeys({ ...apiKeys, nanobanan_api_key: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                {appSettings?.nanobanan_api_key ? "✓ Configured" : "Not configured - creative generation disabled"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="redtrack">RedTrack API Key</Label>
              <Input
                id="redtrack"
                type="password"
                placeholder="Enter RedTrack API key..."
                value={apiKeys.redtrack_api_key}
                onChange={(e) => setApiKeys({ ...apiKeys, redtrack_api_key: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                {appSettings?.redtrack_api_key ? "✓ Configured" : "Not configured - metrics tracking disabled"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="composio">Meta Ads / Composio Configuration</Label>
              <Textarea
                id="composio"
                placeholder='{"account_id": "xxx", "access_token": "xxx"}'
                rows={4}
                value={apiKeys.composio_config_json}
                onChange={(e) => setApiKeys({ ...apiKeys, composio_config_json: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                {appSettings?.composio_config_json ? "✓ Configured" : "Not configured - campaign launch disabled"}
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveApiKeys} disabled={updateApiKeysMutation.isPending}>
              {updateApiKeysMutation.isPending ? "Saving..." : "Save API Keys"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateBoardMutation.isPending}>
          {updateBoardMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
