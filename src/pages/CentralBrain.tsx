import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useFeatureToggle } from "@/hooks/useFeatureToggle";
import {
  Brain,
  Search,
  BookOpen,
  Target,
  Image as ImageIcon,
  Settings,
  Palette,
  FileText,
  Users2,
  Network,
  Star,
  RefreshCw,
  Plus,
  ChevronRight,
  Loader2,
  Check,
  MessageSquare,
  TrendingUp,
  Lightbulb,
  Eye,
  Archive,
  Upload,
  Package,
  UserCircle,
  Video,
  Link as LinkIcon,
  Music,
  File,
  Camera,
  Wand2,
  Layers,
  Database as DatabaseIcon,
  Shield,
  Crown,
  Lock,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type KnowledgeBaseItem = Database["public"]["Tables"]["knowledge_base_items"]["Row"];

interface SectionCard {
  id: string;
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  count: number;
  color: string;
  href?: string;
  tab?: string;
}

export default function CentralBrain() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  // Feature toggle check
  const { enabled: featureEnabled, loading: featureLoading } = useFeatureToggle("feature.central-brain");

  // Show feature disabled message if feature is toggled off
  if (!featureLoading && !featureEnabled) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md text-center">
          <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Feature Not Available</h2>
          <p className="text-muted-foreground mb-4">
            Central Brain is currently disabled. Contact your administrator to enable this feature.
          </p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  // Fetch knowledge base items
  const { data: kbItems = [], isLoading: isLoadingKB, refetch: refetchKB } = useQuery({
    queryKey: ["central-brain-kb-items"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("knowledge_base_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as KnowledgeBaseItem[];
    },
  });

  // Fetch agent boards count
  const { data: boardsCount = 0 } = useQuery({
    queryKey: ["agent-boards-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("agent_boards")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch swipe files count
  const { data: swipeFilesCount = 0 } = useQuery({
    queryKey: ["swipe-files-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("swipe_files")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Get category statistics
  const categoryStats = kbItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get indexing status
  const indexedCount = kbItems.filter(item => item.indexing_status === "indexed").length;
  const processingCount = kbItems.filter(item => item.indexing_status === "processing").length;
  const failedCount = kbItems.filter(item => item.indexing_status === "failed").length;

  // Section cards for overview
  const sectionCards: SectionCard[] = [
    {
      id: "knowledge",
      icon: BookOpen,
      title: "Knowledge Bases",
      description: "Core information library for AI context",
      count: categoryStats.document || 0,
      color: "text-blue-400",
      href: "/knowledge-base",
    },
    {
      id: "strategy",
      icon: Target,
      title: "Strategy",
      description: "Brand, research, funnels & offers",
      count: (categoryStats.playbook || 0) + (categoryStats.research || 0) + (categoryStats.offer || 0),
      color: "text-emerald-400",
      tab: "strategy",
    },
    {
      id: "assets",
      icon: ImageIcon,
      title: "Asset Library",
      description: "Media, files, and creative assets",
      count: (categoryStats.image || 0) + (categoryStats.video || 0),
      color: "text-purple-400",
      tab: "assets",
    },
    {
      id: "tools",
      icon: Settings,
      title: "Tools & Specialists",
      description: "AI roles, prompts, and integrations",
      count: (categoryStats.template || 0) + (categoryStats.script || 0),
      color: "text-cyan-400",
      tab: "tools",
    },
    {
      id: "swipe",
      icon: Star,
      title: "Swipe Files",
      description: "Saved ad inspirations",
      count: swipeFilesCount,
      color: "text-amber-400",
      tab: "swipe-files",
    },
    {
      id: "integrations",
      icon: Network,
      title: "Integrations",
      description: "Connected platforms and APIs",
      count: 0,
      color: "text-rose-400",
      tab: "integrations",
    },
  ];

  const handleSectionClick = (card: SectionCard) => {
    if (card.href) {
      navigate(card.href);
    } else if (card.tab) {
      setSelectedTab(card.tab);
    }
  };

  const handleRefreshIndex = async () => {
    toast({
      title: "Reindexing",
      description: "Starting re-indexing of all knowledge items...",
    });
    await refetchKB();
    toast({
      title: "Complete",
      description: "Knowledge base refresh complete.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Central Brain</h1>
              <p className="text-muted-foreground">Your AI's unified knowledge and strategy hub</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleRefreshIndex}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reindex
            </Button>
            <Button onClick={() => navigate("/knowledge-base")}>
              <Plus className="w-4 h-4 mr-2" />
              Add Knowledge
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="swipe-files">Swipe Files</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* Quick Access Sections */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Quick Access</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectionCards.map((card) => {
                  const IconComponent = card.icon;
                  return (
                    <Card
                      key={card.id}
                      className="bg-card border-border hover:bg-accent/50 transition-colors cursor-pointer group"
                      onClick={() => handleSectionClick(card)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className={`p-2 rounded-lg bg-primary/10 ${card.color}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <h3 className="font-semibold text-foreground mb-1">{card.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{card.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-foreground">{card.count}</span>
                          <Badge variant="secondary" className="text-xs">items</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Brain Status */}
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <DatabaseIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Company Brain Status</CardTitle>
                      <CardDescription>
                        The Central Brain indexes all knowledge to power AI agents with context about your business
                      </CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${indexedCount > 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}
                  >
                    {indexedCount > 0 ? 'Ready' : 'Pending'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-foreground">{kbItems.length}</p>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-500">{indexedCount}</p>
                    <p className="text-sm text-muted-foreground">Indexed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-amber-500">{processingCount}</p>
                    <p className="text-sm text-muted-foreground">Processing</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-rose-500">{failedCount}</p>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                </div>

                {/* Progress indicator */}
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${kbItems.length > 0 ? (indexedCount / kbItems.length) * 100 : 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search across all knowledge..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Projects Integration */}
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Crown className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Agent Projects</CardTitle>
                    <CardDescription>
                      Campaign workspaces that leverage the Central Brain for context
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-foreground">{boardsCount}</p>
                    <p className="text-sm text-muted-foreground">Active Projects</p>
                  </div>
                  <Button variant="outline" onClick={() => navigate("/agent-projects")}>
                    View Projects
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Strategy Tab */}
          <TabsContent value="strategy" className="mt-0">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Strategy</h2>
                <Button onClick={() => navigate("/strategy/knowledge-bases")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Strategy Item
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-border p-6 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => navigate("/strategy/knowledge-bases")}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <Target className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Brand Strategy</h3>
                      <p className="text-sm text-muted-foreground">Define your brand voice and positioning</p>
                    </div>
                  </div>
                </Card>

                <Card className="border-border p-6 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => navigate("/strategy/knowledge-bases")}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Users2 className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Market Research</h3>
                      <p className="text-sm text-muted-foreground">Customer avatars and market analysis</p>
                    </div>
                  </div>
                </Card>

                <Card className="border-border p-6 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => navigate("/strategy/knowledge-bases")}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <TrendingUp className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Funnels</h3>
                      <p className="text-sm text-muted-foreground">Sales funnels and conversion paths</p>
                    </div>
                  </div>
                </Card>

                <Card className="border-border p-6 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => navigate("/strategy/knowledge-bases")}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <Package className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Offers</h3>
                      <p className="text-sm text-muted-foreground">Product offers and pricing</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="mt-0">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Asset Library</h2>
                <Button onClick={() => navigate("/knowledge-base")}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Asset
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-border p-4 text-center">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                  <p className="font-semibold text-foreground">{categoryStats.image || 0}</p>
                  <p className="text-sm text-muted-foreground">Images</p>
                </Card>
                <Card className="border-border p-4 text-center">
                  <Video className="w-8 h-8 mx-auto mb-2 text-rose-500" />
                  <p className="font-semibold text-foreground">{categoryStats.video || 0}</p>
                  <p className="text-sm text-muted-foreground">Videos</p>
                </Card>
                <Card className="border-border p-4 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="font-semibold text-foreground">{categoryStats.document || 0}</p>
                  <p className="text-sm text-muted-foreground">Documents</p>
                </Card>
                <Card className="border-border p-4 text-center">
                  <Palette className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                  <p className="font-semibold text-foreground">{categoryStats.brand_asset || 0}</p>
                  <p className="text-sm text-muted-foreground">Brand Assets</p>
                </Card>
              </div>

              <Card className="border-border p-8 text-center">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Asset Management</h3>
                <p className="text-muted-foreground mb-4">
                  View and manage all your creative assets in one place
                </p>
                <Button variant="outline" onClick={() => navigate("/knowledge-base")}>
                  Go to Knowledge Base
                </Button>
              </Card>
            </div>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="mt-0">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Tools & Specialists</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-border p-6 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => navigate("/ad-spy")}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-cyan-500/10">
                      <Eye className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Ad Spy</h3>
                      <p className="text-sm text-muted-foreground">Research competitor ads</p>
                    </div>
                  </div>
                </Card>

                <Card className="border-border p-6 hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Ad Optimizer</h3>
                      <p className="text-sm text-muted-foreground">AI-powered optimization</p>
                    </div>
                  </div>
                </Card>

                <Card className="border-border p-6 hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Users2 className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Market Research</h3>
                      <p className="text-sm text-muted-foreground">Analyze market trends</p>
                    </div>
                  </div>
                </Card>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">AI Specialists & Roles</h3>
                <Card className="border-border p-8 text-center">
                  <UserCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">AI Roles</h3>
                  <p className="text-muted-foreground mb-4">
                    Configure specialized AI personas for different tasks
                  </p>
                  <Button variant="outline">
                    Configure Roles
                  </Button>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Swipe Files Tab */}
          <TabsContent value="swipe-files" className="mt-0">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Swipe Files</h2>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Swipe File
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-border p-4 text-center">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                  <p className="font-semibold text-foreground">Images</p>
                  <p className="text-sm text-muted-foreground">Screenshots & ads</p>
                </Card>
                <Card className="border-border p-4 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="font-semibold text-foreground">Text</p>
                  <p className="text-sm text-muted-foreground">Copy & hooks</p>
                </Card>
                <Card className="border-border p-4 text-center">
                  <Video className="w-8 h-8 mx-auto mb-2 text-rose-500" />
                  <p className="font-semibold text-foreground">Videos</p>
                  <p className="text-sm text-muted-foreground">Video ads</p>
                </Card>
                <Card className="border-border p-4 text-center">
                  <LinkIcon className="w-8 h-8 mx-auto mb-2 text-cyan-500" />
                  <p className="font-semibold text-foreground">Links</p>
                  <p className="text-sm text-muted-foreground">References</p>
                </Card>
              </div>

              <Card className="border-border p-8 text-center">
                <Star className="w-16 h-16 mx-auto mb-4 text-amber-500" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Swipe File Collection</h3>
                <p className="text-muted-foreground mb-4">
                  {swipeFilesCount > 0 
                    ? `You have ${swipeFilesCount} swipe files saved`
                    : "Start collecting winning ads and inspiration"
                  }
                </p>
                <Button variant="outline" onClick={() => navigate("/ad-spy")}>
                  Browse Ad Spy
                </Button>
              </Card>
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="mt-0">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Integrations</h2>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Integration
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Network className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Ad Networks</h3>
                      <p className="text-sm text-muted-foreground">Facebook, Google, TikTok</p>
                    </div>
                  </div>
                  <Badge variant="secondary">0 connected</Badge>
                </Card>

                <Card className="border-border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <DatabaseIcon className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">CRM</h3>
                      <p className="text-sm text-muted-foreground">HubSpot, Salesforce</p>
                    </div>
                  </div>
                  <Badge variant="secondary">0 connected</Badge>
                </Card>

                <Card className="border-border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Video className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Video Creation</h3>
                      <p className="text-sm text-muted-foreground">HeyGen, Synthesia</p>
                    </div>
                  </div>
                  <Badge variant="secondary">0 connected</Badge>
                </Card>
              </div>

              <Card className="border-border p-8 text-center">
                <Network className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Connect Your Tools</h3>
                <p className="text-muted-foreground mb-4">
                  Integrate with your existing marketing stack
                </p>
                <Button variant="outline">
                  Browse Integrations
                </Button>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

