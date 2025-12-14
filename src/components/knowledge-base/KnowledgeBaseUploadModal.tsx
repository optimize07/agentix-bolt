import { useState, useRef, useCallback } from "react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  X,
  Link,
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface KnowledgeBaseUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
  defaultDepartment?: string;
  defaultScope?: "agency" | "client" | "project" | "task";
  projectId?: string;
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

function detectCategory(file: File): string {
  const type = file.type;
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type.includes("pdf") || type.includes("document") || type.includes("word")) return "document";
  if (type.includes("spreadsheet") || type.includes("excel")) return "document";
  return "document";
}

export function KnowledgeBaseUploadModal({
  open,
  onOpenChange,
  clientId,
  defaultDepartment = "marketing",
  defaultScope = "client",
  projectId,
  onSuccess,
}: KnowledgeBaseUploadModalProps) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("document");
  const [department, setDepartment] = useState(defaultDepartment);
  const [scope, setScope] = useState<"agency" | "client" | "project" | "task">(defaultScope);
  const [externalUrl, setExternalUrl] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setCategory("document");
    setDepartment(defaultDepartment);
    setScope(defaultScope);
    setExternalUrl("");
    setTags([]);
    setTagInput("");
    setMode("upload");
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      if (!title) setTitle(droppedFile.name.replace(/\.[^/.]+$/, ""));
      setCategory(detectCategory(droppedFile));
    }
  }, [title]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!title) setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      setCategory(detectCategory(selectedFile));
    }
  };

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

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (mode === "upload" && !file) {
      toast.error("Please select a file to upload");
      return;
    }

    if (mode === "url" && !externalUrl.trim()) {
      toast.error("Please enter an external URL");
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let filePath: string | null = null;
      let fileName: string | null = null;
      let fileSize: number | null = null;
      let mimeType: string | null = null;
      let scrapedContent: string | null = null;
      let scrapedTitle: string | null = null;
      let scrapedDescription: string | null = null;

      // Scrape external URL if in URL mode
      if (mode === "url" && externalUrl.trim()) {
        toast.info("Scraping content from URL...");
        try {
          const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke(
            "scrape-url-content",
            {
              body: { url: externalUrl.trim() },
            }
          );

          if (!scrapeError && scrapeData && scrapeData.success) {
            scrapedContent = scrapeData.markdown || null;
            scrapedTitle = scrapeData.title || null;
            scrapedDescription = scrapeData.description || null;
            
            // Auto-fill title/description if empty
            if (!title.trim() && scrapedTitle) {
              setTitle(scrapedTitle);
            }
            if (!description.trim() && scrapedDescription) {
              setDescription(scrapedDescription);
            }
            toast.success("URL content scraped successfully!");
          } else {
            console.warn("Failed to scrape URL content, continuing without it", scrapeError || scrapeData?.error);
          }
        } catch (scrapeErr) {
          console.warn("Error scraping URL:", scrapeErr);
          // Continue without scraped content
        }
      }

      // Upload file if in upload mode
      if (mode === "upload" && file) {
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        filePath = `${user.id}/${clientId || "agency"}/${timestamp}_${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("knowledge-base")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        fileName = file.name;
        fileSize = file.size;
        mimeType = file.type;
      }

      // Create database record
      const metadata: Record<string, unknown> = {};
      if (scrapedContent) {
        metadata.scraped_markdown = scrapedContent;
        metadata.scraped_at = new Date().toISOString();
      }

      const { error: dbError } = await supabase.from("knowledge_base_items").insert({
        user_id: user.id,
        scope,
        client_id: scope !== "agency" ? clientId : null,
        project_id: scope === "project" || scope === "task" ? projectId : null,
        source_department: department,
        category,
        title: title.trim() || scrapedTitle || externalUrl.trim(),
        description: description.trim() || scrapedDescription || null,
        tags,
        file_path: filePath,
        external_url: mode === "url" ? externalUrl.trim() : null,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType,
        metadata,
      } as any);

      if (dbError) throw dbError;

      toast.success("Item added to knowledge base" + (scrapedContent ? " (content scraped)" : ""));
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to add item");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add to Knowledge Base</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="flex rounded-lg border border-border p-1">
            <button
              className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                mode === "upload"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setMode("upload")}
            >
              <Upload className="h-4 w-4" />
              Upload File
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                mode === "url"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setMode("url")}
            >
              <Link className="h-4 w-4" />
              External URL
            </button>
          </div>

          {/* File upload area */}
          {mode === "upload" && (
            <div
              className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Drag and drop a file here, or{" "}
                    <button
                      className="text-primary hover:underline"
                      onClick={() => inputRef.current?.click()}
                    >
                      browse
                    </button>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Images, PDFs, documents, videos up to 50MB
                  </p>
                </>
              )}
            </div>
          )}

          {/* External URL input */}
          {mode === "url" && (
            <div>
              <label className="text-sm text-muted-foreground">External URL</label>
              <Input
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          )}

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
              rows={2}
            />
          </div>

          {/* Category & Department */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Category</label>
              <Select value={category} onValueChange={setCategory}>
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

          {/* Scope */}
          <div>
            <label className="text-sm text-muted-foreground">Visibility Scope</label>
            <Select value={scope} onValueChange={(v: "agency" | "client" | "project" | "task") => setScope(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agency">Agency-wide (all clients)</SelectItem>
                <SelectItem value="client">This Client Only</SelectItem>
                {projectId && <SelectItem value="project">Project Only</SelectItem>}
              </SelectContent>
            </Select>
          </div>

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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add to Knowledge Base"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default KnowledgeBaseUploadModal;

