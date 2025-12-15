import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Image, FileText, Link as LinkIcon, File, Video } from "lucide-react";

interface Asset {
  id: string;
  name: string;
  type: string;
  url_or_path?: string | null;
  text_content?: string | null;
  thumbnail_url?: string | null;
  category?: string | null;
  description?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  tags?: string[] | null;
}

interface AssetCardProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
  variant?: "card" | "list";
}

export default function AssetCard({ asset, onEdit, onDelete, variant = "card" }: AssetCardProps) {
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatCategory = (category?: string | null) => {
    if (!category) return "";
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const renderPreview = () => {
    switch (asset.type) {
      case "image":
        return (
          <div className="w-full h-40 bg-muted rounded-md overflow-hidden">
            {asset.url_or_path ? (
              <img
                src={asset.url_or_path}
                alt={asset.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Image className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
          </div>
        );

      case "video":
        return (
          <div className="w-full h-40 bg-muted rounded-md overflow-hidden relative">
            {asset.url_or_path ? (
              <>
                <video
                  src={asset.url_or_path}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-12 h-12 bg-primary/80 rounded-full flex items-center justify-center">
                    <Video className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Video className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
          </div>
        );

      case "url":
        return (
          <div className="w-full h-40 bg-muted rounded-md overflow-hidden flex items-center justify-center p-4">
            <div className="text-center space-y-2">
              <LinkIcon className="w-8 h-8 text-muted-foreground mx-auto" />
              {asset.url_or_path && (
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {new URL(asset.url_or_path).hostname}
                </p>
              )}
            </div>
          </div>
        );

      case "text":
        return (
          <div className="w-full h-40 bg-muted rounded-md overflow-hidden p-4">
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground line-clamp-6">
                {asset.text_content?.substring(0, 200) || "No content"}
              </p>
            </div>
          </div>
        );

      case "doc":
        return (
          <div className="w-full h-40 bg-muted rounded-md overflow-hidden flex items-center justify-center">
            <div className="text-center space-y-2">
              <File className="w-12 h-12 text-muted-foreground mx-auto" />
              {asset.mime_type && (
                <Badge variant="outline" className="text-xs">
                  {asset.mime_type.split("/").pop()?.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="w-full h-40 bg-muted rounded-md overflow-hidden flex items-center justify-center">
            <File className="w-12 h-12 text-muted-foreground" />
          </div>
        );
    }
  };

  if (variant === "list") {
    return (
      <Card
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/asset-id', asset.id);
          e.dataTransfer.setData('application/asset-data', JSON.stringify({
            id: asset.id,
            name: asset.name,
            type: asset.type,
            url: asset.url_or_path,
            content: asset.text_content,
          }));
          e.dataTransfer.effectAllowed = 'copy';
        }}
        className="overflow-hidden hover:border-primary/50 transition-colors group cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-4 p-3">
          {/* Mini thumbnail */}
          <div className="w-10 h-10 flex-shrink-0 bg-muted rounded overflow-hidden">
            {asset.type === "image" && asset.url_or_path ? (
              <img src={asset.url_or_path} alt={asset.name} className="w-full h-full object-cover" />
            ) : asset.type === "video" && asset.url_or_path ? (
              <div className="w-full h-full relative">
                <video src={asset.url_or_path} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
            ) : asset.type === "url" ? (
              <div className="w-full h-full flex items-center justify-center">
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
              </div>
            ) : asset.type === "text" ? (
              <div className="w-full h-full flex items-center justify-center">
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <File className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Name and type */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{asset.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-xs capitalize">{asset.type}</Badge>
              {asset.file_size && (
                <span className="text-xs text-muted-foreground">{formatFileSize(asset.file_size)}</span>
              )}
            </div>
          </div>

          {/* Category */}
          {asset.category && (
            <Badge variant="secondary" className="text-xs flex-shrink-0">
              {formatCategory(asset.category)}
            </Badge>
          )}

          {/* Action buttons */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(asset)}
            >
              <Pencil className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onDelete(asset.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/asset-id', asset.id);
        e.dataTransfer.setData('application/asset-data', JSON.stringify({
          id: asset.id,
          name: asset.name,
          type: asset.type,
          url: asset.url_or_path,
          content: asset.text_content,
        }));
        e.dataTransfer.effectAllowed = 'copy';
      }}
      className="overflow-hidden hover:border-primary/50 transition-colors group cursor-grab active:cursor-grabbing"
    >
      {renderPreview()}
      
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{asset.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground capitalize">{asset.type}</p>
              {asset.file_size && (
                <>
                  <span className="text-xs text-muted-foreground">•</span>
                  <p className="text-xs text-muted-foreground">{formatFileSize(asset.file_size)}</p>
                </>
              )}
            </div>
          </div>
          
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(asset)}
            >
              <Pencil className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onDelete(asset.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {asset.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {asset.description}
              </p>
            )}

            <div className="flex items-center gap-1.5 flex-wrap">
              {asset.category && (
                <Badge variant="secondary" className="text-xs">
                  {formatCategory(asset.category)}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {asset.tags && asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {asset.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {asset.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{asset.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
