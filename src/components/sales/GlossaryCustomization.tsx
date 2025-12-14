import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Save, RotateCcw, Info, ChevronsUpDown } from "lucide-react";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { toast } from "sonner";

interface GlossaryTerm {
  id: string;
  term_key: string;
  default_label: string;
  category: string;
  description?: string;
  alternative_examples?: string;
  display_order?: number;
  niche_id: string;
}

interface GlossaryCustomizationProps {
  clientId?: string;
  nicheId?: string | null;
}

export const GlossaryCustomization = ({ clientId, nicheId }: GlossaryCustomizationProps) => {
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([]);
  const [enabledTerms, setEnabledTerms] = useState<Set<string>>(new Set());
  const [overridesMap, setOverridesMap] = useState<Map<string, string>>(new Map());
  const [hasChanges, setHasChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDescriptions, setShowDescriptions] = useState(false);
  const [openCategories, setOpenCategories] = useState<string[]>(["General"]);

  // Load glossary terms when niche changes
  useEffect(() => {
    const loadGlossaryTerms = async () => {
      if (!nicheId) {
        setGlossaryTerms([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Load terms for the niche
        const { data: terms, error: termsError } = await supabase
          .from("glossary_terms")
          .select("*")
          .eq("niche_id", nicheId)
          .order("display_order")
          .order("category")
          .order("term_key");

        if (termsError) throw termsError;

        // Load client overrides if clientId is provided
        let overridesMapLocal = new Map<string, string>();
        if (clientId) {
          const { data: overrides, error: overridesError } = await supabase
            .from("client_glossary_overrides")
            .select("glossary_term_id, custom_label")
            .eq("client_id", clientId);

          if (!overridesError && overrides) {
            overrides.forEach((o) => {
              overridesMapLocal.set(o.glossary_term_id, o.custom_label);
            });
          }
        }

        if (terms) {
          setGlossaryTerms(terms as GlossaryTerm[]);
          // Enable all terms by default
          setEnabledTerms(new Set(terms.map((t) => t.id)));
          setOverridesMap(overridesMapLocal);
        }
      } catch (error) {
        console.error("Error fetching glossary terms:", error);
        toast.error("Failed to load glossary terms");
      } finally {
        setLoading(false);
      }
    };

    loadGlossaryTerms();
  }, [nicheId, clientId]);

  const handleTermToggle = useCallback((termId: string) => {
    setEnabledTerms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(termId)) {
        newSet.delete(termId);
      } else {
        newSet.add(termId);
      }
      return newSet;
    });
    setHasChanges(true);
  }, []);

  const handleOverrideChange = useCallback((termId: string, customLabel: string) => {
    setOverridesMap((prev) => {
      const newMap = new Map(prev);
      if (customLabel.trim()) {
        newMap.set(termId, customLabel);
      } else {
        newMap.delete(termId);
      }
      return newMap;
    });
    setHasChanges(true);
  }, []);

  const handleResetOverride = useCallback((termId: string) => {
    setOverridesMap((prev) => {
      const newMap = new Map(prev);
      newMap.delete(termId);
      return newMap;
    });
    setHasChanges(true);
  }, []);

  const handleEnableAllInCategory = useCallback((categoryTerms: GlossaryTerm[]) => {
    setEnabledTerms((prev) => {
      const newSet = new Set(prev);
      categoryTerms.forEach((term) => newSet.add(term.id));
      return newSet;
    });
    setHasChanges(true);
  }, []);

  const handleDisableAllInCategory = useCallback((categoryTerms: GlossaryTerm[]) => {
    setEnabledTerms((prev) => {
      const newSet = new Set(prev);
      categoryTerms.forEach((term) => newSet.delete(term.id));
      return newSet;
    });
    setHasChanges(true);
  }, []);

  const handleSaveAll = useCallback(async () => {
    if (!clientId) {
      toast.info("Changes are only saved when linked to a client");
      return;
    }

    setSaving(true);

    try {
      // Delete existing overrides for this client
      const { error: deleteError } = await supabase
        .from("client_glossary_overrides")
        .delete()
        .eq("client_id", clientId);

      if (deleteError) throw deleteError;

      // Insert new overrides (only for enabled terms with custom labels)
      const overridesToInsert = Array.from(overridesMap.entries())
        .filter(([termId]) => enabledTerms.has(termId))
        .map(([termId, customLabel]) => ({
          client_id: clientId,
          glossary_term_id: termId,
          custom_label: customLabel,
        }));

      if (overridesToInsert.length > 0) {
        const { error: insertError } = await supabase.from("client_glossary_overrides").insert(overridesToInsert);

        if (insertError) throw insertError;
      }

      toast.success("Glossary customizations saved");
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving glossary overrides:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }, [clientId, overridesMap, enabledTerms]);

  const filteredTerms = useMemo(() => {
    if (!searchQuery) return glossaryTerms;
    const query = searchQuery.toLowerCase();
    return glossaryTerms.filter(
      (term) =>
        term.term_key.toLowerCase().includes(query) ||
        term.default_label.toLowerCase().includes(query) ||
        term.category?.toLowerCase().includes(query)
    );
  }, [glossaryTerms, searchQuery]);

  const groupedTerms = useMemo(() => {
    const categoryOrder = [
      "General",
      "Business Entities",
      "Contact Stages",
      "Team Roles",
      "Activity Types",
      "Deal/Case Statuses",
      "Activity Outcomes",
      "Process Stages",
      "Performance Metrics",
    ];

    const groups = new Map<string, GlossaryTerm[]>();

    filteredTerms.forEach((term) => {
      // Terms with display_order = 1 go to "General" category
      const category = term.display_order === 1 ? "General" : term.category || "Uncategorized";
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(term);
    });

    // Sort categories by predefined order
    const orderedEntries: [string, GlossaryTerm[]][] = [];
    categoryOrder.forEach((cat) => {
      if (groups.has(cat)) {
        orderedEntries.push([cat, groups.get(cat)!]);
      }
    });

    // Add any remaining categories not in the predefined order
    groups.forEach((terms, cat) => {
      if (!categoryOrder.includes(cat)) {
        orderedEntries.push([cat, terms]);
      }
    });

    return orderedEntries;
  }, [filteredTerms]);

  const allExpanded = openCategories.length === groupedTerms.length;

  const handleToggleAllCategories = useCallback(() => {
    if (allExpanded) {
      setOpenCategories([]);
    } else {
      setOpenCategories(groupedTerms.map(([category]) => category));
    }
  }, [allExpanded, groupedTerms]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!nicheId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Select an industry above to view glossary terms
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Glossary Terms Management</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Enable, disable, and customize terminology for your organization
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Button variant="outline" size="sm" onClick={handleToggleAllCategories}>
              <ChevronsUpDown className="mr-2 h-4 w-4" />
              {allExpanded ? "Collapse All" : "Expand All"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowDescriptions(!showDescriptions)}>
              <Info className="mr-2 h-4 w-4" />
              {showDescriptions ? "Hide" : "Show"} Descriptions
            </Button>
            <Badge variant="secondary">
              {enabledTerms.size} / {glossaryTerms.length} enabled
            </Badge>
            <Badge variant="outline">{overridesMap.size} customized</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search terms by key, label, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Button onClick={handleSaveAll} disabled={!hasChanges || saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save All Changes
              </>
            )}
          </Button>
        </div>

        <Accordion type="multiple" value={openCategories} onValueChange={setOpenCategories} className="space-y-2">
          {groupedTerms.map(([category, terms]) => (
            <AccordionItem key={category} value={category} className="border rounded-lg bg-card">
              <AccordionTrigger className="px-4 hover:no-underline hover:bg-accent/50">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="default" className="text-sm">
                      {category}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{terms.length} terms</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>{terms.filter((t) => enabledTerms.has(t.id)).length} enabled</span>
                      <span>•</span>
                      <span>{terms.filter((t) => overridesMap.has(t.id)).length} customized</span>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEnableAllInCategory(terms);
                        }}
                      >
                        Enable All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDisableAllInCategory(terms);
                        }}
                      >
                        Disable All
                      </Button>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2 mt-2">
                  {terms.map((term) => {
                    const customLabel = overridesMap.get(term.id);
                    const isEnabled = enabledTerms.has(term.id);
                    const hasOverride = customLabel && customLabel !== term.default_label;
                    const hasDescriptions = term.description || term.alternative_examples;

                    return (
                      <div
                        key={term.id}
                        className={`border rounded-lg transition-all ${
                          !isEnabled ? "opacity-60 bg-muted/30 border-muted" : "bg-card"
                        }`}
                      >
                        {/* Single-line compact layout with grid alignment */}
                        <div className="px-3 py-2.5 grid grid-cols-[auto,minmax(140px,auto),minmax(0,1fr),auto,minmax(120px,auto)] items-center gap-3">
                          {/* Status Indicator */}
                          <div
                            className={`h-2 w-2 rounded-full ${isEnabled ? "bg-primary" : "bg-muted-foreground/40"}`}
                          />

                          {/* Term Label */}
                          <div className="font-medium">{term.default_label}</div>

                          {/* Custom Label Input */}
                          <div className="flex items-center gap-2 min-w-0">
                            <Input
                              placeholder={term.default_label}
                              value={customLabel || ""}
                              onChange={(e) => handleOverrideChange(term.id, e.target.value)}
                              disabled={!isEnabled}
                              className={`h-8 text-sm ${hasOverride ? "border-primary" : ""}`}
                            />
                            {hasOverride && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResetOverride(term.id)}
                                className="h-8 px-2 flex-shrink-0"
                                title="Reset to default"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>

                          {/* Toggle Switch */}
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={() => handleTermToggle(term.id)}
                            className="justify-self-start"
                          />

                          {/* Term Key */}
                          <code className="text-xs text-muted-foreground text-right">{term.term_key}</code>
                        </div>

                        {/* Show descriptions and alternative examples if available */}
                        {showDescriptions && hasDescriptions && isEnabled && (
                          <div className="px-3 pb-3 pt-2 border-t space-y-3">
                            {term.description && (
                              <div>
                                <Label className="text-xs font-semibold text-foreground mb-1 block">Description</Label>
                                <p className="text-sm text-muted-foreground leading-relaxed">{term.description}</p>
                              </div>
                            )}
                            {term.alternative_examples && (
                              <div>
                                <Label className="text-xs font-semibold text-foreground mb-1 block">
                                  Alternative Examples
                                </Label>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {term.alternative_examples}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default GlossaryCustomization;
