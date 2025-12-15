import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDocumentParsing } from "@/contexts/DocumentParsingContext";
import AssetLibrary from "@/pages/AssetLibrary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Plus,
  Search,
  Trash2,
  Edit,
  MessageSquare,
  Pencil,
  Image,
  File,
  Link as LinkIcon,
  Package,
  ShieldCheck,
  TrendingUp,
  Eye,
  Palette,
  Users2,
  Network,
  UserCircle,
  Building2,
  Video,
  FileText,
  Facebook,
  Chrome,
  Music,
  Linkedin,
  Twitter,
  Camera,
  Cloud,
  Mail,
  Clapperboard,
  Film,
  FileVideo,
  Layers,
  Settings,
  Wand2,
  BookOpen,
  Upload,
  Target,
  FileSpreadsheet,
  ChevronRight,
  HardDrive,
  Table,
  Database,
  Check,
  Archive,
  ArrowLeft,
  Sparkles,
  Loader2,
  Grid,
  List,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import AddTemplateDialog from "@/components/AddTemplateDialog";
import AddAssetDialog from "@/components/AddAssetDialog";
import { BulkSwipeUploader } from "@/components/BulkSwipeUploader";
import { ContentGroupManager } from "@/components/ContentGroupManager";
import { AddOfferDialog } from "@/components/AddOfferDialog";
import { OfferCard } from "@/components/OfferCard";

interface StrategySection {
  id: string;
  title: string;
  content: string;
  category: string;
}

interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  tags: string[];
  enabled?: boolean;
}

interface Asset {
  id: string;
  name: string;
  type: string;
  text_content?: string;
  url_or_path?: string;
  tags?: string[];
  enabled?: boolean;
}

interface Tool {
  id: string;
  project_id: string;
  name: string;
  description: string;
  type: string;
  config: any;
  enabled: boolean;
  group_id?: string | null;
}

interface MarketResearch {
  id: string;
  project_id: string;
  type: string;
  name: string;
  content: any;
  prompt?: string;
  file_url?: string;
  enabled?: boolean;
  group_id?: string | null;
}

interface Integration {
  id: string;
  project_id: string;
  category: string;
  platform: string;
  name: string;
  config: any;
  is_connected: boolean;
}

interface KnowledgeEntry {
  id: string;
  project_id: string;
  title: string;
  content: string;
  source_url?: string;
  tags: string[];
  enabled: boolean;
  status: string;
  group_id?: string | null;
}

export default function KnowledgeBase() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { addToQueue } = useDocumentParsing();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Tab states
  const [selectedTab, setSelectedTab] = useState("overview");
  const [strategySubTab, setStrategySubTab] = useState("branding");
  const [toolsSubTab, setToolsSubTab] = useState("specialists");
  const [integrationsSubTab, setIntegrationsSubTab] = useState("networks");
  const [knowledgeSubTab, setKnowledgeSubTab] = useState("in-review");

  // Prompts state
  const [searchTerm, setSearchTerm] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<any>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [selectedPromptGroupId, setSelectedPromptGroupId] = useState<string | null>(null);

  // Assets state
  const [assetSearchTerm, setAssetSearchTerm] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>("all");
  const [addAssetDialogOpen, setAddAssetDialogOpen] = useState(false);
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [selectedAssetGroupId, setSelectedAssetGroupId] = useState<string | null>(null);

  // Knowledge state
  const [knowledgeSearchTerm, setKnowledgeSearchTerm] = useState("");
  const [knowledgeDialogOpen, setKnowledgeDialogOpen] = useState(false);
  const [selectedKnowledgeGroupId, setSelectedKnowledgeGroupId] = useState<string | null>(null);
  const [isReparsing, setIsReparsing] = useState(false);
  const [knowledgeFormData, setKnowledgeFormData] = useState({
    id: "",
    title: "",
    content: "",
    source_url: "",
    tags: [] as string[],
    enabled: true,
    group_id: null as string | null,
  });
  const [deleteKnowledgeId, setDeleteKnowledgeId] = useState<string | null>(null);
  const [isAutoTagging, setIsAutoTagging] = useState<string | null>(null);
  const [selectedKnowledgeStatus, setSelectedKnowledgeStatus] = useState<'in_review' | 'active' | 'archived'>('in_review');
  const [uploadedDocument, setUploadedDocument] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [archiveDialogEntry, setArchiveDialogEntry] = useState<KnowledgeEntry | null>(null);

  // Brand/Branding state
  const [brandFormData, setBrandFormData] = useState({
    name: "",
    description: "",
    goal: "",
    creative_style_notes: "",
    budget_cap_note: "",
  });

  // Market Research state
  const [isResearchDialogOpen, setIsResearchDialogOpen] = useState(false);
  const [editingResearch, setEditingResearch] = useState<MarketResearch | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [researchFormData, setResearchFormData] = useState({
    type: "customer_avatar",
    name: "",
    prompt: "",
    content: "",
    file_url: "",
    group_id: null as string | null,
  });
  const [deleteResearchId, setDeleteResearchId] = useState<string | null>(null);
  const [selectedResearchGroupId, setSelectedResearchGroupId] = useState<string | null>(null);

  // Tools state
  const [toolDialogOpen, setToolDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [deleteToolId, setDeleteToolId] = useState<string | null>(null);
  const [toolFormData, setToolFormData] = useState({
    name: "",
    description: "",
    type: "api",
    webhookUrl: "",
    group_id: null as string | null,
  });
  const [selectedToolGroupId, setSelectedToolGroupId] = useState<string | null>(null);

  // Roles state
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);
  const [selectedRoleGroupId, setSelectedRoleGroupId] = useState<string | null>(null);
  const [roleFormData, setRoleFormData] = useState({
    name: "",
    description: "",
    system_prompt: "",
    icon: "user",
    color: "",
    tags: [] as string[],
    group_id: null as string | null,
  });

  // Integrations state
  const [isIntegrationDialogOpen, setIsIntegrationDialogOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [newIntegration, setNewIntegration] = useState<Omit<Integration, "id" | "project_id"> | null>(null);
  const [integrationFormData, setIntegrationFormData] = useState({
    category: "network",
    platform: "",
    name: "",
    config: "{}",
    is_connected: false,
  });
  const [configFieldValues, setConfigFieldValues] = useState<Record<string, string>>({});
  const [configuringPlatform, setConfiguringPlatform] = useState<any | null>(null);

  // Swipe Files state
  const [swipeFileSearchTerm, setSwipeFileSearchTerm] = useState("");
  const [swipeFileDialogOpen, setSwipeFileDialogOpen] = useState(false);
  const [bulkSwipeUploadOpen, setBulkSwipeUploadOpen] = useState(false);
  const [swipeFileFormData, setSwipeFileFormData] = useState({
    id: "",
    type: "image",
    title: "",
    description: "",
    image_url: "",
    source_url: "",
    text_content: "",
    file_url: "",
    video_url: "",
    tags: [] as string[],
    group_id: null as string | null,
  });
  const [deleteSwipeFileId, setDeleteSwipeFileId] = useState<string | null>(null);
  const [uploadingSwipeImage, setUploadingSwipeImage] = useState(false);
  const [uploadingSwipeFile, setUploadingSwipeFile] = useState(false);
  const [editingSwipeFile, setEditingSwipeFile] = useState<any>(null);
  const [selectedSwipeGroupId, setSelectedSwipeGroupId] = useState<string | null>(null);
  const [swipeViewMode, setSwipeViewMode] = useState<"grid" | "list">("grid");
  const [bulkSwipeUploadGroupId, setBulkSwipeUploadGroupId] = useState<string | null>(null);

  // Preview state
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Swipe file type options
  const SWIPE_FILE_TYPES = [
    { id: 'image', name: 'Image', icon: Image, description: 'Screenshots, ads, creatives' },
    { id: 'text', name: 'Text/Notes', icon: FileText, description: 'Copy, hooks, scripts' },
    { id: 'pdf', name: 'PDF Document', icon: File, description: 'Reports, guides, PDFs' },
    { id: 'document', name: 'Document', icon: FileText, description: 'Word docs (.doc, .docx)' },
    { id: 'video', name: 'Video', icon: Video, description: 'Video ads, reels, TikToks' },
    { id: 'link', name: 'Link/Reference', icon: LinkIcon, description: 'Websites, articles, landing pages' },
  ];

  // Funnels state
  const [funnelDialogOpen, setFunnelDialogOpen] = useState(false);
  const [editingFunnel, setEditingFunnel] = useState<any>(null);
  const [funnelFormData, setFunnelFormData] = useState({
    name: "",
    description: "",
    stages: "[]",
  });
  const [deleteFunnelId, setDeleteFunnelId] = useState<string | null>(null);

  // Offers state
  const [offerSearchTerm, setOfferSearchTerm] = useState("");
  const [selectedOfferGroupId, setSelectedOfferGroupId] = useState<string | null>(null);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [editOffer, setEditOffer] = useState<any>(null);
  const [deleteOfferId, setDeleteOfferId] = useState<string | null>(null);

  // Internal tools definition
  const INTERNAL_TOOLS = [
    { id: "ad-spy", name: "Ad Spy", description: "Research competitor ads and discover winning creatives", icon: Eye },
    { id: "ad-optimizer", name: "Ad Optimizer", description: "AI-powered performance optimization for campaigns", icon: TrendingUp },
    { id: "market-research", name: "Market Research", description: "Analyze market trends and customer segments", icon: Users2 },
  ];

  // External tool types
  const EXTERNAL_TOOL_TYPES = [
    { id: "api", name: "API Integration", description: "Connect to external APIs" },
    { id: "n8n", name: "n8n Workflow", description: "Run n8n automation workflows" },
    { id: "zapier", name: "Zapier Webhook", description: "Trigger Zapier zaps via webhooks" },
    { id: "custom", name: "Custom", description: "Custom external tool" },
  ];

  // Overview cards definition
  const OVERVIEW_CARDS = [
    { id: "knowledge", icon: BookOpen, title: "Knowledge Bases", description: "Information library", tab: "knowledge" },
    { id: "strategy", icon: Target, title: "Strategy", description: "Brand, research, funnels & offers", tab: "strategy" },
    { id: "assets", icon: Image, title: "Asset Library", description: "Media & files", tab: "assets" },
    { id: "tools", icon: Settings, title: "Specialists", description: "Specialists, roles & prompts", tab: "tools" },
    { id: "swipe-files", icon: Camera, title: "Swipe Files", description: "Saved ad inspirations", tab: "swipe-files" },
    { id: "integrations", icon: Network, title: "Integrations", description: "Connected platforms", tab: "integrations" },
  ];

  // Predefined platform configurations
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
      { id: "openrouter", name: "OpenRouter", description: "Access 100+ AI models via single API", icon: Sparkles, configFields: ["api_key"], settingsKey: "openrouter_api_key" },
      { id: "manus", name: "Manus", description: "Advanced AI agent for autonomous task execution", icon: Brain, configFields: ["api_key", "workspace_id"] },
      { id: "openai", name: "OpenAI", description: "GPT models for text generation", icon: Sparkles, configFields: ["api_key", "organization_id"] },
      { id: "anthropic", name: "Anthropic", description: "Claude models for advanced reasoning", icon: Brain, configFields: ["api_key"] },
    ],
    image_generation: [
      { id: "nanobanan", name: "Nanobanan", description: "AI-powered ad creative generation", icon: Wand2, configFields: ["api_key"], settingsKey: "nanobanan_api_key" },
      { id: "replicate", name: "Replicate", description: "AI models for image generation", icon: Image, configFields: ["api_key"] },
    ],
    analytics: [
      { id: "redtrack", name: "RedTrack", description: "Conversion tracking and attribution", icon: TrendingUp, configFields: ["api_key"], settingsKey: "redtrack_api_key" },
      { id: "hyros", name: "Hyros", description: "Ad attribution and tracking", icon: Target, configFields: ["api_key"] },
    ],
    automation: [
      { id: "composio", name: "Composio (Meta Ads)", description: "Meta Ads automation and campaign management", icon: Facebook, configFields: ["config_json"], settingsKey: "composio_config_json" },
      { id: "n8n", name: "n8n", description: "Workflow automation", icon: Network, configFields: ["webhook_url"] },
      { id: "zapier", name: "Zapier", description: "Zapier webhook integration", icon: Layers, configFields: ["webhook_url"] },
    ],
    data_storage: [
      { id: "google-sheets", name: "Google Sheets", description: "Spreadsheet data sync", icon: FileSpreadsheet, configFields: ["api_key", "spreadsheet_id"] },
      { id: "google-drive", name: "Google Drive", description: "File storage integration", icon: HardDrive, configFields: ["api_key", "folder_id"] },
      { id: "airtable", name: "Airtable", description: "Database & spreadsheet platform", icon: Table, configFields: ["api_key", "base_id"] },
    ],
  };

  // Prompts queries - fetch global groups
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

  const { data: templates } = useQuery({
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

  const filteredTemplates = templates?.filter((template) => {
    // Group filtering
    if (selectedPromptGroupId === "ungrouped") {
      if ((template as any).group_id) return false;
    } else if (selectedPromptGroupId && (template as any).group_id !== selectedPromptGroupId) {
      return false;
    }
    // Search filtering
    return template.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prompt_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompt-templates"] });
      toast({
        title: "Template Deleted",
        description: "Template has been removed from your library.",
      });
      setDeleteTemplateId(null);
    },
  });

  const toggleTemplateMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("prompt_templates")
        .update({ enabled })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompt-templates"] });
      sonnerToast.success("Template updated");
    },
  });

  // Assets queries - fetch global groups
  const { data: assetGroups = [] } = useQuery({
    queryKey: ["content-groups", "asset"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_groups")
        .select("*")
        .is("project_id", null)
        .eq("content_type", "asset")
        .order("position", { ascending: true});
      if (error) throw error;
      return data;
    },
  });

  // Offers queries - fetch global groups
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

  const { data: offers } = useQuery({
    queryKey: ["offers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select(`
          *,
          offer_assets (*)
        `)
        .is("project_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredOffers = offers?.filter((offer) => {
    // Group filtering
    if (selectedOfferGroupId === "ungrouped") {
      if (offer.group_id) return false;
    } else if (selectedOfferGroupId && offer.group_id !== selectedOfferGroupId) {
      return false;
    }
    // Search filtering
    const searchLower = offerSearchTerm.toLowerCase();
    return (
      offer.name.toLowerCase().includes(searchLower) ||
      offer.description?.toLowerCase().includes(searchLower) ||
      offer.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
    );
  });

  const deleteOfferMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("offers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      toast({
        title: "Offer Deleted",
        description: "Offer has been removed successfully.",
      });
      setDeleteOfferId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete offer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { data: assets } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false});
      if (error) throw error;
      return data;
    },
  });

  const filteredAssets = assets?.filter((asset) => {
    // Group filtering
    if (selectedAssetGroupId === "ungrouped") {
      if (asset.group_id) return false;
    } else if (selectedAssetGroupId && asset.group_id !== selectedAssetGroupId) {
      return false;
    }
    // Search and type filtering
    const matchesSearch = asset.name.toLowerCase().includes(assetSearchTerm.toLowerCase());
    const matchesType = assetTypeFilter === "all" || asset.type === assetTypeFilter;
    return matchesSearch && matchesType;
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast({
        title: "Asset Deleted",
        description: "Asset has been removed from your library.",
      });
      setDeleteAssetId(null);
    },
  });

  const toggleAssetMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("assets")
        .update({ enabled })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      sonnerToast.success("Asset updated");
    },
  });

  // Knowledge queries - fetch global groups
  const { data: knowledgeGroups = [] } = useQuery({
    queryKey: ["content-groups", "knowledge"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_groups")
        .select("*")
        .is("project_id", null)
        .eq("content_type", "knowledge")
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: knowledgeEntries } = useQuery({
    queryKey: ["knowledge-entries", selectedKnowledgeStatus],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_entries")
        .select("*")
        .is("project_id", null)
        .eq("status", selectedKnowledgeStatus)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredKnowledge = knowledgeEntries?.filter((k: any) =>
    k.title.toLowerCase().includes(knowledgeSearchTerm.toLowerCase()) ||
    k.content?.toLowerCase().includes(knowledgeSearchTerm.toLowerCase())
  ) || [];

  const saveKnowledgeMutation = useMutation({
    mutationFn: async (data: typeof knowledgeFormData) => {
      if (data.id) {
        const { error } = await supabase
          .from("knowledge_entries")
          .update({
            title: data.title,
            content: data.content,
            source_url: data.source_url,
            tags: data.tags,
            enabled: data.enabled,
            group_id: data.group_id,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("knowledge_entries")
          .insert({
            project_id: null, // Global knowledge for Central Brain
            title: data.title,
            content: data.content,
            source_url: data.source_url,
            tags: data.tags,
            enabled: data.enabled,
            status: 'in_review',
            group_id: data.group_id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-entries"] });
      setKnowledgeDialogOpen(false);
      setKnowledgeFormData({ id: "", title: "", content: "", source_url: "", tags: [], enabled: true, group_id: null });
      toast({ title: knowledgeFormData.id ? "Knowledge updated" : "Knowledge added" });
    },
  });

  const deleteKnowledgeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("knowledge_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-entries"] });
      setDeleteKnowledgeId(null);
      toast({ title: "Knowledge deleted" });
    },
  });

  const toggleKnowledgeMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("knowledge_entries").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-entries"] });
    },
  });

  const updateKnowledgeStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("knowledge_entries").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-entries"] });
      sonnerToast.success("Knowledge entry status updated");
    },
  });

  const handleKnowledgeSave = () => {
    if (!knowledgeFormData.title.trim()) {
      toast({ title: "Error", description: "Please enter a title", variant: "destructive" });
      return;
    }
    saveKnowledgeMutation.mutate(knowledgeFormData);
  };

  const handleReparseDocuments = async () => {
    setIsReparsing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reparse-documents`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to re-parse documents');
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Documents Re-parsed",
          description: `Successfully re-parsed ${result.processed} documents${result.failed > 0 ? `, ${result.failed} failed` : ''}${result.skipped > 0 ? `, ${result.skipped} skipped` : ''}`,
        });
        queryClient.invalidateQueries({ queryKey: ['knowledge-entries'] });
        queryClient.invalidateQueries({ queryKey: ['swipe-files'] });
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Re-parse error:', error);
      toast({
        title: "Re-parse Failed",
        description: error instanceof Error ? error.message : "Failed to re-parse documents",
        variant: "destructive",
      });
    } finally {
      setIsReparsing(false);
    }
  };

  const handleKnowledgeEdit = (entry: any) => {
    setKnowledgeFormData({
      id: entry.id,
      title: entry.title,
      content: entry.content || "",
      source_url: entry.source_url || "",
      tags: entry.tags || [],
      enabled: entry.enabled,
      group_id: entry.group_id || null,
    });
    setKnowledgeDialogOpen(true);
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedDocument(file);
    }
  };

  const handleParseDocument = async () => {
    if (!uploadedDocument) {
      sonnerToast.error("Please select a document first");
      return;
    }

    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadedDocument);

      const parseResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-document`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!parseResponse.ok) throw new Error('Failed to parse document');

      const data = await parseResponse.json();

      setKnowledgeFormData(prev => ({
        ...prev,
        title: data.title || prev.title,
        content: data.content || prev.content,
      }));

      sonnerToast.success("Document parsed successfully");
      setUploadedDocument(null);
    } catch (error) {
      console.error('Error parsing document:', error);
      sonnerToast.error("Failed to parse document");
    } finally {
      setIsParsing(false);
    }
  };

  const handleApproveKnowledge = async (entry: KnowledgeEntry) => {
    setIsApproving(entry.id);
    try {
      // 1. Update status to active
      const { error: statusError } = await supabase
        .from("knowledge_entries")
        .update({ status: 'active' })
        .eq("id", entry.id);
      
      if (statusError) throw statusError;

      // 2. Auto-tag in background
      const { data: tagData, error: tagError } = await supabase.functions.invoke('auto-tag', {
        body: { 
          content: entry.content || '', 
          title: entry.title || '', 
          type: 'knowledge' 
        }
      });

      // 3. Update tags if generated (don't block on errors)
      if (!tagError && tagData?.tags?.length > 0) {
        await supabase
          .from("knowledge_entries")
          .update({ tags: tagData.tags })
          .eq("id", entry.id);
      }

      queryClient.invalidateQueries({ queryKey: ["knowledge-entries"] });
      setSelectedKnowledgeStatus('active');
      sonnerToast.success(`"${entry.title}" approved! Moved to Active tab${tagData?.tags?.length ? ` and tagged with ${tagData.tags.length} tags` : ''}`);
    } catch (error: any) {
      console.error('Approval error:', error);
      if (error.message?.includes('Rate limit')) {
        sonnerToast.error('Approved, but rate limit exceeded for tagging');
      } else if (error.message?.includes('credits')) {
        sonnerToast.error('Approved, but AI credits exhausted for tagging');
      } else {
        sonnerToast.error("Failed to approve entry");
      }
    } finally {
      setIsApproving(null);
    }
  };

  const autoTagContent = async (id: string, content: string, title: string, type: 'knowledge' | 'asset') => {
    if (!content && !title) {
      sonnerToast.error('No content to analyze');
      return;
    }

    setIsAutoTagging(id);
    try {
      const { data, error } = await supabase.functions.invoke('auto-tag', {
        body: { content: content || '', title: title || '', type }
      });

      if (error) throw error;

      if (data?.tags && data.tags.length > 0) {
        const table = type === 'knowledge' ? 'knowledge_entries' : 'assets';
        const { error: updateError } = await supabase
          .from(table)
          .update({ tags: data.tags })
          .eq('id', id);

        if (updateError) throw updateError;

        queryClient.invalidateQueries({ queryKey: [type === 'knowledge' ? 'knowledge-entries' : 'assets'] });
        sonnerToast.success(`Generated ${data.tags.length} tags`);
      } else {
        sonnerToast.error('No tags generated');
      }
    } catch (error: any) {
      console.error('Auto-tag error:', error);
      if (error.message?.includes('Rate limit')) {
        sonnerToast.error('Rate limit exceeded. Please try again later.');
      } else if (error.message?.includes('credits')) {
        sonnerToast.error('AI credits exhausted. Please add credits.');
      } else {
        sonnerToast.error('Failed to generate tags');
      }
    } finally {
      setIsAutoTagging(null);
    }
  };

  // Board (Brand/Branding) queries
  const { data: board } = useQuery({
    queryKey: ["agent-board", selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return null;
      const { data, error } = await supabase
        .from("agent_boards")
        .select("*")
        .eq("id", selectedProjectId)
        .single();
      if (error) throw error;
      
      if (data) {
        setBrandFormData({
          name: data.name || "",
          description: data.description || "",
          goal: data.goal || "",
          creative_style_notes: data.creative_style_notes || "",
          budget_cap_note: data.budget_cap_note || "",
        });
      }
      
      return data;
    },
    enabled: !!selectedProjectId,
  });

  const updateBoardMutation = useMutation({
    mutationFn: async (data: typeof brandFormData) => {
      if (!selectedProjectId) throw new Error("No project selected");
      const { error } = await supabase
        .from("agent_boards")
        .update(data)
        .eq("id", selectedProjectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-board", selectedProjectId] });
      toast({
        title: "Settings saved",
        description: "Brand settings have been updated successfully.",
      });
    },
  });

  const handleSaveBrand = () => {
    updateBoardMutation.mutate(brandFormData);
  };

  // Market Research queries - fetch global groups
  const { data: researchGroups = [] } = useQuery({
    queryKey: ["content-groups", "research"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_groups")
        .select("*")
        .is("project_id", null)
        .eq("content_type", "research")
        .order("position", { ascending: true});
      if (error) throw error;
      return data;
    },
  });

  const { data: marketResearch = [] } = useQuery({
    queryKey: ["market-research"],
    queryFn: async () => {
      const { data, error} = await supabase
        .from("market_research")
        .select("*")
        .is("project_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createResearchMutation = useMutation({
    mutationFn: async (research: Omit<MarketResearch, "id" | "project_id">) => {
      const { error } = await supabase.from("market_research").insert([{
        project_id: null, // Global research for Central Brain
        type: research.type as "customer_avatar" | "competitor" | "market_trend" | "other",
        name: research.name,
        content: research.content,
        prompt: research.prompt,
        file_url: research.file_url,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market-research"] });
      sonnerToast.success("Research added");
      setIsResearchDialogOpen(false);
      setResearchFormData({ type: "customer_avatar", name: "", prompt: "", content: "", file_url: "", group_id: null });
    },
  });

  const updateResearchMutation = useMutation({
    mutationFn: async ({ id, type, ...research }: Partial<MarketResearch> & { id: string }) => {
      const { error } = await supabase
        .from("market_research")
        .update({
          ...research,
          ...(type && { type: type as "customer_avatar" | "competitor" | "market_trend" | "other" }),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market-research"] });
      sonnerToast.success("Research updated");
      setIsResearchDialogOpen(false);
      setEditingResearch(null);
      setResearchFormData({ type: "customer_avatar", name: "", prompt: "", content: "", file_url: "", group_id: null });
    },
  });

  const deleteResearchMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("market_research").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market-research"] });
      sonnerToast.success("Research deleted");
      setDeleteResearchId(null);
    },
  });

  const toggleResearchMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("market_research")
        .update({ enabled })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market-research"] });
      sonnerToast.success("Research updated");
    },
  });

  // Swipe Files queries - fetch global groups
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

  const { data: swipeFiles = [] } = useQuery({
    queryKey: ["swipe-files"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("swipe_files")
        .select("*")
        .is("project_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredSwipeFiles = swipeFiles.filter((file: any) => {
    // Group filtering
    if (selectedSwipeGroupId === "ungrouped") {
      if (file.group_id) return false;
    } else if (selectedSwipeGroupId && file.group_id !== selectedSwipeGroupId) {
      return false;
    }
    // Search filtering - includes text content search for documents
    return file.title.toLowerCase().includes(swipeFileSearchTerm.toLowerCase()) ||
      file.description?.toLowerCase().includes(swipeFileSearchTerm.toLowerCase()) ||
      file.text_content?.toLowerCase().includes(swipeFileSearchTerm.toLowerCase());
  });

  const createSwipeFileMutation = useMutation({
    mutationFn: async (swipeFile: Omit<typeof swipeFileFormData, "id">) => {
      const { error } = await supabase.from("swipe_files").insert([{
        project_id: null, // Global swipe files for Central Brain
        ...swipeFile,
        group_id: swipeFile.group_id === "ungrouped" ? null : swipeFile.group_id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swipe-files"] });
      sonnerToast.success("Swipe file saved");
      setSwipeFileDialogOpen(false);
      setSwipeFileFormData({ 
        id: "", 
        type: "image", 
        title: "", 
        description: "", 
        image_url: "", 
        source_url: "", 
        text_content: "", 
        file_url: "", 
        video_url: "", 
        tags: [],
        group_id: null,
      });
      setEditingSwipeFile(null);
    },
  });

  const updateSwipeFileMutation = useMutation({
    mutationFn: async ({ id, ...swipeFile }: typeof swipeFileFormData) => {
      const { error } = await supabase
        .from("swipe_files")
        .update({
          ...swipeFile,
          group_id: swipeFile.group_id === "ungrouped" ? null : swipeFile.group_id,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swipe-files"] });
      sonnerToast.success("Swipe file updated");
      setSwipeFileDialogOpen(false);
      setSwipeFileFormData({ 
        id: "", 
        type: "image", 
        title: "", 
        description: "", 
        image_url: "", 
        source_url: "", 
        text_content: "", 
        file_url: "", 
        video_url: "", 
        tags: [],
        group_id: null,
      });
      setEditingSwipeFile(null);
    },
  });

  const deleteSwipeFileMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("swipe_files").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swipe-files"] });
      sonnerToast.success("Swipe file deleted");
      setDeleteSwipeFileId(null);
    },
  });

  const handleSwipeImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      sonnerToast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      sonnerToast.error('Image size must be less than 10MB');
      return;
    }

    setUploadingSwipeImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${selectedProjectId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('canvas-uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('canvas-uploads')
        .getPublicUrl(filePath);

      setSwipeFileFormData(prev => ({ ...prev, image_url: publicUrl }));
      sonnerToast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      sonnerToast.error('Failed to upload image');
    } finally {
      setUploadingSwipeImage(false);
    }
  };

  const handleSwipeFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = swipeFileFormData.type === 'video' ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      sonnerToast.error(`File size must be less than ${swipeFileFormData.type === 'video' ? '100MB' : '20MB'}`);
      return;
    }

    setUploadingSwipeFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${selectedProjectId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('canvas-uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('canvas-uploads')
        .getPublicUrl(filePath);

      setSwipeFileFormData(prev => ({ ...prev, file_url: publicUrl }));
      sonnerToast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      sonnerToast.error('Failed to upload file');
    } finally {
      setUploadingSwipeFile(false);
    }
  };

  const handleSwipeFileSave = () => {
    if (!swipeFileFormData.title) {
      sonnerToast.error("Please provide a title");
      return;
    }

    // Type-specific validation
    switch (swipeFileFormData.type) {
      case 'image':
        if (!swipeFileFormData.image_url) {
          sonnerToast.error("Please upload an image");
          return;
        }
        break;
      case 'text':
        if (!swipeFileFormData.text_content) {
          sonnerToast.error("Please provide text content");
          return;
        }
        break;
      case 'pdf':
        if (!swipeFileFormData.file_url) {
          sonnerToast.error("Please upload a PDF file");
          return;
        }
        break;
      case 'video':
        if (!swipeFileFormData.video_url && !swipeFileFormData.file_url) {
          sonnerToast.error("Please provide a video URL or upload a video");
          return;
        }
        break;
      case 'link':
        if (!swipeFileFormData.source_url) {
          sonnerToast.error("Please provide a URL");
          return;
        }
        break;
    }

    if (editingSwipeFile) {
      updateSwipeFileMutation.mutate(swipeFileFormData);
    } else {
      const { id, ...dataToCreate } = swipeFileFormData;
      createSwipeFileMutation.mutate(dataToCreate);
    }
  };

  const handleSwipeFileEdit = (file: any) => {
    setEditingSwipeFile(file);
    setSwipeFileFormData({
      id: file.id,
      type: file.type || 'image',
      title: file.title,
      description: file.description || "",
      image_url: file.image_url || "",
      source_url: file.source_url || "",
      text_content: file.text_content || "",
      file_url: file.file_url || "",
      video_url: file.video_url || "",
      tags: file.tags || [],
      group_id: file.group_id || null,
    });
    setSwipeFileDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    const filePath = `research/${Date.now()}-${file.name}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("canvas-uploads")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("canvas-uploads")
        .getPublicUrl(filePath);

      setResearchFormData({ ...researchFormData, file_url: publicUrl });
      sonnerToast.success("File uploaded");
    } catch (error) {
      console.error("Upload error:", error);
      sonnerToast.error("Failed to upload file");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSaveResearch = () => {
    if (!researchFormData.name || !researchFormData.content) {
      sonnerToast.error("Please fill in required fields");
      return;
    }

    if (editingResearch) {
      updateResearchMutation.mutate({
        id: editingResearch.id,
        type: researchFormData.type,
        name: researchFormData.name,
        content: researchFormData.content,
        prompt: researchFormData.prompt,
        file_url: researchFormData.file_url,
        group_id: researchFormData.group_id,
      });
    } else {
      createResearchMutation.mutate({
        type: researchFormData.type,
        name: researchFormData.name,
        content: researchFormData.content,
        prompt: researchFormData.prompt,
        file_url: researchFormData.file_url,
        group_id: researchFormData.group_id,
      } as Omit<MarketResearch, "id" | "project_id">);
    }
  };

  const handleResearchEdit = (research: MarketResearch) => {
    setEditingResearch(research);
    setResearchFormData({
      type: research.type,
      name: research.name,
      content: research.content,
      prompt: research.prompt || "",
      file_url: research.file_url || "",
      group_id: (research as any).group_id || null,
    });
    setIsResearchDialogOpen(true);
  };

  // Tools queries - fetch global groups
  const { data: toolGroups = [] } = useQuery({
    queryKey: ["content-groups", "tool"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_groups")
        .select("*")
        .is("project_id", null)
        .eq("content_type", "tool")
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: projectTools = [] } = useQuery({
    queryKey: ["project-tools"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tools")
        .select("*")
        .is("project_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const internalTools = projectTools.filter((t: any) => {
    // Group filtering
    if (selectedToolGroupId === "ungrouped") {
      if (t.group_id) return false;
    } else if (selectedToolGroupId && t.group_id !== selectedToolGroupId) {
      return false;
    }
    return t.type === "internal";
  });

  const externalTools = projectTools.filter((t: any) => {
    // Group filtering
    if (selectedToolGroupId === "ungrouped") {
      if (t.group_id) return false;
    } else if (selectedToolGroupId && t.group_id !== selectedToolGroupId) {
      return false;
    }
    return t.type !== "internal";
  });

  const createToolMutation = useMutation({
    mutationFn: async (tool: Omit<Tool, "id" | "project_id">) => {
      const { error } = await supabase.from("project_tools").insert([{
        project_id: null, // Global tools for Central Brain
        ...tool,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tools"] });
      sonnerToast.success("Tool added");
      setToolDialogOpen(false);
      setToolFormData({ name: "", description: "", type: "api", webhookUrl: "", group_id: null });
    },
  });

  const updateToolMutation = useMutation({
    mutationFn: async ({ id, ...tool }: Partial<Tool> & { id: string }) => {
      const { error } = await supabase
        .from("project_tools")
        .update(tool)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tools"] });
      sonnerToast.success("Tool updated");
      setToolDialogOpen(false);
      setEditingTool(null);
      setToolFormData({ name: "", description: "", type: "api", webhookUrl: "", group_id: null });
    },
  });

  const deleteToolMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_tools").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tools"] });
      sonnerToast.success("Tool deleted");
      setDeleteToolId(null);
    },
  });

  const toggleToolMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("project_tools")
        .update({ enabled })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tools"] });
    },
  });

  // AI Roles queries - fetch global groups
  const { data: roleGroups = [] } = useQuery({
    queryKey: ["content-groups", "role"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_groups")
        .select("*")
        .is("project_id", null)
        .eq("content_type", "role")
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: aiRoles = [] } = useQuery({
    queryKey: ["ai-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_roles")
        .select("*")
        .is("project_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredRoles = aiRoles.filter((role: any) => {
    // Group filtering
    if (selectedRoleGroupId === "ungrouped") {
      if (role.group_id) return false;
    } else if (selectedRoleGroupId && role.group_id !== selectedRoleGroupId) {
      return false;
    }
    return true;
  });

  const createRoleMutation = useMutation({
    mutationFn: async (role: Omit<typeof roleFormData, "id">) => {
      const { error } = await supabase.from("ai_roles").insert([{
        project_id: null, // Global roles for Central Brain
        ...role,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-roles"] });
      sonnerToast.success("Role added");
      setRoleDialogOpen(false);
      setRoleFormData({ 
        name: "", 
        description: "", 
        system_prompt: "", 
        icon: "user", 
        color: "", 
        tags: [], 
        group_id: null 
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, ...role }: any) => {
      const { error } = await supabase
        .from("ai_roles")
        .update(role)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-roles"] });
      sonnerToast.success("Role updated");
      setRoleDialogOpen(false);
      setEditingRole(null);
      setRoleFormData({ 
        name: "", 
        description: "", 
        system_prompt: "", 
        icon: "user", 
        color: "", 
        tags: [], 
        group_id: null 
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ai_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-roles"] });
      sonnerToast.success("Role deleted");
      setDeleteRoleId(null);
    },
  });

  const toggleRoleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error} = await supabase
        .from("ai_roles")
        .update({ enabled })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-roles"] });
      sonnerToast.success("Role updated");
    },
  });

  const handleToolSave = () => {
    if (!toolFormData.name || !toolFormData.description) {
      sonnerToast.error("Please fill in all required fields");
      return;
    }
    
    const config: any = {};
    if (toolFormData.webhookUrl) {
      config.webhookUrl = toolFormData.webhookUrl;
    }
    
    if (editingTool) {
      updateToolMutation.mutate({ 
        id: editingTool.id, 
        name: toolFormData.name,
        description: toolFormData.description,
        type: toolFormData.type,
        config,
        group_id: toolFormData.group_id,
      });
    } else {
      createToolMutation.mutate({
        name: toolFormData.name,
        description: toolFormData.description,
        type: toolFormData.type,
        config,
        enabled: true,
        group_id: toolFormData.group_id,
      });
    }
  };

  const handleToolEdit = (tool: Tool) => {
    setEditingTool(tool);
    setToolFormData({
      name: tool.name,
      description: tool.description,
      type: tool.type,
      webhookUrl: (tool.config as any)?.webhookUrl || "",
      group_id: (tool as any).group_id || null,
    });
    setToolDialogOpen(true);
  };

  // Integrations queries
  const { data: integrations = [] } = useQuery({
    queryKey: ["integrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .is("project_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // App settings query for API key integrations
  const { data: appSettings } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const createIntegrationMutation = useMutation({
    mutationFn: async (integration: Omit<Integration, "id" | "project_id">) => {
      const { error } = await supabase.from("integrations").insert([{
        project_id: null,
        category: integration.category as "network" | "crm" | "video_creation" | "data_storage" | "llm",
        platform: integration.platform,
        name: integration.name,
        config: JSON.parse(integration.config as string),
        is_connected: integration.is_connected,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      sonnerToast.success("Integration added");
      setIsIntegrationDialogOpen(false);
      setNewIntegration(null);
      setConfiguringPlatform(null);
      setConfigFieldValues({});
      setIntegrationFormData({ category: "network", platform: "", name: "", config: "{}", is_connected: false });
    },
  });

  const updateIntegrationMutation = useMutation({
    mutationFn: async ({ id, ...integration }: Partial<Integration> & { id: string }) => {
      const updateData: any = { ...integration };
      if (integration.config) {
        updateData.config = JSON.parse(integration.config as string);
      }
      if (integration.category) {
        updateData.category = integration.category as "network" | "crm" | "video_creation" | "data_storage" | "llm";
      }
      
      const { error } = await supabase
        .from("integrations")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      sonnerToast.success("Integration updated");
      setIsIntegrationDialogOpen(false);
      setEditingIntegration(null);
      setNewIntegration(null);
      setConfiguringPlatform(null);
      setConfigFieldValues({});
      setIntegrationFormData({ category: "network", platform: "", name: "", config: "{}", is_connected: false });
    },
  });

  const deleteIntegrationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("integrations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      sonnerToast.success("Integration deleted");
    },
  });

  const handleIntegrationSave = () => {
    if (!integrationFormData.name || !integrationFormData.platform) {
      sonnerToast.error("Please fill in all required fields");
      return;
    }
    
    // Build config from field values if using predefined platform
    const config = configuringPlatform 
      ? JSON.stringify(configFieldValues)
      : integrationFormData.config;
    
    const dataToSave = { ...integrationFormData, config };
    
    if (editingIntegration) {
      updateIntegrationMutation.mutate({ id: editingIntegration.id, ...dataToSave });
    } else {
      createIntegrationMutation.mutate(dataToSave);
    }
  };

  const handleIntegrationEdit = (integration: Integration) => {
    setEditingIntegration(integration);
    setNewIntegration(null);
    
    // Check if this is a predefined platform
    const platformsInCategory = PREDEFINED_PLATFORMS[integration.category as keyof typeof PREDEFINED_PLATFORMS] || [];
    const platform = platformsInCategory.find((p: any) => p.id === integration.platform);
    
    if (platform && platform.configFields) {
      setConfiguringPlatform(platform);
      // Parse existing config and populate field values
      const parsedConfig = typeof integration.config === 'string' 
        ? JSON.parse(integration.config) 
        : integration.config;
      setConfigFieldValues(parsedConfig);
    } else {
      setConfiguringPlatform(null);
      setConfigFieldValues({});
    }
    
    setIntegrationFormData({
      category: integration.category,
      platform: integration.platform,
      name: integration.name,
      config: JSON.stringify(integration.config, null, 2),
      is_connected: integration.is_connected,
    });
    setIsIntegrationDialogOpen(true);
  };

  const handlePlatformConfigure = (platform: any, category: string) => {
    setConfiguringPlatform(platform);
    
    // Initialize config field values from platform.configFields
    const initialFields: Record<string, string> = {};
    platform.configFields?.forEach((field: string) => {
      initialFields[field] = '';
    });
    setConfigFieldValues(initialFields);
    
    setNewIntegration({
      name: platform.name,
      platform: platform.id,
      category: category as "network" | "crm" | "video_creation" | "data_storage" | "llm",
      config: {},
      is_connected: false,
    });
    setEditingIntegration(null);
    setIntegrationFormData({
      category: category,
      platform: platform.id,
      name: platform.name,
      config: "{}",
      is_connected: false,
    });
    setIsIntegrationDialogOpen(true);
  };

  // Helper functions
  const getAssetIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="w-5 h-5 text-primary" />;
      case "text":
        return <FileText className="w-5 h-5 text-primary" />;
      case "url":
        return <LinkIcon className="w-5 h-5 text-primary" />;
      default:
        return <File className="w-5 h-5 text-primary" />;
    }
  };

  const getIntegrationIcon = (category: string) => {
    switch (category) {
      case "network":
        return <Network className="h-5 w-5" />;
      case "crm":
        return <UserCircle className="h-5 w-5" />;
      case "video_creation":
        return <Video className="h-5 w-5" />;
      case "data_storage":
        return <Database className="h-5 w-5" />;
      default:
        return <Network className="h-5 w-5" />;
    }
  };

  // Filter functions
  const customerAvatars = marketResearch.filter((r) => r.type === "customer_avatar");
  const competitors = marketResearch.filter((r) => r.type === "competitor");
  const integrationsData = integrations;

  // Count functions for overview cards
  const getCounts = () => {
    return {
      knowledge: (knowledgeEntries?.length || 0),
      strategy: (marketResearch?.length || 0),
      assets: (assets?.length || 0),
      tools: (projectTools?.length || 0) + (templates?.length || 0),
      swipeFiles: (swipeFiles?.length || 0),
      integrations: integrations?.filter((i: any) => i.is_connected).length || 0,
    };
  };

  const counts = getCounts();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Brain className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Central Brain</h1>
          <p className="text-muted-foreground">Your AI's memory and learning space</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge Bases</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="assets">Asset Library</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="swipe-files">Swipe Files</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          {/* Overview Tab - Cards Design */}
          <TabsContent value="overview" className="space-y-6">
            <p className="text-muted-foreground">Quick access to all Central Brain sections</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {OVERVIEW_CARDS.map((card) => {
                const IconComponent = card.icon;
                const count = counts[card.id as keyof typeof counts];
                
                return (
                  <Card 
                    key={card.id} 
                    className="cursor-pointer transition-all hover:shadow-md"
                    onClick={() => setSelectedTab(card.tab)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3">
                        <IconComponent className="w-8 h-8 text-primary" />
                        <div className="flex-1">
                          <h3 className="font-semibold">{card.title}</h3>
                          <p className="text-sm text-muted-foreground">{card.description}</p>
                        </div>
                      </div>
                      <Separator className="my-4" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {count} {card.id === "integrations" ? "connected" : count === 1 ? "item" : "items"}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Strategy Tab with nested sub-tabs */}
          <TabsContent value="strategy" className="space-y-4">
            <Tabs value={strategySubTab} onValueChange={setStrategySubTab}>
              <TabsList>
                <TabsTrigger value="branding">
                  <Palette className="w-4 h-4 mr-2" />
                  Branding
                </TabsTrigger>
                <TabsTrigger value="market-research">
                  <Users2 className="w-4 h-4 mr-2" />
                  Market Research
                </TabsTrigger>
                <TabsTrigger value="funnels">
                  <Target className="w-4 h-4 mr-2" />
                  Funnels
                </TabsTrigger>
                <TabsTrigger value="offers">
                  <Package className="w-4 h-4 mr-2" />
                  Offers
                </TabsTrigger>
              </TabsList>

              {/* Branding Sub-tab */}
              <TabsContent value="branding" className="space-y-6">
                {!selectedProjectId ? (
                  <Card className="p-8">
                    <p className="text-muted-foreground text-center">
                      Select a project to manage brand settings
                    </p>
                  </Card>
                ) : (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Project Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="brand-name">Project Name</Label>
                          <Input
                            id="brand-name"
                            value={brandFormData.name}
                            onChange={(e) => setBrandFormData({ ...brandFormData, name: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="brand-description">Description</Label>
                          <Textarea
                            id="brand-description"
                            value={brandFormData.description}
                            onChange={(e) => setBrandFormData({ ...brandFormData, description: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="brand-goal">Campaign Goal</Label>
                          <Input
                            id="brand-goal"
                            value={brandFormData.goal}
                            onChange={(e) => setBrandFormData({ ...brandFormData, goal: e.target.value })}
                            placeholder="e.g., Generate 1000 leads, $50k revenue"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Creative Guidelines</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="brand-style">Creative Style Notes</Label>
                          <Textarea
                            id="brand-style"
                            value={brandFormData.creative_style_notes}
                            onChange={(e) => setBrandFormData({ ...brandFormData, creative_style_notes: e.target.value })}
                            placeholder="Brand voice, tone, visual style preferences..."
                            rows={4}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="brand-budget">Budget Cap Notes</Label>
                          <Input
                            id="brand-budget"
                            value={brandFormData.budget_cap_note}
                            onChange={(e) => setBrandFormData({ ...brandFormData, budget_cap_note: e.target.value })}
                            placeholder="e.g., Max $100/day per campaign"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-end">
                      <Button onClick={handleSaveBrand} disabled={updateBoardMutation.isPending}>
                        {updateBoardMutation.isPending ? "Saving..." : "Save Settings"}
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Market Research Sub-tab */}
              <TabsContent value="market-research" className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">Define customer avatars and competitor research</p>
                  <Dialog open={isResearchDialogOpen} onOpenChange={setIsResearchDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Research
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{editingResearch ? "Edit" : "Add"} Market Research</DialogTitle>
                        <DialogDescription>
                          Add customer avatar segments, competitor analysis, or market trends
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Type</Label>
                          <Select
                            value={researchFormData.type}
                            onValueChange={(value) =>
                              setResearchFormData({ ...researchFormData, type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="customer_avatar">Customer Avatar</SelectItem>
                              <SelectItem value="competitor">Competitor</SelectItem>
                              <SelectItem value="market_trend">Market Trend</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Upload File (Optional)</Label>
                          <div className="mt-2">
                            <Input
                              type="file"
                              onChange={handleFileUpload}
                              disabled={uploadingFile}
                              accept="image/*,.pdf,.doc,.docx"
                            />
                            {uploadingFile && (
                              <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
                            )}
                            {researchFormData.file_url && (
                              <div className="mt-2 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <a
                                  href={researchFormData.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline"
                                >
                                  View uploaded file
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label>Name *</Label>
                          <Input
                            value={researchFormData.name}
                            onChange={(e) =>
                              setResearchFormData({ ...researchFormData, name: e.target.value })
                            }
                            placeholder="e.g., Primary Customer Avatar"
                          />
                        </div>

                        <div>
                          <Label>Prompt / Instructions (Optional)</Label>
                          <Textarea
                            value={researchFormData.prompt}
                            onChange={(e) =>
                              setResearchFormData({ ...researchFormData, prompt: e.target.value })
                            }
                            placeholder="e.g., Use this avatar for Facebook targeting campaigns..."
                            className="min-h-[80px]"
                          />
                        </div>

                        <div>
                          <Label>Content *</Label>
                          <Textarea
                            value={researchFormData.content}
                            onChange={(e) =>
                              setResearchFormData({ ...researchFormData, content: e.target.value })
                            }
                            placeholder="Describe demographics, pain points, goals, behaviors..."
                            className="min-h-[120px]"
                          />
                        </div>

                        <div>
                          <Label>Group (Optional)</Label>
                          <Select
                            value={researchFormData.group_id || "none"}
                            onValueChange={(value) => 
                              setResearchFormData(prev => ({ ...prev, group_id: value === "none" ? null : value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="No group" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No group</SelectItem>
                              {researchGroups?.map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                  {group.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsResearchDialogOpen(false);
                            setEditingResearch(null);
                            setResearchFormData({ type: "customer_avatar", name: "", prompt: "", content: "", file_url: "", group_id: null });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSaveResearch}>
                          {editingResearch ? "Update" : "Add"} Research
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <ContentGroupManager
                  projectId={null}
                  contentType="research"
                  groups={researchGroups || []}
                  selectedGroupId={selectedResearchGroupId}
                  onSelectGroup={setSelectedResearchGroupId}
                />

                <Accordion type="multiple" className="space-y-4">
                  <AccordionItem value="customer-avatars">
                    <AccordionTrigger className="text-lg font-semibold">
                      Customer Avatars ({customerAvatars.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      {customerAvatars.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No customer avatars defined yet
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {customerAvatars.map((research) => (
                            <Card key={research.id} className={!research.enabled ? "opacity-50" : ""}>
                               <CardHeader>
                                 <div className="flex items-start justify-between">
                                   <div className="flex-1">
                                     <div className="flex items-center gap-2">
                                       {research.group_id && (
                                         <div
                                           className="h-2 w-2 rounded-full flex-shrink-0"
                                           style={{
                                             backgroundColor: `hsl(${
                                               researchGroups?.find((g: any) => g.id === research.group_id)?.color || "221 83% 53%"
                                             })`,
                                           }}
                                         />
                                       )}
                                       <CardTitle className="text-base">{research.name}</CardTitle>
                                       {!research.enabled && <Badge variant="secondary">Disabled</Badge>}
                                     </div>
                                    {research.prompt && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {research.prompt}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleResearchEdit(research)}
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => setDeleteResearchId(research.id)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {research.content}
                                </p>
                                {research.file_url && (
                                  <div className="mt-3 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    <a
                                      href={research.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-primary hover:underline"
                                    >
                                      View attached file
                                    </a>
                                  </div>
                                )}
                                <Separator className="my-3" />
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    {research.enabled ? "Enabled" : "Disabled"}
                                  </span>
                                  <Switch
                                    checked={research.enabled !== false}
                                    onCheckedChange={(checked) =>
                                      toggleResearchMutation.mutate({ id: research.id, enabled: checked })
                                    }
                                  />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="competitors">
                    <AccordionTrigger className="text-lg font-semibold">
                      Competitors ({competitors.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      {competitors.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No competitor research defined yet
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {competitors.map((research) => (
                             <Card key={research.id} className={!research.enabled ? "opacity-50" : ""}>
                               <CardHeader>
                                 <div className="flex items-start justify-between">
                                   <div className="flex-1">
                                     <div className="flex items-center gap-2">
                                       {research.group_id && (
                                         <div
                                           className="h-2 w-2 rounded-full flex-shrink-0"
                                           style={{
                                             backgroundColor: `hsl(${
                                               researchGroups?.find((g: any) => g.id === research.group_id)?.color || "221 83% 53%"
                                             })`,
                                           }}
                                         />
                                       )}
                                       <CardTitle className="text-base">{research.name}</CardTitle>
                                       {!research.enabled && <Badge variant="secondary">Disabled</Badge>}
                                     </div>
                                    {research.prompt && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {research.prompt}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleResearchEdit(research)}
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => setDeleteResearchId(research.id)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {research.content}
                                </p>
                                {research.file_url && (
                                  <div className="mt-3 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    <a
                                      href={research.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-primary hover:underline"
                                    >
                                      View attached file
                                    </a>
                                  </div>
                                )}
                                <Separator className="my-3" />
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    {research.enabled ? "Enabled" : "Disabled"}
                                  </span>
                                  <Switch
                                    checked={research.enabled !== false}
                                    onCheckedChange={(checked) =>
                                      toggleResearchMutation.mutate({ id: research.id, enabled: checked })
                                    }
                                  />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>

              {/* Funnels Sub-tab */}
              <TabsContent value="funnels" className="space-y-4">
                <Card className="p-8">
                  <div className="text-center space-y-2">
                    <Target className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">Define your sales funnels and customer journeys</p>
                    <p className="text-sm text-muted-foreground">Coming soon</p>
                  </div>
                </Card>
              </TabsContent>

              {/* Offers Sub-tab */}
              <TabsContent value="offers" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    <h2 className="text-xl font-semibold">Product Offers</h2>
                  </div>
                  <Button onClick={() => { setEditOffer(null); setOfferDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Offer
                  </Button>
                </div>

                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search offers..."
                      value={offerSearchTerm}
                      onChange={(e) => setOfferSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <ContentGroupManager
                  projectId={null}
                  contentType="offer"
                  groups={offerGroups}
                  selectedGroupId={selectedOfferGroupId}
                  onSelectGroup={setSelectedOfferGroupId}
                />

                {!selectedProjectId ? (
                  <Card className="p-8">
                    <div className="text-center space-y-2">
                      <Package className="w-12 h-12 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">Select a project to manage offers</p>
                    </div>
                  </Card>
                ) : filteredOffers && filteredOffers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredOffers.map((offer) => (
                      <OfferCard
                        key={offer.id}
                        offer={offer}
                        groups={offerGroups}
                        onEdit={(o) => { setEditOffer(o); setOfferDialogOpen(true); }}
                        onDelete={(id) => setDeleteOfferId(id)}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="p-8">
                    <div className="text-center space-y-2">
                      <Package className="w-12 h-12 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {offerSearchTerm || selectedOfferGroupId ? "No offers found" : "No offers yet"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {offerSearchTerm || selectedOfferGroupId
                          ? "Try adjusting your filters"
                          : "Create your first product offer to get started"}
                      </p>
                    </div>
                  </Card>
                )}

                <AddOfferDialog
                  open={offerDialogOpen}
                  onOpenChange={(open) => {
                    setOfferDialogOpen(open);
                    if (!open) setEditOffer(null);
                  }}
                  projectId={selectedProjectId || ""}
                  groups={offerGroups}
                  editOffer={editOffer}
                />

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
                      <AlertDialogAction
                        onClick={() => deleteOfferId && deleteOfferMutation.mutate(deleteOfferId)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Asset Library Tab */}
          <TabsContent value="assets" className="h-[calc(100vh-12rem)]">
            <AssetLibrary />
          </TabsContent>

          {/* Tools Tab with Internal/External/Prompts sub-tabs */}
          <TabsContent value="tools" className="space-y-4">
            <Tabs value={toolsSubTab} onValueChange={setToolsSubTab}>
              <TabsList>
                <TabsTrigger value="specialists">
                  <Package className="w-4 h-4 mr-2" />
                  Specialists
                </TabsTrigger>
                <TabsTrigger value="roles">
                  <UserCircle className="w-4 h-4 mr-2" />
                  Roles
                </TabsTrigger>
                <TabsTrigger value="external">
                  <Network className="w-4 h-4 mr-2" />
                  External
                </TabsTrigger>
                <TabsTrigger value="prompts">
                  <Wand2 className="w-4 h-4 mr-2" />
                  Prompts
                </TabsTrigger>
              </TabsList>

              {/* Specialists Sub-tab (formerly Internal) */}
              <TabsContent value="specialists" className="space-y-4">
                <p className="text-muted-foreground">Built-in platform tools</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {INTERNAL_TOOLS.map((tool) => {
                    const existingTool = internalTools.find((t: any) => t.config?.internalType === tool.id);
                    const IconComponent = tool.icon;
                    
                    return (
                      <Card key={tool.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-3">
                            <IconComponent className="w-8 h-8 text-primary" />
                            <div className="flex-1">
                              <h3 className="font-semibold">{tool.name}</h3>
                              <p className="text-sm text-muted-foreground">{tool.description}</p>
                            </div>
                          </div>
                          <Separator className="my-4" />
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {existingTool?.enabled ? "Enabled" : "Disabled"}
                            </span>
                            <div className="flex items-center gap-2">
                              {existingTool?.group_id && (
                                <div
                                  className="h-2 w-2 rounded-full"
                                  style={{
                                    backgroundColor: `hsl(${
                                      toolGroups?.find((g: any) => g.id === existingTool.group_id)?.color || "221 83% 53%"
                                    })`,
                                  }}
                                />
                              )}
                              <Switch
                                checked={existingTool?.enabled ?? false}
                                onCheckedChange={(checked) => {
                                  if (existingTool) {
                                    toggleToolMutation.mutate({ id: existingTool.id, enabled: checked });
                                  } else {
                                    createToolMutation.mutate({
                                      name: tool.name,
                                      description: tool.description,
                                      type: "internal",
                                      config: { internalType: tool.id },
                                      enabled: checked,
                                      group_id: selectedToolGroupId === "ungrouped" ? null : selectedToolGroupId,
                                    });
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Roles Sub-tab */}
              <TabsContent value="roles" className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">AI specialist personas with custom system prompts</p>
                  <Dialog open={roleDialogOpen} onOpenChange={(open) => {
                    setRoleDialogOpen(open);
                    if (!open) {
                      setEditingRole(null);
                      setRoleFormData({ name: "", description: "", system_prompt: "", icon: "user", color: "", tags: [], group_id: null });
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Role
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle>{editingRole ? "Edit" : "Add"} AI Role</DialogTitle>
                        <DialogDescription>
                          Create a pre-trained AI specialist with custom system prompts
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
                        <div className="space-y-4">
                          <div>
                            <Label>Name *</Label>
                            <Input
                              value={roleFormData.name}
                              onChange={(e) => setRoleFormData(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g., Marketing Strategist"
                            />
                          </div>

                          <div>
                            <Label>Description</Label>
                            <Input
                              value={roleFormData.description}
                              onChange={(e) => setRoleFormData(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Short description for the UI"
                            />
                          </div>

                          <div>
                            <Label>System Prompt * {roleFormData.system_prompt.length > 4000 && <span className="text-destructive text-xs ml-2">(Very long prompt may exceed token limits)</span>}</Label>
                            <Textarea
                              value={roleFormData.system_prompt}
                              onChange={(e) => setRoleFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
                              placeholder="You are an expert marketing strategist who..."
                              className="min-h-[200px] font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground mt-1">{roleFormData.system_prompt.length} characters</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Icon</Label>
                              <Select
                                value={roleFormData.icon}
                                onValueChange={(value) => setRoleFormData(prev => ({ ...prev, icon: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="brain">Brain</SelectItem>
                                  <SelectItem value="target">Target</SelectItem>
                                  <SelectItem value="sparkles">Sparkles</SelectItem>
                                  <SelectItem value="palette">Palette</SelectItem>
                                  <SelectItem value="trending-up">Trending Up</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>Color (Optional)</Label>
                              <Input
                                value={roleFormData.color}
                                onChange={(e) => setRoleFormData(prev => ({ ...prev, color: e.target.value }))}
                                placeholder="e.g., 221 83% 53%"
                              />
                            </div>
                          </div>

                          <div>
                            <Label>Tags (comma-separated)</Label>
                            <Input
                              value={roleFormData.tags.join(", ")}
                              onChange={(e) => setRoleFormData(prev => ({ 
                                ...prev, 
                                tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) 
                              }))}
                              placeholder="marketing, strategy, expert"
                            />
                          </div>

                          <div>
                            <Label>Group (Optional)</Label>
                            <Select
                              value={roleFormData.group_id || "none"}
                              onValueChange={(value) => setRoleFormData(prev => ({ ...prev, group_id: value === "none" ? null : value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="No group" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No group</SelectItem>
                                {roleGroups?.map((group) => (
                                  <SelectItem key={group.id} value={group.id}>
                                    {group.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </ScrollArea>
                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => {
                          if (!roleFormData.name || !roleFormData.system_prompt) {
                            sonnerToast.error("Please fill in required fields");
                            return;
                          }
                          if (editingRole) {
                            updateRoleMutation.mutate({ id: editingRole.id, ...roleFormData });
                          } else {
                            createRoleMutation.mutate(roleFormData);
                          }
                        }}>
                          {editingRole ? "Update" : "Add"} Role
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <ContentGroupManager
                  projectId={null}
                  contentType="role"
                  groups={roleGroups || []}
                  selectedGroupId={selectedRoleGroupId}
                  onSelectGroup={setSelectedRoleGroupId}
                />

                {filteredRoles.length === 0 ? (
                  <Card className="p-12">
                    <div className="text-center space-y-2">
                      <UserCircle className="w-12 h-12 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">No AI roles yet</p>
                      <p className="text-sm text-muted-foreground">
                        Create pre-trained specialists with custom system prompts
                      </p>
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRoles.map((role: any) => (
                      <Card key={role.id} className={`p-6 hover:border-primary/50 transition-colors ${!role.enabled ? "opacity-50" : ""}`}>
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {role.group_id && (
                                  <div
                                    className="h-2 w-2 rounded-full flex-shrink-0"
                                    style={{
                                      backgroundColor: `hsl(${
                                        roleGroups?.find((g: any) => g.id === role.group_id)?.color || "221 83% 53%"
                                      })`,
                                    }}
                                  />
                                )}
                                {!role.enabled && <Badge variant="secondary">Disabled</Badge>}
                              </div>
                              <h3 className="font-semibold mb-1">{role.name}</h3>
                              {role.description && (
                                <p className="text-sm text-muted-foreground mb-2">{role.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {role.system_prompt.substring(0, 100)}...
                              </p>
                              {role.tags && role.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {role.tags.map((tag: string, idx: number) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setEditingRole(role);
                                  setRoleFormData({
                                    name: role.name,
                                    description: role.description || "",
                                    system_prompt: role.system_prompt,
                                    icon: role.icon || "user",
                                    color: role.color || "",
                                    tags: role.tags || [],
                                    group_id: role.group_id || null,
                                  });
                                  setRoleDialogOpen(true);
                                }}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setDeleteRoleId(role.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {role.enabled ? "Enabled" : "Disabled"}
                            </span>
                            <Switch
                              checked={role.enabled}
                              onCheckedChange={(checked) =>
                                toggleRoleMutation.mutate({ id: role.id, enabled: checked })
                              }
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                <AlertDialog open={!!deleteRoleId} onOpenChange={() => setDeleteRoleId(null)}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Role</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this AI role? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteRoleId && deleteRoleMutation.mutate(deleteRoleId)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TabsContent>

              {/* External Tools Sub-tab */}
              <TabsContent value="external" className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">External integrations, webhooks, and automation workflows</p>
                  <Dialog open={toolDialogOpen} onOpenChange={setToolDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add External Tool
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingTool ? "Edit" : "Add"} External Tool</DialogTitle>
                        <DialogDescription>
                          Configure an external tool or webhook integration
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Tool Type</Label>
                          <Select
                            value={toolFormData.type}
                            onValueChange={(value) =>
                              setToolFormData({ ...toolFormData, type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {EXTERNAL_TOOL_TYPES.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Name *</Label>
                          <Input
                            value={toolFormData.name}
                            onChange={(e) =>
                              setToolFormData({ ...toolFormData, name: e.target.value })
                            }
                            placeholder="e.g., My n8n Workflow"
                          />
                        </div>

                        <div>
                          <Label>Description *</Label>
                          <Textarea
                            value={toolFormData.description}
                            onChange={(e) =>
                              setToolFormData({ ...toolFormData, description: e.target.value })
                            }
                            placeholder="Describe what this tool does..."
                            className="min-h-[80px]"
                          />
                        </div>

                        {(toolFormData.type === "n8n" || toolFormData.type === "zapier" || toolFormData.type === "api") && (
                          <div>
                            <Label>Webhook URL</Label>
                            <Input
                              value={toolFormData.webhookUrl}
                              onChange={(e) =>
                                setToolFormData({ ...toolFormData, webhookUrl: e.target.value })
                              }
                              placeholder="https://..."
                            />
                          </div>
                        )}

                        <div>
                          <Label>Group (Optional)</Label>
                          <Select
                            value={toolFormData.group_id || "none"}
                            onValueChange={(value) => 
                              setToolFormData(prev => ({ ...prev, group_id: value === "none" ? null : value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="No group" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No group</SelectItem>
                              {toolGroups?.map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                  {group.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setToolDialogOpen(false);
                            setEditingTool(null);
                            setToolFormData({ name: "", description: "", type: "api", webhookUrl: "", group_id: null });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleToolSave}>
                          {editingTool ? "Update" : "Add"} Tool
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <ContentGroupManager
                  projectId={null}
                  contentType="tool"
                  groups={toolGroups || []}
                  selectedGroupId={selectedToolGroupId}
                  onSelectGroup={setSelectedToolGroupId}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {externalTools.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <p className="text-muted-foreground">No external tools configured</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add n8n workflows, Zapier webhooks, or custom API integrations
                      </p>
                    </div>
                  ) : (
                    externalTools.map((tool: any) => (
                      <Card key={tool.id} className={`p-6 hover:border-primary/50 transition-colors ${!tool.enabled ? "opacity-50" : ""}`}>
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-2">
                             <div className="flex-1">
                               <div className="flex items-center gap-2 mb-2">
                                 {tool.group_id && (
                                   <div
                                     className="h-2 w-2 rounded-full flex-shrink-0"
                                     style={{
                                       backgroundColor: `hsl(${
                                         toolGroups?.find((g: any) => g.id === tool.group_id)?.color || "221 83% 53%"
                                       })`,
                                     }}
                                   />
                                 )}
                                 <Badge variant="outline" className="text-xs">
                                   {tool.type}
                                 </Badge>
                                 {!tool.enabled && <Badge variant="secondary">Disabled</Badge>}
                               </div>
                               <h3 className="font-semibold mb-1">{tool.name}</h3>
                              <p className="text-sm text-muted-foreground mb-2">{tool.description}</p>
                              {tool.config?.webhookUrl && (
                                <p className="text-xs text-muted-foreground truncate" title={tool.config.webhookUrl}>
                                  {tool.config.webhookUrl}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleToolEdit(tool)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setDeleteToolId(tool.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {tool.enabled ? "Enabled" : "Disabled"}
                            </span>
                            <Switch
                              checked={tool.enabled}
                              onCheckedChange={(checked) =>
                                toggleToolMutation.mutate({ id: tool.id, enabled: checked })
                              }
                            />
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Prompts Sub-tab (moved from standalone tab) */}
              <TabsContent value="prompts" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search templates..."
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Template
                  </Button>
                </div>

                <ContentGroupManager
                  projectId={null}
                  contentType="prompt"
                  groups={promptGroups || []}
                  selectedGroupId={selectedPromptGroupId}
                  onSelectGroup={setSelectedPromptGroupId}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates?.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <p className="text-muted-foreground">No templates found</p>
                    </div>
                  ) : (
                    filteredTemplates?.map((template) => (
                      <Card key={template.id} className={`p-4 hover:border-primary/50 transition-colors group relative ${!template.enabled ? "opacity-50" : ""}`}>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setEditTemplate(template)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setDeleteTemplateId(template.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mb-2 pr-16">
                          <h3 className="font-semibold text-foreground">{template.name}</h3>
                          {!template.enabled && <Badge variant="secondary">Disabled</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                          {template.content}
                        </p>
                        {template.tags && template.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {template.tags.map((tag: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-muted-foreground">
                            {template.enabled !== false ? "Enabled" : "Disabled"}
                          </span>
                          <Switch
                            checked={template.enabled !== false}
                            onCheckedChange={(checked) =>
                              toggleTemplateMutation.mutate({ id: template.id, enabled: checked })
                            }
                          />
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Swipe Files Tab */}
          <TabsContent value="swipe-files" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={swipeFileSearchTerm}
                  onChange={(e) => setSwipeFileSearchTerm(e.target.value)}
                  placeholder="Search swipe files..."
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex border border-border rounded-md">
                  <Button
                    variant={swipeViewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setSwipeViewMode("grid")}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={swipeViewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setSwipeViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setBulkSwipeUploadOpen(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Upload
                </Button>
                <Button onClick={() => { setEditingSwipeFile(null); setSwipeFileDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Swipe File
                </Button>
              </div>
            </div>

            <ContentGroupManager
              projectId={null}
              contentType="swipe"
              groups={swipeGroups || []}
              selectedGroupId={selectedSwipeGroupId}
              onSelectGroup={setSelectedSwipeGroupId}
            />

            {swipeViewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredSwipeFiles.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No swipe files saved yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Save competitor ads and creative inspiration
                    </p>
                  </div>
                ) : (
                  filteredSwipeFiles.map((file: any) => {
                  const fileType = file.type || 'image';
                  const TypeIcon = SWIPE_FILE_TYPES.find(t => t.id === fileType)?.icon || Image;
                  
                  return (
                    <Card key={file.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                      {/* Type-specific preview */}
                      {fileType === 'image' && file.image_url && (
                        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                          <img
                            src={file.image_url}
                            alt={file.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setPreviewFile(file);
                                setPreviewDialogOpen(true);
                              }}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleSwipeFileEdit(file)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setDeleteSwipeFileId(file.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      {fileType === 'text' && (
                        <div className="relative aspect-[4/3] bg-muted overflow-hidden p-4 flex items-center justify-center">
                          <FileText className="w-12 h-12 text-muted-foreground absolute" />
                          <p className="text-sm text-foreground line-clamp-6 relative z-10">
                            {file.text_content}
                          </p>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setPreviewFile(file);
                                setPreviewDialogOpen(true);
                              }}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleSwipeFileEdit(file)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setDeleteSwipeFileId(file.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      {(fileType === 'pdf' || fileType === 'document') && (
                        <div className="relative aspect-[4/3] bg-muted overflow-hidden p-4">
                          {file.text_content ? (
                            <div className="relative h-full flex flex-col">
                              <File className="w-12 h-12 text-muted-foreground mb-2" />
                              <p className="text-xs text-foreground line-clamp-6 overflow-hidden">
                                {file.text_content}
                              </p>
                              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-muted to-transparent" />
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <File className="w-16 h-16 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setPreviewFile(file);
                                setPreviewDialogOpen(true);
                              }}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleSwipeFileEdit(file)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setDeleteSwipeFileId(file.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      {fileType === 'video' && (
                        <div className="relative aspect-[4/3] bg-muted overflow-hidden flex items-center justify-center">
                          {file.video_url ? (
                            <iframe
                              src={file.video_url}
                              className="w-full h-full"
                              allowFullScreen
                            />
                          ) : (
                            <Video className="w-16 h-16 text-muted-foreground" />
                          )}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setPreviewFile(file);
                                setPreviewDialogOpen(true);
                              }}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleSwipeFileEdit(file)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setDeleteSwipeFileId(file.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      {fileType === 'link' && (
                        <div className="relative aspect-[4/3] bg-muted overflow-hidden flex items-center justify-center">
                          <LinkIcon className="w-16 h-16 text-muted-foreground" />
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setPreviewFile(file);
                                setPreviewDialogOpen(true);
                              }}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleSwipeFileEdit(file)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setDeleteSwipeFileId(file.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                       <CardContent className="p-4">
                         <div className="flex items-center gap-2 mb-2">
                           {file.group_id && (
                             <div
                               className="h-2 w-2 rounded-full flex-shrink-0"
                               style={{
                                 backgroundColor: `hsl(${
                                   swipeGroups?.find((g: any) => g.id === file.group_id)?.color || "221 83% 53%"
                                 })`,
                               }}
                             />
                           )}
                           <Badge variant="outline" className="text-xs">
                             <TypeIcon className="w-3 h-3 mr-1" />
                             {SWIPE_FILE_TYPES.find(t => t.id === fileType)?.name}
                           </Badge>
                         </div>
                         <h3 className="font-semibold mb-1 line-clamp-1">{file.title}</h3>
                        {file.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {file.description}
                          </p>
                        )}
                        {file.source_url && (
                          <a
                            href={file.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1 mb-2"
                          >
                            <LinkIcon className="w-3 h-3" />
                            View source
                          </a>
                         )}
                         {file.tags && file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {file.tags.slice(0, 3).map((tag: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {file.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{file.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
            ) : (
              <div className="space-y-2">
                {filteredSwipeFiles.length === 0 ? (
                  <div className="text-center py-12">
                    <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No swipe files saved yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Save competitor ads and creative inspiration
                    </p>
                  </div>
                ) : (
                  filteredSwipeFiles.map((file: any) => {
                    const fileType = file.type || 'image';
                    const TypeIcon = SWIPE_FILE_TYPES.find(t => t.id === fileType)?.icon || Image;
                    const groupColor = swipeGroups?.find((g: any) => g.id === file.group_id)?.color;
                    
                    return (
                      <div key={file.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 group">
                        {/* Mini thumbnail */}
                        <div className="w-12 h-12 rounded bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {fileType === 'image' && file.image_url ? (
                            <img src={file.image_url} alt={file.title} className="w-full h-full object-cover" />
                          ) : fileType === 'video' && file.video_url ? (
                            <Video className="w-6 h-6 text-muted-foreground" />
                          ) : (
                            <TypeIcon className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {file.group_id && groupColor && (
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: `hsl(${groupColor})` }} />
                            )}
                            <Badge variant="outline" className="text-xs">
                              <TypeIcon className="w-3 h-3 mr-1" />
                              {SWIPE_FILE_TYPES.find(t => t.id === fileType)?.name}
                            </Badge>
                            <span className="font-semibold truncate">{file.title}</span>
                          </div>
                          {file.description && (
                            <p className="text-sm text-muted-foreground truncate">{file.description}</p>
                          )}
                          {/* Show text content preview for documents if no description */}
                          {!file.description && (fileType === 'document' || fileType === 'pdf') && file.text_content && (
                            <p className="text-sm text-muted-foreground truncate italic">{file.text_content.substring(0, 100)}...</p>
                          )}
                          {file.tags && file.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {file.tags.slice(0, 2).map((tag: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                              ))}
                              {file.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">+{file.tags.length - 2}</Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setPreviewFile(file);
                              setPreviewDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleSwipeFileEdit(file)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDeleteSwipeFileId(file.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </TabsContent>

          {/* Knowledge Bases Tab with subtabs */}
          <TabsContent value="knowledge" className="space-y-4">
            <Tabs value={knowledgeSubTab} onValueChange={setKnowledgeSubTab}>
              <TabsList>
                <TabsTrigger value="in-review">
                  <Eye className="w-4 h-4 mr-2" />
                  In-review
                </TabsTrigger>
                <TabsTrigger value="active">
                  <Check className="w-4 h-4 mr-2" />
                  Active
                </TabsTrigger>
                <TabsTrigger value="archived">
                  <Archive className="w-4 h-4 mr-2" />
                  Archived
                </TabsTrigger>
              </TabsList>

               <TabsContent value={knowledgeSubTab} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Knowledge Base</h3>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleReparseDocuments} 
                      variant="outline"
                      disabled={isReparsing}
                    >
                      {isReparsing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Re-parsing...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Re-parse Documents
                        </>
                      )}
                    </Button>
                    <Dialog open={knowledgeDialogOpen} onOpenChange={setKnowledgeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Knowledge
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{knowledgeFormData.id ? "Edit" : "Add"} Knowledge Entry</DialogTitle>
                    <DialogDescription>
                      Store important information, insights, and documentation
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {!knowledgeFormData.id && (
                      <div className="border-2 border-dashed border-border rounded-lg p-6">
                        <div className="flex flex-col items-center gap-4">
                          <FileText className="h-12 w-12 text-muted-foreground" />
                          <div className="text-center space-y-2">
                            <h4 className="font-medium">Upload Document (optional)</h4>
                            <p className="text-sm text-muted-foreground">
                              Upload a PDF or text file to auto-extract content
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept=".pdf,.txt,.doc,.docx"
                              onChange={handleDocumentUpload}
                              className="max-w-xs"
                            />
                            {uploadedDocument && (
                              <Button
                                onClick={handleParseDocument}
                                disabled={isParsing}
                                size="sm"
                              >
                                {isParsing ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Parsing...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Parse with AI
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                          {uploadedDocument && (
                            <p className="text-sm text-muted-foreground">
                              Selected: {uploadedDocument.name}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    <div>
                      <Label>Title *</Label>
                      <Input
                        value={knowledgeFormData.title}
                        onChange={(e) =>
                          setKnowledgeFormData({ ...knowledgeFormData, title: e.target.value })
                        }
                        placeholder="e.g., Brand Guidelines"
                      />
                    </div>

                    <div>
                      <Label>Content *</Label>
                      <Textarea
                        value={knowledgeFormData.content}
                        onChange={(e) =>
                          setKnowledgeFormData({ ...knowledgeFormData, content: e.target.value })
                        }
                        placeholder="Enter detailed information..."
                        className="min-h-[200px]"
                      />
                    </div>

                    <div>
                      <Label>Source URL (Optional)</Label>
                      <Input
                        value={knowledgeFormData.source_url}
                        onChange={(e) =>
                          setKnowledgeFormData({ ...knowledgeFormData, source_url: e.target.value })
                        }
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <Label>Group (Optional)</Label>
                      <Select
                        value={knowledgeFormData.group_id || "none"}
                        onValueChange={(value) =>
                          setKnowledgeFormData({
                            ...knowledgeFormData,
                            group_id: value === "none" ? null : value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No group</SelectItem>
                          {knowledgeGroups?.map((group: any) => (
                            <SelectItem key={group.id} value={group.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: `hsl(${group.color || "221 83% 53%"})` }}
                                />
                                {group.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Tags (comma-separated)</Label>
                      <Input
                        value={knowledgeFormData.tags.join(", ")}
                        onChange={(e) =>
                          setKnowledgeFormData({
                            ...knowledgeFormData,
                            tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                          })
                        }
                        placeholder="branding, guidelines, reference"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setKnowledgeDialogOpen(false);
                        setKnowledgeFormData({ id: "", title: "", content: "", source_url: "", tags: [], enabled: true, group_id: null });
                        setUploadedDocument(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleKnowledgeSave}>
                      {knowledgeFormData.id ? "Update" : "Add to In-review"}
                    </Button>
                  </div>
                    </DialogContent>
                  </Dialog>
                  </div>
                </div>

            <ContentGroupManager
              projectId={null}
              contentType="knowledge"
              groups={knowledgeGroups || []}
              selectedGroupId={selectedKnowledgeGroupId}
              onSelectGroup={setSelectedKnowledgeGroupId}
            />

            <div className="space-y-4 mt-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={knowledgeSearchTerm}
                  onChange={(e) => setKnowledgeSearchTerm(e.target.value)}
                  placeholder="Search knowledge..."
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredKnowledge.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No knowledge entries found</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedKnowledgeStatus === 'in_review' && 'Upload documents or add entries to start your review queue'}
                        {selectedKnowledgeStatus === 'active' && 'Add documentation, insights, and important information'}
                        {selectedKnowledgeStatus === 'archived' && 'Archived entries will appear here'}
                      </p>
                    </div>
                  ) : (
                    filteredKnowledge.map((entry: any) => (
                      <Card key={entry.id} className={`hover:border-primary/50 transition-colors ${!entry.enabled ? "opacity-50" : ""}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {entry.group_id && (
                                  <div
                                    className="h-2 w-2 rounded-full flex-shrink-0"
                                    style={{
                                      backgroundColor: `hsl(${
                                        knowledgeGroups?.find((g: any) => g.id === entry.group_id)?.color || "221 83% 53%"
                                      })`,
                                    }}
                                  />
                                )}
                                <CardTitle className="text-lg">{entry.title}</CardTitle>
                                {!entry.enabled && <Badge variant="secondary">Disabled</Badge>}
                              </div>
                              {entry.source_url && (
                                <a
                                  href={entry.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                  <LinkIcon className="w-3 h-3" />
                                  Source
                                </a>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {selectedKnowledgeStatus === 'in_review' && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleApproveKnowledge(entry)}
                                  disabled={isApproving === entry.id}
                                >
                                  {isApproving === entry.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                      Approving...
                                    </>
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4 mr-1" />
                                      Approve
                                    </>
                                  )}
                                </Button>
                              )}
                              {selectedKnowledgeStatus === 'active' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setArchiveDialogEntry(entry)}
                                  className="text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                                >
                                  <Archive className="h-4 w-4 mr-1" />
                                  Archive
                                </Button>
                              )}
                              {selectedKnowledgeStatus === 'archived' && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => updateKnowledgeStatusMutation.mutate({ id: entry.id, status: 'active' })}
                                >
                                  <ArrowLeft className="h-4 w-4 mr-1" />
                                  Restore
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setPreviewFile(entry);
                                  setPreviewDialogOpen(true);
                                }}
                                title="Preview content"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => autoTagContent(entry.id, entry.content || '', entry.title, 'knowledge')}
                                disabled={isAutoTagging === entry.id}
                                title="Auto-generate tags with AI"
                              >
                                <Wand2 className={cn("w-3 h-3", isAutoTagging === entry.id && "animate-spin")} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleKnowledgeEdit(entry)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setDeleteKnowledgeId(entry.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4 mb-3">
                            {entry.content}
                          </p>
                          {entry.tags && entry.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {entry.tags.map((tag: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <Separator className="my-3" />
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {entry.enabled ? "Enabled" : "Disabled"}
                            </span>
                            <Switch
                              checked={entry.enabled !== false}
                              onCheckedChange={(checked) =>
                                toggleKnowledgeMutation.mutate({ id: entry.id, enabled: checked })
                              }
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Integrations Tab with nested sub-tabs INCLUDING Data & Storage */}
          <TabsContent value="integrations" className="space-y-4">
            <Tabs value={integrationsSubTab} onValueChange={setIntegrationsSubTab}>
              <ScrollArea className="w-full">
                <TabsList className="inline-flex w-max">
                  <TabsTrigger value="networks">
                    <Network className="w-4 h-4 mr-2" />
                    Networks
                  </TabsTrigger>
                  <TabsTrigger value="crm">
                    <UserCircle className="w-4 h-4 mr-2" />
                    CRM
                  </TabsTrigger>
                  <TabsTrigger value="video-creation">
                    <Video className="w-4 h-4 mr-2" />
                    Video Creation
                  </TabsTrigger>
                  <TabsTrigger value="llms">
                    <Brain className="w-4 h-4 mr-2" />
                    LLMs
                  </TabsTrigger>
                  <TabsTrigger value="analytics">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger value="automation">
                    <Layers className="w-4 h-4 mr-2" />
                    Automation
                  </TabsTrigger>
                  <TabsTrigger value="data-storage">
                    <Database className="w-4 h-4 mr-2" />
                    Data & Storage
                  </TabsTrigger>
                </TabsList>
              </ScrollArea>

              {/* Networks Sub-tab */}
              <TabsContent value="networks" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {PREDEFINED_PLATFORMS.network.map((platform) => {
                    const existingIntegration = integrationsData?.find(
                      (i) => i.platform === platform.id && i.category === "network"
                    );
                    const IconComponent = platform.icon;
                    
                    return (
                      <Card key={platform.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-5 w-5" />
                              <CardTitle className="text-lg">{platform.name}</CardTitle>
                            </div>
                            <Badge variant={existingIntegration?.is_connected ? "default" : "secondary"}>
                              {existingIntegration?.is_connected ? "Connected" : "Not Connected"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">{platform.description}</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (existingIntegration) {
                                  handleIntegrationEdit(existingIntegration);
                                } else {
                                  handlePlatformConfigure(platform, "network");
                                }
                              }}
                            >
                              {existingIntegration ? "Edit" : "Configure"}
                            </Button>
                            {existingIntegration?.is_connected && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  deleteIntegrationMutation.mutate(existingIntegration.id);
                                }}
                              >
                                Disconnect
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* CRM Sub-tab */}
              <TabsContent value="crm" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {PREDEFINED_PLATFORMS.crm.map((platform) => {
                    const existingIntegration = integrationsData?.find(
                      (i) => i.platform === platform.id && i.category === "crm"
                    );
                    const IconComponent = platform.icon;
                    
                    return (
                      <Card key={platform.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-5 w-5" />
                              <CardTitle className="text-lg">{platform.name}</CardTitle>
                            </div>
                            <Badge variant={existingIntegration?.is_connected ? "default" : "secondary"}>
                              {existingIntegration?.is_connected ? "Connected" : "Not Connected"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">{platform.description}</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (existingIntegration) {
                                  handleIntegrationEdit(existingIntegration);
                                } else {
                                  handlePlatformConfigure(platform, "crm");
                                }
                              }}
                            >
                              {existingIntegration ? "Edit" : "Configure"}
                            </Button>
                            {existingIntegration?.is_connected && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  deleteIntegrationMutation.mutate(existingIntegration.id);
                                }}
                              >
                                Disconnect
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Video Creation Sub-tab */}
              <TabsContent value="video-creation" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {PREDEFINED_PLATFORMS.video_creation.map((platform) => {
                    const existingIntegration = integrationsData?.find(
                      (i) => i.platform === platform.id && i.category === "video_creation"
                    );
                    const IconComponent = platform.icon;
                    
                    return (
                      <Card key={platform.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-5 w-5" />
                              <CardTitle className="text-lg">{platform.name}</CardTitle>
                            </div>
                            <Badge variant={existingIntegration?.is_connected ? "default" : "secondary"}>
                              {existingIntegration?.is_connected ? "Connected" : "Not Connected"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">{platform.description}</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (existingIntegration) {
                                  handleIntegrationEdit(existingIntegration);
                                } else {
                                  handlePlatformConfigure(platform, "video_creation");
                                }
                              }}
                            >
                              {existingIntegration ? "Edit" : "Configure"}
                            </Button>
                            {existingIntegration?.is_connected && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  deleteIntegrationMutation.mutate(existingIntegration.id);
                                }}
                              >
                                Disconnect
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* LLMs Sub-tab (includes Image Generation) */}
              <TabsContent value="llms" className="space-y-6">
                {/* Text LLMs Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Text & Chat Models</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {PREDEFINED_PLATFORMS.llm.map((platform) => {
                      const existingIntegration = integrationsData?.find(
                        (i) => i.platform === platform.id && i.category === "llm"
                      );
                      const IconComponent = platform.icon;
                      const settingsKey = (platform as any).settingsKey;
                      const isConnectedViaSettings = settingsKey && appSettings?.[settingsKey];
                      const isConnected = isConnectedViaSettings || existingIntegration?.is_connected;
                      
                      return (
                        <Card key={platform.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-5 w-5" />
                                <CardTitle className="text-lg">{platform.name}</CardTitle>
                              </div>
                              <Badge variant={isConnected ? "default" : "secondary"}>
                                {isConnected ? "Connected" : "Not Connected"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">{platform.description}</p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (existingIntegration) {
                                    handleIntegrationEdit(existingIntegration);
                                  } else {
                                    handlePlatformConfigure(platform, "llm");
                                  }
                                }}
                              >
                                {isConnected ? "Edit" : "Configure"}
                              </Button>
                              {isConnected && existingIntegration && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    deleteIntegrationMutation.mutate(existingIntegration.id);
                                  }}
                                >
                                  Disconnect
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Image Generation Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Image Generation Models</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {PREDEFINED_PLATFORMS.image_generation.map((platform) => {
                      const IconComponent = platform.icon;
                      const settingsKey = (platform as any).settingsKey;
                      const isConnected = settingsKey && appSettings?.[settingsKey];
                      
                      return (
                        <Card key={platform.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-5 w-5" />
                                <CardTitle className="text-lg">{platform.name}</CardTitle>
                              </div>
                              <Badge variant={isConnected ? "default" : "secondary"}>
                                {isConnected ? "Connected" : "Not Connected"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">{platform.description}</p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate('/brand-settings')}
                            >
                              {isConnected ? "Edit" : "Configure"}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              {/* Analytics Sub-tab */}
              <TabsContent value="analytics" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {PREDEFINED_PLATFORMS.analytics.map((platform) => {
                    const IconComponent = platform.icon;
                    const settingsKey = (platform as any).settingsKey;
                    const isConnected = settingsKey && appSettings?.[settingsKey];
                    
                    return (
                      <Card key={platform.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-5 w-5" />
                              <CardTitle className="text-lg">{platform.name}</CardTitle>
                            </div>
                            <Badge variant={isConnected ? "default" : "secondary"}>
                              {isConnected ? "Connected" : "Not Connected"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">{platform.description}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate('/brand-settings')}
                          >
                            {isConnected ? "Edit" : "Configure"}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Automation Sub-tab */}
              <TabsContent value="automation" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {PREDEFINED_PLATFORMS.automation.map((platform) => {
                    const IconComponent = platform.icon;
                    const settingsKey = (platform as any).settingsKey;
                    const isConnected = settingsKey && appSettings?.[settingsKey];
                    
                    return (
                      <Card key={platform.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-5 w-5" />
                              <CardTitle className="text-lg">{platform.name}</CardTitle>
                            </div>
                            <Badge variant={isConnected ? "default" : "secondary"}>
                              {isConnected ? "Connected" : "Not Connected"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">{platform.description}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate('/brand-settings')}
                          >
                            {isConnected ? "Edit" : "Configure"}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* NEW Data & Storage Sub-tab */}
              <TabsContent value="data-storage" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {PREDEFINED_PLATFORMS.data_storage.map((platform) => {
                    const existingIntegration = integrationsData?.find(
                      (i) => i.platform === platform.id && i.category === "data_storage"
                    );
                    const IconComponent = platform.icon;
                    
                    return (
                      <Card key={platform.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-5 w-5" />
                              <CardTitle className="text-lg">{platform.name}</CardTitle>
                            </div>
                            <Badge variant={existingIntegration?.is_connected ? "default" : "secondary"}>
                              {existingIntegration?.is_connected ? "Connected" : "Not Connected"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">{platform.description}</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (existingIntegration) {
                                  handleIntegrationEdit(existingIntegration);
                                } else {
                                  handlePlatformConfigure(platform, "data_storage");
                                }
                              }}
                            >
                              {existingIntegration ? "Edit" : "Configure"}
                            </Button>
                            {existingIntegration?.is_connected && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  deleteIntegrationMutation.mutate(existingIntegration.id);
                                }}
                              >
                                Disconnect
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

      {/* Add Template Dialog */}
      <AddTemplateDialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) setEditTemplate(null);
        }}
        editTemplate={editTemplate}
        groups={promptGroups || []}
      />

      {/* Delete Template AlertDialog */}
      <AlertDialog open={!!deleteTemplateId} onOpenChange={() => setDeleteTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this template. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTemplateId && deleteTemplateMutation.mutate(deleteTemplateId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Asset Dialog */}
      <AddAssetDialog
        open={addAssetDialogOpen}
        onOpenChange={(open) => {
          setAddAssetDialogOpen(open);
          if (!open) setEditAsset(null);
        }}
        editAsset={editAsset}
      />

      {/* Delete Asset AlertDialog */}
      <AlertDialog open={!!deleteAssetId} onOpenChange={() => setDeleteAssetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this asset. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAssetId && deleteAssetMutation.mutate(deleteAssetId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Knowledge AlertDialog */}
      <AlertDialog open={!!deleteKnowledgeId} onOpenChange={() => setDeleteKnowledgeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Knowledge Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this knowledge entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteKnowledgeId && deleteKnowledgeMutation.mutate(deleteKnowledgeId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Research AlertDialog */}
      <AlertDialog open={!!deleteResearchId} onOpenChange={() => setDeleteResearchId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Research?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this research entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteResearchId && deleteResearchMutation.mutate(deleteResearchId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Tool AlertDialog */}
      <AlertDialog open={!!deleteToolId} onOpenChange={() => setDeleteToolId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tool?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this tool. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteToolId && deleteToolMutation.mutate(deleteToolId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Integration Configuration Dialog */}
      <Dialog open={isIntegrationDialogOpen} onOpenChange={setIsIntegrationDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingIntegration ? "Edit" : "Configure"} Integration
            </DialogTitle>
            <DialogDescription>
              {newIntegration
                ? `Configure ${newIntegration.name} integration`
                : "Set up your integration credentials and settings"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={integrationFormData.name}
                onChange={(e) =>
                  setIntegrationFormData({ ...integrationFormData, name: e.target.value })
                }
                placeholder="Integration name"
              />
            </div>

            {configuringPlatform?.configFields ? (
              <div className="space-y-4">
                <Label>Configuration</Label>
                {configuringPlatform.configFields.map((field: string) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field}>
                      {field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </Label>
                    <Input
                      id={field}
                      type={field.includes('key') || field.includes('secret') || field.includes('token') ? 'password' : 'text'}
                      value={configFieldValues[field] || ''}
                      onChange={(e) => setConfigFieldValues({...configFieldValues, [field]: e.target.value})}
                      placeholder={`Enter ${field.split('_').join(' ')}`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <Label>Configuration (JSON)</Label>
                <Textarea
                  value={integrationFormData.config}
                  onChange={(e) =>
                    setIntegrationFormData({ ...integrationFormData, config: e.target.value })
                  }
                  placeholder='{"api_key": "...", "account_id": "..."}'
                  className="min-h-[120px] font-mono text-sm"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                checked={integrationFormData.is_connected}
                onCheckedChange={(checked) =>
                  setIntegrationFormData({ ...integrationFormData, is_connected: checked })
                }
              />
              <Label>Mark as connected</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsIntegrationDialogOpen(false);
                setEditingIntegration(null);
                setNewIntegration(null);
                setConfiguringPlatform(null);
                setConfigFieldValues({});
                setIntegrationFormData({ category: "network", platform: "", name: "", config: "{}", is_connected: false });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleIntegrationSave}>
              {editingIntegration ? "Update" : "Save"} Integration
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Knowledge Entry AlertDialog */}
      <AlertDialog open={!!archiveDialogEntry} onOpenChange={() => setArchiveDialogEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Knowledge Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move "{archiveDialogEntry?.title}" to the archive. Archived entries won't be 
              included in AI context or search results. You can restore it later from the Archived tab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (archiveDialogEntry) {
                  updateKnowledgeStatusMutation.mutate({ id: archiveDialogEntry.id, status: 'archived' });
                  setArchiveDialogEntry(null);
                }
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add/Edit Swipe File Dialog */}
      <Dialog open={swipeFileDialogOpen} onOpenChange={setSwipeFileDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSwipeFile ? "Edit" : "Add"} Swipe File</DialogTitle>
            <DialogDescription>
              Save competitor ads, creative inspiration, or reference materials
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Type Selector */}
            <div>
              <Label>Content Type *</Label>
              <Select
                value={swipeFileFormData.type}
                onValueChange={(value) => setSwipeFileFormData({ ...swipeFileFormData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SWIPE_FILE_TYPES.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{type.name}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Type-specific fields */}
            {swipeFileFormData.type === 'image' && (
              <div>
                <Label>Image *</Label>
                {swipeFileFormData.image_url ? (
                  <div className="relative mt-2">
                    <img
                      src={swipeFileFormData.image_url}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setSwipeFileFormData(prev => ({ ...prev, image_url: "" }))}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="mt-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleSwipeImageUpload}
                      disabled={uploadingSwipeImage}
                    />
                    {uploadingSwipeImage && (
                      <div className="flex items-center gap-2 mt-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {swipeFileFormData.type === 'text' && (
              <div>
                <Label>Text Content *</Label>
                <Textarea
                  value={swipeFileFormData.text_content}
                  onChange={(e) => setSwipeFileFormData({ ...swipeFileFormData, text_content: e.target.value })}
                  placeholder="Paste your ad copy, hooks, scripts, or notes here..."
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
            )}

            {swipeFileFormData.type === 'pdf' && (
              <div>
                <Label>PDF Document *</Label>
                {swipeFileFormData.file_url ? (
                  <div className="mt-2 p-4 border rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <File className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm">PDF uploaded</span>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setSwipeFileFormData(prev => ({ ...prev, file_url: "" }))}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="mt-2">
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={handleSwipeFileUpload}
                      disabled={uploadingSwipeFile}
                    />
                    {uploadingSwipeFile && (
                      <div className="flex items-center gap-2 mt-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {swipeFileFormData.type === 'video' && (
              <div className="space-y-3">
                <div>
                  <Label>Video URL (YouTube, Vimeo embed)</Label>
                  <Input
                    value={swipeFileFormData.video_url}
                    onChange={(e) => setSwipeFileFormData({ ...swipeFileFormData, video_url: e.target.value })}
                    placeholder="https://www.youtube.com/embed/..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">OR</span>
                  <Separator className="flex-1" />
                </div>
                <div>
                  <Label>Upload Video File</Label>
                  {swipeFileFormData.file_url ? (
                    <div className="mt-2 p-4 border rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm">Video uploaded</span>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setSwipeFileFormData(prev => ({ ...prev, file_url: "" }))}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={handleSwipeFileUpload}
                        disabled={uploadingSwipeFile}
                      />
                      {uploadingSwipeFile && (
                        <div className="flex items-center gap-2 mt-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <p className="text-sm text-muted-foreground">Uploading...</p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">Max 100MB</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {swipeFileFormData.type === 'link' && (
              <div>
                <Label>URL *</Label>
                <Input
                  value={swipeFileFormData.source_url}
                  onChange={(e) => setSwipeFileFormData({ ...swipeFileFormData, source_url: e.target.value })}
                  placeholder="https://example.com/landing-page"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Save reference to websites, landing pages, articles, or any URL
                </p>
              </div>
            )}

            {/* Common fields for all types */}
            <div>
              <Label>Title *</Label>
              <Input
                value={swipeFileFormData.title}
                onChange={(e) => setSwipeFileFormData({ ...swipeFileFormData, title: e.target.value })}
                placeholder="e.g., Nike Ad - Summer Campaign 2024"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={swipeFileFormData.description}
                onChange={(e) => setSwipeFileFormData({ ...swipeFileFormData, description: e.target.value })}
                placeholder="What makes this effective? Key takeaways..."
                className="min-h-[100px]"
              />
            </div>

            {swipeFileFormData.type !== 'link' && (
              <div>
                <Label>Source URL (optional)</Label>
                <Input
                  value={swipeFileFormData.source_url}
                  onChange={(e) => setSwipeFileFormData({ ...swipeFileFormData, source_url: e.target.value })}
                  placeholder="https://facebook.com/ads/..."
                />
              </div>
            )}

            <div>
              <Label>Tags (comma-separated)</Label>
              <Input
                value={swipeFileFormData.tags.join(", ")}
                onChange={(e) =>
                  setSwipeFileFormData({
                    ...swipeFileFormData,
                    tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                  })
                }
                placeholder="facebook, video, ecommerce"
              />
            </div>

            <div>
              <Label>Group (Optional)</Label>
              <Select
                value={swipeFileFormData.group_id || "none"}
                onValueChange={(value) => 
                  setSwipeFileFormData(prev => ({ ...prev, group_id: value === "none" ? null : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No group</SelectItem>
                  {swipeGroups?.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSwipeFileDialogOpen(false);
                setSwipeFileFormData({ 
                  id: "", 
                  type: "image", 
                  title: "", 
                  description: "", 
                  image_url: "", 
                  source_url: "", 
                  text_content: "", 
                  file_url: "", 
                  video_url: "", 
                  tags: [],
                  group_id: null,
                });
                setEditingSwipeFile(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSwipeFileSave}>
              {editingSwipeFile ? "Update" : "Save"} Swipe File
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={bulkSwipeUploadOpen} onOpenChange={setBulkSwipeUploadOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Upload Swipe Files</DialogTitle>
            <DialogDescription>
              Upload multiple images, videos, or PDFs at once
            </DialogDescription>
          </DialogHeader>
          
          {/* Group selector */}
          <div className="space-y-2">
            <Label>Upload to Group</Label>
            <Select 
              value={bulkSwipeUploadGroupId || "ungrouped"} 
              onValueChange={(v) => setBulkSwipeUploadGroupId(v === "ungrouped" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ungrouped">No Group</SelectItem>
                {swipeGroups?.map((group: any) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <BulkSwipeUploader
            projectId={selectedProjectId || null}
            groupId={bulkSwipeUploadGroupId}
            onComplete={() => {
              queryClient.invalidateQueries({ queryKey: ["swipe-files"] });
              setBulkSwipeUploadOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Swipe File AlertDialog */}
      <AlertDialog open={!!deleteSwipeFileId} onOpenChange={() => setDeleteSwipeFileId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Swipe File?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this swipe file. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSwipeFileId && deleteSwipeFileMutation.mutate(deleteSwipeFileId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewFile?.title}</DialogTitle>
            {previewFile?.description && (
              <DialogDescription>{previewFile.description}</DialogDescription>
            )}
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            {/* Swipe file image preview */}
            {previewFile?.type === 'image' && previewFile?.image_url && (
              <img
                src={previewFile.image_url}
                alt={previewFile.title}
                className="max-w-full max-h-[70vh] object-contain mx-auto"
              />
            )}
            
            {/* Swipe file text preview */}
            {previewFile?.type === 'text' && previewFile?.text_content && (
              <ScrollArea className="h-[60vh]">
                <p className="whitespace-pre-wrap font-mono text-sm">{previewFile.text_content}</p>
              </ScrollArea>
            )}
            
            {/* Swipe file PDF preview */}
            {(previewFile?.type === 'pdf' || previewFile?.type === 'document') && previewFile?.file_url && (
              <div className="space-y-4">
                {/* Show extracted text if available */}
                {previewFile?.text_content && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Extracted Text Content</h4>
                    <ScrollArea className="h-[50vh] border rounded-lg p-4 bg-muted/20">
                      <p className="whitespace-pre-wrap text-sm">{previewFile.text_content}</p>
                    </ScrollArea>
                  </div>
                )}
                {/* Show document file iframe if PDF */}
                {previewFile?.type === 'pdf' && (
                  <div className={previewFile?.text_content ? "h-[50vh]" : "h-[70vh]"}>
                    <h4 className="text-sm font-semibold mb-2">Document Preview</h4>
                    <iframe
                      src={previewFile.file_url}
                      className="w-full h-full border-0 rounded-lg"
                      title="PDF Preview"
                    />
                  </div>
                )}
                {/* Show download link for Word documents */}
                {previewFile?.type === 'document' && (
                  <Button
                    variant="default"
                    onClick={() => window.open(previewFile.file_url, '_blank')}
                    className="w-full"
                  >
                    Download Document
                  </Button>
                )}
              </div>
            )}
            
            {/* Swipe file video preview */}
            {previewFile?.type === 'video' && (
              <div className="h-[70vh] flex items-center justify-center bg-muted">
                {previewFile?.video_url ? (
                  <iframe
                    src={previewFile.video_url}
                    className="w-full h-full"
                    allowFullScreen
                    title="Video Preview"
                  />
                ) : previewFile?.file_url ? (
                  <video
                    src={previewFile.file_url}
                    controls
                    className="max-w-full max-h-full"
                  />
                ) : (
                  <p className="text-muted-foreground">No video source available</p>
                )}
              </div>
            )}
            
            {/* Swipe file link preview */}
            {previewFile?.type === 'link' && previewFile?.source_url && (
              <div className="space-y-4 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <LinkIcon className="w-4 h-4" />
                  <a
                    href={previewFile.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    {previewFile.source_url}
                  </a>
                </div>
                {previewFile.description && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{previewFile.description}</p>
                  </div>
                )}
                <Button
                  variant="default"
                  onClick={() => window.open(previewFile.source_url, '_blank')}
                  className="w-full"
                >
                  Open in New Tab
                </Button>
              </div>
            )}
            
            {/* Knowledge entry preview */}
            {previewFile?.content && !previewFile?.type && (
              <ScrollArea className="h-[60vh]">
                <div className="space-y-4">
                  <p className="whitespace-pre-wrap">{previewFile.content}</p>
                  {previewFile.source_url && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <LinkIcon className="w-4 h-4" />
                        <span>Source:</span>
                        <a
                          href={previewFile.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline break-all"
                        >
                          {previewFile.source_url}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
