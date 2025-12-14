import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Link, PlayCircle, CheckCircle2, AlertCircle } from "lucide-react";

export function SettingsTab() {
  const queryClient = useQueryClient();
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [assessmentEnabled, setAssessmentEnabled] = useState(false);
  const [intervalDays, setIntervalDays] = useState("7");
  const [minLikes, setMinLikes] = useState("100");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["ad-spy-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_spy_settings")
        .select("*")
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        setSheetsUrl(data.google_sheets_url || "");
        setAssessmentEnabled(data.auto_push_enabled || false);
        const rules = data.breakout_rules as { assessment_interval_days?: number; min_likes_threshold?: number } | null;
        setIntervalDays(String(rules?.assessment_interval_days || 7));
        setMinLikes(String(rules?.min_likes_threshold || 100));
      }
      
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const breakoutRules = {
        assessment_interval_days: parseInt(intervalDays),
        min_likes_threshold: parseInt(minLikes),
      };

      const payload = {
        google_sheets_url: sheetsUrl,
        auto_push_enabled: assessmentEnabled,
        breakout_rules: breakoutRules,
        updated_at: new Date().toISOString(),
      };

      if (settings?.id) {
        const { error } = await supabase
          .from("ad_spy_settings")
          .update(payload)
          .eq("id", settings.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ad_spy_settings")
          .insert(payload);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Settings saved successfully");
      queryClient.invalidateQueries({ queryKey: ["ad-spy-settings"] });
    },
    onError: (error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });

  const runAssessmentMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("ad-spy-assessment", {
        body: {
          minLikes: parseInt(minLikes),
          sheetsUrl: sheetsUrl,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Assessment complete! ${data?.pushed || 0} ads pushed to Google Sheets`);
    },
    onError: (error) => {
      toast.error(`Assessment failed: ${error.message}`);
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  const handleRunNow = () => {
    if (!sheetsUrl) {
      toast.error("Please enter a Google Sheets URL first");
      return;
    }
    runAssessmentMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Google Sheets Integration
          </CardTitle>
          <CardDescription>
            Connect your Google Sheets to automatically push ad assessments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sheets-url">Google Sheets URL</Label>
            <Input
              id="sheets-url"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetsUrl}
              onChange={(e) => setSheetsUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Make sure the sheet is shared with edit access
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Connection Status</Label>
              <p className="text-xs text-muted-foreground">
                {sheetsUrl ? (
                  <span className="flex items-center gap-1 text-primary">
                    <CheckCircle2 className="w-3 h-3" />
                    URL configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <AlertCircle className="w-3 h-3" />
                    Not configured
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5" />
            Automated Assessment Agent
          </CardTitle>
          <CardDescription>
            Automatically assess high-performing ads and push to Google Sheets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="assessment-enabled">Enable Auto-Assessment</Label>
              <p className="text-xs text-muted-foreground">
                Run automatic assessments on a schedule
              </p>
            </div>
            <Switch
              id="assessment-enabled"
              checked={assessmentEnabled}
              onCheckedChange={setAssessmentEnabled}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="interval">Assessment Interval</Label>
              <Select value={intervalDays} onValueChange={setIntervalDays}>
                <SelectTrigger id="interval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Every 1 day</SelectItem>
                  <SelectItem value="7">Every 7 days</SelectItem>
                  <SelectItem value="14">Every 14 days</SelectItem>
                  <SelectItem value="30">Every 30 days</SelectItem>
                  <SelectItem value="90">Every 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min-likes">Minimum Likes Threshold</Label>
              <Input
                id="min-likes"
                type="number"
                placeholder="100"
                value={minLikes}
                onChange={(e) => setMinLikes(e.target.value)}
              />
            </div>
          </div>

          {settings?.updated_at && (
            <div className="text-xs text-muted-foreground">
              Last updated: {new Date(settings.updated_at).toLocaleString()}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
            <Button
              variant="outline"
              onClick={handleRunNow}
              disabled={runAssessmentMutation.isPending || !sheetsUrl}
            >
              {runAssessmentMutation.isPending ? "Running..." : "Run Assessment Now"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



