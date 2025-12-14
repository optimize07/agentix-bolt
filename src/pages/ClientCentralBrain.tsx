import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Brain, FileText, Search, RefreshCw, Users, Database, TrendingUp, ChevronRight,
  Target, Image as ImageIcon, Video, Settings as SettingsIcon, Upload, Plus, Edit,
  Trash2, Eye, Camera, Network, Link as LinkIcon, Grid, List, UserCircle, Wand2,
  Facebook, Linkedin, Twitter, Music, Chrome, Building2, Cloud, Mail, Film,
  FileVideo, Clapperboard, Layers, FileSpreadsheet, HardDrive, Table, Sparkles,
} from "lucide-react";
import { ChatSidebar } from "@/components/ChatSidebar";
import { KnowledgeBaseTable } from "@/components/knowledge-base/KnowledgeBaseTable";
import { KnowledgeBaseUploadModal } from "@/components/knowledge-base/KnowledgeBaseUploadModal";
import { FloatingAskAI } from "@/components/knowledge-base/FloatingAskAI";
import { ContentGroupManager } from "@/components/ContentGroupManager";
import { BulkSwipeUploader } from "@/components/BulkSwipeUploader";
import AddAssetDialog from "@/components/AddAssetDialog";
import AddTemplateDialog from "@/components/AddTemplateDialog";
import { AddOfferDialog } from "@/components/AddOfferDialog";
import { OfferCard } from "@/components/OfferCard";
import type { Database as DB } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type KnowledgeBaseItem = DB["public"]["Tables"]["knowledge_base_items"]["Row"];

const PREDEFINED_PLATFORMS = {
  network: [
    { id: "facebook-ads", name: "Facebook Ads", description: "Meta advertising platform", icon: Facebook },
    { id: "google-ads", name: "Google Ads", description: "Google advertising platform", icon: Chrome },
    { id: "tiktok-ads", name: "TikTok Ads", description: "TikTok advertising platform", icon: Music },
    { id: "linkedin-ads", name: "LinkedIn Ads", description: "LinkedIn advertising platform", icon: Linkedin },
    { id: "twitter-ads", name: "Twitter/X Ads", description: "X advertising platform", icon: Twitter },
  ],
  crm: [
    { id: "gohighlevel", name: "GoHighLevel", description: "All-in-one CRM", icon: Building2 },
    { id: "hubspot", name: "HubSpot", description: "CRM & marketing", icon: Building2 },
    { id: "salesforce", name: "Salesforce", description: "Cloud-based CRM", icon: Cloud },
  ],
  video_creation: [
    { id: "heygen", name: "HeyGen", description: "AI video generation", icon: Video },
    { id: "synthesia", name: "Synthesia", description: "AI video creation", icon: Video },
  ],
  llm: [
    { id: "openrouter", name: "OpenRouter", description: "Access 100+ AI models", icon: Sparkles },
    { id: "openai", name: "OpenAI", description: "GPT models", icon: Sparkles },
    { id: "anthropic", name: "Anthropic", description: "Claude models", icon: Brain },
  ],
  analytics: [
    { id: "redtrack", name: "RedTrack", description: "Conversion tracking", icon: TrendingUp },
  ],
  automation: [
    { id: "n8n", name: "n8n", description: "Workflow automation", icon: Network },
    { id: "zapier", name: "Zapier", description: "Zapier webhook", icon: Layers },
  ],
  data_storage: [
    { id: "google-sheets", name: "Google Sheets", description: "Spreadsheet sync", icon: FileSpreadsheet },
    { id: "google-drive", name: "Google Drive", description: "File storage", icon: HardDrive },
  ],
};

const INTERNAL_TOOLS = [
  { id: "ad-spy", name: "Ad Spy", description: "Research competitor ads", icon: Eye },
  { id: "ad-optimizer", name: "Ad Optimizer", description: "AI-powered optimization", icon: TrendingUp },
  { id: "market-research", name: "Market Research", description: "Analyze market trends", icon: Users },
];

export default function ClientCentralBrain() {
  const { clientId } = useParams<{ clientId: string }>();
  const queryClient = useQueryClient();
  const [resolvedClientId, setResolvedClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [strategySubTab, setStrategySubTab] = useState("branding");
  const [toolsSubTab, setToolsSubTab] = useState("specialists");
  const [integrationsSubTab, setIntegrationsSubTab] = useState("network");
  const [assetSearchTerm, setAssetSearchTerm] = useState("");
  const [addAssetDialogOpen, setAddAssetDialogOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<any>(null);
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null);
  const [selectedAssetGroupId, setSelectedAssetGroupId] = useState<string | null>(null);
  const [assetViewMode, setAssetViewMode] = useState<"grid" | "list">("grid");
  const [swipeFileSearchTerm, setSwipeFileSearchTerm] = useState("");
  const [bulkSwipeUploadOpen, setBulkSwipeUploadOpen] = useState(false);
  const [selectedSwipeGroupId, setSelectedSwipeGroupId] = useState<string | null>(null);
  const [swipeViewMode, setSwipeViewMode] = useState<"grid" | "list">("grid");
  const [deleteSwipeFileId, setDeleteSwipeFileId] = useState<string | null>(null);
  const [addTemplateDialogOpen, setAddTemplateDialogOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<any>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [selectedPromptGroupId, setSelectedPromptGroupId] = useState<string | null>(null);
  const [promptSearchTerm, setPromptSearchTerm] = useState("");
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [editOffer, setEditOffer] = useState<any>(null);
  const [deleteOfferId, setDeleteOfferId] = useState<string | null>(null);
  const [selectedOfferGroupId, setSelectedOfferGroupId] = useState<string | null>(null);

  useEffect(() => {
    const resolve = async () => {
      if (!clientId) return;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(clientId)) {
        setResolvedClientId(clientId);
        const { data } = await supabase.from("clients").select("name").eq("id", clientId).single();
        if (data?.name) setClientName(data.name);
        return;
      }
      const { data } = await supabase.from("clients").select("id,name").eq("slug", clientId).single();
      if (data?.id) {
        setResolvedClientId(data.id);
        if (data.name) setClientName(data.name);
      }
    };
    resolve();
  }, [clientId]);

  const effectiveClientId = resolvedClientId || null;

  const { data: kbItems = [], refetch: refetchKb } = useQuery({
    queryKey: ["client-kb-items", effectiveClientId],
    queryFn: async () => {
      if (!effectiveClientId) return [];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      // Get client-specific items
      const { data: clientItems } = await supabase
        .from("knowledge_base_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("client_id", effectiveClientId)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      
      // Get agency-level items with client visibility (client_ready or published)
      const { data: agencyItems } = await supabase
        .from("knowledge_base_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("scope", "agency")
        .in("visibility", ["client_ready", "published"])
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      
      // Merge client and agency items, marking agency items
      const clientList = (clientItems || []).map((item: any) => ({ ...item, isAgencyItem: false }));
      const agencyList = (agencyItems || []).map((item: any) => ({ ...item, isAgencyItem: true }));
      
      return [...clientList, ...agencyList] as KnowledgeBaseItem[];
    },
    enabled: !!effectiveClientId,
  });

  const { data: assets = [], refetch: refetchAssets } = useQuery({
    queryKey: ["assets", effectiveClientId],
    queryFn: async () => {
      if (!effectiveClientId) return [];
      const { data } = await supabase.from("assets").select("*").eq("client_id", effectiveClientId).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!effectiveClientId,
  });

  const { data: assetGroups = [] } = useQuery({
    queryKey: ["content-groups", "asset", clientId],
    queryFn: async () => {
      const { data } = await supabase.from("content_groups").select("*").is("project_id", null).eq("content_type", "asset").order("position");
      return data || [];
    },
  });

  const { data: swipeFiles = [], refetch: refetchSwipeFiles } = useQuery({
    queryKey: ["swipe-files", effectiveClientId],
    queryFn: async () => {
      if (!effectiveClientId) return [];
      const { data } = await supabase.from("swipe_files").select("*").eq("client_id", effectiveClientId).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!effectiveClientId,
  });

  const { data: swipeGroups = [] } = useQuery({
    queryKey: ["content-groups", "swipe", clientId],
    queryFn: async () => {
      const { data } = await supabase.from("content_groups").select("*").is("project_id", null).eq("content_type", "swipe").order("position");
      return data || [];
    },
  });

  const { data: promptTemplates = [] } = useQuery({
    queryKey: ["prompt-templates", clientId],
    queryFn: async () => {
      const { data } = await supabase.from("prompt_templates").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: promptGroups = [] } = useQuery({
    queryKey: ["content-groups", "prompt"],
    queryFn: async () => {
      const { data } = await supabase.from("content_groups").select("*").is("project_id", null).eq("content_type", "prompt").order("position");
      return data || [];
    },
  });

  const { data: offers = [] } = useQuery({
    queryKey: ["offers", effectiveClientId],
    queryFn: async () => {
      if (!effectiveClientId) return [];
      const { data } = await supabase.from("offers").select(`*, offer_assets (*)`).is("project_id", null).eq("client_id", effectiveClientId).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!effectiveClientId,
  });

  const { data: offerGroups = [] } = useQuery({
    queryKey: ["content-groups", "offer"],
    queryFn: async () => {
      const { data } = await supabase.from("content_groups").select("*").is("project_id", null).eq("content_type", "offer").order("position");
      return data || [];
    },
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ["integrations", effectiveClientId],
    queryFn: async () => {
      if (!effectiveClientId) return [];
      const { data } = await supabase.from("integrations").select("*").eq("client_id", effectiveClientId).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!effectiveClientId,
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (id: string) => { await supabase.from("assets").delete().eq("id", id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["assets", clientId] }); toast.success("Asset deleted"); setDeleteAssetId(null); },
  });

  const deleteSwipeFileMutation = useMutation({
    mutationFn: async (id: string) => { await supabase.from("swipe_files").delete().eq("id", id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["swipe-files", clientId] }); toast.success("Swipe file deleted"); setDeleteSwipeFileId(null); },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => { await supabase.from("prompt_templates").delete().eq("id", id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["prompt-templates"] }); toast.success("Template deleted"); setDeleteTemplateId(null); },
  });

  const deleteOfferMutation = useMutation({
    mutationFn: async (id: string) => { await supabase.from("offers").delete().eq("id", id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["offers", clientId] }); toast.success("Offer deleted"); setDeleteOfferId(null); },
  });

  const toggleTemplateMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => { await supabase.from("prompt_templates").update({ enabled }).eq("id", id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["prompt-templates"] }); },
  });

  const kbStats = { total: kbItems.length, indexed: kbItems.filter(i => i.indexing_status === "indexed").length, processing: kbItems.filter(i => i.indexing_status === "processing").length, failed: kbItems.filter(i => i.indexing_status === "failed").length };
  const filteredAssets = assets?.filter((a: any) => (!selectedAssetGroupId || selectedAssetGroupId === "ungrouped" ? !a.group_id : a.group_id === selectedAssetGroupId) && a.name?.toLowerCase().includes(assetSearchTerm.toLowerCase())) || [];
  const filteredSwipeFiles = swipeFiles?.filter((f: any) => (!selectedSwipeGroupId || selectedSwipeGroupId === "ungrouped" ? !f.group_id : f.group_id === selectedSwipeGroupId) && f.title?.toLowerCase().includes(swipeFileSearchTerm.toLowerCase())) || [];
  const filteredTemplates = promptTemplates?.filter((t: any) => (!selectedPromptGroupId || selectedPromptGroupId === "ungrouped" ? !t.group_id : t.group_id === selectedPromptGroupId) && t.name?.toLowerCase().includes(promptSearchTerm.toLowerCase())) || [];
  const filteredOffers = offers?.filter((o: any) => !selectedOfferGroupId || selectedOfferGroupId === "ungrouped" ? !o.group_id : o.group_id === selectedOfferGroupId) || [];
  const connectedIntegrationsCount = integrations.filter((i: any) => i.is_connected).length;

  const handleReindexAll = async () => { if (!effectiveClientId) return; toast.info("Reindexing..."); await supabase.functions.invoke("google-search-indexing", { body: { action: "reindex", scope: "client", clientId: effectiveClientId } }); setTimeout(() => { refetchKb(); toast.success("Done"); }, 2000); };

  return (
    <div className="flex min-h-screen bg-background">
      <ChatSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="border-b border-border bg-background p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20"><Brain className="h-5 w-5 text-primary" /></div>
            <div><h1 className="text-2xl font-bold text-foreground">Central Brain</h1><p className="text-sm text-muted-foreground">{clientName ? `${clientName}'s knowledge and resources` : "Client knowledge and resources"}</p></div>
          </div>
        </div>
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-sidebar border-border mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="knowledge-bases">Knowledge Bases</TabsTrigger>
              <TabsTrigger value="strategy">Strategy</TabsTrigger>
              <TabsTrigger value="asset-library">Asset Library</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
              <TabsTrigger value="swipe-files">Swipe Files</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[{ tab: "knowledge-bases", icon: FileText, color: "blue", title: "Knowledge Bases", count: kbStats.total, label: "items" },
                  { tab: "strategy", icon: Target, color: "emerald", title: "Strategy", count: offers.length, label: "offers" },
                  { tab: "asset-library", icon: ImageIcon, color: "purple", title: "Asset Library", count: assets.length, label: "assets" },
                  { tab: "tools", icon: SettingsIcon, color: "cyan", title: "Tools", count: promptTemplates.length, label: "prompts" },
                  { tab: "swipe-files", icon: Camera, color: "amber", title: "Swipe Files", count: swipeFiles.length, label: "items" },
                  { tab: "integrations", icon: Network, color: "rose", title: "Integrations", count: connectedIntegrationsCount, label: "connected" },
                ].map(({ tab, icon: Icon, color, title, count, label }) => (
                  <Card key={tab} className="bg-card border-border hover:bg-card/80 cursor-pointer" onClick={() => setActiveTab(tab)}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4"><div className={`p-3 bg-${color}-500/10 rounded-lg`}><Icon className={`w-6 h-6 text-${color}-400`} /></div><ChevronRight className="w-5 h-5 text-muted-foreground" /></div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
                      <div className="flex items-center justify-between"><span className="text-2xl font-bold text-foreground">{count}</span><span className="text-sm text-muted-foreground">{label}</span></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="border-border"><CardHeader><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Database className="w-5 h-5 text-primary" /></div><div><CardTitle className="text-lg">Brain Status</CardTitle><CardDescription>Knowledge indexed for AI agents</CardDescription></div></div></CardHeader><CardContent><div className="grid grid-cols-4 gap-6 mb-6"><div className="text-center"><p className="text-3xl font-bold text-foreground">{kbStats.total}</p><p className="text-sm text-muted-foreground">Total</p></div><div className="text-center"><p className="text-3xl font-bold text-emerald-500">{kbStats.indexed}</p><p className="text-sm text-muted-foreground">Indexed</p></div><div className="text-center"><p className="text-3xl font-bold text-amber-500">{kbStats.processing}</p><p className="text-sm text-muted-foreground">Processing</p></div><div className="text-center"><p className="text-3xl font-bold text-rose-500">{kbStats.failed}</p><p className="text-sm text-muted-foreground">Failed</p></div></div><div className="w-full h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${kbStats.total > 0 ? (kbStats.indexed / kbStats.total) * 100 : 0}%` }} /></div></CardContent></Card>
            </TabsContent>

            <TabsContent value="knowledge-bases" className="space-y-6">
              <div className="flex items-center justify-between mb-4"><div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-sidebar border-border" /></div><div className="flex gap-2"><Button variant="outline" onClick={handleReindexAll} className="gap-2"><RefreshCw className="h-4 w-4" />Re-parse</Button><Button onClick={() => setUploadModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Add</Button></div></div>
              <Card className="border-border bg-card"><CardHeader><CardTitle>Knowledge Base Items</CardTitle><p className="text-sm text-muted-foreground">{kbStats.indexed} of {kbStats.total} indexed</p></CardHeader><CardContent><KnowledgeBaseTable scope="client" clientId={clientId} /></CardContent></Card>
            </TabsContent>

            <TabsContent value="strategy" className="space-y-6">
              <Tabs value={strategySubTab} onValueChange={setStrategySubTab}><TabsList className="bg-sidebar border-border mb-6"><TabsTrigger value="branding">Branding</TabsTrigger><TabsTrigger value="research">Research</TabsTrigger><TabsTrigger value="funnels">Funnels</TabsTrigger><TabsTrigger value="offers">Offers</TabsTrigger></TabsList>
                <TabsContent value="branding"><Card className="border-border bg-card p-8 text-center"><Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold text-foreground mb-2">Brand Guidelines</h3><p className="text-muted-foreground">Define your brand voice, colors, and visual identity</p></Card></TabsContent>
                <TabsContent value="research"><Card className="border-border bg-card p-8 text-center"><Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold text-foreground mb-2">Market Research</h3><p className="text-muted-foreground">Analyze your target market and competitors</p></Card></TabsContent>
                <TabsContent value="funnels"><Card className="border-border bg-card p-8 text-center"><TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold text-foreground mb-2">Sales Funnels</h3><p className="text-muted-foreground">Map out your customer journey</p></Card></TabsContent>
                <TabsContent value="offers" className="space-y-4"><div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">Your Offers</h3><Button onClick={() => { setEditOffer(null); setOfferDialogOpen(true); }} className="gap-2"><Plus className="w-4 h-4" />Add Offer</Button></div><ContentGroupManager projectId={null} contentType="offer" groups={offerGroups} selectedGroupId={selectedOfferGroupId} onSelectGroup={setSelectedOfferGroupId} />{filteredOffers.length === 0 ? <Card className="border-border bg-card p-8 text-center"><Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">No Offers Yet</h3><Button onClick={() => setOfferDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Offer</Button></Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{filteredOffers.map((offer: any) => <OfferCard key={offer.id} offer={offer} groups={offerGroups} onEdit={() => { setEditOffer(offer); setOfferDialogOpen(true); }} onDelete={() => setDeleteOfferId(offer.id)} />)}</div>}</TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="asset-library" className="space-y-6">
              <div className="flex items-center justify-between mb-4"><div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search assets..." value={assetSearchTerm} onChange={(e) => setAssetSearchTerm(e.target.value)} className="pl-10 bg-sidebar border-border" /></div><div className="flex items-center gap-2"><div className="flex border border-border rounded-lg"><Button variant={assetViewMode === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setAssetViewMode("grid")} className="rounded-r-none"><Grid className="w-4 h-4" /></Button><Button variant={assetViewMode === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setAssetViewMode("list")} className="rounded-l-none"><List className="w-4 h-4" /></Button></div><Button onClick={() => { setEditAsset(null); setAddAssetDialogOpen(true); }} className="gap-2"><Plus className="w-4 h-4" />Add Asset</Button></div></div>
              <ContentGroupManager projectId={null} contentType="asset" groups={assetGroups} selectedGroupId={selectedAssetGroupId} onSelectGroup={setSelectedAssetGroupId} />
              {filteredAssets.length === 0 ? <Card className="border-border bg-card p-8 text-center"><ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">No Assets Yet</h3><Button onClick={() => setAddAssetDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Asset</Button></Card> : <div className={cn(assetViewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "flex flex-col gap-2")}>{filteredAssets.map((asset: any) => <Card key={asset.id} className="border-border bg-card overflow-hidden group">{asset.url_or_path && (asset.type === "image" || asset.type === "video") && <div className="aspect-video bg-muted relative">{asset.type === "image" ? <img src={asset.url_or_path} alt={asset.name} className="w-full h-full object-cover" /> : <video src={asset.url_or_path} className="w-full h-full object-cover" />}<div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => { setEditAsset(asset); setAddAssetDialogOpen(true); }}><Edit className="w-4 h-4" /></Button><Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => setDeleteAssetId(asset.id)}><Trash2 className="w-4 h-4" /></Button></div></div>}<CardContent className="p-4"><h4 className="font-medium text-foreground truncate">{asset.name}</h4><p className="text-sm text-muted-foreground capitalize">{asset.type}</p>{asset.tags?.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{asset.tags.slice(0, 3).map((tag: string, i: number) => <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>)}</div>}</CardContent></Card>)}</div>}
            </TabsContent>

            <TabsContent value="tools" className="space-y-6">
              <Tabs value={toolsSubTab} onValueChange={setToolsSubTab}><TabsList className="bg-sidebar border-border mb-6"><TabsTrigger value="specialists" className="gap-2"><Wand2 className="w-4 h-4" />Specialists</TabsTrigger><TabsTrigger value="roles" className="gap-2"><UserCircle className="w-4 h-4" />Roles</TabsTrigger><TabsTrigger value="external" className="gap-2"><Network className="w-4 h-4" />External</TabsTrigger><TabsTrigger value="prompts" className="gap-2"><FileText className="w-4 h-4" />Prompts</TabsTrigger></TabsList>
                <TabsContent value="specialists"><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{INTERNAL_TOOLS.map((tool) => { const Icon = tool.icon; return <Card key={tool.id} className="border-border bg-card p-6"><div className="flex items-start gap-4"><div className="p-2 bg-primary/10 rounded-lg"><Icon className="w-6 h-6 text-primary" /></div><div className="flex-1"><h4 className="font-semibold text-foreground">{tool.name}</h4><p className="text-sm text-muted-foreground">{tool.description}</p></div><Switch defaultChecked /></div></Card>; })}</div></TabsContent>
                <TabsContent value="roles"><Card className="border-border bg-card p-8 text-center"><UserCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">AI Roles</h3><p className="text-muted-foreground">Configure AI personas</p></Card></TabsContent>
                <TabsContent value="external"><Card className="border-border bg-card p-8 text-center"><Network className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">External Tools</h3><p className="text-muted-foreground">Connect external APIs</p></Card></TabsContent>
                <TabsContent value="prompts" className="space-y-4"><div className="flex items-center justify-between mb-4"><div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search prompts..." value={promptSearchTerm} onChange={(e) => setPromptSearchTerm(e.target.value)} className="pl-10 bg-sidebar border-border" /></div><Button onClick={() => { setEditTemplate(null); setAddTemplateDialogOpen(true); }} className="gap-2"><Plus className="w-4 h-4" />Add Prompt</Button></div><ContentGroupManager projectId={null} contentType="prompt" groups={promptGroups} selectedGroupId={selectedPromptGroupId} onSelectGroup={setSelectedPromptGroupId} />{filteredTemplates.length === 0 ? <Card className="border-border bg-card p-8 text-center"><FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">No Prompts Yet</h3><Button onClick={() => setAddTemplateDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Prompt</Button></Card> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{filteredTemplates.map((t: any) => <Card key={t.id} className="border-border bg-card"><CardContent className="p-4"><div className="flex items-start justify-between gap-2 mb-2"><h4 className="font-semibold text-foreground">{t.name}</h4><div className="flex items-center gap-2"><Switch checked={t.enabled !== false} onCheckedChange={(checked) => toggleTemplateMutation.mutate({ id: t.id, enabled: checked })} /><Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditTemplate(t); setAddTemplateDialogOpen(true); }}><Edit className="w-4 h-4" /></Button><Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteTemplateId(t.id)}><Trash2 className="w-4 h-4" /></Button></div></div><p className="text-sm text-muted-foreground line-clamp-3">{t.content}</p></CardContent></Card>)}</div>}</TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="swipe-files" className="space-y-6">
              <div className="flex items-center justify-between mb-4"><div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search swipe files..." value={swipeFileSearchTerm} onChange={(e) => setSwipeFileSearchTerm(e.target.value)} className="pl-10 bg-sidebar border-border" /></div><div className="flex items-center gap-2"><div className="flex border border-border rounded-lg"><Button variant={swipeViewMode === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setSwipeViewMode("grid")} className="rounded-r-none"><Grid className="w-4 h-4" /></Button><Button variant={swipeViewMode === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setSwipeViewMode("list")} className="rounded-l-none"><List className="w-4 h-4" /></Button></div><Button variant="outline" onClick={() => setBulkSwipeUploadOpen(true)} className="gap-2"><Upload className="w-4 h-4" />Bulk Upload</Button><Button className="gap-2"><Plus className="w-4 h-4" />Add Swipe File</Button></div></div>
              <ContentGroupManager projectId={null} contentType="swipe" groups={swipeGroups} selectedGroupId={selectedSwipeGroupId} onSelectGroup={setSelectedSwipeGroupId} />
              {bulkSwipeUploadOpen && <Card className="border-border bg-card p-4"><BulkSwipeUploader projectId={null} groupId={selectedSwipeGroupId} onComplete={() => { setBulkSwipeUploadOpen(false); refetchSwipeFiles(); }} /></Card>}
              {filteredSwipeFiles.length === 0 ? <Card className="border-border bg-card p-8 text-center"><Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">No Swipe Files Yet</h3><Button onClick={() => setBulkSwipeUploadOpen(true)}><Upload className="w-4 h-4 mr-2" />Upload Files</Button></Card> : <div className={cn(swipeViewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "flex flex-col gap-2")}>{filteredSwipeFiles.map((file: any) => <Card key={file.id} className="border-border bg-card overflow-hidden group">{file.image_url ? <div className="aspect-video bg-muted relative"><img src={file.image_url} alt={file.title} className="w-full h-full object-cover" /><div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><Button size="icon" variant="secondary" className="h-8 w-8"><Eye className="w-4 h-4" /></Button><Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => setDeleteSwipeFileId(file.id)}><Trash2 className="w-4 h-4" /></Button></div></div> : <div className="aspect-video bg-muted flex items-center justify-center">{file.type === "video" && <Video className="w-12 h-12 text-muted-foreground" />}{file.type === "link" && <LinkIcon className="w-12 h-12 text-muted-foreground" />}{(!file.type || file.type === "text" || file.type === "document") && <FileText className="w-12 h-12 text-muted-foreground" />}</div>}<CardContent className="p-4"><Badge variant="outline" className="capitalize mb-1">{file.type}</Badge><h4 className="font-medium text-foreground truncate">{file.title}</h4></CardContent></Card>)}</div>}
            </TabsContent>

            <TabsContent value="integrations" className="space-y-6">
              <Tabs value={integrationsSubTab} onValueChange={setIntegrationsSubTab}><TabsList className="bg-sidebar border-border mb-6 flex-wrap h-auto gap-1"><TabsTrigger value="network"><Network className="w-4 h-4 mr-1" />Networks</TabsTrigger><TabsTrigger value="crm"><Building2 className="w-4 h-4 mr-1" />CRM</TabsTrigger><TabsTrigger value="video_creation"><Video className="w-4 h-4 mr-1" />Video</TabsTrigger><TabsTrigger value="llm"><Brain className="w-4 h-4 mr-1" />LLMs</TabsTrigger><TabsTrigger value="analytics"><TrendingUp className="w-4 h-4 mr-1" />Analytics</TabsTrigger><TabsTrigger value="automation"><Layers className="w-4 h-4 mr-1" />Automation</TabsTrigger><TabsTrigger value="data_storage"><Database className="w-4 h-4 mr-1" />Data</TabsTrigger></TabsList>
                {Object.entries(PREDEFINED_PLATFORMS).map(([category, platforms]) => <TabsContent key={category} value={category}><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{platforms.map((p) => { const Icon = p.icon; const isConnected = integrations.some((i: any) => i.platform === p.id && i.is_connected); return <Card key={p.id} className="border-border bg-card"><CardContent className="p-6"><div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><div className="p-2 bg-muted rounded-lg"><Icon className="w-6 h-6 text-foreground" /></div><div><h4 className="font-semibold text-foreground">{p.name}</h4><p className="text-sm text-muted-foreground">{p.description}</p></div></div><Badge variant={isConnected ? "default" : "secondary"} className={isConnected ? "bg-emerald-500" : ""}>{isConnected ? "Connected" : "Not Connected"}</Badge></div><Button variant="outline" className="w-full mt-4">Configure</Button></CardContent></Card>; })}</div></TabsContent>)}
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <KnowledgeBaseUploadModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} onSuccess={refetchKb} clientId={clientId} />
      <AddAssetDialog open={addAssetDialogOpen} onOpenChange={setAddAssetDialogOpen} editAsset={editAsset} />
      <AddTemplateDialog open={addTemplateDialogOpen} onOpenChange={setAddTemplateDialogOpen} editTemplate={editTemplate} groups={promptGroups} />
      <AddOfferDialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen} projectId="" groups={offerGroups} editOffer={editOffer} />

      <AlertDialog open={!!deleteAssetId} onOpenChange={() => setDeleteAssetId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Asset</AlertDialogTitle><AlertDialogDescription>Are you sure?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteAssetId && deleteAssetMutation.mutate(deleteAssetId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={!!deleteSwipeFileId} onOpenChange={() => setDeleteSwipeFileId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Swipe File</AlertDialogTitle><AlertDialogDescription>Are you sure?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteSwipeFileId && deleteSwipeFileMutation.mutate(deleteSwipeFileId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={!!deleteTemplateId} onOpenChange={() => setDeleteTemplateId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Template</AlertDialogTitle><AlertDialogDescription>Are you sure?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteTemplateId && deleteTemplateMutation.mutate(deleteTemplateId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={!!deleteOfferId} onOpenChange={() => setDeleteOfferId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Offer</AlertDialogTitle><AlertDialogDescription>Are you sure?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteOfferId && deleteOfferMutation.mutate(deleteOfferId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <FloatingAskAI clientId={effectiveClientId || undefined} />
    </div>
  );
}
