import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, LayoutGrid, History, TrendingUp, Settings, Microscope, Lock } from "lucide-react";
import { AdsTab } from "@/components/ad-spy/tabs/AdsTab";
import { BoardsTab } from "@/components/ad-spy/tabs/BoardsTab";
import { ResearchTab } from "@/components/ad-spy/tabs/ResearchTab";
import { SettingsTab } from "@/components/ad-spy/tabs/SettingsTab";
import BreakoutTab from "@/components/ad-spy/tabs/BreakoutTab";
import { useFeatureToggle } from "@/hooks/useFeatureToggle";
import { AdvertisingSidebar } from "@/components/AdvertisingSidebar";

export default function AdSpyNew() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const [activeTab, setActiveTab] = useState("ads");
  const [viewMode, setViewMode] = useState<"card" | "line">("card");
  const [channelFilter, setChannelFilter] = useState<string>("all");

  // Feature toggle check
  const { enabled: featureEnabled, loading: featureLoading } = useFeatureToggle("feature.ad-spy-enhanced");

  // Show feature disabled message if feature is toggled off
  if (!featureLoading && !featureEnabled) {
    return (
      <div className="flex min-h-screen">
        {clientId && <AdvertisingSidebar />}
        <div className="flex-1 p-8 flex items-center justify-center">
          <Card className="p-8 max-w-md text-center">
            <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Feature Not Available</h2>
            <p className="text-muted-foreground mb-4">
              Enhanced Ad Spy is currently disabled. Contact your administrator to enable this feature.
            </p>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {clientId && <AdvertisingSidebar />}
      <main className="flex-1 bg-background overflow-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-border bg-card">
          <div className="px-6">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Search className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Ad Spy</h1>
                  <p className="text-xs text-muted-foreground">Research competitor advertising strategies</p>
                </div>
              </div>
            </div>

            <TabsList className="w-full justify-start h-12 bg-transparent border-0 p-0 gap-1">
              {/* PRIMARY TABS - Prominent */}
              <TabsTrigger 
                value="ads" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent font-semibold text-base"
              >
                <Search className="w-4 h-4 mr-2" />
                Ads
              </TabsTrigger>
              <TabsTrigger 
                value="boards"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent font-semibold text-base"
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Boards
              </TabsTrigger>
              
              {/* SEPARATOR */}
              <div className="mx-2 h-6 border-l border-border" />
              
              {/* SECONDARY TABS - Smaller */}
              <TabsTrigger 
                value="history"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent text-sm text-muted-foreground"
              >
                <History className="w-3.5 h-3.5 mr-1.5" />
                History
              </TabsTrigger>
              <TabsTrigger 
                value="research"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent text-sm text-muted-foreground"
              >
                <Microscope className="w-3.5 h-3.5 mr-1.5" />
                Research
              </TabsTrigger>
              <TabsTrigger 
                value="breakout"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent text-sm text-muted-foreground"
              >
                <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                Breakout
              </TabsTrigger>
              
              {/* SETTINGS - Right side */}
              <div className="ml-auto flex items-center gap-1">
                {/* SETTINGS */}
                <TabsTrigger 
                  value="settings"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
                >
                  <Settings className="w-4 h-4" />
                </TabsTrigger>
              </div>
            </TabsList>
          </div>
        </div>

        <div className="px-6 py-6">
          <TabsContent value="ads" className="mt-0">
            <AdsTab 
              viewMode={viewMode} 
              channelFilter={channelFilter}
              onViewModeChange={setViewMode}
              onChannelFilterChange={setChannelFilter}
            />
          </TabsContent>

          <TabsContent value="boards" className="mt-0">
            <BoardsTab />
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <div className="text-center py-12 text-muted-foreground">
              History tab coming soon...
            </div>
          </TabsContent>

          <TabsContent value="research" className="mt-0">
            <ResearchTab />
          </TabsContent>

          <TabsContent value="breakout" className="mt-0">
            <BreakoutTab />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <SettingsTab />
          </TabsContent>
        </div>
      </Tabs>
      </main>
    </div>
  );
}

