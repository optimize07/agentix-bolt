import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, LayoutGrid, History, TrendingUp, Settings, Microscope, List, Grid3x3 } from "lucide-react";
import { AdsTab } from "@/components/ad-spy/tabs/AdsTab";
import { BoardsTab } from "@/components/ad-spy/tabs/BoardsTab";
import { ResearchTab } from "@/components/ad-spy/tabs/ResearchTab";
import { SettingsTab } from "@/components/ad-spy/tabs/SettingsTab";
import BreakoutTab from "@/components/ad-spy/tabs/BreakoutTab";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AdSpy() {
  const [activeTab, setActiveTab] = useState("ads");
  const [viewMode, setViewMode] = useState<"card" | "line">("card");
  const [channelFilter, setChannelFilter] = useState<string>("all");

  const channels = [
    { id: "facebook", label: "Facebook", icon: "📘" },
    { id: "instagram", label: "Instagram", icon: "📷" },
    { id: "tiktok", label: "TikTok", icon: "🎵" },
    { id: "youtube", label: "YouTube", icon: "▶️" },
    { id: "google", label: "Google", icon: "🔍" },
  ];

  return (
    <div className="min-h-screen bg-background">
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
    </div>
  );
}
