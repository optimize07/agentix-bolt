import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Database } from "@/integrations/supabase/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  FileText,
  Image,
  Video,
  Music,
  FileCode,
  Palette,
  Star,
  BookOpen,
  Target,
  HelpCircle,
  Gift,
  Check,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { KnowledgeBaseCard, type KBItem } from "./KnowledgeBaseCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface KnowledgeBaseBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
  categoryFilter?: string[];
  maxSelect?: number;
  onConfirm: (items: KBItem[]) => void;
  title?: string;
  description?: string;
}

const categoryOptions = [
  { value: "document", label: "Document", icon: FileText },
  { value: "image", label: "Image", icon: Image },
  { value: "video", label: "Video", icon: Video },
  { value: "audio", label: "Audio", icon: Music },
  { value: "template", label: "Template", icon: FileCode },
  { value: "script", label: "Script", icon: FileCode },
  { value: "brand_asset", label: "Brand Asset", icon: Palette },
  { value: "winning_ad", label: "Winning Ad", icon: Star },
  { value: "research", label: "Research", icon: BookOpen },
  { value: "playbook", label: "Playbook", icon: Target },
  { value: "faq", label: "FAQ", icon: HelpCircle },
  { value: "offer", label: "Offer", icon: Gift },
];

export function KnowledgeBaseBrowser({
  open,
  onOpenChange,
  clientId,
  categoryFilter,
  maxSelect = 10,
  onConfirm,
  title = "Select from Knowledge Base",
  description,
}: KnowledgeBaseBrowserProps) {
  const [items, setItems] = useState<KBItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  async function fetchItems() {
    setLoading(true);
    try {
      let query = supabase
        .from("knowledge_base_items")
        .select("*")
        .eq("is_archived", false)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      // Include both agency-level and client-level items
      if (clientId) {
        query = query.or(`client_id.eq.${clientId},scope.eq.agency`);
      }

      if (categoryFilter && categoryFilter.length > 0) {
        query = query.in("category", categoryFilter as Database["public"]["Enums"]["kb_category"][]);
      }

      const { data, error } = await query;

      if (error) throw error;
      setItems((data as KBItem[]) || []);
    } catch (err) {
      console.error("Error fetching knowledge base items:", err);
      toast.error("Failed to load knowledge base");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      fetchItems();
      setSelectedItems(new Set());
    }
  }, [open, clientId]);

  // Filter items based on search and category
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase()) ||
      item.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = filterCategory === "all" || item.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const handleSelectItem = (item: KBItem, selected: boolean) => {
    const newSelected = new Set(selectedItems);
    if (selected) {
      if (newSelected.size >= maxSelect) {
        toast.info(`Maximum ${maxSelect} items can be selected`);
        return;
      }
      newSelected.add(item.id);
    } else {
      newSelected.delete(item.id);
    }
    setSelectedItems(newSelected);
  };

  const handleConfirm = () => {
    const selectedKBItems = items.filter((i) => selectedItems.has(i.id));
    onConfirm(selectedKBItems);
    onOpenChange(false);
  };

  // Get available categories from the current filter or all
  const availableCategories = categoryFilter
    ? categoryOptions.filter((c) => categoryFilter.includes(c.value))
    : categoryOptions;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            {title}
          </DialogTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </DialogHeader>

        {/* Filters */}
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {availableCategories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <div className="flex items-center gap-2">
                    <cat.icon className="h-4 w-4" />
                    {cat.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected count */}
        {selectedItems.size > 0 && (
          <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-primary/10">
            <Check className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {selectedItems.size} item{selectedItems.size > 1 ? "s" : ""} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setSelectedItems(new Set())}
            >
              Clear
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">No items found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {search || filterCategory !== "all"
                  ? "Try adjusting your search or filters"
                  : "Add items to your knowledge base to use them here"}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {filteredItems.map((item) => (
                <KnowledgeBaseCard
                  key={item.id}
                  item={item}
                  selectable
                  compact
                  onSelect={handleSelectItem}
                  isSelected={selectedItems.has(item.id)}
                />
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selectedItems.size === 0}>
            {selectedItems.size > 0
              ? `Select ${selectedItems.size} Item${selectedItems.size > 1 ? "s" : ""}`
              : "Select Items"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default KnowledgeBaseBrowser;

