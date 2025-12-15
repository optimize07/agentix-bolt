import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useNavigate } from "react-router-dom";
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

interface Niche {
  id: string;
  name: string;
  slug: string;
}

export function FormTemplatePresets() {
  const { organization, niche, glossaryTerms } = useOrganization();
  const navigate = useNavigate();
  const [presets, setPresets] = useState<FormTemplatePreset[]>([]);
  const [enabledPresetIds, setEnabledPresetIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [creatingFromTemplate, setCreatingFromTemplate] = useState(false);
  
  // Preview mode states
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [niches, setNiches] = useState<Niche[]>([]);
  const [selectedPreviewNiche, setSelectedPreviewNiche] = useState<string>("");

  // Use preview niche if in preview mode, otherwise use org's actual niche
  const effectiveNicheId = isPreviewMode ? selectedPreviewNiche : niche?.id;

  useEffect(() => {
    const loadNiches = async () => {
      const { data } = await supabase
        .from("niches")
        .select("id, name, slug")
        .eq("is_system_template", true)
        .order("name");
      
      if (data) {
        setNiches(data);
        // Default to current org niche
        if (niche?.id) setSelectedPreviewNiche(niche.id);
      }
    };
    loadNiches();
  }, [niche?.id]);

  useEffect(() => {
    if (effectiveNicheId) {
      loadPresets(effectiveNicheId);
      loadEnabledPresets();
    }
  }, [effectiveNicheId]);

  const loadPresets = async (nicheId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("form_template_presets")
        .select("*")
        .eq("niche_id", nicheId)
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
    if (!organization?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("organization_form_template_presets")
        .select("form_template_preset_id")
        .eq("organization_id", organization.id)
        .eq("is_active", true);

      if (error) throw error;
      setEnabledPresetIds(new Set(data?.map(d => d.form_template_preset_id) || []));
    } catch (error) {
      console.error("Error loading enabled presets:", error);
    }
  };

  const handlePresetToggle = async (presetId: string) => {
    if (!organization?.id) return;

    const isEnabled = enabledPresetIds.has(presetId);
    
    try {
      if (isEnabled) {
        // Disable
        const { error } = await supabase
          .from("organization_form_template_presets")
          .delete()
          .eq("organization_id", organization.id)
          .eq("form_template_preset_id", presetId);

        if (error) throw error;
        setEnabledPresetIds(prev => {
          const next = new Set(prev);
          next.delete(presetId);
          return next;
        });
      } else {
        // Enable
        const { error } = await supabase
          .from("organization_form_template_presets")
          .insert({
            organization_id: organization.id,
            form_template_preset_id: presetId,
            is_active: true
          });

        if (error) throw error;
        setEnabledPresetIds(prev => new Set([...prev, presetId]));
      }
    } catch (error) {
      console.error("Error toggling preset:", error);
      toast.error("Failed to update preset");
    }
  };

  const useTemplate = async (preset: FormTemplatePreset) => {
    if (!organization) return;

    setCreatingFromTemplate(true);

    try {
      // 1. Create form_template
      const { data: newForm, error: formError } = await supabase
        .from("form_templates")
        .insert({
          organization_id: organization.id,
          name: preset.name,
          description: preset.description || `Based on ${preset.name} template`,
          is_active: true,
        })
        .select()
        .single();

      if (formError) throw formError;

      // 2. Create glossary lookup map
      const glossaryLookup = glossaryTerms.reduce((acc, term) => {
        acc[term.term_key] = term.id;
        return acc;
      }, {} as Record<string, string>);

      // 3. Create form_fields with resolved glossary mappings
      const fieldsToInsert = preset.fields.map((field, idx) => ({
        form_template_id: newForm.id,
        glossary_term_id: field.glossary_term_key
          ? glossaryLookup[field.glossary_term_key] || null
          : null,
        field_label: field.field_label,
        field_type: field.field_type,
        is_required: field.is_required,
        placeholder: field.placeholder || null,
        options: field.options ? field.options : null,
        display_order: idx,
      }));

      const { error: fieldsError } = await supabase
        .from("form_fields")
        .insert(fieldsToInsert);

      if (fieldsError) throw fieldsError;

      toast.success(`Form created from template: ${preset.name}`);
      
      // Navigate to Forms tab to see the new form
      const url = new URL(window.location.href);
      url.searchParams.set("tab", "forms");
      window.history.pushState({}, "", url);
      window.location.reload();
    } catch (error) {
      console.error("Error creating form from template:", error);
      toast.error("Failed to create form from template");
    } finally {
      setCreatingFromTemplate(false);
    }
  };

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName];
    return Icon ? <Icon className="h-4 w-4" /> : <Icons.FileText className="h-4 w-4" />;
  };

  if (!organization) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center gap-3">
          <Switch 
            checked={isPreviewMode} 
            onCheckedChange={setIsPreviewMode}
            id="preview-mode"
          />
          <Label htmlFor="preview-mode" className="cursor-pointer">
            Preview Mode (browse all industries)
          </Label>
        </div>
        
        {isPreviewMode && (
          <Select value={selectedPreviewNiche} onValueChange={setSelectedPreviewNiche}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select industry..." />
            </SelectTrigger>
            <SelectContent>
              {niches.map(n => (
                <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isPreviewMode && selectedPreviewNiche && (
        <Badge variant="secondary" className="mb-2">
          <Icons.Eye className="h-3 w-3 mr-1" />
          Previewing: {niches.find(n => n.id === selectedPreviewNiche)?.name}
        </Badge>
      )}

      <div className="text-sm text-muted-foreground">
        Toggle on the form templates you want to use as quick starting points. Enabled templates appear with a "Use" button.
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading templates...
        </div>
      ) : presets.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No templates available for your niche.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {presets.map((preset) => {
            const isEnabled = enabledPresetIds.has(preset.id);
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
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {preset.description}
                      </p>
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
                          {preset.fields.length} fields
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {preset.fields.filter(f => f.glossary_term_key).length} glossary
                        </Badge>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          useTemplate(preset);
                        }}
                        disabled={creatingFromTemplate}
                      >
                        <Icons.Plus className="h-3 w-3 mr-1" /> Use
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
