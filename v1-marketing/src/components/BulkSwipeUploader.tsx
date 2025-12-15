import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDocumentParsing } from "@/contexts/DocumentParsingContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, X, FileImage, FileVideo, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadFile {
  id: string;
  file: File;
  name: string;
  type: "image" | "video" | "document";
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
  url?: string;
}

interface BulkSwipeUploaderProps {
  projectId: string | null;
  groupId?: string | null;
  onComplete: () => void;
}

export function BulkSwipeUploader({ projectId, groupId, onComplete }: BulkSwipeUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToQueue } = useDocumentParsing();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      const event = {
        target: { files: droppedFiles }
      } as any;
      handleFileSelection(event);
    }
  };

  const getFileType = (file: File): "image" | "video" | "document" | null => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    
    // Check for document types including Word documents
    if (
      file.type === "application/pdf" ||
      file.type === "application/msword" ||  // .doc
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||  // .docx
      file.type === "text/plain" ||  // .txt
      file.name.toLowerCase().endsWith('.doc') ||
      file.name.toLowerCase().endsWith('.docx') ||
      file.name.toLowerCase().endsWith('.pdf') ||
      file.name.toLowerCase().endsWith('.txt')
    ) return "document";
    
    return null;
  };

  const getFileIcon = (type: "image" | "video" | "document") => {
    switch (type) {
      case "image":
        return FileImage;
      case "video":
        return FileVideo;
      case "document":
        return FileText;
    }
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    const newFiles: UploadFile[] = selectedFiles
      .filter((file) => {
        const type = getFileType(file);
        if (!type) {
          toast.error(`${file.name}: Unsupported file type`);
          return false;
        }
        
        const maxSize = type === "video" ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
        if (file.size > maxSize) {
          toast.error(`${file.name}: File too large (max ${type === "video" ? "100MB" : "20MB"})`);
          return false;
        }
        
        return true;
      })
      .map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        type: getFileType(file)!,
        status: "pending" as const,
        progress: 0,
      }));

    setFiles((prev) => [...prev, ...newFiles]);
    event.target.value = "";
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadFile = async (uploadFile: UploadFile): Promise<UploadFile> => {
    try {
      const fileExt = uploadFile.file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `swipe-files/${fileName}`;

      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: "uploading" as const, progress: 0 } : f
        )
      );

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("canvas-uploads")
        .upload(filePath, uploadFile.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("canvas-uploads").getPublicUrl(filePath);

      setFiles((prev) =>
        prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 70 } : f))
      );

      // Create swipe_files entry
      const swipeData: any = {
        project_id: null,
        title: uploadFile.file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        type: uploadFile.type,
        group_id: groupId === "ungrouped" ? null : groupId,
        parsing_status: uploadFile.type === "document" ? "pending" : "none",
      };

      if (uploadFile.type === "image") {
        swipeData.image_url = publicUrl;
      } else if (uploadFile.type === "video") {
        swipeData.video_url = publicUrl;
      } else if (uploadFile.type === "document") {
        swipeData.file_url = publicUrl;
      }

      const { data: newRecord, error: insertError } = await supabase
        .from("swipe_files")
        .insert(swipeData)
        .select()
        .single();

      if (insertError) throw insertError;

      // Queue document for background parsing if it's a document
      if (uploadFile.type === "document" && newRecord) {
        addToQueue(
          uploadFile.file,
          newRecord.id,
          "swipe_files",
          uploadFile.file.name
        );
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: "success" as const, progress: 100, url: publicUrl }
            : f
        )
      );

      return { ...uploadFile, status: "success", progress: 100, url: publicUrl };
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: "error" as const, error: errorMessage }
            : f
        )
      );

      return { ...uploadFile, status: "error", error: errorMessage };
    }
  };

  const handleUploadAll = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    const pendingFiles = files.filter((f) => f.status === "pending" || f.status === "error");

    try {
      // Process files in parallel batches of 3 to avoid overwhelming the server
      const batchSize = 3;
      const batches: UploadFile[][] = [];
      
      for (let i = 0; i < pendingFiles.length; i += batchSize) {
        batches.push(pendingFiles.slice(i, i + batchSize));
      }

      // Process each batch in parallel
      for (const batch of batches) {
        await Promise.all(batch.map(file => uploadFile(file)));
      }

      const successCount = files.filter((f) => f.status === "success").length;
      const errorCount = files.filter((f) => f.status === "error").length;

      if (errorCount === 0) {
        toast.success(`Successfully uploaded ${successCount} file${successCount !== 1 ? "s" : ""}`);
        onComplete();
        setFiles([]);
      } else {
        toast.warning(`Uploaded ${successCount} file${successCount !== 1 ? "s" : ""}, ${errorCount} failed`);
      }
    } catch (error) {
      toast.error("Bulk upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const uploadingCount = files.filter((f) => f.status === "uploading").length;
  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            size="sm"
            variant="outline"
          >
            <Upload className="h-4 w-4 mr-2" />
            Select Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx"
            onChange={handleFileSelection}
            className="hidden"
          />
          {files.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {pendingCount > 0 && `${pendingCount} pending`}
              {uploadingCount > 0 && ` • ${uploadingCount} uploading`}
              {successCount > 0 && ` • ${successCount} uploaded`}
              {errorCount > 0 && ` • ${errorCount} failed`}
            </div>
          )}
        </div>
        {files.length > 0 && (
          <div className="flex gap-2">
            <Button
              onClick={handleUploadAll}
              disabled={isUploading || pendingCount === 0}
              size="sm"
            >
              Upload {pendingCount > 0 ? `${pendingCount} File${pendingCount !== 1 ? "s" : ""}` : "All"}
            </Button>
            {!isUploading && (
              <Button onClick={() => setFiles([])} variant="ghost" size="sm">
                Clear All
              </Button>
            )}
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4">
          {files.map((file) => {
            const Icon = getFileIcon(file.type);
            return (
              <div
                key={file.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      ({(file.file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  {file.status === "uploading" && (
                    <Progress value={file.progress} className="h-1 mt-1" />
                  )}
                  {file.status === "error" && (
                    <p className="text-xs text-destructive mt-1">{file.error}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {file.status === "success" && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                  {file.status === "error" && (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  {file.status === "pending" && !isUploading && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(file.id)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {files.length === 0 && (
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-border"
          )}
        >
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-2">
            {isDragging ? "Drop files here" : "Drag & drop files here or click Select Files"}
          </p>
          <p className="text-xs text-muted-foreground">
            Images & PDFs: up to 20MB • Videos: up to 100MB
          </p>
        </div>
      )}
    </div>
  );
}
