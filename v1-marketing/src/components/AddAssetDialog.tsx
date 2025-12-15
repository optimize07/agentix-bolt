import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProject } from "@/contexts/ProjectContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Globe, Sparkles, Loader2 } from "lucide-react";

interface Asset {
  id: string;
  name: string;
  type: string;
  text_content?: string | null;
  url_or_path?: string | null;
  tags?: string[] | null;
  description?: string | null;
  category?: string | null;
}

interface AddAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editAsset?: Asset | null;
}

export default function AddAssetDialog({ open, onOpenChange, editAsset }: AddAssetDialogProps) {
  const { selectedProjectId } = useProject();
  const [name, setName] = useState("");
  const [type, setType] = useState<"image" | "video" | "text" | "url" | "doc">("text");
  const [textContent, setTextContent] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [isUploading, setIsUploading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [isAutoTagging, setIsAutoTagging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resetForm = () => {
    setName("");
    setType("text");
    setTextContent("");
    setUrl("");
    setTags("");
    setDescription("");
    setCategory("general");
    setPreviewUrl("");
  };

  useEffect(() => {
    if (editAsset && open) {
      setName(editAsset.name);
      setType(editAsset.type as any);
      setTextContent(editAsset.text_content || "");
      setUrl(editAsset.url_or_path || "");
      setTags(editAsset.tags?.join(", ") || "");
      setDescription(editAsset.description || "");
      setCategory(editAsset.category || "general");
      if (editAsset.url_or_path && (editAsset.type === "image" || editAsset.type === "video")) {
        setPreviewUrl(editAsset.url_or_path);
      }
    } else if (!open) {
      resetForm();
    }
  }, [editAsset, open]);

  const addAssetMutation = useMutation({
    mutationFn: async (assetData: any) => {
      if (editAsset) {
        const { error } = await supabase
          .from("assets")
          .update(assetData)
          .eq("id", editAsset.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("assets").insert([assetData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast({
        title: editAsset ? "Asset Updated" : "Asset Added",
        description: editAsset
          ? "Asset has been updated successfully."
          : "New asset has been added to your library.",
      });
      resetForm();
      onOpenChange(false);
    },
  });

  const handleBulkFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    const results = { success: 0, failed: 0 };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({ current: i + 1, total: files.length });

      try {
        // Upload file to storage
        const fileExt = file.name.split(".").pop();
        const fileName = `assets/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("canvas-uploads")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("canvas-uploads")
          .getPublicUrl(fileName);

        // Auto-generate tags for the file
        let autoTags: string[] = [];
        try {
          const { data: tagData } = await supabase.functions.invoke("auto-tag", {
            body: {
              title: file.name,
              content: "",
              type: file.type.startsWith("image") ? "image" : "video",
            },
          });
          if (tagData?.tags) {
            autoTags = tagData.tags;
          }
        } catch (tagError) {
          console.error("Auto-tag failed for", file.name, tagError);
        }

        // Insert asset directly into database (not using mutation to avoid premature dialog close)
        const { error: insertError } = await supabase.from("assets").insert([{
          name: file.name,
          type: file.type.startsWith("image") ? "image" : "video",
          url_or_path: publicUrl,
          tags: autoTags,
          description: null,
          category: category || "general",
          file_size: file.size,
          mime_type: file.type,
          agent_board_id: null, // Global assets for Central Brain
        }]);

        if (insertError) throw insertError;

        results.success++;
      } catch (error: any) {
        console.error(`Failed to upload ${file.name}:`, error);
        results.failed++;
      }
    }

    setIsUploading(false);
    setUploadProgress(null);

    // Invalidate queries after all uploads complete
    queryClient.invalidateQueries({ queryKey: ["assets"] });

    toast({
      title: "Bulk Upload Complete",
      description: `${results.success} files uploaded successfully${results.failed > 0 ? `, ${results.failed} failed` : ""}.`,
      variant: results.failed > 0 ? "destructive" : "default",
    });

    if (results.success > 0) {
      resetForm();
      onOpenChange(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    await handleBulkFileUpload([file]);
  };

  const handleScrapeUrl = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a URL to scrape.",
        variant: "destructive",
      });
      return;
    }

    setIsScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-url", {
        body: { url },
      });

      if (error) throw error;

      if (data?.title && !name) {
        setName(data.title);
      }
      if (data?.description && !description) {
        setDescription(data.description);
      }

      toast({
        title: "URL Scraped",
        description: "Metadata extracted successfully.",
      });
    } catch (error: any) {
      console.error("Scrape error:", error);
      toast({
        title: "Scraping Failed",
        description: error.message || "Could not scrape URL metadata.",
        variant: "destructive",
      });
    } finally {
      setIsScraping(false);
    }
  };

  const handleAutoTag = async () => {
    if (!name && !description && !textContent) {
      toast({
        title: "Content Required",
        description: "Add a name, description, or content to auto-generate tags.",
        variant: "destructive",
      });
      return;
    }

    setIsAutoTagging(true);
    try {
      const { data, error } = await supabase.functions.invoke("auto-tag", {
        body: {
          title: name,
          content: description || textContent || "",
          type: type,
        },
      });

      if (error) throw error;

      if (data?.tags && Array.isArray(data.tags)) {
        setTags(data.tags.join(", "));
        toast({
          title: "Tags Generated",
          description: `Generated ${data.tags.length} tags using AI.`,
        });
      }
    } catch (error: any) {
      console.error("Auto-tag error:", error);
      toast({
        title: "Auto-Tagging Failed",
        description: error.message || "Could not generate tags.",
        variant: "destructive",
      });
    } finally {
      setIsAutoTagging(false);
    }
  };

  const handleSubmit = async () => {
    if (!name) {
      toast({
        title: "Name Required",
        description: "Please enter a name for the asset.",
        variant: "destructive",
      });
      return;
    }

    if (type === "text" && !textContent.trim()) {
      toast({
        title: "Text Content Required",
        description: "Please enter text content for this asset.",
        variant: "destructive",
      });
      return;
    }

    if (type === "url") {
      if (!url.trim()) {
        toast({
          title: "URL Required",
          description: "Please enter a URL for this asset.",
          variant: "destructive",
        });
        return;
      }

      try {
        new URL(url);
      } catch {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid URL (e.g., https://example.com).",
          variant: "destructive",
        });
        return;
      }
    }

    const assetData: any = {
      name,
      type,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      description: description || null,
      category,
      agent_board_id: null, // Global assets for Central Brain
    };

    if (type === "text") {
      assetData.text_content = textContent;
    } else if (type === "url") {
      assetData.url_or_path = url;
    }

    addAssetMutation.mutate(assetData);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    
    if (type === "image" || type === "video" || type === "doc") {
      const validFiles = files.filter(file => {
        if (type === "image") return file.type.startsWith("image/");
        if (type === "video") return file.type.startsWith("video/");
        if (type === "doc") return file.type.includes("pdf") || file.type.includes("document");
        return false;
      });

      if (validFiles.length > 0) {
        handleBulkFileUpload(validFiles);
      } else {
        toast({
          title: "Invalid Files",
          description: `Please drop ${type} files only.`,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editAsset ? "Edit Asset" : "Add Asset"}</DialogTitle>
          <DialogDescription>
            Add images, videos, text, URLs, or documents to your asset library.
            {(type === "image" || type === "video" || type === "doc") && " Files will be uploaded automatically."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asset-type">Type</Label>
              <Select value={type} onValueChange={(val: any) => setType(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="doc">Document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="asset-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="brand_kit">Brand Kit</SelectItem>
                  <SelectItem value="campaign">Campaign</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="asset-name">Name</Label>
            <Input
              id="asset-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter asset name..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="asset-description">Description</Label>
            <Textarea
              id="asset-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a brief description..."
              rows={2}
            />
          </div>

          {type === "text" && (
            <div className="space-y-2">
              <Label htmlFor="asset-text">Text Content</Label>
              <Textarea
                id="asset-text"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Enter text content..."
                rows={6}
              />
            </div>
          )}

          {type === "url" && (
            <div className="space-y-2">
              <Label htmlFor="asset-url">URL</Label>
              <div className="flex gap-2">
                <Input
                  id="asset-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleScrapeUrl}
                  disabled={isScraping || !url}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  {isScraping ? "Scraping..." : "Scrape"}
                </Button>
              </div>
            </div>
          )}

          {(type === "image" || type === "video" || type === "doc") && (
            <div className="space-y-2">
              <Label>Upload Files (Multiple supported)</Label>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadProgress ? (
                  <div className="space-y-3">
                    <Upload className="w-8 h-8 mx-auto text-primary animate-pulse" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        Uploading {uploadProgress.current} of {uploadProgress.total} files...
                      </p>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : previewUrl && (type === "image" || type === "video") ? (
                  <div className="space-y-2">
                    {type === "image" ? (
                      <img src={previewUrl} alt="Preview" className="max-h-40 mx-auto rounded" />
                    ) : (
                      <video src={previewUrl} className="max-h-40 mx-auto rounded" controls />
                    )}
                    <p className="text-xs text-muted-foreground">Click to change</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      Drag & drop multiple files or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {type === "image" && "PNG, JPG, WEBP • Multiple files supported"}
                      {type === "video" && "MP4, MOV, WebM • Max 50MB per file"}
                      {type === "doc" && "PDF, DOC, DOCX, TXT • Multiple files supported"}
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={
                  type === "image" ? "image/*" :
                  type === "video" ? "video/mp4,video/quicktime,video/webm" :
                  ".pdf,.doc,.docx,.txt"
                }
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    if (type === "video") {
                      const oversized = files.filter(f => f.size > 50 * 1024 * 1024);
                      if (oversized.length > 0) {
                        toast({
                          title: "Files Too Large",
                          description: `${oversized.length} video file(s) exceed 50MB limit.`,
                          variant: "destructive",
                        });
                        return;
                      }
                    }
                    handleBulkFileUpload(files);
                  }
                }}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="asset-tags">Tags (comma-separated)</Label>
            <div className="flex gap-2">
              <Input
                id="asset-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. campaign, meta, product"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAutoTag}
                disabled={isAutoTagging}
                title="Generate tags using AI"
              >
                {isAutoTagging ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Cancel
          </Button>
          {(type === "text" || type === "url") && (
            <Button
              onClick={handleSubmit}
              disabled={
                !name || 
                addAssetMutation.isPending || 
                (type === "text" && !textContent.trim()) ||
                (type === "url" && !url.trim())
              }
            >
              {editAsset ? "Update Asset" : "Add Asset"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
