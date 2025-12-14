import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ChatSidebar } from "@/components/ChatSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Upload,
  RefreshCcw,
  FolderOpen,
  FileText,
  Image,
  Video,
  Star,
  Target,
  Palette,
  Music,
  FileCode,
  HelpCircle,
  Gift,
  Plus,
  Brain,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { ClientSwitcher } from "@/components/ClientSwitcher";
import {
  KnowledgeBaseTable,
  KnowledgeBaseUploadModal,
  KnowledgeBaseEditModal,
  FloatingAskAI,
  type KBItem,
} from "@/components/knowledge-base";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { toast } from "sonner";

const categoryStats = [
  { key: "document", label: "Documents", icon: FileText, color: "text-blue-400" },
  { key: "image", label: "Images", icon: Image, color: "text-purple-400" },
  { key: "video", label: "Videos", icon: Video, color: "text-red-400" },
  { key: "winning_ad", label: "Winning Ads", icon: Star, color: "text-yellow-400" },
  { key: "playbook", label: "Playbooks", icon: Target, color: "text-orange-400" },
  { key: "brand_asset", label: "Brand Assets", icon: Palette, color: "text-pink-400" },
];

const ClientKnowledge = () => {
  const { clientId } = useParams();
  const [resolvedClientId, setResolvedClientId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [pinnedItems, setPinnedItems] = useState<KBItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editItem, setEditItem] = useState<KBItem | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [indexedCount, setIndexedCount] = useState(0);
  const [processingCount, setProcessingCount] = useState(0);

  useEffect(() => {
    const resolve = async () => {
      if (!clientId) return;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(clientId)) {
        setResolvedClientId(clientId);
        return;
      }
      const { data } = await supabase.from("clients").select("id").eq("slug", clientId).single();
      if (data?.id) setResolvedClientId(data.id);
    };
    resolve();
  }, [clientId]);

  async function fetchStats() {
    try {
      if (!resolvedClientId) return;
      // Fetch category counts
      const { data: items } = await supabase
        .from("knowledge_base_items")
        .select("category, is_pinned, indexing_status")
        .or(`client_id.eq.${resolvedClientId},scope.eq.agency`)
        .eq("is_archived", false);

      if (items) {
        const counts: Record<string, number> = {};
        let indexed = 0;
        let processing = 0;

        items.forEach((item: { category: string; indexing_status?: string }) => {
          counts[item.category] = (counts[item.category] || 0) + 1;
          if (item.indexing_status === "indexed") indexed++;
          if (item.indexing_status === "processing") processing++;
        });

        setCategoryCounts(counts);
        setTotalItems(items.length);
        setIndexedCount(indexed);
        setProcessingCount(processing);
      }

      // Fetch pinned items
      const { data: pinned } = await supabase
        .from("knowledge_base_items")
        .select("*")
        .or(`client_id.eq.${resolvedClientId},scope.eq.agency`)
        .eq("is_archived", false)
        .eq("is_pinned", true)
        .order("created_at", { ascending: false })
        .limit(6);

      if (pinned) {
        setPinnedItems(pinned as KBItem[]);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }

  useEffect(() => {
    fetchStats();
  }, [resolvedClientId, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    fetchStats();
    toast.success("Knowledge base refreshed");
  };

  const handleReindex = async () => {
    try {
      toast.info("Reindexing knowledge base...");

      await supabase.functions.invoke("google-search-indexing", {
        body: {
          action: "reindex",
          scope: "client",
          clientId: resolvedClientId
        },
      });

      // Also trigger RAG reindexing
      await supabase.functions.invoke("rag-indexing", {
        body: {
          action: "reindex",
          scope: "client",
          clientId: resolvedClientId
        },
      });

      setTimeout(() => {
        fetchStats();
        toast.success("Reindexing complete");
      }, 2000);
    } catch (error) {
      console.error("Reindex error:", error);
      toast.error("Failed to reindex");
    }
  };

  const handleUploadSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleEditItem = (item: KBItem) => {
    setEditItem(item);
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setRefreshKey((k) => k + 1);
    setEditModalOpen(false);
  };

  return (
    <div className="flex h-screen w-full bg-background">
      <ChatSidebar />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-border bg-background sticky top-0 z-10">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">Knowledge Base</h1>
                <span className="text-sm text-muted-foreground">for</span>
                <ClientSwitcher />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2" onClick={handleRefresh}>
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </Button>
              <Button className="gap-2" onClick={() => setUploadOpen(true)}>
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-10 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categoryStats.map((stat) => {
              const count = categoryCounts[stat.key] || 0;
              return (
                <Card key={stat.key} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-secondary ${stat.color}`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{count}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pinned Items */}
          {pinnedItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-yellow-500" />
                <h2 className="text-lg font-semibold text-foreground">Pinned Items</h2>
                <Badge variant="secondary">{pinnedItems.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinnedItems.map((item) => (
                  <Card key={item.id} className="border border-border bg-card hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{item.title}</p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-3">
                            <Badge variant="outline">{item.source_department}</Badge>
                            <Badge variant="secondary">{item.category.replace("_", " ")}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Company Brain Section */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2 border border-border bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Company Brain Status
                  </CardTitle>
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleReindex}>
                    <Sparkles className="h-4 w-4" />
                    Reindex
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-lg bg-secondary/50 p-4">
                      <p className="text-2xl font-bold text-foreground">{totalItems}</p>
                      <p className="text-xs text-muted-foreground">Total Items</p>
                    </div>
                    <div className="rounded-lg bg-emerald-500/10 p-4">
                      <p className="text-2xl font-bold text-emerald-500">{indexedCount}</p>
                      <p className="text-xs text-muted-foreground">Indexed</p>
                    </div>
                    <div className="rounded-lg bg-amber-500/10 p-4">
                      <p className="text-2xl font-bold text-amber-500">{processingCount}</p>
                      <p className="text-xs text-muted-foreground">Processing</p>
                    </div>
                    <div className={`rounded-lg p-4 ${
                      indexedCount === totalItems && totalItems > 0
                        ? "bg-green-500/10"
                        : processingCount > 0
                        ? "bg-amber-500/10"
                        : "bg-secondary/50"
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          indexedCount === totalItems && totalItems > 0
                            ? "bg-green-500 animate-pulse"
                            : processingCount > 0
                            ? "bg-amber-500 animate-pulse"
                            : "bg-gray-500"
                        }`} />
                        <p className={`text-sm font-medium ${
                          indexedCount === totalItems && totalItems > 0
                            ? "text-green-500"
                            : processingCount > 0
                            ? "text-amber-500"
                            : "text-gray-500"
                        }`}>
                          {indexedCount === totalItems && totalItems > 0
                            ? "Ready"
                            : processingCount > 0
                            ? "Indexing"
                            : "Idle"
                          }
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">RAG Status</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The Company Brain indexes all knowledge base items to power AI agents with context about your business.
                    Reindex after major updates to keep search and AI responses fresh.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => setUploadOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Upload New Asset
                </Button>
                <div className="pt-3 border-t border-border">
                  <p className="text-sm font-medium text-foreground mb-3">Suggested Sources</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Help Center / FAQs
                    </li>
                    <li className="flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      Offer pages and sales collateral
                    </li>
                    <li className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Product docs and internal notes
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Winning ad creatives
                    </li>
                    <li className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Brand guidelines and assets
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Knowledge Base Table */}
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                All Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <KnowledgeBaseTable
                key={refreshKey}
                clientId={clientId}
                showUpload
                onUploadClick={() => setUploadOpen(true)}
                onEdit={handleEditItem}
              />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Upload Modal */}
      <KnowledgeBaseUploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        clientId={clientId}
        onSuccess={handleUploadSuccess}
      />

      {/* Edit Modal */}
      <KnowledgeBaseEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        item={editItem}
        onSuccess={handleEditSuccess}
      />

      {/* Floating Ask AI */}
      <FloatingAskAI clientId={resolvedClientId || undefined} />
    </div>
  );
};

export default ClientKnowledge;
