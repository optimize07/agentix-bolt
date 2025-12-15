import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { FormTemplatePresets } from "./FormTemplatePresets";
import { Save, RotateCcw, Loader2, Info, Check, ChevronsUpDown } from "lucide-react";

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

interface TermDifference {
  term: string;
  difference: string;
}

interface Niche {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface SalesProcess {
  id: string;
  name: string;
  slug: string;
  stages: any;
  niche_id: string;
}

export const GlossaryCustomization = () => {
  const { toast } = useToast();
  const { organization, loading: contextLoading } = useOrganization();

  const [niches, setNiches] = useState<Niche[]>([]);
  const [selectedNicheId, setSelectedNicheId] = useState<string>('');
  const [availableSalesProcesses, setAvailableSalesProcesses] = useState<SalesProcess[]>([]);
  const [selectedProcessIds, setSelectedProcessIds] = useState<Set<string>>(new Set());
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([]);
  const [enabledTerms, setEnabledTerms] = useState<Set<string>>(new Set());
  const [overridesMap, setOverridesMap] = useState<Map<string, string>>(new Map());
  const [hasChanges, setHasChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDescriptions, setShowDescriptions] = useState(false);
  const [openCategories, setOpenCategories] = useState<string[]>(["General"]);
  
  // Track last fetched niche to prevent duplicate fetches
  const lastFetchedNicheRef = useRef<string | null>(null);

  useEffect(() => {
    fetchNiches();
  }, []);

  // Effect 1: org-present flow
  useEffect(() => {
    if (contextLoading) return;

    if (organization) {
      // Only fetch if niche actually changed
      if (lastFetchedNicheRef.current !== organization.niche_id) {
        lastFetchedNicheRef.current = organization.niche_id;
        setSelectedNicheId(organization.niche_id);
        fetchGlossaryTerms(organization.niche_id);
        fetchSalesProcesses(organization.niche_id);
      }
      fetchActiveSalesProcesses(organization.id);
      return;
    }

    // No org: we'll handle demo mode in a separate effect
    setLoading(false);
  }, [organization, contextLoading]);

  // Effect 2: demo mode fallback (no organization, but niches loaded)
  useEffect(() => {
    if (contextLoading || organization) return;
    if (!niches.length) return;

    // Choose Online Sales if available, else first niche
    const onlineSales = niches.find((n) => n.slug === "online-sales") || niches[0];

    setSelectedNicheId(onlineSales.id);
    fetchGlossaryTerms(onlineSales.id);
    fetchSalesProcesses(onlineSales.id);
  }, [niches, organization, contextLoading]);

  const fetchNiches = async () => {
    const { data } = await supabase
      .from('niches')
      .select('*')
      .eq('is_system_template', true)
      .order('name');
    
    if (data) setNiches(data);
  };

  const fetchGlossaryTerms = async (nicheId: string) => {
    setLoading(true);
    
    try {
      const { data: terms } = await supabase
        .from('glossary_terms')
        .select('*')
        .eq('niche_id', nicheId)
        .order('display_order, category, term_key');
      
      let overridesMapLocal = new Map<string, string>();

      if (organization) {
        const { data: overrides } = await supabase
          .from('organization_glossary_overrides')
          .select('glossary_term_id, custom_label')
          .eq('organization_id', organization.id);

        overrides?.forEach((o) => {
          overridesMapLocal.set(o.glossary_term_id, o.custom_label);
        });
      }
      
      if (terms) {
        setGlossaryTerms(terms);
        setEnabledTerms(new Set(terms.map(t => t.id)));
        setOverridesMap(overridesMapLocal);
      }
    } catch (error) {
      console.error('Error fetching glossary terms:', error);
      toast({
        title: "Error",
        description: "Failed to load glossary terms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesProcesses = async (nicheId: string) => {
    const { data } = await supabase
      .from('sales_processes')
      .select('*')
      .eq('niche_id', nicheId);
    
    if (data) setAvailableSalesProcesses(data);
  };

  const fetchActiveSalesProcesses = async (orgId: string) => {
    const { data } = await supabase
      .from("organization_sales_processes")
      .select("sales_process_id")
      .eq("organization_id", orgId)
      .eq("is_active", true);

    if (data) {
      setSelectedProcessIds(new Set(data.map(p => p.sales_process_id)));
    }
  };

  const handleNicheChange = async (nicheId: string) => {
    // Guard against concurrent changes
    if (saving || loading) return;
    
    if (!organization) {
      toast({
        title: "Demo mode",
        description: "Changing the organization niche requires an organization. You can still browse glossary terms.",
      });
      setSelectedNicheId(nicheId);
      lastFetchedNicheRef.current = nicheId;
      await fetchGlossaryTerms(nicheId);
      await fetchSalesProcesses(nicheId);
      return;
    }

    setSaving(true);
    lastFetchedNicheRef.current = nicheId;
    
    const { error } = await supabase
      .from('organizations')
      .update({ niche_id: nicheId })
      .eq('id', organization.id);
    
    if (!error) {
      setSelectedNicheId(nicheId);
      toast({
        title: "Niche Updated",
        description: "Loading new glossary terms...",
      });
      fetchGlossaryTerms(nicheId);
      fetchSalesProcesses(nicheId);
    } else {
      toast({
        title: "Error",
        description: "Failed to update niche",
        variant: "destructive",
      });
    }
    
    setSaving(false);
  };

  const handleProcessToggle = async (processId: string) => {
    if (!organization) {
      toast({
        title: "Demo mode",
        description: "Saving sales process requires an organization.",
      });
      const newSet = new Set(selectedProcessIds);
      if (newSet.has(processId)) {
        newSet.delete(processId);
      } else {
        newSet.add(processId);
      }
      setSelectedProcessIds(newSet);
      return;
    }

    const isCurrentlySelected = selectedProcessIds.has(processId);
    setSaving(true);

    try {
      if (isCurrentlySelected) {
        await supabase
          .from("organization_sales_processes")
          .delete()
          .eq("organization_id", organization.id)
          .eq("sales_process_id", processId);
      } else {
        await supabase
          .from("organization_sales_processes")
          .insert({
            organization_id: organization.id,
            sales_process_id: processId,
            is_active: true,
          });
      }

      const newSet = new Set(selectedProcessIds);
      if (isCurrentlySelected) {
        newSet.delete(processId);
      } else {
        newSet.add(processId);
      }
      setSelectedProcessIds(newSet);

      toast({
        title: isCurrentlySelected ? "Process Disabled" : "Process Enabled",
      });
    } catch (error) {
      console.error("Error toggling sales process:", error);
      toast({
        title: "Error",
        description: "Failed to update sales process selection",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTermToggle = (termId: string) => {
    const newEnabledTerms = new Set(enabledTerms);
    
    if (newEnabledTerms.has(termId)) {
      newEnabledTerms.delete(termId);
    } else {
      newEnabledTerms.add(termId);
    }
    
    setEnabledTerms(newEnabledTerms);
    setHasChanges(true);
  };

  const handleOverrideChange = (termId: string, customLabel: string) => {
    const newOverridesMap = new Map(overridesMap);
    
    if (customLabel.trim()) {
      newOverridesMap.set(termId, customLabel);
    } else {
      newOverridesMap.delete(termId);
    }
    
    setOverridesMap(newOverridesMap);
    setHasChanges(true);
  };

  const handleResetOverride = (termId: string) => {
    const newOverridesMap = new Map(overridesMap);
    newOverridesMap.delete(termId);
    setOverridesMap(newOverridesMap);
    setHasChanges(true);
  };

  const handleEnableAllInCategory = (categoryTerms: GlossaryTerm[]) => {
    const newEnabledTerms = new Set(enabledTerms);
    categoryTerms.forEach(term => newEnabledTerms.add(term.id));
    setEnabledTerms(newEnabledTerms);
    setHasChanges(true);
  };

  const handleDisableAllInCategory = (categoryTerms: GlossaryTerm[]) => {
    const newEnabledTerms = new Set(enabledTerms);
    categoryTerms.forEach(term => newEnabledTerms.delete(term.id));
    setEnabledTerms(newEnabledTerms);
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    if (!organization) {
      toast({
        title: "Demo mode",
        description: "Glossary overrides are only saved when linked to an organization.",
      });
      return;
    }

    setSaving(true);
    
    try {
      await supabase
        .from('organization_glossary_overrides')
        .delete()
        .eq('organization_id', organization.id);
      
      const overridesToInsert = Array.from(overridesMap.entries())
        .filter(([termId]) => enabledTerms.has(termId))
        .map(([termId, customLabel]) => ({
          organization_id: organization.id,
          glossary_term_id: termId,
          custom_label: customLabel
        }));
      
      if (overridesToInsert.length > 0) {
        await supabase
          .from('organization_glossary_overrides')
          .insert(overridesToInsert);
      }
      
      toast({
        title: "Changes Saved",
        description: "Refreshing application...",
      });
      
      setTimeout(() => window.location.reload(), 1000);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    }
    
    setSaving(false);
    setHasChanges(false);
  };

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
      "Performance Metrics"
    ];

    const groups = new Map<string, GlossaryTerm[]>();

    filteredTerms.forEach((term) => {
      // Terms with display_order = 1 go to "General" category
      const category = term.display_order === 1 ? 'General' : (term.category || 'Uncategorized');
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(term);
    });

    // Sort categories by predefined order
    const orderedEntries: [string, GlossaryTerm[]][] = [];
    categoryOrder.forEach(cat => {
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

  const handleToggleAllCategories = () => {
    if (allExpanded) {
      setOpenCategories([]);
    } else {
      setOpenCategories(groupedTerms.map(([category]) => category));
    }
  };

  if (loading || contextLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!organization && (
        <Card>
          <CardContent className="py-3">
            <p className="text-sm text-muted-foreground">
              You're viewing glossary customization in preview mode without an attached organization. 
              You can browse and experiment, but some changes won't be saved.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Industry & Niche Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Industry & Niche Configuration</CardTitle>
          <CardDescription>
            Select your organization's industry vertical to load relevant terminology
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {niches.map((niche) => {
              const isSelected = selectedNicheId === niche.id;
              return (
                <Card
                  key={niche.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => handleNicheChange(niche.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-1">
                          {niche.name}
                        </h4>
                        {niche.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {niche.description}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="h-5 w-5 text-primary ml-2 flex-shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
            <Badge variant="outline">
              {glossaryTerms.length} terms available
            </Badge>
            in {niches.find((n) => n.id === selectedNicheId)?.name}
          </div>
        </CardContent>
      </Card>

      {/* Form Template Presets */}
      <Card>
        <CardHeader>
          <CardTitle>Form Template Presets</CardTitle>
          <CardDescription>
            Toggle on the form templates you want to use as quick starting points
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormTemplatePresets />
        </CardContent>
      </Card>

      {/* Sales Process Models */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Process Models</CardTitle>
          <CardDescription>
            Enable multiple sales processes for different departments or workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableSalesProcesses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sales processes available for this niche
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableSalesProcesses.map((process) => {
                const isSelected = selectedProcessIds.has(process.id);
                return (
                  <Card
                    key={process.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => handleProcessToggle(process.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base mb-1">
                            {process.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {Array.isArray(process.stages)
                              ? process.stages.length
                              : 0}{" "}
                            stages
                          </p>
                        </div>
                        <Switch
                          checked={isSelected}
                          onClick={(e) => e.stopPropagation()}
                          onCheckedChange={() => handleProcessToggle(process.id)}
                          className="ml-2"
                        />
                      </div>
                      {isSelected &&
                        Array.isArray(process.stages) &&
                        process.stages.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t">
                            {process.stages.slice(0, 3).map((stage: any) => (
                              <Badge
                                key={stage.id}
                                variant="secondary"
                                className="text-xs"
                              >
                                {stage.name}
                              </Badge>
                            ))}
                            {process.stages.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{process.stages.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Terminology Quick Reference */}
      <Card className="bg-accent/30 border-accent">
        <CardHeader>
          <CardTitle className="text-lg">Understanding Your Glossary Terms</CardTitle>
          <CardDescription>
            Common terminology questions and how terms relate to each other
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">What's the difference between...</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-medium">Lead vs Contact</p>
                  <p className="text-muted-foreground">All leads are contacts, but not all contacts are leads. A contact is anyone in your database; a lead is someone who might buy.</p>
                </div>
                <div>
                  <p className="font-medium">Lead vs Prospect</p>
                  <p className="text-muted-foreground">Leads are unqualified opportunities. Prospects are qualified leads you're actively working with.</p>
                </div>
                <div>
                  <p className="font-medium">Customer vs Client</p>
                  <p className="text-muted-foreground">Customer is transactional. Client implies an ongoing relationship with repeat business.</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Typical Contact Journey</h4>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">1</Badge>
                  <span className="text-muted-foreground">Contact → Lead (shows interest)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">2</Badge>
                  <span className="text-muted-foreground">Lead → Qualified Lead (meets criteria)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">3</Badge>
                  <span className="text-muted-foreground">Qualified Lead → Prospect (active engagement)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">4</Badge>
                  <span className="text-muted-foreground">Prospect → Customer (purchase made)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">5</Badge>
                  <span className="text-muted-foreground">Customer → Client (ongoing relationship)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Glossary Terms Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Glossary Terms Management</CardTitle>
              <CardDescription>
                Enable, disable, and customize terminology for your organization
              </CardDescription>
            </div>
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleAllCategories}
              >
                <ChevronsUpDown className="mr-2 h-4 w-4" />
                {allExpanded ? "Collapse All" : "Expand All"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDescriptions(!showDescriptions)}
              >
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
              <AccordionItem
                key={category}
                value={category}
                className="border rounded-lg bg-card"
              >
                <AccordionTrigger className="px-4 hover:no-underline hover:bg-accent/50">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="default" className="text-sm">
                        {category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {terms.length} terms
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>
                          {terms.filter((t) => enabledTerms.has(t.id)).length}{" "}
                          enabled
                        </span>
                        <span>•</span>
                        <span>
                          {terms.filter((t) => overridesMap.has(t.id)).length}{" "}
                          customized
                        </span>
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
                      const hasOverride =
                        customLabel && customLabel !== term.default_label;
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
                            <div className={`h-2 w-2 rounded-full ${
                              isEnabled ? "bg-primary" : "bg-muted-foreground/40"
                            }`} />
                            
                            {/* Term Label */}
                            <div className="font-medium">
                              {term.default_label}
                            </div>

                            {/* Custom Label Input */}
                            <div className="flex items-center gap-2 min-w-0">
                              <Input
                                placeholder={term.default_label}
                                value={customLabel || ""}
                                onChange={(e) =>
                                  handleOverrideChange(term.id, e.target.value)
                                }
                                disabled={!isEnabled}
                                className={`h-8 text-sm ${
                                  hasOverride ? "border-primary" : ""
                                }`}
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
                            <code className="text-xs text-muted-foreground text-right">
                              {term.term_key}
                            </code>
                          </div>

                          {/* Show descriptions and alternative examples if available */}
                          {showDescriptions && hasDescriptions && isEnabled && (
                            <div className="px-3 pb-3 pt-2 border-t space-y-3">
                              {term.description && (
                                <div>
                                  <Label className="text-xs font-semibold text-foreground mb-1 block">
                                    Description
                                  </Label>
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {term.description}
                                  </p>
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
    </div>
  );
};