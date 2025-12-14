import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, Loader2, Settings } from "lucide-react";
import { MarketingSidebar } from "@/components/MarketingSidebar";
import AdSpyCreativeBoard from "@/components/advertising/AdSpyCreativeBoard";
import AdSpyCreativeCard from "@/components/advertising/AdSpyCreativeCard";
import GoogleSheetsConnectForm from "@/components/advertising/GoogleSheetsConnectForm";

const MarketingAdSpy = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"url" | "creator">("url");
  const [isSearching, setIsSearching] = useState(false);
  const [searches, setSearches] = useState<any[]>([]);
  const [sheetsConnected, setSheetsConnected] = useState(false);
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
  const [currentSearchResults, setCurrentSearchResults] = useState<any[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSearches();
    checkConnection();
  }, []);

  useEffect(() => {
    if (!currentSearchId) return;

    setIsLoadingResults(true);
    
    // Fetch initial results
    const fetchResults = async () => {
      const { data, error } = await supabase
        .from('ad_spy_ads')
        .select(`
          *,
          ad_spy_analysis (*)
        `)
        .eq('search_id', currentSearchId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCurrentSearchResults(data);
        if (data.length > 0) {
          setIsLoadingResults(false);
        }
      }
    };

    fetchResults();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`ads-${currentSearchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ad_spy_ads',
          filter: `search_id=eq.${currentSearchId}`
        },
        async (payload) => {
          // Fetch the analysis for this ad
          const { data: analysisData } = await supabase
            .from('ad_spy_analysis')
            .select('*')
            .eq('ad_id', payload.new.id)
            .maybeSingle();

          const adWithAnalysis = {
            ...payload.new,
            ad_spy_analysis: analysisData ? [analysisData] : []
          };

          setCurrentSearchResults(prev => [adWithAnalysis, ...prev]);
          setIsLoadingResults(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentSearchId]);

  const checkConnection = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('google_sheets_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    setSheetsConnected(!!data && !error);
  };

  const fetchSearches = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('ad_spy_searches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching searches:', error);
      return;
    }

    setSearches(data || []);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a Facebook Ads Library URL or creator name",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call edge function to scrape and analyze
      const { data, error } = await supabase.functions.invoke('ad-spy-scrape', {
        body: {
          searchQuery,
          searchType,
        }
      });

      if (error) throw error;

      // Store the search ID to track results
      setCurrentSearchId(data.searchId);
      setCurrentSearchResults([]);
      setIsLoadingResults(true);

      toast({
        title: "Search initiated",
        description: "Scraping ads and analyzing them...",
      });

      // Refresh searches
      await fetchSearches();
      setSearchQuery("");

    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: error.message || "Failed to search ads",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <MarketingSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Ad Spy</h1>
            <p className="text-muted-foreground">
              Discover and analyze competitor ads from Facebook Ads Library
            </p>
          </div>

          <Tabs defaultValue="search" className="space-y-6">
            <TabsList>
              <TabsTrigger value="search">Search Ads</TabsTrigger>
              <TabsTrigger value="board">Creative Board</TabsTrigger>
              <TabsTrigger value="history">Search History</TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-6">
              <Card className="p-6 bg-card border-border">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Search for Ads
                    </h3>
                    
                    <RadioGroup
                      value={searchType}
                      onValueChange={(value: any) => setSearchType(value)}
                      className="mb-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="url" id="url" />
                        <Label htmlFor="url">Facebook Ads Library URL</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="creator" id="creator" />
                        <Label htmlFor="creator">Creator/Brand Name</Label>
                      </div>
                    </RadioGroup>

                    <div className="flex gap-2">
                      <Input
                        placeholder={
                          searchType === "url"
                            ? "https://www.facebook.com/ads/library/?id=..."
                            : "Enter creator or brand name"
                        }
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="gap-2"
                      >
                        {isSearching ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Searching...
                          </>
                        ) : (
                          <>
                            <Search className="h-4 w-4" />
                            Search
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-2">
                    <p className="font-medium">What Ad Spy does:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Scrapes ad assets (video, image, copy) from Facebook Ads Library</li>
                      <li>AI analyzes: Hook, angle, emotion, CTA, and script structure</li>
                      <li>Provides "Why it works" explanation</li>
                      <li>Exports to Google Sheet + Creative Board view</li>
                      <li>Option to recreate for your offer</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Search Results Section */}
              {currentSearchId && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">
                      Search Results
                    </h3>
                    {isLoadingResults && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Finding and analyzing ads...</span>
                      </div>
                    )}
                    {!isLoadingResults && currentSearchResults.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {currentSearchResults.length} {currentSearchResults.length === 1 ? 'ad' : 'ads'} found
                      </span>
                    )}
                  </div>

                  {currentSearchResults.length === 0 && !isLoadingResults ? (
                    <Card className="p-8 text-center bg-card border-border">
                      <p className="text-muted-foreground">No ads found for this search.</p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {currentSearchResults.map((ad) => (
                        <AdSpyCreativeCard key={ad.id} ad={ad} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="board">
              <AdSpyCreativeBoard />
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {searches.length === 0 ? (
                <Card className="p-12 text-center bg-card border-border">
                  <p className="text-muted-foreground">No searches yet. Start by searching for ads above.</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {searches.map((search) => (
                    <Card key={search.id} className="p-4 bg-card border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{search.search_query}</p>
                          <p className="text-sm text-muted-foreground">
                            Type: {search.search_type} • {new Date(search.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card className="p-6 bg-card border-border">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Google Sheets Connection
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Connect your Google Sheet to export scraped ad data automatically. Ad Spy will export all discovered ads including their analysis to your connected sheet.
                    </p>
                    
                    <GoogleSheetsConnectForm 
                      isConnected={sheetsConnected}
                      onConnect={() => checkConnection()}
                    />
                  </div>

                  {!sheetsConnected && (
                    <div className="bg-muted/50 border border-border rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">
                        <strong>Note:</strong> Google Sheets connection is required for the "Export to Google Sheet" feature. Connect your sheet above to enable this functionality.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default MarketingAdSpy;




