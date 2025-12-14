import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AdSpyAdCard } from "../AdSpyAdCard";
import { toast } from "sonner";
import { Loader2, TrendingUp, X } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface RuleConfig {
  enabled: boolean;
  operator: ">" | ">=" | "=";
  value: number;
}

interface ChannelRules {
  minLikes?: RuleConfig;
  minDuration?: RuleConfig;
  minComments?: RuleConfig;
  minShares?: RuleConfig;
  minViews?: RuleConfig;
  minImpressions?: RuleConfig;
  minSpend?: RuleConfig;
  appearanceCount?: RuleConfig;
}

interface BreakoutRules {
  global: ChannelRules;
  channels: {
    facebook?: Partial<ChannelRules>;
    instagram?: Partial<ChannelRules>;
    tiktok?: Partial<ChannelRules>;
    youtube?: Partial<ChannelRules>;
    google?: Partial<ChannelRules>;
  };
  categoriesToTrack: string[];
  categoriesToExclude: string[];
  systemPrompt: string;
}

const CHANNELS = ['facebook', 'instagram', 'tiktok', 'youtube', 'google'] as const;

export default function BreakoutTab() {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState("ads");
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [newTrackCategory, setNewTrackCategory] = useState("");
  const [newExcludeCategory, setNewExcludeCategory] = useState("");

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["ad-spy-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_spy_settings")
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: breakoutAds, isLoading: isLoadingAds } = useQuery({
    queryKey: ["breakout-ads", selectedChannel],
    queryFn: async () => {
      let query = supabase
        .from("ad_spy_ads")
        .select(`
          *,
          competitor:ad_spy_competitors(name, logo_url)
        `)
        .eq("is_breakout", true);

      if (selectedChannel !== "all") {
        query = query.eq("channel", selectedChannel);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const [rules, setRules] = useState<BreakoutRules>(() => ({
    global: {},
    channels: {},
    categoriesToTrack: [],
    categoriesToExclude: [],
    systemPrompt: "",
  }));

  useEffect(() => {
    if (settings?.breakout_rules) {
      const loadedRules = settings.breakout_rules as any;
      setRules({
        global: loadedRules.global || {},
        channels: loadedRules.channels || {},
        categoriesToTrack: loadedRules.categoriesToTrack || [],
        categoriesToExclude: loadedRules.categoriesToExclude || [],
        systemPrompt: loadedRules.systemPrompt || "",
      });
    }
  }, [settings]);

  const updateRulesMutation = useMutation({
    mutationFn: async (newRules: BreakoutRules) => {
      const { error } = await supabase
        .from("ad_spy_settings")
        .upsert({
          breakout_rules: newRules as any,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-spy-settings"] });
      toast.success("Breakout rules updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update rules: ${error.message}`);
    },
  });

  const handleSaveRules = () => {
    updateRulesMutation.mutate(rules);
  };

  const updateGlobalRule = (
    key: keyof ChannelRules,
    field: keyof RuleConfig,
    value: any
  ) => {
    setRules((prev) => ({
      ...prev,
      global: {
        ...prev.global,
        [key]: {
          ...(prev.global[key] || { enabled: false, operator: ">", value: 0 }),
          [field]: value,
        },
      },
    }));
  };

  const updateChannelRule = (
    channel: keyof BreakoutRules["channels"],
    key: keyof ChannelRules,
    field: keyof RuleConfig,
    value: any
  ) => {
    setRules((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: {
          ...prev.channels[channel],
          [key]: {
            ...(prev.channels[channel]?.[key] || { enabled: false, operator: ">", value: 0 }),
            [field]: value,
          },
        },
      },
    }));
  };

  const addCategory = (type: 'track' | 'exclude', category: string) => {
    if (!category.trim()) return;
    
    setRules((prev) => ({
      ...prev,
      [type === 'track' ? 'categoriesToTrack' : 'categoriesToExclude']: [
        ...(type === 'track' ? prev.categoriesToTrack : prev.categoriesToExclude),
        category.trim()
      ],
    }));

    if (type === 'track') {
      setNewTrackCategory("");
    } else {
      setNewExcludeCategory("");
    }
  };

  const removeCategory = (type: 'track' | 'exclude', category: string) => {
    setRules((prev) => ({
      ...prev,
      [type === 'track' ? 'categoriesToTrack' : 'categoriesToExclude']: 
        (type === 'track' ? prev.categoriesToTrack : prev.categoriesToExclude).filter(c => c !== category),
    }));
  };

  const RuleEditor = ({
    label,
    ruleKey,
    rule,
    onUpdate,
  }: {
    label: string;
    ruleKey: keyof ChannelRules;
    rule: RuleConfig;
    onUpdate: (field: keyof RuleConfig, value: any) => void;
  }) => {
    return (
      <div className="flex items-center gap-4 p-3 border border-border rounded-lg">
        <div className="flex items-center gap-2 min-w-[180px]">
          <Switch
            checked={rule.enabled}
            onCheckedChange={(checked) => onUpdate("enabled", checked)}
          />
          <Label className="text-sm">{label}</Label>
        </div>

        {rule.enabled && (
          <>
            <Select
              value={rule.operator}
              onValueChange={(value) => onUpdate("operator", value)}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=">">{">"}</SelectItem>
                <SelectItem value=">=">{">="}</SelectItem>
                <SelectItem value="=">{"="}</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              value={rule.value}
              onChange={(e) => onUpdate("value", parseInt(e.target.value) || 0)}
              className="w-[120px]"
              min={0}
            />
          </>
        )}
      </div>
    );
  };

  const ChannelRulesSection = ({ channel }: { channel: keyof BreakoutRules["channels"] }) => {
    const channelRules = rules.channels[channel] || {};
    
    return (
      <Collapsible className="border border-border rounded-lg">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-accent/50 transition-colors">
          <span className="font-medium capitalize">{channel}</span>
          <span className="text-xs text-muted-foreground">Override global rules</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 pt-0 space-y-3">
          {(['minLikes', 'minDuration', 'minComments', 'minShares', 'minViews', 'minImpressions', 'minSpend', 'appearanceCount'] as const).map((key) => {
            const rule = channelRules[key] || { enabled: false, operator: ">", value: 0 };
            return (
              <RuleEditor
                key={key}
                label={key.replace('min', 'Min ').replace(/([A-Z])/g, ' $1')}
                ruleKey={key}
                rule={rule as RuleConfig}
                onUpdate={(field, value) => updateChannelRule(channel, key, field, value)}
              />
            );
          })}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-6">
      <TabsList>
        <TabsTrigger value="ads">
          <TrendingUp className="w-4 h-4 mr-2" />
          Breakout Ads
        </TabsTrigger>
        <TabsTrigger value="rules">Breakout Rules</TabsTrigger>
      </TabsList>

      <TabsContent value="ads" className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={selectedChannel === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedChannel("all")}
          >
            All Channels
          </Button>
          {CHANNELS.map((channel) => (
            <Button
              key={channel}
              variant={selectedChannel === channel ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedChannel(channel)}
            >
              {channel.charAt(0).toUpperCase() + channel.slice(1)}
            </Button>
          ))}
        </div>

        {isLoadingAds ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : breakoutAds && breakoutAds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {breakoutAds.map((ad) => (
              <AdSpyAdCard
                key={ad.id}
                ad={{
                  ...ad,
                  competitor: ad.competitor ? {
                    name: ad.competitor.name,
                    logo_url: ad.competitor.logo_url || undefined,
                  } : undefined,
                }}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No breakout ads yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Define rules in the Rules tab to identify breakout ads automatically
              </p>
              <Button variant="outline" onClick={() => setActiveSubTab("rules")}>
                Configure Rules
              </Button>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="rules" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Global Breakout Criteria</CardTitle>
            <CardDescription>
              Default rules applied to all channels (unless overridden by channel-specific rules)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(['minLikes', 'minDuration', 'minComments', 'minShares', 'minViews', 'minImpressions', 'minSpend', 'appearanceCount'] as const).map((key) => {
              const rule = rules.global[key] || { enabled: false, operator: ">", value: 0 };
              return (
                <RuleEditor
                  key={key}
                  label={key.replace('min', 'Min ').replace(/([A-Z])/g, ' $1')}
                  ruleKey={key}
                  rule={rule as RuleConfig}
                  onUpdate={(field, value) => updateGlobalRule(key, field, value)}
                />
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Channel-Specific Rules</CardTitle>
            <CardDescription>
              Override global rules for specific channels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {CHANNELS.map((channel) => (
              <ChannelRulesSection key={channel} channel={channel} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Tracking</CardTitle>
            <CardDescription>
              Define which categories to track and which to exclude
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Categories to Track</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newTrackCategory}
                  onChange={(e) => setNewTrackCategory(e.target.value)}
                  placeholder="e.g., skincare, fitness"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addCategory('track', newTrackCategory);
                    }
                  }}
                />
                <Button onClick={() => addCategory('track', newTrackCategory)}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {rules.categoriesToTrack.map((cat) => (
                  <Badge key={cat} variant="secondary" className="gap-1">
                    {cat}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeCategory('track', cat)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Categories to Exclude</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newExcludeCategory}
                  onChange={(e) => setNewExcludeCategory(e.target.value)}
                  placeholder="e.g., gambling, adult"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addCategory('exclude', newExcludeCategory);
                    }
                  }}
                />
                <Button onClick={() => addCategory('exclude', newExcludeCategory)}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {rules.categoriesToExclude.map((cat) => (
                  <Badge key={cat} variant="destructive" className="gap-1">
                    {cat}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeCategory('exclude', cat)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom Rules (System Prompt)</CardTitle>
            <CardDescription>
              Define custom natural language rules for breakout ad identification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={rules.systemPrompt}
              onChange={(e) => setRules(prev => ({ ...prev, systemPrompt: e.target.value }))}
              placeholder="Example: Flag any ad that runs for more than 30 days and has video content, or ads with unusually high engagement rates compared to competitor averages"
              rows={6}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Use natural language to describe additional criteria that should flag an ad as breakout
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={handleSaveRules}
            disabled={updateRulesMutation.isPending}
            size="lg"
          >
            {updateRulesMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Save All Rules
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}



