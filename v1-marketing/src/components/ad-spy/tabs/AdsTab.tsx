import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdSpySearch } from "../AdSpySearch";
import { AdSpyFilters } from "../AdSpyFilters";
import { AdSpyAdCard } from "../AdSpyAdCard";
import { AdSpyAdLine } from "../AdSpyAdLine";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";

interface AdsTabProps {
  viewMode: "card" | "line";
  channelFilter: string;
  onViewModeChange: (mode: "card" | "line") => void;
  onChannelFilterChange: (channel: string) => void;
}

export function AdsTab({ viewMode, channelFilter, onViewModeChange, onChannelFilterChange }: AdsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(true);
  const [mediaType, setMediaType] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(true);

  // Fetch competitors
  const { data: competitors = [] } = useQuery({
    queryKey: ["ad-spy-competitors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_spy_competitors")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch ads with filters
  const { data: ads = [], isLoading } = useQuery({
    queryKey: ["ad-spy-ads", selectedCompetitors, mediaType, status, sortBy, searchQuery, showAll, channelFilter],
    queryFn: async () => {
      let query = supabase
        .from("ad_spy_ads")
        .select(`
          *,
          competitor:ad_spy_competitors(id, name, logo_url)
        `);

      // Apply filters
      if (!showAll && selectedCompetitors.length > 0) {
        query = query.in("competitor_id", selectedCompetitors);
      }
      
      if (channelFilter !== "all") {
        query = query.eq("channel", channelFilter);
      }
      
      if (mediaType !== "all") {
        query = query.eq("media_type", mediaType);
      }
      
      if (status !== "all") {
        query = query.eq("status", status);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,landing_page_url.ilike.%${searchQuery}%`);
      }

      // Apply sorting
      if (sortBy === "newest") {
        query = query.order("created_at", { ascending: false });
      } else if (sortBy === "oldest") {
        query = query.order("created_at", { ascending: true });
      } else if (sortBy === "duration") {
        query = query.order("duration_days", { ascending: false, nullsFirst: false });
      } else if (sortBy === "title") {
        query = query.order("title");
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
  });

  const handleCompetitorToggle = (id: string) => {
    setShowAll(false);
    setSelectedCompetitors((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
    );
  };

  const handleShowAllToggle = () => {
    setShowAll(!showAll);
    if (!showAll) {
      setSelectedCompetitors([]);
    }
  };

  // Count ads per competitor
  const competitorsWithCount = competitors.map((comp) => ({
    id: comp.id,
    name: comp.name,
    count: ads.filter((ad) => ad.competitor_id === comp.id).length,
  }));

  // Calculate analytics
  const activeAdsCount = ads.filter((ad) => ad.status === "active").length;
  const landingPages = Array.from(new Set(ads.map((ad) => ad.landing_page_url).filter(Boolean)));
  const topHooks = ads
    .filter((ad) => ad.hook)
    .slice(0, 5)
    .map((ad) => ({ text: ad.hook, duration: ad.duration_days }));

  return (
    <div className="space-y-6">
      <AdSpySearch
        competitors={competitorsWithCount}
        selectedCompetitors={selectedCompetitors}
        onCompetitorToggle={handleCompetitorToggle}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showAll={showAll}
        onShowAllToggle={handleShowAllToggle}
        selectedChannel={channelFilter}
        onChannelChange={onChannelFilterChange}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
      />

      {/* Analytics Section */}
      <Collapsible open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
        <Card className="border-border">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-4 h-auto hover:bg-transparent"
            >
              <span className="text-sm font-medium text-foreground">Analytics Overview</span>
              {isAnalyticsOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Active Ads Gauge */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Active Ads</h4>
                  <div className="flex items-center justify-center h-32">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-muted"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeDasharray={`${(activeAdsCount / ads.length) * 352} 352`}
                          className="text-primary transition-all"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-2xl font-bold text-foreground">{activeAdsCount}</span>
                        <span className="text-xs text-muted-foreground">of {ads.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Landing Pages */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Landing Pages</h4>
                  <div className="space-y-2">
                    {landingPages.slice(0, 5).map((url, idx) => {
                      const adsForPage = ads.filter((ad) => ad.landing_page_url === url);
                      const percentage = ((adsForPage.length / ads.length) * 100).toFixed(1);
                      
                      // Group by competitor
                      const competitorBreakdown = adsForPage.reduce((acc, ad) => {
                        const name = ad.competitor?.name || 'Unknown';
                        acc[name] = (acc[name] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                      
                      const topCompetitor = Object.entries(competitorBreakdown)
                        .sort(([, a], [, b]) => b - a)[0];

                      return (
                        <div
                          key={idx}
                          className="bg-muted/50 rounded-md px-3 py-2 space-y-1"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="truncate text-foreground font-medium">
                              {url ? new URL(url as string).hostname : "Unknown"}
                            </span>
                            <span className="text-primary font-semibold ml-2">
                              {percentage}%
                            </span>
                          </div>
                          {topCompetitor && (
                            <div className="text-xs text-muted-foreground">
                              {topCompetitor[0]}: {topCompetitor[1]} ads
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {landingPages.length === 0 && (
                      <p className="text-sm text-muted-foreground">No landing pages tracked</p>
                    )}
                  </div>
                </div>

                {/* Top Hooks */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Top Performing Hooks</h4>
                  <div className="space-y-2">
                    {topHooks.map((hook, idx) => (
                      <div
                        key={idx}
                        className="bg-muted/50 rounded-md px-2.5 py-1.5 space-y-1"
                      >
                        <p className="text-xs text-foreground line-clamp-2">{hook.text}</p>
                        {hook.duration && (
                          <span className="text-xs text-primary font-medium">
                            {hook.duration}d running
                          </span>
                        )}
                      </div>
                    ))}
                    {topHooks.length === 0 && (
                      <p className="text-sm text-muted-foreground">No hooks tracked</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <AdSpyFilters
        mediaType={mediaType}
        dateRange={dateRange}
        status={status}
        sortBy={sortBy}
        onMediaTypeChange={setMediaType}
        onDateRangeChange={setDateRange}
        onStatusChange={setStatus}
        onSortByChange={setSortBy}
      />

      {/* Ads Display */}
      {isLoading ? (
        viewMode === "card" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-square bg-muted animate-pulse" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <Card key={i} className="p-4">
                <div className="h-16 bg-muted animate-pulse rounded" />
              </Card>
            ))}
          </div>
        )
      ) : ads.length > 0 ? (
        viewMode === "card" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {ads.map((ad) => (
              <AdSpyAdCard key={ad.id} ad={ad} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {ads.map((ad) => (
              <AdSpyAdLine key={ad.id} ad={ad} />
            ))}
          </div>
        )
      ) : (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No ads found. Try adjusting your filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
