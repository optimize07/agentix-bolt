import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Image as ImageIcon,
  Video,
  Star,
  Target,
  Palette,
  Search,
  Upload,
  RefreshCw,
  MessageSquare,
  ChevronRight
} from "lucide-react";
import { KnowledgeBaseUploadModal } from "@/components/knowledge-base/KnowledgeBaseUploadModal";
import { KnowledgeBaseCard } from "@/components/knowledge-base/KnowledgeBaseCard";
import { AskAIWidget } from "@/components/knowledge-base/AskAIWidget";
import type { Database } from "@/integrations/supabase/types";

type KnowledgeBaseItem = Database["public"]["Tables"]["knowledge_base_items"]["Row"];
type KBCategory = Database["public"]["Enums"]["kb_category"];

const categoryIcons: Record<KBCategory, any> = {
  document: FileText,
  image: ImageIcon,
  video: Video,
  audio: Video,
  template: FileText,
  script: FileText,
  brand_asset: Palette,
  winning_ad: Star,
  research: Search,
  playbook: Target,
  faq: MessageSquare,
  offer: Target,
};

const categoryLabels: Record<KBCategory, string> = {
  document: "Documents",
  image: "Images",
  video: "Videos",
  audio: "Audio",
  template: "Templates",
  script: "Scripts",
  brand_asset: "Brand Assets",
  winning_ad: "Winning Ads",
  research: "Research",
  playbook: "Playbooks",
  faq: "FAQs",
  offer: "Offers",
};

export default function KnowledgeBaseBrowser() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<KBCategory | "all">("all");
  const [askAIOpen, setAskAIOpen] = useState(false);

  // Fetch all knowledge base items
  const { data: kbItems = [], isLoading, refetch } = useQuery({
    queryKey: ["knowledge-base-items"],
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

  // Get category statistics
  const categoryStats = kbItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<KBCategory, number>);

  // Filter items
  const filteredItems = kbItems.filter(item => {
    const matchesSearch = !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Get indexing status
  const indexedCount = kbItems.filter(item => item.indexing_status === "indexed").length;
  const processingCount = kbItems.filter(item => item.indexing_status === "processing").length;
  const failedCount = kbItems.filter(item => item.indexing_status === "failed").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Knowledge Base</h1>
            <p className="text-slate-400">Your AI's memory and learning space</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => setUploadModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="knowledge-bases">Knowledge Bases</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="asset-library">Asset Library</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="swipe-files">Swipe Files</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Access Sections */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Quick access to all sections</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Knowledge Bases Card */}
                <Card className="bg-slate-800/50 border-slate-700 p-6 hover:bg-slate-800 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Knowledge Bases</h3>
                  <p className="text-sm text-slate-400 mb-4">Information library</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-white">
                      {categoryStats.document || 0}
                    </span>
                    <span className="text-sm text-slate-500">items</span>
                  </div>
                </Card>

                {/* Strategy Card */}
                <Card className="bg-slate-800/50 border-slate-700 p-6 hover:bg-slate-800 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-emerald-500/10 rounded-lg">
                      <Target className="w-6 h-6 text-emerald-400" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Strategy</h3>
                  <p className="text-sm text-slate-400 mb-4">Brand, research, funnels & offers</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-white">
                      {(categoryStats.playbook || 0) + (categoryStats.research || 0) + (categoryStats.offer || 0)}
                    </span>
                    <span className="text-sm text-slate-500">items</span>
                  </div>
                </Card>

                {/* Asset Library Card */}
                <Card className="bg-slate-800/50 border-slate-700 p-6 hover:bg-slate-800 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-purple-500/10 rounded-lg">
                      <ImageIcon className="w-6 h-6 text-purple-400" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Asset Library</h3>
                  <p className="text-sm text-slate-400 mb-4">Media & files</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-white">
                      {(categoryStats.image || 0) + (categoryStats.video || 0) + (categoryStats.audio || 0)}
                    </span>
                    <span className="text-sm text-slate-500">items</span>
                  </div>
                </Card>

                {/* Tools Card */}
                <Card className="bg-slate-800/50 border-slate-700 p-6 hover:bg-slate-800 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-cyan-500/10 rounded-lg">
                      <Target className="w-6 h-6 text-cyan-400" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Tools</h3>
                  <p className="text-sm text-slate-400 mb-4">Internal, external & prompts</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-white">
                      {(categoryStats.template || 0) + (categoryStats.script || 0)}
                    </span>
                    <span className="text-sm text-slate-500">items</span>
                  </div>
                </Card>

                {/* Swipe Files Card */}
                <Card className="bg-slate-800/50 border-slate-700 p-6 hover:bg-slate-800 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-amber-500/10 rounded-lg">
                      <Star className="w-6 h-6 text-amber-400" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Swipe Files</h3>
                  <p className="text-sm text-slate-400 mb-4">Saved ad inspirations</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-white">
                      {categoryStats.winning_ad || 0}
                    </span>
                    <span className="text-sm text-slate-500">items</span>
                  </div>
                </Card>

                {/* Integrations Card */}
                <Card className="bg-slate-800/50 border-slate-700 p-6 hover:bg-slate-800 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-rose-500/10 rounded-lg">
                      <Target className="w-6 h-6 text-rose-400" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Integrations</h3>
                  <p className="text-sm text-slate-400 mb-4">Connected platforms</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-white">0</span>
                    <span className="text-sm text-slate-500">connected</span>
                  </div>
                </Card>
              </div>
            </div>

            {/* Company Brain Status */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 rounded-lg">
                    <Target className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Company Brain Status</h3>
                    <p className="text-sm text-slate-400">
                      The Company Brain indexes all knowledge base items to power AI agents with context about your business
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reindex
                </Button>
              </div>

              <div className="grid grid-cols-4 gap-6">
                <div>
                  <p className="text-3xl font-bold text-white">{kbItems.length}</p>
                  <p className="text-sm text-slate-400">Total Items</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-emerald-400">{indexedCount}</p>
                  <p className="text-sm text-slate-400">Indexed</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-amber-400">{processingCount}</p>
                  <p className="text-sm text-slate-400">Processing</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-rose-400">{failedCount}</p>
                  <p className="text-sm text-slate-400">Failed</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-emerald-400 font-medium">Ready</span>
                  <span className="text-slate-400 ml-2">RAG Status</span>
                </div>
              </div>
            </Card>

            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  placeholder="Search knowledge base..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setAskAIOpen(true)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Ask AI
              </Button>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                onClick={() => setSelectedCategory("all")}
                className={selectedCategory === "all" ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-600 text-slate-300 hover:bg-slate-700"}
              >
                All ({kbItems.length})
              </Button>
              {Object.entries(categoryStats).map(([category, count]) => {
                const Icon = categoryIcons[category as KBCategory];
                return (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category as KBCategory)}
                    className={selectedCategory === category ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-600 text-slate-300 hover:bg-slate-700"}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {categoryLabels[category as KBCategory]} ({count})
                  </Button>
                );
              })}
            </div>

            {/* Items Grid */}
            {isLoading ? (
              <div className="text-center text-slate-400 py-12">Loading...</div>
            ) : filteredItems.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700 p-12 text-center">
                <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No items found</h3>
                <p className="text-slate-400 mb-6">
                  {searchQuery || selectedCategory !== "all"
                    ? "Try adjusting your search or filters"
                    : "Get started by uploading your first document"
                  }
                </p>
                {!searchQuery && selectedCategory === "all" && (
                  <Button
                    onClick={() => setUploadModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredItems.map((item) => (
                  <KnowledgeBaseCard key={item.id} item={item} onUpdate={refetch} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="knowledge-bases">
            <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
              <p className="text-slate-400">Knowledge Bases view - Coming soon</p>
            </Card>
          </TabsContent>

          <TabsContent value="strategy">
            <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
              <p className="text-slate-400">Strategy view - Coming soon</p>
            </Card>
          </TabsContent>

          <TabsContent value="asset-library">
            <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
              <p className="text-slate-400">Asset Library view - Coming soon</p>
            </Card>
          </TabsContent>

          <TabsContent value="tools">
            <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
              <p className="text-slate-400">Tools view - Coming soon</p>
            </Card>
          </TabsContent>

          <TabsContent value="swipe-files">
            <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
              <p className="text-slate-400">Swipe Files view - Coming soon</p>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
              <p className="text-slate-400">Integrations view - Coming soon</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <KnowledgeBaseUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onSuccess={refetch}
      />

      {/* Ask AI Widget */}
      <AskAIWidget open={askAIOpen} onOpenChange={setAskAIOpen} />
    </div>
  );
}
