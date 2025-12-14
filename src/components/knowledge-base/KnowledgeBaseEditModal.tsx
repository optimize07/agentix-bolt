import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  X,
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
  Loader2,
  ExternalLink,
  Eye,
  RefreshCcw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { type KBItem } from "./KnowledgeBaseCard";
import ReactMarkdown from "react-markdown";
import { type Database } from "@/integrations/supabase/types";

type KBCategory = Database["public"]["Enums"]["kb_category"];

interface KnowledgeBaseEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: KBItem | null;
  onSuccess?: () => void;
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

const departmentOptions = [
  { value: "strategy", label: "Strategy" },
  { value: "advertising", label: "Advertising" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "operations", label: "Operations" },
  { value: "financials", label: "Financials" },
  { value: "admin", label: "Admin" },
];

export function KnowledgeBaseEditModal({
  open,
  onOpenChange,
  item,
  onSuccess,
}: KnowledgeBaseEditModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<KBCategory>("document");
  const [department, setDepartment] = useState("marketing");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [scrapedContent, setScrapedContent] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description || "");
      setCategory(item.category as KBCategory);
      setDepartment(item.source_department);
      setTags(item.tags || []);
      setIsPinned(item.is_pinned);
      setActiveTab("details");
      
      // Load existing scraped content
      const existingContent = item.metadata && typeof item.metadata === "object" && "scraped_markdown" in item.metadata
        ? String(item.metadata.scraped_markdown)
        : null;
      setScrapedContent(existingContent);
    }
  }, [item]);

  const addTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleScrapeAgain = async () => {
    if (!item?.external_url) return;

    setScraping(true);
    try {
      toast.info("Scraping latest content from URL...");
      
      const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke(
        "scrape-url-content",
        {
          body: { url: item.external_url },
        }
      );

      if (scrapeError) {
        throw new Error(scrapeError.message || "Failed to scrape URL");
      }

      if (!scrapeData || !scrapeData.success) {
        throw new Error(scrapeData?.error || "Failed to scrape URL");
      }
      const newMarkdown = scrapeData.markdown || "";
      const newTitle = scrapeData.title || "";
      const newDescription = scrapeData.description || "";

      // Update metadata with new scraped content
      const updatedMetadata = {
        ...(item.metadata && typeof item.metadata === "object" ? item.metadata : {}),
        scraped_markdown: newMarkdown,
        scraped_at: new Date().toISOString(),
      };

      // Update the item in database
      const { error } = await supabase
        .from("knowledge_base_items")
        .update({
          metadata: updatedMetadata,
          // Optionally update title/description if they're empty or user wants to refresh
          title: !title.trim() ? newTitle : title.trim(),
          description: !description.trim() ? newDescription : description.trim(),
        })
        .eq("id", item.id);

      if (error) throw error;

      // Update local state
      setScrapedContent(newMarkdown);
      if (!title.trim()) setTitle(newTitle);
      if (!description.trim()) setDescription(newDescription);
      
      // Update item reference
      if (item) {
        item.metadata = updatedMetadata;
      }

      toast.success("Content scraped and updated successfully");
      
      // Switch to content tab to show the new content
      if (newMarkdown) {
        setActiveTab("content");
      }
    } catch (err) {
      console.error("Scrape error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to scrape URL");
    } finally {
      setScraping(false);
    }
  };

  const handleSave = async () => {
    if (!item || !title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("knowledge_base_items")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          category,
          source_department: department,
          tags,
          is_pinned: isPinned,
        })
        .eq("id", item.id);

      if (error) throw error;

      toast.success("Item updated");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to update item");
    } finally {
      setSaving(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {item.external_url ? "View & Edit" : "Edit"} Knowledge Base Item
          </DialogTitle>
          <DialogDescription>
            {item.external_url && "View scraped content and edit metadata"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className={`grid w-full ${item.external_url ? "grid-cols-2" : "grid-cols-1"}`}>
            <TabsTrigger value="details">Details</TabsTrigger>
            {item.external_url && (
              <TabsTrigger value="content">
                Scraped Content
                {scrapedContent && <span className="ml-2 text-xs opacity-70">({Math.ceil(scrapedContent.length / 1000)}k)</span>}
                {!scrapedContent && <span className="ml-2 text-xs opacity-50">(Not scraped)</span>}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="details" className="flex-1 overflow-auto space-y-4 mt-4 pr-2">
            {/* Title */}
            <div>
              <label className="text-sm text-muted-foreground">Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm text-muted-foreground">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>

            {/* Category & Department */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Category</label>
                <Select value={category} onValueChange={(val) => setCategory(val as KBCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
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
              <div>
                <label className="text-sm text-muted-foreground">Source Department</label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentOptions.map((dept) => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* External URL */}
            {item.external_url && (
              <div>
                <label className="text-sm text-muted-foreground">External URL</label>
                <div className="flex items-center gap-2">
                  <Input value={item.external_url} readOnly className="bg-muted flex-1" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleScrapeAgain}
                    disabled={scraping}
                    title="Scrape latest content from URL"
                  >
                    {scraping ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a href={item.external_url} target="_blank" rel="noopener noreferrer" title="Open in new tab">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
                {scrapedContent && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Content scraped • Switch to "Scraped Content" tab to view
                  </p>
                )}
              </div>
            )}

            {/* File Info */}
            {item.file_path && (
              <div>
                <label className="text-sm text-muted-foreground">File</label>
                <div className="text-sm text-muted-foreground">
                  {item.file_name || item.file_path}
                  {item.file_size && ` (${(item.file_size / 1024).toFixed(1)} KB)`}
                </div>
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="text-sm text-muted-foreground">Tags</label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tag"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button onClick={() => removeTag(tag)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Pin Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pin-item"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <label htmlFor="pin-item" className="text-sm text-muted-foreground cursor-pointer">
                Pin this item to the top
              </label>
            </div>
          </TabsContent>

          {item.external_url && (
            <TabsContent value="content" className="flex-1 overflow-auto mt-4 pr-2">
              {scrapedContent ? (
                <div className="rounded-lg border border-border bg-card p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-foreground">Scraped Content</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Markdown format • {scrapedContent.length.toLocaleString()} characters
                        {item.metadata && typeof item.metadata === "object" && "scraped_at" in item.metadata && (
                          <span> • Scraped {new Date(String(item.metadata.scraped_at)).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleScrapeAgain}
                      disabled={scraping}
                      className="gap-2"
                    >
                      {scraping ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Scraping...
                        </>
                      ) : (
                        <>
                          <RefreshCcw className="h-3 w-3" />
                          Scrape Again
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none border-t border-border pt-4">
                    <ReactMarkdown>{scrapedContent}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Scraped Content</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This external URL hasn't been scraped yet, or the content was removed.
                  </p>
                  <Button onClick={handleScrapeAgain} disabled={scraping} className="gap-2">
                    {scraping ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Scraping...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="h-4 w-4" />
                        Scrape Content Now
                      </>
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter className="border-t border-border pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default KnowledgeBaseEditModal;

