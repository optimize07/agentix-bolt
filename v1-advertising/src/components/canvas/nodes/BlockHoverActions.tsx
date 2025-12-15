import { memo } from "react";
import { Pencil, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BlockHoverActionsProps {
  isHovered: boolean;
  onEdit?: () => void;
  onCopy?: () => void;
  onDownload?: () => void;
  content?: string;
  downloadUrl?: string;
  showEdit?: boolean;
  showCopy?: boolean;
  showDownload?: boolean;
}

export const BlockHoverActions = memo(({
  isHovered,
  onEdit,
  onCopy,
  onDownload,
  content,
  downloadUrl,
  showEdit = true,
  showCopy = true,
  showDownload = false,
}: BlockHoverActionsProps) => {
  
  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard");
    }
    onCopy?.();
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, "_blank");
    }
    onDownload?.();
  };

  if (!isHovered) return null;

  return (
    <div className="absolute top-2 right-2 z-30 flex items-center gap-1 bg-card/90 backdrop-blur-sm rounded-md p-1 shadow-lg border border-border">
      {showEdit && onEdit && (
        <Button size="sm" variant="secondary" className="h-7 w-7 p-0" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}
      {showCopy && content && (
        <Button size="sm" variant="secondary" className="h-7 w-7 p-0" onClick={handleCopy}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
      )}
      {showDownload && downloadUrl && (
        <Button size="sm" variant="secondary" className="h-7 w-7 p-0" onClick={handleDownload}>
          <Download className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
});

BlockHoverActions.displayName = "BlockHoverActions";
