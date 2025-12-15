import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BlockEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block: {
    id: string;
    type: string;
    data: {
      title?: string;
      content?: string;
      url?: string;
      file_path?: string;
    };
  } | null;
  onSave: (blockId: string, updates: {
    title?: string;
    content?: string;
    url?: string;
    file_path?: string;
  }) => void;
}

export function BlockEditDialog({
  open,
  onOpenChange,
  block,
  onSave,
}: BlockEditDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [filePath, setFilePath] = useState("");

  useEffect(() => {
    if (block) {
      setTitle(block.data.title || "");
      setContent(block.data.content || "");
      setUrl(block.data.url || "");
      setFilePath(block.data.file_path || "");
    }
  }, [block]);

  const handleSave = () => {
    if (!block) return;

    const updates: any = { title };

    if (block.type === "text") {
      updates.content = content;
    } else if (block.type === "image") {
      updates.url = url;
    } else if (block.type === "url") {
      updates.url = url;
    } else if (block.type === "document") {
      updates.file_path = filePath;
    } else if (block.type === "video") {
      updates.url = url;
    }

    onSave(block.id, updates);
    onOpenChange(false);
  };

  if (!block) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit {block.type} Block</DialogTitle>
          <DialogDescription>
            Update the content of this block
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Block title"
            />
          </div>

          {block.type === "text" && (
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Block content"
                rows={6}
              />
            </div>
          )}

          {(block.type === "image" || block.type === "video" || block.type === "url") && (
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={`Enter ${block.type} URL`}
              />
            </div>
          )}

          {block.type === "document" && (
            <div className="space-y-2">
              <Label htmlFor="filePath">File Path</Label>
              <Input
                id="filePath"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="Document file path"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
