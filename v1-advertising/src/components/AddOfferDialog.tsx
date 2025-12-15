import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";
import { Upload, X, FileText, Image as ImageIcon, Video } from "lucide-react";

interface AddOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  groups: any[];
  editOffer?: any;
}

interface UploadedFile {
  file: File;
  type: "image" | "video" | "document";
  preview?: string;
  uploading?: boolean;
}

export function AddOfferDialog({
  open,
  onOpenChange,
  projectId,
  groups,
  editOffer,
}: AddOfferDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    discount: "",
    guarantee: "",
    usp: "",
    cta: "",
    tags: "",
    group_id: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  useEffect(() => {
    if (editOffer) {
      setFormData({
        name: editOffer.name || "",
        description: editOffer.description || "",
        price: editOffer.price || "",
        discount: editOffer.discount || "",
        guarantee: editOffer.guarantee || "",
        usp: editOffer.usp || "",
        cta: editOffer.cta || "",
        tags: editOffer.tags?.join(", ") || "",
        group_id: editOffer.group_id || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        discount: "",
        guarantee: "",
        usp: "",
        cta: "",
        tags: "",
        group_id: "",
      });
      setUploadedFiles([]);
    }
  }, [editOffer, open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles: UploadedFile[] = files.map((file) => {
      const mimeType = file.type;
      let type: "image" | "video" | "document" = "document";

      if (mimeType.startsWith("image/")) {
        type = "image";
      } else if (mimeType.startsWith("video/")) {
        type = "video";
      }

      const preview = type === "image" ? URL.createObjectURL(file) : undefined;

      return { file, type, preview };
    });

    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const offerData = {
        project_id: projectId,
        name: formData.name,
        description: formData.description || null,
        price: formData.price || null,
        discount: formData.discount || null,
        guarantee: formData.guarantee || null,
        usp: formData.usp || null,
        cta: formData.cta || null,
        tags: tagsArray,
        group_id: formData.group_id === "ungrouped" ? null : formData.group_id || null,
      };

      let offerId: string;

      if (editOffer) {
        // Update existing offer
        const { error } = await supabase
          .from("offers")
          .update(offerData)
          .eq("id", editOffer.id);
        if (error) throw error;
        offerId = editOffer.id;
      } else {
        // Create new offer
        const { data, error } = await supabase
          .from("offers")
          .insert([offerData])
          .select()
          .single();
        if (error) throw error;
        offerId = data.id;
      }

      // Upload files if any
      if (uploadedFiles.length > 0) {
        for (const uploadFile of uploadedFiles) {
          const fileName = `${offerId}/${Date.now()}_${uploadFile.file.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("canvas-uploads")
            .upload(fileName, uploadFile.file);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from("canvas-uploads")
            .getPublicUrl(uploadData.path);

          // Save asset reference
          const { error: assetError } = await supabase.from("offer_assets").insert([
            {
              offer_id: offerId,
              type: uploadFile.type,
              url: urlData.publicUrl,
              name: uploadFile.file.name,
              file_size: uploadFile.file.size,
              mime_type: uploadFile.file.type,
            },
          ]);

          if (assetError) throw assetError;
        }
      }

      return offerId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      sonnerToast.success(editOffer ? "Offer updated successfully" : "Offer created successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      sonnerToast.error(editOffer ? "Failed to update offer" : "Failed to create offer");
      console.error("Save error:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      sonnerToast.error("Please enter an offer name");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editOffer ? "Edit Offer" : "Add New Offer"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Offer Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Summer Sale Bundle"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your offer..."
              rows={3}
            />
          </div>

          {/* Price & Discount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="e.g., $99.99"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount">Discount</Label>
              <Input
                id="discount"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                placeholder="e.g., 20% OFF"
              />
            </div>
          </div>

          {/* Guarantee */}
          <div className="space-y-2">
            <Label htmlFor="guarantee">Guarantee</Label>
            <Input
              id="guarantee"
              value={formData.guarantee}
              onChange={(e) => setFormData({ ...formData, guarantee: e.target.value })}
              placeholder="e.g., 30-day money-back guarantee"
            />
          </div>

          {/* USP */}
          <div className="space-y-2">
            <Label htmlFor="usp">Unique Selling Proposition</Label>
            <Textarea
              id="usp"
              value={formData.usp}
              onChange={(e) => setFormData({ ...formData, usp: e.target.value })}
              placeholder="What makes this offer special?"
              rows={2}
            />
          </div>

          {/* CTA */}
          <div className="space-y-2">
            <Label htmlFor="cta">Call to Action</Label>
            <Input
              id="cta"
              value={formData.cta}
              onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
              placeholder="e.g., Buy Now, Get Started Today"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., summer, discount, bundle"
            />
          </div>

          {/* Group */}
          <div className="space-y-2">
            <Label htmlFor="group">Group (optional)</Label>
            <Select
              value={formData.group_id}
              onValueChange={(value) => setFormData({ ...formData, group_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ungrouped">Ungrouped</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Assets & Documents</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                type="file"
                id="file-upload"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload images, videos, or documents
                </p>
              </label>
            </div>

            {/* Uploaded Files Preview */}
            {uploadedFiles.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="relative border border-border rounded-lg p-2 flex items-center gap-2"
                  >
                    {file.type === "image" && file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : file.type === "video" ? (
                      <Video className="w-12 h-12 text-muted-foreground" />
                    ) : (
                      <FileText className="w-12 h-12 text-muted-foreground" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{file.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editOffer ? "Update Offer" : "Create Offer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
