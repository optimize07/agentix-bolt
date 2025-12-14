import { useState, useEffect, useCallback } from "react";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import * as Icons from "lucide-react";

interface FormTemplatePreset {
  id: string;
  niche_id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  fields: Array<{
    field_label: string;
    field_type: string;
    is_required: boolean;
    glossary_term_key?: string | null;
    options?: string[];
    placeholder?: string;
  }>;
}

interface FormTemplatePresetsProps {
  clientId?: string;
  nicheId?: string | null;
}

export function FormTemplatePresets({ clientId, nicheId }: FormTemplatePresetsProps) {
  const [presets, setPresets] = useState<FormTemplatePreset[]>([]);
  const [enabledPresetIds, setEnabledPresetIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (nicheId) {
      loadPresets(nicheId);
      loadEnabledPresets();
    } else {
      setPresets([]);
      setIsLoading(false);
    }
  }, [nicheId, clientId]);

  const loadPresets = async (nicheIdParam: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("form_template_presets")
        .select("*")
        .eq("niche_id", nicheIdParam)
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      setPresets((data || []) as unknown as FormTemplatePreset[]);
    } catch (error) {
      console.error("Error loading presets:", error);
      toast.error("Failed to load form templates");
    } finally {
      setIsLoading(false);
    }
  };

  const loadEnabledPresets = async () => {
    if (!clientId) return;

    try {
      const { data, error } = await supabase
        .from("client_form_template_presets")
        .select("form_template_preset_id")
        .eq("client_id", clientId)
        .eq("is_active", true);

      if (error) throw error;
      setEnabledPresetIds(new Set(data?.map((d) => d.form_template_preset_id) || []));
    } catch (error) {
      console.error("Error loading enabled presets:", error);
    }
  };

  const handlePresetToggle = useCallback(
    async (presetId: string) => {
      if (!clientId) {
        toast.info("Select a client to save preset preferences");
        return;
      }

      const isEnabled = enabledPresetIds.has(presetId);

      try {
        if (isEnabled) {
          // Disable
          const { error } = await supabase
            .from("client_form_template_presets")
            .delete()
            .eq("client_id", clientId)
            .eq("form_template_preset_id", presetId);

          if (error) throw error;
          setEnabledPresetIds((prev) => {
            const next = new Set(prev);
            next.delete(presetId);
            return next;
          });
        } else {
          // Enable
          const { error } = await supabase.from("client_form_template_presets").insert({
            client_id: clientId,
            form_template_preset_id: presetId,
            is_active: true,
          });

          if (error) throw error;
          setEnabledPresetIds((prev) => new Set([...prev, presetId]));
        }

        toast.success(isEnabled ? "Template disabled" : "Template enabled");
      } catch (error) {
        console.error("Error toggling preset:", error);
        toast.error("Failed to update preset");
      }
    },
    [clientId, enabledPresetIds]
  );

  const getIcon = (iconName: string) => {
    const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return Icon ? <Icon className="h-4 w-4" /> : <FileText className="h-4 w-4" />;
  };

  if (!nicheId) {
    return <p className="text-sm text-muted-foreground">Select an industry above to view form templates</p>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (presets.length === 0) {
    return <p className="text-sm text-muted-foreground">No templates available for this industry</p>;
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Toggle on the form templates you want to use as quick starting points.
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {presets.map((preset) => {
          const isEnabled = enabledPresetIds.has(preset.id);
          const fields = Array.isArray(preset.fields) ? preset.fields : [];

          return (
            <Card
              key={preset.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isEnabled ? "border-primary bg-primary/5 shadow-md" : "border-border"
              }`}
              onClick={() => handlePresetToggle(preset.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getIcon(preset.icon)}
                      <h4 className="font-semibold text-base truncate">{preset.name}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{preset.description}</p>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onClick={(e) => e.stopPropagation()}
                    onCheckedChange={() => handlePresetToggle(preset.id)}
                    className="ml-2 flex-shrink-0"
                  />
                </div>

                {isEnabled && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {fields.length} fields
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {fields.filter((f) => f.glossary_term_key).length} glossary
                      </Badge>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {preset.category}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default FormTemplatePresets;
