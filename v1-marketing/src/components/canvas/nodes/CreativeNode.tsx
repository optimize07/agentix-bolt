import { memo, useState, useEffect } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { 
  Sparkles, 
  Image as ImageIcon,
  Type,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Film,
  Search,
  Pencil,
  RefreshCw,
  Check,
  X,
  Circle,
  Loader2,
  Trash2,
  ArrowRight,
  Copy
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreativeVariant {
  id: string;
  channel: 'google-ads' | 'tiktok-script' | 'facebook-ig' | 'carousel';
  headlines?: string[];
  descriptions?: string[];
  displayUrl?: string;
  hook?: string;
  body?: { scene: string; description: string; timestamp: string }[];
  cta?: string;
  images?: string[];
  primaryText?: string;
  headline?: string;
  ctaButton?: string;
  cards?: Array<{
    image?: string;
    headline?: string;
    primaryText?: string;
    ctaButton?: string;
  }>;
}

interface CreativeNodeData {
  title?: string;
  content?: string;
  variants?: CreativeVariant[];
  isExpanded?: boolean;
  detectedChannel?: string;
  selected?: boolean;
  isGroupChild?: boolean;
  parentGroupId?: string;
  onUnlinkFromGroup?: () => void;
  boardId?: string;
  onUpdateText?: (itemId: string, newText: string) => void;
}

interface CreativeNodeProps {
  id: string;
  data: CreativeNodeData;
  selected: boolean;
}

interface BlockItem {
  id: string;
  type: 'section' | 'scene' | 'paragraph' | 'hook' | 'cta';
  title?: string;
  content: string;
  timestamp?: string;
  index?: number;
}

// Channel-specific character limits and rules
const CHANNEL_RULES = {
  'google-ads': {
    headline: { max: 30, count: 15, label: 'Headlines' },
    description: { max: 90, count: 4, label: 'Descriptions' }
  },
  'facebook-ig': {
    primary: { max: 125, recommended: true, label: 'Primary Text (rec)' },
    headline: { max: 40, label: 'Headline' }
  },
  'tiktok-script': {
    hook: { max: 50, label: 'Hook (3s)' },
    cta: { max: 20, label: 'CTA' }
  }
} as const;

export const CreativeNode = memo(({ id, data, selected }: CreativeNodeProps) => {
  const [nodeDimensions, setNodeDimensions] = useState({ width: 700, height: 900 });
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [approvedItems, setApprovedItems] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [regeneratingItemId, setRegeneratingItemId] = useState<string | null>(null);
  const [contentEditorOpen, setContentEditorOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<TextItem | null>(null);
  const [editingContentText, setEditingContentText] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [customInstruction, setCustomInstruction] = useState("");

  // Reset all state when node id changes (component reuse protection)
  useEffect(() => {
    setSelectedItems(new Set());
    setApprovedItems(new Set());
    setActiveTab("all");
    setIsFullscreen(false);
    setEditingItemId(null);
    setEditingText("");
    setRegeneratingItemId(null);
    setContentEditorOpen(false);
    setEditingContent(null);
    setEditingContentText("");
    setAiSuggestions([]);
    setIsLoadingSuggestions(false);
    setCustomInstruction("");
  }, [id]);

  // Parse variants from content if available, or fall back to data.variants
  const variants = (() => {
    if (data.content) {
      try {
        const parsed = JSON.parse(data.content);
        if (parsed.variants && Array.isArray(parsed.variants)) {
          return parsed.variants;
        }
      } catch (e) {
        console.error("Failed to parse creative content:", e);
      }
    }
    
    // Fallback to data.variants or empty array
    return data.variants || [];
  })();

  // Collect ALL content from ALL variants
  interface TextItem {
    id: string;
    type: 'headline' | 'description' | 'primary' | 'hook' | 'cta';
    text: string;
  }

  const allImages: string[] = variants.flatMap(v => v.images || []);
  const allTextItems: TextItem[] = variants.flatMap((v, vIdx) => {
    const items: TextItem[] = [];
    
    // Headlines
    v.headlines?.forEach((h, i) => items.push({ 
      id: `${vIdx}-h-${i}`, 
      type: 'headline', 
      text: h 
    }));
    
    // Descriptions
    v.descriptions?.forEach((d, i) => items.push({ 
      id: `${vIdx}-d-${i}`, 
      type: 'description', 
      text: d 
    }));
    
    // Primary text
    if (v.primaryText) items.push({ 
      id: `${vIdx}-p`, 
      type: 'primary', 
      text: v.primaryText 
    });
    
    // Single headline
    if (v.headline) items.push({ 
      id: `${vIdx}-sh`, 
      type: 'headline', 
      text: v.headline 
    });
    
    // Hook
    if (v.hook) items.push({ 
      id: `${vIdx}-hook`, 
      type: 'hook', 
      text: v.hook 
    });
    
    // CTA
    if (v.cta) items.push({ 
      id: `${vIdx}-cta`, 
      type: 'cta', 
      text: v.cta 
    });
    
    return items;
  }).filter(Boolean);

  // Parse block-based content (video scripts, sales pages)
  const parseBlockContent = (variants: CreativeVariant[]): BlockItem[] => {
    const blocks: BlockItem[] = [];
    
    variants.forEach((variant, vIdx) => {
      // Video script scenes
      if (variant.body && Array.isArray(variant.body)) {
        variant.body.forEach((scene, i) => {
          blocks.push({
            id: `${vIdx}-scene-${i}`,
            type: 'scene',
            title: scene.scene,
            content: scene.description,
            timestamp: scene.timestamp,
            index: i + 1
          });
        });
      }
      
      // Sales page paragraphs (if primaryText is long)
      if (variant.primaryText && variant.primaryText.length > 300) {
        blocks.push({
          id: `${vIdx}-body`,
          type: 'paragraph',
          content: variant.primaryText
        });
      }
    });
    
    return blocks;
  };

  const allBlocks = parseBlockContent(variants);

  // Content format detection
  type ContentFormat = 'line' | 'card' | 'block';
  
  const getContentFormat = (text: string): ContentFormat => {
    const length = text?.length || 0;
    const lineCount = (text?.match(/\n/g) || []).length;
    
    if (length > 300 || lineCount > 3) return 'block';
    if (length > 100 || lineCount > 1) return 'card';
    return 'line';
  };

  // Character count component
  const CharacterCount = ({ text, max, recommended }: { text: string, max: number, recommended?: boolean }) => {
    const count = text?.length || 0;
    const color = count > max 
      ? 'text-destructive' 
      : count > max * 0.8 
        ? 'text-yellow-500' 
        : 'text-green-500';
    
    return (
      <span className={cn("text-[10px] font-medium", color)}>
        {count}/{max}{recommended && ' rec'}
      </span>
    );
  };

  // Toggle selection
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const selectAllInView = () => {
    const allIds = new Set([
      ...allTextItems.map(t => t.id),
      ...allImages.map((_, idx) => `img-${idx}`)
    ]);
    setSelectedItems(allIds);
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const toggleApproval = (itemId: string) => {
    setApprovedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const startEditing = (item: TextItem) => {
    setEditingItemId(item.id);
    setEditingText(item.text);
  };

  const saveEdit = (itemId: string) => {
    if (data.onUpdateText) {
      data.onUpdateText(itemId, editingText);
    }
    setEditingItemId(null);
    setEditingText("");
    toast.success("Text updated");
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditingText("");
  };

  const handleRegenerate = async (item: TextItem) => {
    setRegeneratingItemId(item.id);
    try {
      const { data: result, error } = await supabase.functions.invoke('generate-creative', {
        body: {
          type: item.type,
          context: data.title,
          currentText: item.text,
          action: 'regenerate'
        }
      });
      
      if (error) throw error;
      
      if (data.onUpdateText && result?.text) {
        data.onUpdateText(item.id, result.text);
      }
      toast.success("Text regenerated");
    } catch (error) {
      console.error('Regenerate error:', error);
      toast.error("Failed to regenerate");
    } finally {
      setRegeneratingItemId(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const [variantIdxStr, typeCode, itemIdxStr] = itemId.split('-');
    const variantIdx = parseInt(variantIdxStr);
    const itemIdx = parseInt(itemIdxStr);
    
    if (isNaN(variantIdx) || !variants[variantIdx]) return;
    
    const updatedVariants = [...variants];
    const variant = updatedVariants[variantIdx];
    
    // Remove the specific item based on type
    switch(typeCode) {
      case 'h':
        variant.headlines = variant.headlines?.filter((_, i) => i !== itemIdx);
        break;
      case 'd':
        variant.descriptions = variant.descriptions?.filter((_, i) => i !== itemIdx);
        break;
      case 'p':
        variant.primaryText = undefined;
        break;
      case 'hl':
        variant.headline = undefined;
        break;
      case 'c':
        variant.ctaButton = undefined;
        break;
    }
    
    // Update in database
    const { error } = await supabase
      .from("canvas_blocks")
      .update({ 
        content: JSON.stringify({ variants: updatedVariants }),
        updated_at: new Date().toISOString()
      })
      .eq("id", id);
    
    if (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
      return;
    }
    
    toast.success("Item deleted");
  };

  const handleDeleteImage = async (imageIdx: number) => {
    const updatedVariants = variants.map(v => ({
      ...v,
      images: v.images?.filter((_, i) => i !== imageIdx) || []
    }));
    
    const { error } = await supabase
      .from("canvas_blocks")
      .update({ 
        content: JSON.stringify({ variants: updatedVariants }),
        updated_at: new Date().toISOString()
      })
      .eq("id", id);
    
    if (error) {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete image");
      return;
    }
    
    toast.success("Image deleted");
  };

  const handleCopyItem = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleBulkPushAll = () => {
    selectAllInView();
    setTimeout(() => handleBatchPushToReview(), 100);
  };

  const openContentEditor = (item: TextItem) => {
    setEditingContent(item);
    setEditingContentText(item.text);
    setAiSuggestions([]);
    setCustomInstruction("");
    setContentEditorOpen(true);
  };

  const getAiSuggestions = async () => {
    if (!editingContent) return;
    
    setIsLoadingSuggestions(true);
    setAiSuggestions([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('improve-content', {
        body: {
          content: editingContentText,
          contentType: editingContent.type,
          instruction: customInstruction || undefined
        }
      });

      if (error) throw error;

      if (data.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('Rate limit reached. Please wait a moment.');
        } else if (data.error.includes('credits')) {
          toast.error('AI credits depleted. Please add credits.');
        } else {
          toast.error(data.error);
        }
        return;
      }

      if (data.variations && data.variations.length > 0) {
        setAiSuggestions(data.variations);
        toast.success(`Generated ${data.variations.length} suggestions`);
      } else {
        toast.error('No suggestions generated');
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      toast.error('Failed to get suggestions');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const applySuggestion = (suggestion: string) => {
    setEditingContentText(suggestion);
    toast.success('Suggestion applied');
  };

  const saveContentEdit = async () => {
    if (!editingContent) return;
    
    if (data.onUpdateText) {
      data.onUpdateText(editingContent.id, editingContentText);
    }
    
    setContentEditorOpen(false);
    toast.success("Content updated");
  };

  const handleBatchPushToReview = async () => {
    if (!data.boardId) {
      toast.error("Board ID not found");
      return;
    }

    // Group selected text by type
    const selectedHeadlines = allTextItems.filter(item => 
      selectedItems.has(item.id) && item.type === 'headline'
    );
    const selectedDescriptions = allTextItems.filter(item => 
      selectedItems.has(item.id) && item.type === 'description'
    );
    const selectedPrimary = allTextItems.filter(item => 
      selectedItems.has(item.id) && (item.type === 'primary' || item.type === 'hook' || item.type === 'cta')
    );
    const selectedImageUrls = allImages.filter((_, idx) => selectedItems.has(`img-${idx}`));

    if (selectedHeadlines.length === 0 && selectedDescriptions.length === 0 && 
        selectedPrimary.length === 0 && selectedImageUrls.length === 0) {
      toast.error("No items selected");
      return;
    }

    try {
      let inserts: Array<{
        agent_board_id: string;
        title: string;
        image_url?: string;
        headline?: string;
        description_text?: string;
        primary_text?: string;
        status: string;
        tags: string[];
      }> = [];

      if (selectedImageUrls.length > 0) {
        // Create one card per image with associated text
        inserts = selectedImageUrls.map((img, idx) => ({
          agent_board_id: data.boardId!,
          title: `${data.title || 'Creative'} - Image ${idx + 1}`,
          image_url: img,
          headline: selectedHeadlines[idx % selectedHeadlines.length]?.text || selectedHeadlines[0]?.text,
          description_text: selectedDescriptions.map(d => d.text).join('\n'),
          primary_text: selectedPrimary.map(p => p.text).join('\n\n'),
          status: "AI_DRAFT",
          tags: ['creative', 'image'],
        }));
      } else if (selectedHeadlines.length > 0 || selectedDescriptions.length > 0 || selectedPrimary.length > 0) {
        // Create individual cards for each headline, or one combined text card
        if (selectedHeadlines.length > 0) {
          // Create one card per headline
          inserts = selectedHeadlines.map((h, idx) => ({
            agent_board_id: data.boardId!,
            title: `${data.title || 'Creative'} - Copy ${idx + 1}`,
            headline: h.text,
            description_text: selectedDescriptions[idx % selectedDescriptions.length]?.text,
            primary_text: selectedPrimary[idx % selectedPrimary.length]?.text,
            status: "AI_DRAFT",
            tags: ['creative', 'copy'],
          }));
        } else {
          // Single card with all text
          inserts = [{
            agent_board_id: data.boardId!,
            title: `${data.title || 'Creative'} - Copy`,
            headline: undefined,
            description_text: selectedDescriptions.map(d => d.text).join('\n'),
            primary_text: selectedPrimary.map(p => p.text).join('\n\n'),
            status: "AI_DRAFT",
            tags: ['creative', 'copy'],
          }];
        }
      }

      const { error } = await supabase
        .from("creative_cards")
        .insert(inserts);

      if (error) throw error;
      
      toast.success(`${inserts.length} creative(s) pushed to Review`);
      clearSelection();
    } catch (error) {
      toast.error("Failed to push to review");
    }
  };

  // Render compact text line
  const renderTextLine = (item: TextItem, idx: number, channelContext?: string) => {
    const isSelected = selectedItems.has(item.id);
    const isApproved = approvedItems.has(item.id);
    const isEditing = editingItemId === item.id;
    const isRegenerating = regeneratingItemId === item.id;
    
    const typeBadge = {
      headline: 'H',
      description: 'D',
      primary: 'P',
      hook: 'HK',
      cta: 'C'
    }[item.type];

    // Get channel-specific rule if in a channel tab
    let rule: { max: number; recommended?: boolean } | undefined;
    if (channelContext === 'google-ads' && (item.type === 'headline' || item.type === 'description')) {
      rule = CHANNEL_RULES['google-ads'][item.type];
    } else if (channelContext === 'facebook-ig' && (item.type === 'primary' || item.type === 'headline')) {
      rule = CHANNEL_RULES['facebook-ig'][item.type];
    } else if (channelContext === 'tiktok-script' && (item.type === 'hook' || item.type === 'cta')) {
      rule = CHANNEL_RULES['tiktok-script'][item.type];
    }

    const isOverLimit = rule && item.text.length > rule.max;

    // Editing mode
    if (isEditing) {
      return (
        <div key={item.id} className="flex items-center gap-2 py-1 px-2 rounded bg-muted/40">
          <Badge variant="outline" className="text-[10px] px-1 h-4 shrink-0">
            {typeBadge}
          </Badge>
          <Input
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            className="h-7 text-xs flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit(item.id);
              if (e.key === 'Escape') cancelEdit();
            }}
          />
          <Button size="sm" variant="ghost" onClick={() => saveEdit(item.id)} className="h-6 w-6 p-0">
            <Check className="h-3 w-3 text-green-500" />
          </Button>
          <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-6 w-6 p-0">
            <X className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      );
    }

    return (
      <div 
        key={item.id}
        className={cn(
          "flex items-center gap-2 py-1 px-2 rounded text-xs hover:bg-muted/40 transition-colors group",
          isSelected && "bg-primary/10 border border-primary/30",
          isApproved && "bg-green-500/10 border border-green-500/30",
          isOverLimit && "border-destructive/50 bg-destructive/5"
        )}
      >
        <Checkbox 
          checked={isSelected}
          onCheckedChange={() => toggleItemSelection(item.id)}
          className="h-3 w-3"
          onClick={(e) => e.stopPropagation()}
        />
        <Badge variant="outline" className="text-[10px] px-1 h-4 shrink-0">
          {typeBadge}
        </Badge>
        <span 
          className={cn("truncate flex-1", isApproved && "text-green-600 dark:text-green-400")}
          onClick={() => toggleItemSelection(item.id)}
          onDoubleClick={(e) => { e.stopPropagation(); openContentEditor(item); }}
        >
          {item.text}
        </span>
        {rule ? (
          <CharacterCount text={item.text} max={rule.max} recommended={rule.recommended} />
        ) : (
          <span className="text-muted-foreground text-[10px] shrink-0">{item.text.length}ch</span>
        )}
        
        {/* Action buttons - show on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={(e) => { e.stopPropagation(); handleCopyItem(item.text); }}
            className="h-5 w-5 p-0"
            title="Copy"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={(e) => { e.stopPropagation(); startEditing(item); }}
            className="h-5 w-5 p-0"
            title="Edit"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={(e) => { e.stopPropagation(); handleRegenerate(item); }}
            className="h-5 w-5 p-0"
            disabled={isRegenerating}
            title="Regenerate"
          >
            {isRegenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={(e) => { e.stopPropagation(); toggleApproval(item.id); }}
            className={cn("h-5 w-5 p-0", isApproved && "text-green-500")}
            title={isApproved ? "Unapprove" : "Approve"}
          >
            {isApproved ? <CheckCircle2 className="h-3 w-3 fill-current" /> : <Circle className="h-3 w-3" />}
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
            className="h-5 w-5 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  };

  // Render text card for medium/long content
  const renderTextCard = (item: TextItem, idx: number) => {
    const isSelected = selectedItems.has(item.id);
    const isApproved = approvedItems.has(item.id);
    const isRegenerating = regeneratingItemId === item.id;
    
    return (
      <div 
        key={item.id}
        onClick={() => toggleItemSelection(item.id)}
        onDoubleClick={() => openContentEditor(item)}
        className={cn(
          "p-3 rounded-lg border cursor-pointer transition-all group",
          isSelected ? "bg-primary/10 ring-2 ring-primary" : "bg-muted/20 hover:bg-muted/30",
          isApproved && "border-green-500/50 bg-green-500/5"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Checkbox checked={isSelected} onCheckedChange={() => toggleItemSelection(item.id)} onClick={(e) => e.stopPropagation()} />
            <Badge variant="outline" className="text-[10px]">{item.type.toUpperCase()}</Badge>
            <span className="text-[10px] text-muted-foreground">{item.text.length} chars</span>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={(e) => { e.stopPropagation(); handleCopyItem(item.text); }}
              className="h-5 w-5 p-0"
              title="Copy"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={(e) => { e.stopPropagation(); openContentEditor(item); }}
              className="h-5 w-5 p-0"
              title="Edit"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={(e) => { e.stopPropagation(); handleRegenerate(item); }}
              className="h-5 w-5 p-0"
              disabled={isRegenerating}
              title="Regenerate"
            >
              {isRegenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={(e) => { e.stopPropagation(); toggleApproval(item.id); }}
              className={cn("h-5 w-5 p-0", isApproved && "text-green-500")}
              title={isApproved ? "Unapprove" : "Approve"}
            >
              {isApproved ? <CheckCircle2 className="h-3 w-3 fill-current" /> : <Circle className="h-3 w-3" />}
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
              className="h-5 w-5 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {item.text}
        </p>
      </div>
    );
  };

  // Render compact image grid
  const renderImageGrid = () => (
    <div 
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(70px, 1fr))` }}
    >
      {allImages.map((img, idx) => {
        const itemId = `img-${idx}`;
        const isSelected = selectedItems.has(itemId);
        
        return (
          <div 
            key={idx}
            onClick={() => toggleItemSelection(itemId)}
            className={cn(
              "relative aspect-square bg-muted rounded overflow-hidden group cursor-pointer transition-all",
              isSelected && "ring-2 ring-primary"
            )}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
            <Button
              size="icon"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteImage(idx);
              }}
              className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 h-5 w-5 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 transition-opacity"
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggleItemSelection(itemId)}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-3 w-3 bg-background"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        );
      })}
    </div>
  );

  // Render block-based content (video scripts, sales pages)
  const renderBlockItem = (block: BlockItem) => {
    const isSelected = selectedItems.has(block.id);
    
    return (
      <div 
        key={block.id}
        onClick={() => toggleItemSelection(block.id)}
        className={cn(
          "p-3 rounded-lg border border-border/50 cursor-pointer transition-all",
          isSelected ? "bg-primary/10 ring-2 ring-primary" : "bg-muted/20 hover:bg-muted/40"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {block.type === 'scene' ? `Scene ${block.index}` : block.type.toUpperCase()}
            </Badge>
            {block.title && <span className="text-xs font-semibold">{block.title}</span>}
          </div>
          {block.timestamp && (
            <span className="text-[10px] text-muted-foreground font-mono">{block.timestamp}</span>
          )}
        </div>
        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{block.content}</p>
      </div>
    );
  };

  // Facebook/IG Ad Preview
  const FacebookAdPreview = ({ variant, image }: { variant: CreativeVariant, image?: string }) => (
    <div className="max-w-sm mx-auto border rounded-lg overflow-hidden bg-card shadow-lg">
      {/* Header */}
      <div className="p-3 flex items-center gap-2 border-b">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-xs font-bold text-primary-foreground">B</span>
        </div>
        <div>
          <div className="text-xs font-semibold">Brand Name</div>
          <div className="text-[10px] text-muted-foreground">Sponsored</div>
        </div>
      </div>
      
      {/* Primary Text */}
      {variant.primaryText && (
        <div className="px-3 py-2">
          <p className="text-xs line-clamp-3">{variant.primaryText}</p>
        </div>
      )}
      
      {/* Image */}
      <div className="aspect-square bg-muted">
        {image && <img src={image} alt="" className="w-full h-full object-cover" />}
      </div>
      
      {/* Headline & CTA */}
      <div className="p-3 border-t bg-muted/20">
        <div className="text-[10px] text-muted-foreground">example.com</div>
        <div className="text-sm font-semibold line-clamp-2 mt-1">{variant.headline || 'Headline goes here'}</div>
        <Button size="sm" className="mt-2 w-full h-7 text-xs">
          {variant.ctaButton || 'Learn More'}
        </Button>
      </div>
    </div>
  );

  // Google Ads Preview
  const GoogleAdPreview = ({ variant }: { variant: CreativeVariant }) => (
    <div className="max-w-md mx-auto p-4 border rounded-lg bg-card shadow-lg">
      {/* Ad Badge */}
      <div className="flex items-center gap-2 mb-1">
        <Badge variant="outline" className="text-[10px] h-5">Ad</Badge>
        <span className="text-[10px] text-muted-foreground">{variant.displayUrl || 'www.example.com'}</span>
      </div>
      
      {/* Headlines */}
      <div className="text-primary font-semibold text-lg mb-1 leading-tight">
        {variant.headlines?.slice(0, 3).join(' | ') || 'Headline • Headline 2 • Headline 3'}
      </div>
      
      {/* Descriptions */}
      <div className="text-sm text-muted-foreground leading-relaxed">
        {variant.descriptions?.slice(0, 2).join(' ') || 'Description text goes here with more details about the offer.'}
      </div>

      {/* Character counts */}
      <div className="mt-3 pt-3 border-t flex flex-wrap gap-3 text-[10px]">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Headlines:</span>
          <CharacterCount text={variant.headlines?.[0] || ''} max={30} />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Descriptions:</span>
          <CharacterCount text={variant.descriptions?.[0] || ''} max={90} />
        </div>
      </div>
    </div>
  );

  // TikTok Script Preview
  const TikTokScriptPreview = ({ variant }: { variant: CreativeVariant }) => (
    <div className="max-w-sm mx-auto space-y-4">
      {/* Phone Frame */}
      <div className="border-4 border-foreground/10 rounded-[2rem] p-2 bg-gradient-to-b from-foreground/5 to-foreground/10">
        <div className="aspect-[9/16] bg-gradient-to-b from-muted to-muted/50 rounded-[1.5rem] relative overflow-hidden border border-border">
          {/* Hook overlay at top */}
          <div className="absolute top-4 left-4 right-4 z-10">
            <Badge className="bg-destructive text-destructive-foreground text-[10px] mb-1">HOOK (0-3s)</Badge>
            <p className="text-foreground text-sm font-bold drop-shadow-lg bg-background/80 backdrop-blur-sm p-2 rounded">
              {variant.hook || '🎯 Attention-grabbing hook goes here!'}
            </p>
          </div>
          
          {/* CTA at bottom */}
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <Button size="sm" className="w-full shadow-lg">
              {variant.cta || 'Shop Now'}
            </Button>
          </div>

          {/* Placeholder video content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Film className="w-16 h-16 text-muted-foreground/20" />
          </div>
        </div>
      </div>
      
      {/* Script Timeline */}
      {variant.body && variant.body.length > 0 && (
        <div className="space-y-2 px-2">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Script Timeline</div>
          {variant.body.map((scene, i) => (
            <div key={i} className="flex gap-3 text-xs border-l-2 border-primary/30 pl-3 py-1">
              <div className="w-12 text-primary font-mono shrink-0">{scene.timestamp}</div>
              <div>
                <span className="font-semibold">{scene.scene}:</span> {scene.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderContent = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold truncate max-w-[150px]">
            {data.title || "Creatives"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {(allTextItems.length > 0 || allImages.length > 0) && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkPushAll}
              className="h-6 text-xs"
            >
              <ArrowRight className="w-3 h-3 mr-1" />
              Push All
            </Button>
          )}
          {selectedItems.size > 0 && (
            <Button 
              variant="secondary" 
              size="sm" 
              className="h-6 text-xs"
              onClick={handleBatchPushToReview}
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Push {selectedItems.size}
            </Button>
          )}
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-7 w-7"
            onClick={() => setIsFullscreen(true)}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
          <TabsList className="h-7">
            <TabsTrigger value="all" className="text-xs h-6 px-2">All</TabsTrigger>
            <TabsTrigger value="facebook" className="text-xs h-6 px-2">
              Facebook
            </TabsTrigger>
            <TabsTrigger value="google" className="text-xs h-6 px-2">
              Google Ads
            </TabsTrigger>
            <TabsTrigger value="tiktok" className="text-xs h-6 px-2">
              TikTok
            </TabsTrigger>
          </TabsList>
        </div>
      </div>
      
      <TabsContent value="all" className="flex-1 overflow-hidden mt-0">
        <ScrollArea className="h-full nowheel nodrag" onWheel={(e) => e.stopPropagation()}>
          {allImages.length > 0 && (
            <div className="p-3">
              <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <ImageIcon className="w-3 h-3" />
                Images ({allImages.length})
              </div>
              {renderImageGrid()}
            </div>
          )}
          
          {allTextItems.length > 0 && (
            <div className="p-3 border-t border-border">
              <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <Type className="w-3 h-3" />
                Copy ({allTextItems.length})
              </div>
              <div className="space-y-2">
                {allTextItems.map((item, idx) => {
                  const format = getContentFormat(item.text);
                  if (format === 'block' || format === 'card') {
                    return renderTextCard(item, idx);
                  }
                  return renderTextLine(item, idx);
                })}
              </div>
            </div>
          )}
          
          {allImages.length === 0 && allTextItems.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No content yet</p>
              </div>
            </div>
          )}
        </ScrollArea>
      </TabsContent>
      
      <TabsContent value="facebook" className="flex-1 overflow-hidden mt-0">
        <ScrollArea className="h-full nowheel nodrag" onWheel={(e) => e.stopPropagation()}>
          <div className="p-4 space-y-4">
            {variants.filter(v => v.channel === 'facebook-ig').map((variant, idx) => (
              <FacebookAdPreview key={idx} variant={variant} image={variant.images?.[0] || allImages[0]} />
            ))}
            {variants.filter(v => v.channel === 'facebook-ig').length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p className="text-sm">No Facebook/IG ads yet</p>
                <p className="text-xs mt-2">Content will appear when channel is set to facebook-ig</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="google" className="flex-1 overflow-hidden mt-0">
        <ScrollArea className="h-full nowheel nodrag" onWheel={(e) => e.stopPropagation()}>
          <div className="p-4 space-y-4">
            {variants.filter(v => v.channel === 'google-ads').map((variant, idx) => (
              <GoogleAdPreview key={idx} variant={variant} />
            ))}
            {variants.filter(v => v.channel === 'google-ads').length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p className="text-sm">No Google Ads yet</p>
                <p className="text-xs mt-2">Content will appear when channel is set to google-ads</p>
              </div>
            )}
            
            {/* Show all headlines with validation */}
            {allTextItems.filter(t => t.type === 'headline').length > 0 && (
              <div className="border-t pt-4">
                <div className="text-xs font-semibold text-muted-foreground mb-2">
                  All Headlines ({allTextItems.filter(t => t.type === 'headline').length})
                </div>
                <div className="space-y-1">
                  {allTextItems.filter(t => t.type === 'headline').map((item, idx) => 
                    renderTextLine(item, idx, 'google-ads')
                  )}
                </div>
              </div>
            )}
            
            {/* Show all descriptions with validation */}
            {allTextItems.filter(t => t.type === 'description').length > 0 && (
              <div className="border-t pt-4 mt-4">
                <div className="text-xs font-semibold text-muted-foreground mb-2">
                  All Descriptions ({allTextItems.filter(t => t.type === 'description').length})
                </div>
                <div className="space-y-1">
                  {allTextItems.filter(t => t.type === 'description').map((item, idx) => 
                    renderTextLine(item, idx, 'google-ads')
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="tiktok" className="flex-1 overflow-hidden mt-0">
        <ScrollArea className="h-full nowheel nodrag" onWheel={(e) => e.stopPropagation()}>
          <div className="p-4 space-y-4">
            {variants.filter(v => v.channel === 'tiktok-script').map((variant, idx) => (
              <TikTokScriptPreview key={idx} variant={variant} />
            ))}
            {variants.filter(v => v.channel === 'tiktok-script').length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p className="text-sm">No TikTok scripts yet</p>
                <p className="text-xs mt-2">Content will appear when channel is set to tiktok-script</p>
              </div>
            )}

            {/* Show all blocks if they exist */}
            {allBlocks.length > 0 && (
              <div className="border-t pt-4 space-y-2">
                <div className="text-xs font-semibold text-muted-foreground mb-2">
                  Video Script Timeline ({allBlocks.length} scenes)
                </div>
                {allBlocks.map(renderBlockItem)}
              </div>
            )}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );

  return (
    <>
      {/* Content Edit Dialog */}
      <Dialog open={contentEditorOpen} onOpenChange={setContentEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4" />
              Edit {editingContent?.type}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex gap-4 flex-1 overflow-hidden">
            {/* Left side - Editor */}
            <div className="flex-1 flex flex-col gap-2">
              <Textarea
                value={editingContentText}
                onChange={(e) => setEditingContentText(e.target.value)}
                className="min-h-[200px] flex-1 font-mono text-sm resize-none"
                placeholder="Enter your content..."
              />
              
              <div className="flex items-center gap-2">
                <Input
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  placeholder="Optional: Add custom instruction (e.g., 'make it more urgent')"
                  className="flex-1 text-sm"
                />
                <Button
                  onClick={getAiSuggestions}
                  disabled={isLoadingSuggestions || !editingContentText.trim()}
                  variant="secondary"
                  className="gap-2"
                >
                  {isLoadingSuggestions ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Get AI Suggestions
                    </>
                  )}
                </Button>
              </div>
              
              <span className="text-xs text-muted-foreground">
                {editingContentText.length} characters
              </span>
            </div>

            {/* Right side - AI Suggestions */}
            {aiSuggestions.length > 0 && (
              <div className="w-[380px] border-l pl-4 flex flex-col gap-2">
                <div className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  AI Suggestions
                </div>
                <ScrollArea className="flex-1 pr-2 nowheel nodrag" onWheel={(e) => e.stopPropagation()}>
                  <div className="space-y-2">
                    {aiSuggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors group cursor-pointer"
                        onClick={() => applySuggestion(suggestion)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge variant="outline" className="text-[10px]">
                            Option {idx + 1}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 px-2 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              applySuggestion(suggestion);
                            }}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Apply
                          </Button>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {suggestion}
                        </p>
                        <div className="text-xs text-muted-foreground mt-2">
                          {suggestion.length} chars
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setContentEditorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveContentEdit}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="w-screen h-screen max-w-none m-0 rounded-none p-0 flex flex-col">
          <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                {data.title || "Creatives"}
              </DialogTitle>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => setIsFullscreen(false)}
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {renderContent()}
          </div>
        </DialogContent>
      </Dialog>

      <NodeResizer
        isVisible={selected}
        minWidth={500}
        minHeight={600}
        onResize={(event, params) => {
          setNodeDimensions({ 
            width: params.width, 
            height: params.height 
          });
        }}
      />
      
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ 
          left: '-12px',
          width: '24px',
          height: '24px',
          background: 'hsl(var(--primary))',
          border: '2px solid hsl(var(--primary-foreground))',
          zIndex: 50,
        }}
        className="hover:scale-125 transition-transform cursor-grab"
        title="Input"
      />

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ 
          right: '-12px',
          width: '24px',
          height: '24px',
          background: 'hsl(var(--accent))',
          border: '2px solid hsl(var(--accent-foreground))',
          zIndex: 50,
        }}
        className="hover:scale-125 transition-transform cursor-grab"
        title="Creative Output"
      />

      <Card
        className={cn(
          "overflow-hidden transition-shadow",
          selected && "ring-2 ring-primary shadow-lg"
        )}
        style={{ width: "100%", height: "100%" }}
      >
        {renderContent()}
      </Card>
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - re-render if these change
  if (prevProps.data.content !== nextProps.data.content) return false;
  if (prevProps.data.variants !== nextProps.data.variants) return false;
  if (prevProps.selected !== nextProps.selected) return false;
  if (prevProps.id !== nextProps.id) return false;
  return true; // Don't re-render if nothing changed
});

CreativeNode.displayName = "CreativeNode";
