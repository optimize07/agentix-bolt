import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Brain,
  FileText,
  Search,
  RefreshCw,
  Users,
  Database,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  Target,
  Image as ImageIcon,
  Video,
  Settings as SettingsIcon,
  Upload,
  Plus,
  Edit,
  Trash2,
  Eye,
  Palette,
  Package,
  BookOpen,
  Camera,
  Network,
  Link as LinkIcon,
  File,
  Grid,
  List,
  Archive,
  Check,
  UserCircle,
  Wand2,
  Facebook,
  Linkedin,
  Twitter,
  Music,
  Chrome,
  Building2,
  Cloud,
  Mail,
  Film,
  FileVideo,
  Clapperboard,
  Layers,
  FileSpreadsheet,
  HardDrive,
  Table,
  Sparkles,
} from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { KnowledgeBaseTable } from "@/components/knowledge-base/KnowledgeBaseTable";
import { KnowledgeBaseUploadModal } from "@/components/knowledge-base/KnowledgeBaseUploadModal";
import { FloatingAskAI } from "@/components/knowledge-base/FloatingAskAI";
import { ContentGroupManager } from "@/components/ContentGroupManager";
import { BulkSwipeUploader } from "@/components/BulkSwipeUploader";
import AddAssetDialog from "@/components/AddAssetDialog";
import AddTemplateDialog from "@/components/AddTemplateDialog";
import { AddOfferDialog } from "@/components/AddOfferDialog";
import { OfferCard } from "@/components/OfferCard";
import { PushToClientModal } from "@/components/central-brain/PushToClientModal";
import type { Database as DB } from "@/integrations/supabase/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type KnowledgeBaseItem = DB["public"]["Tables"]["knowledge_base_items"]["Row"];

// Predefined platform configurations for integrations
const PREDEFINED_PLATFORMS = {
  network: [
    { id: "facebook-ads", name: "Facebook Ads", description: "Meta advertising platform", icon: Facebook, configFields: ["access_token", "ad_account_id"] },
    { id: "google-ads", name: "Google Ads", description: "Google advertising platform", icon: Chrome, configFields: ["client_id", "api_key"] },
    { id: "tiktok-ads", name: "TikTok Ads", description: "TikTok advertising platform", icon: Music, configFields: ["access_token", "advertiser_id"] },
    { id: "linkedin-ads", name: "LinkedIn Ads", description: "LinkedIn advertising platform", icon: Linkedin, configFields: ["access_token", "account_id"] },
    { id: "twitter-ads", name: "Twitter/X Ads", description: "X advertising platform", icon: Twitter, configFields: ["api_key", "api_secret"] },
    { id: "snapchat-ads", name: "Snapchat Ads", description: "Snapchat advertising platform", icon: Camera, configFields: ["access_token", "ad_account_id"] },
  ],
  crm: [
    { id: "gohighlevel", name: "GoHighLevel", description: "All-in-one CRM & marketing automation", icon: Building2, configFields: ["api_key", "location_id"] },
    { id: "hubspot", name: "HubSpot", description: "CRM, marketing, and sales platform", icon: Building2, configFields: ["api_key"] },
    { id: "salesforce", name: "Salesforce", description: "Cloud-based CRM platform", icon: Cloud, configFields: ["client_id", "client_secret", "instance_url"] },
    { id: "pipedrive", name: "Pipedrive", description: "Sales CRM and pipeline management", icon: TrendingUp, configFields: ["api_token", "company_domain"] },
    { id: "activecampaign", name: "ActiveCampaign", description: "Email marketing and automation", icon: Mail, configFields: ["api_key", "api_url"] },
  ],
  video_creation: [
    { id: "heygen", name: "HeyGen", description: "AI video generation platform", icon: Video, configFields: ["api_key"] },
    { id: "synthesia", name: "Synthesia", description: "AI video creation with avatars", icon: Video, configFields: ["api_key"] },
    { id: "d-id", name: "D-ID", description: "AI-powered video generation", icon: Clapperboard, configFields: ["api_key", "client_id"] },
    { id: "runway", name: "Runway", description: "AI video editing and generation", icon: Film, configFields: ["api_key"] },
    { id: "pictory", name: "Pictory", description: "AI video creation from text", icon: FileVideo, configFields: ["api_key"] },
  ],
  llm: [
    { id: "openrouter", name: "OpenRouter", description: "Access 100+ AI models via single API", icon: Sparkles, configFields: ["api_key"] },
    { id: "openai", name: "OpenAI", description: "GPT models for text generation", icon: Sparkles, configFields: ["api_key", "organization_id"] },
    { id: "anthropic", name: "Anthropic", description: "Claude models for advanced reasoning", icon: Brain, configFields: ["api_key"] },
  ],
  analytics: [
    { id: "redtrack", name: "RedTrack", description: "Conversion tracking and attribution", icon: TrendingUp, configFields: ["api_key"] },
    { id: "hyros", name: "Hyros", description: "Ad attribution and tracking", icon: Target, configFields: ["api_key"] },
  ],
  automation: [
    { id: "n8n", name: "n8n", description: "Workflow automation", icon: Network, configFields: ["webhook_url"] },
    { id: "zapier", name: "Zapier", description: "Zapier webhook integration", icon: Layers, configFields: ["webhook_url"] },
  ],
  data_storage: [
    { id: "google-sheets", name: "Google Sheets", description: "Spreadsheet data sync", icon: FileSpreadsheet, configFields: ["api_key", "spreadsheet_id"] },
    { id: "google-drive", name: "Google Drive", description: "File storage integration", icon: HardDrive, configFields: ["api_key", "folder_id"] },
    { id: "airtable", name: "Airtable", description: "Database & spreadsheet platform", icon: Table, configFields: ["api_key", "base_id"] },
  ],
};

// Internal tools definition
const INTERNAL_TOOLS = [
  { id: "ad-spy", name: "Ad Spy", description: "Research competitor ads and discover winning creatives", icon: Eye },
  { id: "ad-optimizer", name: "Ad Optimizer", description: "AI-powered performance optimization for campaigns", icon: TrendingUp },
  { id: "market-research", name: "Market Research", description: "Analyze market trends and customer segments", icon: Users },
];

// Swipe file type options
const SWIPE_FILE_TYPES = [
  { id: 'image', name: 'Image', icon: ImageIcon, description: 'Screenshots, ads, creatives' },
  { id: 'text', name: 'Text/Notes', icon: FileText, description: 'Copy, hooks, scripts' },
  { id: 'pdf', name: 'PDF Document', icon: File, description: 'Reports, guides, PDFs' },
  { id: 'document', name: 'Document', icon: FileText, description: 'Word docs (.doc, .docx)' },
  { id: 'video', name: 'Video', icon: Video, description: 'Video ads, reels, TikToks' },
  { id: 'link', name: 'Link/Reference', icon: LinkIcon, description: 'Websites, articles, landing pages' },
];

export default function AgencyCentralBrain() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Sub-tab states
  const [strategySubTab, setStrategySubTab] = useState("branding");
  const [toolsSubTab, setToolsSubTab] = useState("specialists");
  const [integrationsSubTab, setIntegrationsSubTab] = useState("network");

  // Asset states
  const [assetSearchTerm, setAssetSearchTerm] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>("all");
  const [addAssetDialogOpen, setAddAssetDialogOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<any>(null);
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null);
  const [selectedAssetGroupId, setSelectedAssetGroupId] = useState<string | null>(null);
  const [assetViewMode, setAssetViewMode] = useState<"grid" | "list">("grid");

  // Swipe files states
  const [swipeFileSearchTerm, setSwipeFileSearchTerm] = useState("");
  const [bulkSwipeUploadOpen, setBulkSwipeUploadOpen] = useState(false);
  const [selectedSwipeGroupId, setSelectedSwipeGroupId] = useState<string | null>(null);
  const [swipeViewMode, setSwipeViewMode] = useState<"grid" | "list">("grid");
  const [addSwipeDialogOpen, setAddSwipeDialogOpen] = useState(false);
  const [deleteSwipeFileId, setDeleteSwipeFileId] = useState<string | null>(null);

  // Tools/Prompts states
  const [addTemplateDialogOpen, setAddTemplateDialogOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<any>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [selectedPromptGroupId, setSelectedPromptGroupId] = useState<string | null>(null);
  const [promptSearchTerm, setPromptSearchTerm] = useState("");

  // Offer states
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [editOffer, setEditOffer] = useState<any>(null);
  const [deleteOfferId, setDeleteOfferId] = useState<string | null>(null);
  const [selectedOfferGroupId, setSelectedOfferGroupId] = useState<string | null>(null);

  // Push to client states
  const [pushModalOpen, setPushModalOpen] = useState(false);
  const [pushItem, setPushItem] = useState<{ id: string; title: string; type: "knowledge_base" | "template" | "offer" | "swipe" } | null>(null);

  // ====================
  // QUERIES
  // ====================

  // Fetch all agency-level knowledge base items
  const { data: agencyItems = [], isLoading: agencyLoading, refetch: refetchAgency } = useQuery({
    queryKey: ["agency-kb-items"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("knowledge_base_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("scope", "agency")
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as KnowledgeBaseItem[];
    },
  });

  // Fetch all clients
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Fetch client-level items
  const { data: clientItems = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["all-client-kb-items", selectedClient],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from("knowledge_base_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("scope", "client")
        .eq("is_archived", false);

      if (selectedClient !== "all") {
        query = query.eq("client_id", selectedClient);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data as KnowledgeBaseItem[];
    },
  });

  // Fetch assets
  const { data: assets = [], refetch: refetchAssets } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch asset groups
  const { data: assetGroups = [] } = useQuery({
    queryKey: ["content-groups", "asset"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_groups")
        .select("*")
        .is("project_id", null)
        .eq("content_type", "asset")
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch swipe files
  const { data: swipeFiles = [], refetch: refetchSwipeFiles } = useQuery({
    queryKey: ["swipe-files"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("swipe_files")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch swipe file groups
  const { data: swipeGroups = [] } = useQuery({
    queryKey: ["content-groups", "swipe"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_groups")
        .select("*")
        .is("project_id", null)
        .eq("content_type", "swipe")
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch prompt templates
  const { data: promptTemplates = [] } = useQuery({
    queryKey: ["prompt-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompt_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch prompt groups
  const { data: promptGroups = [] } = useQuery({
    queryKey: ["content-groups", "prompt"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_groups")
        .select("*")
        .is("project_id", null)
        .eq("content_type", "prompt")
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch offers
  const { data: offers = [] } = useQuery({
    queryKey: ["offers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select(`*, offer_assets (*)`)
        .is("project_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch offer groups
  const { data: offerGroups = [] } = useQuery({
    queryKey: ["content-groups", "offer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_groups")
        .select("*")
        .is("project_id", null)
        .eq("content_type", "offer")
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch integrations
  const { data: integrations = [] } = useQuery({
    queryKey: ["integrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // ====================
  // MUTATIONS
  // ====================

  const deleteAssetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Asset deleted");
      setDeleteAssetId(null);
    },
  });

  const deleteSwipeFileMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("swipe_files").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swipe-files"] });
      toast.success("Swipe file deleted");
      setDeleteSwipeFileId(null);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prompt_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompt-templates"] });
      toast.success("Template deleted");
      setDeleteTemplateId(null);
    },
  });

  const deleteOfferMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("offers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      toast.success("Offer deleted");
      setDeleteOfferId(null);
    },
  });

  const toggleTemplateMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("prompt_templates").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompt-templates"] });
    },
  });

  // ====================
  // COMPUTED VALUES
  // ====================

  // Calculate statistics
  const agencyStats = {
    total: agencyItems.length,
    indexed: agencyItems.filter(item => item.indexing_status === "indexed").length,
    processing: agencyItems.filter(item => item.indexing_status === "processing").length,
    failed: agencyItems.filter(item => item.indexing_status === "failed").length,
  };

  const clientStats = {
    total: clientItems.length,
    indexed: clientItems.filter(item => item.indexing_status === "indexed").length,
    processing: clientItems.filter(item => item.indexing_status === "processing").length,
    failed: clientItems.filter(item => item.indexing_status === "failed").length,
  };

  const totalStats = {
    total: agencyStats.total + clientStats.total,
    indexed: agencyStats.indexed + clientStats.indexed,
    processing: agencyStats.processing + clientStats.processing,
    failed: agencyStats.failed + clientStats.failed,
  };

  // Get category statistics
  const allItems = [...agencyItems, ...clientItems];
  const categoryStats = allItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filter assets
  const filteredAssets = assets?.filter((asset: any) => {
    if (selectedAssetGroupId === "ungrouped") {
      if (asset.group_id) return false;
    } else if (selectedAssetGroupId && asset.group_id !== selectedAssetGroupId) {
      return false;
    }
    const matchesSearch = asset.name?.toLowerCase().includes(assetSearchTerm.toLowerCase());
    const matchesType = assetTypeFilter === "all" || asset.type === assetTypeFilter || asset.category === assetTypeFilter;
    return matchesSearch && matchesType;
  }) || [];

  // Filter swipe files
  const filteredSwipeFiles = swipeFiles?.filter((file: any) => {
    if (selectedSwipeGroupId === "ungrouped") {
      if (file.group_id) return false;
    } else if (selectedSwipeGroupId && file.group_id !== selectedSwipeGroupId) {
      return false;
    }
    return file.title?.toLowerCase().includes(swipeFileSearchTerm.toLowerCase());
  }) || [];

  // Filter prompts
  const filteredTemplates = promptTemplates?.filter((template: any) => {
    if (selectedPromptGroupId === "ungrouped") {
      if (template.group_id) return false;
    } else if (selectedPromptGroupId && template.group_id !== selectedPromptGroupId) {
      return false;
    }
    return template.name?.toLowerCase().includes(promptSearchTerm.toLowerCase());
  }) || [];

  // Filter offers
  const filteredOffers = offers?.filter((offer: any) => {
    if (selectedOfferGroupId === "ungrouped") {
      if (offer.group_id) return false;
    } else if (selectedOfferGroupId && offer.group_id !== selectedOfferGroupId) {
      return false;
    }
    return true;
  }) || [];

  // Get connected integrations count
  const connectedIntegrationsCount = integrations.filter((i: any) => i.is_connected).length;

  // ====================
  // HANDLERS
  // ====================

  const handleReindexAll = async () => {
    try {
      toast.info("Reindexing all documents...");

      await supabase.functions.invoke("google-search-indexing", {
        body: { action: "reindex", scope: "agency" },
      });

      await supabase.functions.invoke("google-search-indexing", {
        body: { action: "reindex", scope: "client" },
      });

      setTimeout(() => {
        refetchAgency();
        toast.success("Reindexing complete");
      }, 2000);
    } catch (error) {
      console.error("Reindex error:", error);
      toast.error("Failed to reindex");
    }
  };

  const handleAssetGroupChange = async (assetId: string, groupId: string | null) => {
    const { error } = await supabase.from("assets").update({ group_id: groupId }).eq("id", assetId);
    if (error) {
      toast.error("Failed to move asset");
    } else {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Asset moved");
    }
  };

  // ====================
  // RENDER
  // ====================

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-border bg-background">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Central Brain</h1>
                <p className="text-sm text-muted-foreground">Your AI's memory and learning space</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Tabs */}
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

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Quick access to all Central Brain sections</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Knowledge Bases Card */}
                  <Card className="bg-card border-border hover:bg-card/80 transition-colors cursor-pointer" onClick={() => setActiveTab("knowledge-bases")}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-lg">
                          <FileText className="w-6 h-6 text-blue-400" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Knowledge Bases</h3>
                      <p className="text-sm text-muted-foreground mb-4">Information library</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-foreground">{totalStats.total}</span>
                        <span className="text-sm text-muted-foreground">items</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Strategy Card */}
                  <Card className="bg-card border-border hover:bg-card/80 transition-colors cursor-pointer" onClick={() => setActiveTab("strategy")}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-lg">
                          <Target className="w-6 h-6 text-emerald-400" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Strategy</h3>
                      <p className="text-sm text-muted-foreground mb-4">Brand, research, funnels & offers</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-foreground">{offers.length}</span>
                        <span className="text-sm text-muted-foreground">offers</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Asset Library Card */}
                  <Card className="bg-card border-border hover:bg-card/80 transition-colors cursor-pointer" onClick={() => setActiveTab("asset-library")}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-lg">
                          <ImageIcon className="w-6 h-6 text-purple-400" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Asset Library</h3>
                      <p className="text-sm text-muted-foreground mb-4">Media & files</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-foreground">{assets.length}</span>
                        <span className="text-sm text-muted-foreground">assets</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tools Card */}
                  <Card className="bg-card border-border hover:bg-card/80 transition-colors cursor-pointer" onClick={() => setActiveTab("tools")}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-cyan-500/10 rounded-lg">
                          <SettingsIcon className="w-6 h-6 text-cyan-400" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Tools</h3>
                      <p className="text-sm text-muted-foreground mb-4">Specialists, roles & prompts</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-foreground">{promptTemplates.length}</span>
                        <span className="text-sm text-muted-foreground">prompts</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Swipe Files Card */}
                  <Card className="bg-card border-border hover:bg-card/80 transition-colors cursor-pointer" onClick={() => setActiveTab("swipe-files")}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-amber-500/10 rounded-lg">
                          <Camera className="w-6 h-6 text-amber-400" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Swipe Files</h3>
                      <p className="text-sm text-muted-foreground mb-4">Saved ad inspirations</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-foreground">{swipeFiles.length}</span>
                        <span className="text-sm text-muted-foreground">items</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Integrations Card */}
                  <Card className="bg-card border-border hover:bg-card/80 transition-colors cursor-pointer" onClick={() => setActiveTab("integrations")}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-rose-500/10 rounded-lg">
                          <Network className="w-6 h-6 text-rose-400" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Integrations</h3>
                      <p className="text-sm text-muted-foreground mb-4">Connected platforms</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-foreground">{connectedIntegrationsCount}</span>
                        <span className="text-sm text-muted-foreground">connected</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Brain Status */}
              <Card className="border-border">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Database className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Company Brain Status</CardTitle>
                      <CardDescription>
                        The Central Brain indexes all knowledge to power AI agents with context about your business
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-6 mb-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-foreground">{totalStats.total}</p>
                      <p className="text-sm text-muted-foreground">Total Items</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-emerald-500">{totalStats.indexed}</p>
                      <p className="text-sm text-muted-foreground">Indexed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-amber-500">{totalStats.processing}</p>
                      <p className="text-sm text-muted-foreground">Processing</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-rose-500">{totalStats.failed}</p>
                      <p className="text-sm text-muted-foreground">Failed</p>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${totalStats.total > 0 ? (totalStats.indexed / totalStats.total) * 100 : 0}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* KNOWLEDGE BASES TAB */}
            <TabsContent value="knowledge-bases" className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search knowledge base..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-sidebar border-border"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleReindexAll} className="gap-2 border-border">
                    <RefreshCw className="h-4 w-4" />
                    Re-parse Documents
                  </Button>
                  <Button onClick={() => setUploadModalOpen(true)} className="gap-2 bg-primary">
                    <Plus className="h-4 w-4" />
                    Add Knowledge
                  </Button>
                </div>
              </div>

              <Card className="border-border bg-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-foreground">All Knowledge Base Items</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {totalStats.indexed} of {totalStats.total} indexed
                      </p>
                    </div>
                    <Select value={selectedClient} onValueChange={setSelectedClient}>
                      <SelectTrigger className="w-64 bg-sidebar border-border">
                        <SelectValue placeholder="Filter by scope" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="all">All Items</SelectItem>
                        <SelectItem value="agency">Agency Only</SelectItem>
                        {clients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <KnowledgeBaseTable
                    scope={selectedClient === "agency" ? "agency" : selectedClient === "all" ? undefined : "client"}
                    clientId={selectedClient !== "agency" && selectedClient !== "all" ? selectedClient : undefined}
                    onPushToClients={(item) => {
                      setPushItem({ id: item.id, title: item.title, type: "knowledge_base" });
                      setPushModalOpen(true);
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* STRATEGY TAB */}
            <TabsContent value="strategy" className="space-y-6">
              <Tabs value={strategySubTab} onValueChange={setStrategySubTab}>
                <TabsList className="bg-sidebar border-border mb-6">
                  <TabsTrigger value="branding" className="gap-2">
                    <Palette className="w-4 h-4" />
                    Branding
                  </TabsTrigger>
                  <TabsTrigger value="market-research" className="gap-2">
                    <Users className="w-4 h-4" />
                    Market Research
                  </TabsTrigger>
                  <TabsTrigger value="funnels" className="gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Funnels
                  </TabsTrigger>
                  <TabsTrigger value="offers" className="gap-2">
                    <Package className="w-4 h-4" />
                    Offers
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="branding">
                  <Card className="border-border bg-card p-8 text-center">
                    <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Branding</h3>
                    <p className="text-muted-foreground">Select a project to manage brand settings</p>
                  </Card>
                </TabsContent>

                <TabsContent value="market-research">
                  <Card className="border-border bg-card p-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Market Research</h3>
                    <p className="text-muted-foreground">Customer avatars, competitors, and market analysis</p>
                  </Card>
                </TabsContent>

                <TabsContent value="funnels">
                  <Card className="border-border bg-card p-8 text-center">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Funnels</h3>
                    <p className="text-muted-foreground">Sales funnels and conversion paths</p>
                  </Card>
                </TabsContent>

                <TabsContent value="offers" className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <ContentGroupManager
                      projectId={null}
                      contentType="offer"
                      groups={offerGroups}
                      selectedGroupId={selectedOfferGroupId}
                      onSelectGroup={setSelectedOfferGroupId}
                    />
                    <Button onClick={() => { setEditOffer(null); setOfferDialogOpen(true); }} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Offer
                    </Button>
                  </div>
                  
                  {filteredOffers.length === 0 ? (
                    <Card className="border-border bg-card p-8 text-center">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-foreground mb-2">No Offers Yet</h3>
                      <p className="text-muted-foreground mb-4">Create your first offer to get started</p>
                      <Button onClick={() => setOfferDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Offer
                      </Button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredOffers.map((offer: any) => (
                        <OfferCard
                          key={offer.id}
                          offer={offer}
                          groups={offerGroups}
                          onEdit={(o) => { setEditOffer(o); setOfferDialogOpen(true); }}
                          onDelete={(id) => setDeleteOfferId(id)}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* ASSET LIBRARY TAB */}
            <TabsContent value="asset-library" className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search assets..."
                    value={assetSearchTerm}
                    onChange={(e) => setAssetSearchTerm(e.target.value)}
                    className="pl-10 bg-sidebar border-border"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex border border-border rounded-lg">
                    <Button
                      variant={assetViewMode === "grid" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setAssetViewMode("grid")}
                      className="rounded-r-none"
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={assetViewMode === "list" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setAssetViewMode("list")}
                      className="rounded-l-none"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Bulk Upload
                  </Button>
                  <Button onClick={() => { setEditAsset(null); setAddAssetDialogOpen(true); }} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Asset
                  </Button>
                </div>
              </div>

              {/* Asset Type Filter */}
              <div className="flex items-center gap-2">
                {["all", "brand_kit", "campaign", "ugc"].map((filter) => (
                  <Button
                    key={filter}
                    variant={assetTypeFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAssetTypeFilter(filter)}
                    className="capitalize"
                  >
                    {filter === "all" ? "All" : filter.replace("_", " ")}
                  </Button>
                ))}
                <Button
                  variant={assetTypeFilter === "archived" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAssetTypeFilter("archived")}
                  className="gap-2"
                >
                  <Archive className="w-4 h-4" />
                  Archived
                </Button>
              </div>

              <ContentGroupManager
                projectId={null}
                contentType="asset"
                groups={assetGroups}
                selectedGroupId={selectedAssetGroupId}
                onSelectGroup={setSelectedAssetGroupId}
                onDropAsset={handleAssetGroupChange}
              />

              {filteredAssets.length === 0 ? (
                <Card className="border-border bg-card p-8 text-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Assets Yet</h3>
                  <p className="text-muted-foreground mb-4">Upload your first asset to get started</p>
                  <Button onClick={() => setAddAssetDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Asset
                  </Button>
                </Card>
              ) : (
                <div className={cn(
                  assetViewMode === "grid" 
                    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                    : "flex flex-col gap-2"
                )}>
                  {filteredAssets.map((asset: any) => (
                    <Card key={asset.id} className="border-border bg-card overflow-hidden group">
                      {asset.url_or_path && (asset.type === "image" || asset.type === "video") && (
                        <div className="aspect-video bg-muted relative">
                          {asset.type === "image" ? (
                            <img src={asset.url_or_path} alt={asset.name} className="w-full h-full object-cover" />
                          ) : (
                            <video src={asset.url_or_path} className="w-full h-full object-cover" />
                          )}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => { setEditAsset(asset); setAddAssetDialogOpen(true); }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => setDeleteAssetId(asset.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      <CardContent className="p-4">
                        <h4 className="font-medium text-foreground truncate">{asset.name}</h4>
                        <p className="text-sm text-muted-foreground capitalize">{asset.type} • {(asset.file_size ? (asset.file_size / 1024 / 1024).toFixed(1) + " MB" : "")}</p>
                        {asset.tags && asset.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {asset.tags.slice(0, 3).map((tag: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                            {asset.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">+{asset.tags.length - 3}</Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TOOLS TAB */}
            <TabsContent value="tools" className="space-y-6">
              <Tabs value={toolsSubTab} onValueChange={setToolsSubTab}>
                <TabsList className="bg-sidebar border-border mb-6">
                  <TabsTrigger value="specialists" className="gap-2">
                    <Wand2 className="w-4 h-4" />
                    Specialists
                  </TabsTrigger>
                  <TabsTrigger value="roles" className="gap-2">
                    <UserCircle className="w-4 h-4" />
                    Roles
                  </TabsTrigger>
                  <TabsTrigger value="external" className="gap-2">
                    <Network className="w-4 h-4" />
                    External
                  </TabsTrigger>
                  <TabsTrigger value="prompts" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Prompts
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="specialists">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Built-in platform tools</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {INTERNAL_TOOLS.map((tool) => {
                        const Icon = tool.icon;
                        return (
                          <Card key={tool.id} className="border-border bg-card p-6">
                            <div className="flex items-start gap-4">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Icon className="w-6 h-6 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground">{tool.name}</h4>
                                <p className="text-sm text-muted-foreground">{tool.description}</p>
                              </div>
                              <Switch defaultChecked />
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="roles">
                  <Card className="border-border bg-card p-8 text-center">
                    <UserCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">AI Roles</h3>
                    <p className="text-muted-foreground">Configure specialized AI personas for different tasks</p>
                  </Card>
                </TabsContent>

                <TabsContent value="external">
                  <Card className="border-border bg-card p-8 text-center">
                    <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">External Tools</h3>
                    <p className="text-muted-foreground">Connect external APIs, n8n workflows, and webhooks</p>
                  </Card>
                </TabsContent>

                <TabsContent value="prompts" className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search prompts..."
                        value={promptSearchTerm}
                        onChange={(e) => setPromptSearchTerm(e.target.value)}
                        className="pl-10 bg-sidebar border-border"
                      />
                    </div>
                    <Button onClick={() => { setEditTemplate(null); setAddTemplateDialogOpen(true); }} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Prompt Template
                    </Button>
                  </div>

                  <ContentGroupManager
                    projectId={null}
                    contentType="prompt"
                    groups={promptGroups}
                    selectedGroupId={selectedPromptGroupId}
                    onSelectGroup={setSelectedPromptGroupId}
                  />

                  {filteredTemplates.length === 0 ? (
                    <Card className="border-border bg-card p-8 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-foreground mb-2">No Prompts Yet</h3>
                      <p className="text-muted-foreground mb-4">Create your first prompt template</p>
                      <Button onClick={() => setAddTemplateDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Prompt
                      </Button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredTemplates.map((template: any) => (
                        <Card key={template.id} className="border-border bg-card">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="font-semibold text-foreground">{template.name}</h4>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={template.enabled !== false}
                                  onCheckedChange={(checked) => toggleTemplateMutation.mutate({ id: template.id, enabled: checked })}
                                />
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditTemplate(template); setAddTemplateDialogOpen(true); }}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteTemplateId(template.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-3">{template.content}</p>
                            {template.tags && template.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {template.tags.map((tag: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* SWIPE FILES TAB */}
            <TabsContent value="swipe-files" className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search swipe files..."
                    value={swipeFileSearchTerm}
                    onChange={(e) => setSwipeFileSearchTerm(e.target.value)}
                    className="pl-10 bg-sidebar border-border"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex border border-border rounded-lg">
                    <Button
                      variant={swipeViewMode === "grid" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setSwipeViewMode("grid")}
                      className="rounded-r-none"
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={swipeViewMode === "list" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setSwipeViewMode("list")}
                      className="rounded-l-none"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button variant="outline" onClick={() => setBulkSwipeUploadOpen(true)} className="gap-2">
                    <Upload className="w-4 h-4" />
                    Bulk Upload
                  </Button>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Swipe File
                  </Button>
                </div>
              </div>

              <ContentGroupManager
                projectId={null}
                contentType="swipe"
                groups={swipeGroups}
                selectedGroupId={selectedSwipeGroupId}
                onSelectGroup={setSelectedSwipeGroupId}
              />

              {/* Bulk Upload Section */}
              {bulkSwipeUploadOpen && (
                <Card className="border-border bg-card p-4">
                  <BulkSwipeUploader
                    projectId={null}
                    groupId={selectedSwipeGroupId}
                    onComplete={() => {
                      setBulkSwipeUploadOpen(false);
                      refetchSwipeFiles();
                    }}
                  />
                </Card>
              )}

              {filteredSwipeFiles.length === 0 ? (
                <Card className="border-border bg-card p-8 text-center">
                  <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Swipe Files Yet</h3>
                  <p className="text-muted-foreground mb-4">Upload documents or add entries to start your review queue</p>
                  <Button onClick={() => setBulkSwipeUploadOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Files
                  </Button>
                </Card>
              ) : (
                <div className={cn(
                  swipeViewMode === "grid" 
                    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                    : "flex flex-col gap-2"
                )}>
                  {filteredSwipeFiles.map((file: any) => (
                    <Card key={file.id} className="border-border bg-card overflow-hidden group">
                      {file.image_url && (
                        <div className="aspect-video bg-muted relative">
                          <img src={file.image_url} alt={file.title} className="w-full h-full object-cover" />
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="secondary" className="h-8 w-8">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => setDeleteSwipeFileId(file.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      {!file.image_url && (
                        <div className="aspect-video bg-muted flex items-center justify-center">
                          {file.type === "video" && <Video className="w-12 h-12 text-muted-foreground" />}
                          {file.type === "document" && <FileText className="w-12 h-12 text-muted-foreground" />}
                          {file.type === "text" && <FileText className="w-12 h-12 text-muted-foreground" />}
                          {file.type === "link" && <LinkIcon className="w-12 h-12 text-muted-foreground" />}
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Badge variant="outline" className="capitalize">{file.type}</Badge>
                        </div>
                        <h4 className="font-medium text-foreground truncate">{file.title}</h4>
                        {file.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{file.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* INTEGRATIONS TAB */}
            <TabsContent value="integrations" className="space-y-6">
              <Tabs value={integrationsSubTab} onValueChange={setIntegrationsSubTab}>
                <TabsList className="bg-sidebar border-border mb-6 flex-wrap h-auto gap-1">
                  <TabsTrigger value="network" className="gap-2">
                    <Network className="w-4 h-4" />
                    Networks
                  </TabsTrigger>
                  <TabsTrigger value="crm" className="gap-2">
                    <Building2 className="w-4 h-4" />
                    CRM
                  </TabsTrigger>
                  <TabsTrigger value="video_creation" className="gap-2">
                    <Video className="w-4 h-4" />
                    Video Creation
                  </TabsTrigger>
                  <TabsTrigger value="llm" className="gap-2">
                    <Brain className="w-4 h-4" />
                    LLMs
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger value="automation" className="gap-2">
                    <Layers className="w-4 h-4" />
                    Automation
                  </TabsTrigger>
                  <TabsTrigger value="data_storage" className="gap-2">
                    <Database className="w-4 h-4" />
                    Data & Storage
                  </TabsTrigger>
                </TabsList>

                {Object.entries(PREDEFINED_PLATFORMS).map(([category, platforms]) => (
                  <TabsContent key={category} value={category}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {platforms.map((platform) => {
                        const Icon = platform.icon;
                        const isConnected = integrations.some((i: any) => i.platform === platform.id && i.is_connected);
                        return (
                          <Card key={platform.id} className="border-border bg-card">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-muted rounded-lg">
                                    <Icon className="w-6 h-6 text-foreground" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-foreground">{platform.name}</h4>
                                    <p className="text-sm text-muted-foreground">{platform.description}</p>
                                  </div>
                                </div>
                                <Badge variant={isConnected ? "default" : "secondary"} className={isConnected ? "bg-emerald-500" : ""}>
                                  {isConnected ? "Connected" : "Not Connected"}
                                </Badge>
                              </div>
                              <Button variant="outline" className="w-full mt-4">
                                Configure
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Upload Modal */}
      <KnowledgeBaseUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onSuccess={refetchAgency}
      />

      {/* Add Asset Dialog */}
      <AddAssetDialog
        open={addAssetDialogOpen}
        onOpenChange={setAddAssetDialogOpen}
        editAsset={editAsset}
      />

      {/* Add Template Dialog */}
      <AddTemplateDialog
        open={addTemplateDialogOpen}
        onOpenChange={setAddTemplateDialogOpen}
        editTemplate={editTemplate}
        groups={promptGroups}
      />

      {/* Add Offer Dialog */}
      <AddOfferDialog
        open={offerDialogOpen}
        onOpenChange={setOfferDialogOpen}
        projectId=""
        groups={offerGroups}
        editOffer={editOffer}
      />

      {/* Delete Confirmations */}
      <AlertDialog open={!!deleteAssetId} onOpenChange={() => setDeleteAssetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this asset? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteAssetId && deleteAssetMutation.mutate(deleteAssetId)} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteSwipeFileId} onOpenChange={() => setDeleteSwipeFileId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Swipe File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this swipe file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteSwipeFileId && deleteSwipeFileMutation.mutate(deleteSwipeFileId)} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTemplateId} onOpenChange={() => setDeleteTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTemplateId && deleteTemplateMutation.mutate(deleteTemplateId)} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteOfferId} onOpenChange={() => setDeleteOfferId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Offer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this offer? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteOfferId && deleteOfferMutation.mutate(deleteOfferId)} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Floating Ask AI */}
      <FloatingAskAI />

      {/* Push to Client Modal */}
      {pushItem && (
        <PushToClientModal
          open={pushModalOpen}
          onOpenChange={setPushModalOpen}
          assetId={pushItem.id}
          assetType={pushItem.type}
          assetTitle={pushItem.title}
        />
      )}
    </div>
  );
}
