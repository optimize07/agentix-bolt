import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ConfigurationWarningProps {
  checkType: "api_keys" | "composio";
}

export default function ConfigurationWarning({ checkType }: ConfigurationWarningProps) {
  const navigate = useNavigate();

  const { data: settings } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const showWarning =
    checkType === "api_keys"
      ? !settings?.nanobanan_api_key || !settings?.redtrack_api_key
      : !settings?.composio_config_json;

  if (!showWarning) return null;

  const message =
    checkType === "api_keys"
      ? "API keys not configured. Configure Nanobanan and RedTrack API keys to enable full functionality."
      : "Composio/Meta integration not configured. Configure in Brand Settings to launch campaigns.";

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        <Button variant="outline" size="sm" onClick={() => navigate("/brand-settings")}>
          Configure Settings
        </Button>
      </AlertDescription>
    </Alert>
  );
}
