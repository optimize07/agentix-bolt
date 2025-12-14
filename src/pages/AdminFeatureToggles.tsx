import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Loader2,
  Search,
  ChevronRight,
  ChevronDown,
  Settings2,
  ToggleLeft,
  Building2,
  Layers,
  Bot,
  Plug,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  listFeatureDefinitions,
  listPlatformToggles,
  setPlatformToggle,
  type FeatureDefinition,
  type PlatformFeatureToggle,
} from "@/integrations/feature-toggles/api";
import { listClients, type Client } from "@/integrations/clients/api";

interface FeatureNode {
  feature: FeatureDefinition;
  children: FeatureNode[];
  platformEnabled: boolean | null;
  effectiveEnabled: boolean;
}

const categoryIcons: Record<string, React.ElementType> = {
  department: Building2,
  agent: Bot,
  feature: Layers,
  module: Settings2,
};

const categoryLabels: Record<string, string> = {
  department: "Departments",
  agent: "Agents",
  feature: "Features",
  module: "Modules",
};

export default function AdminFeatureToggles() {
  const { toast } = useToast();
  const [features, setFeatures] = useState<FeatureDefinition[]>([]);
  const [platformToggles, setPlatformToggles] = useState<PlatformFeatureToggle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["department"])
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [featuresData, togglesData, clientsData] = await Promise.all([
        listFeatureDefinitions(),
        listPlatformToggles(),
        listClients(),
      ]);
      setFeatures(featuresData);
      setPlatformToggles(togglesData);
      setClients(clientsData);
    } catch (e) {
      console.error("Failed to load data:", e);
      toast({
        title: "Error",
        description: "Failed to load feature toggles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(featureKey: string, enabled: boolean) {
    setSaving(featureKey);
    try {
      await setPlatformToggle(featureKey, enabled);
      setPlatformToggles((prev) => {
        const existing = prev.find((t) => t.feature_key === featureKey);
        if (existing) {
          return prev.map((t) =>
            t.feature_key === featureKey ? { ...t, enabled } : t
          );
        }
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            feature_key: featureKey,
            enabled,
            updated_by: null,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          },
        ];
      });
      toast({
        title: enabled ? "Feature Enabled" : "Feature Disabled",
        description: `${featureKey} has been ${enabled ? "enabled" : "disabled"} platform-wide.`,
      });
    } catch (e) {
      console.error("Failed to toggle feature:", e);
      toast({
        title: "Error",
        description: "Failed to update feature toggle",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  }

  // Build feature tree
  const toggleMap = new Map(platformToggles.map((t) => [t.feature_key, t.enabled]));

  function getEffectiveEnabled(feature: FeatureDefinition): boolean {
    const platformEnabled = toggleMap.get(feature.key);
    if (platformEnabled !== undefined) return platformEnabled;
    return feature.default_enabled;
  }

  function buildTree(parentKey: string | null): FeatureNode[] {
    return features
      .filter((f) => f.parent_key === parentKey)
      .filter((f) => {
        if (categoryFilter !== "all" && f.category !== categoryFilter) {
          // But include if it has children that match
          const hasMatchingChildren = features.some(
            (child) =>
              child.parent_key === f.key &&
              (categoryFilter === "all" || child.category === categoryFilter)
          );
          if (!hasMatchingChildren) return false;
        }
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchesSelf =
            f.name.toLowerCase().includes(q) ||
            f.key.toLowerCase().includes(q) ||
            f.description?.toLowerCase().includes(q);
          const hasMatchingChildren = features.some(
            (child) =>
              child.parent_key === f.key &&
              (child.name.toLowerCase().includes(q) ||
                child.key.toLowerCase().includes(q))
          );
          if (!matchesSelf && !hasMatchingChildren) return false;
        }
        return true;
      })
      .map((f) => ({
        feature: f,
        children: buildTree(f.key),
        platformEnabled: toggleMap.get(f.key) ?? null,
        effectiveEnabled: getEffectiveEnabled(f),
      }));
  }

  const featureTree = buildTree(null);

  // Group by category for display
  const categories = Array.from(new Set(features.map((f) => f.category)));

  function toggleCategory(category: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  function FeatureRow({
    node,
    depth = 0,
  }: {
    node: FeatureNode;
    depth?: number;
  }) {
    const [expanded, setExpanded] = useState(depth < 2);
    const hasChildren = node.children.length > 0;
    const CategoryIcon = categoryIcons[node.feature.category] || Settings2;
    const isDisabledByParent =
      node.feature.parent_key &&
      !getEffectiveEnabled(
        features.find((f) => f.key === node.feature.parent_key)!
      );

    return (
      <div className="border-b border-border last:border-b-0">
        <div
          className={`flex items-center gap-3 py-3 px-4 hover:bg-muted/50 transition-colors ${
            depth > 0 ? "pl-" + (4 + depth * 6) : ""
          }`}
          style={{ paddingLeft: `${16 + depth * 24}px` }}
        >
          {hasChildren ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-0.5 hover:bg-muted rounded"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}

          <CategoryIcon className="h-4 w-4 text-muted-foreground" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground truncate">
                {node.feature.name}
              </span>
              <Badge
                variant="outline"
                className="text-xs capitalize hidden sm:inline-flex"
              >
                {node.feature.category}
              </Badge>
            </div>
            {node.feature.description && (
              <p className="text-xs text-muted-foreground truncate">
                {node.feature.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isDisabledByParent && (
              <div className="flex items-center gap-1 text-xs text-amber-500">
                <AlertCircle className="h-3 w-3" />
                <span className="hidden md:inline">Parent disabled</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {node.effectiveEnabled ? "Enabled" : "Disabled"}
              </span>
              <Switch
                checked={node.effectiveEnabled}
                onCheckedChange={(checked) =>
                  handleToggle(node.feature.key, checked)
                }
                disabled={saving === node.feature.key || isDisabledByParent}
              />
              {saving === node.feature.key && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </div>
          </div>
        </div>

        {hasChildren && expanded && (
          <div className="bg-muted/20">
            {node.children.map((child) => (
              <FeatureRow key={child.feature.key} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-border bg-background">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <ToggleLeft className="h-6 w-6" />
                  Feature Toggles
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage platform-wide feature availability. These are default
                  settings that cascade to all clients.
                </p>
              </div>
              <Button
                variant="outline"
                className="gap-2"
                onClick={loadData}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search features..."
                  className="pl-10 bg-sidebar border-border"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {categoryLabels[cat] || cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="text-2xl font-bold text-foreground">
                    {features.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Features
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-green-500">
                    {features.filter((f) => getEffectiveEnabled(f)).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Enabled</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-red-500">
                    {features.filter((f) => !getEffectiveEnabled(f)).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Disabled</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-foreground">
                    {clients.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Clients</div>
                </Card>
              </div>

              {/* Feature Tree by Category */}
              {categories
                .filter((cat) => categoryFilter === "all" || cat === categoryFilter)
                .map((category) => {
                  const categoryFeatures = featureTree.filter(
                    (node) => node.feature.category === category
                  );
                  if (categoryFeatures.length === 0) return null;

                  const CategoryIcon = categoryIcons[category] || Settings2;
                  const isExpanded = expandedCategories.has(category);

                  return (
                    <Collapsible
                      key={category}
                      open={isExpanded}
                      onOpenChange={() => toggleCategory(category)}
                    >
                      <Card className="border border-border overflow-hidden">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              )}
                              <CategoryIcon className="h-5 w-5 text-primary" />
                              <span className="font-semibold text-foreground">
                                {categoryLabels[category] || category}
                              </span>
                              <Badge variant="secondary">
                                {categoryFeatures.length}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {
                                categoryFeatures.filter((n) => n.effectiveEnabled)
                                  .length
                              }{" "}
                              enabled
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="border-t border-border">
                            {categoryFeatures.map((node) => (
                              <FeatureRow key={node.feature.key} node={node} />
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                })}

              {/* Child features (agents, modules) that belong to departments */}
              {categoryFilter === "all" && (
                <Card className="border border-border overflow-hidden">
                  <Collapsible
                    open={expandedCategories.has("nested")}
                    onOpenChange={() => toggleCategory("nested")}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {expandedCategories.has("nested") ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <Plug className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-foreground">
                            Integrations & Nested Features
                          </span>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t border-border">
                        {featureTree
                          .filter((n) => n.feature.category === "feature")
                          .map((node) => (
                            <FeatureRow key={node.feature.key} node={node} />
                          ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

