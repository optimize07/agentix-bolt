import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Image,
  Video,
  Music,
  FileCode,
  Palette,
  Star,
  MoreVertical,
  ExternalLink,
  Download,
  Pencil,
  Trash2,
  Pin,
  Archive,
  Eye,
  BookOpen,
  Target,
  HelpCircle,
  Gift,
  Send,
} from "lucide-react";
import { getKnowledgeBaseFileUrl } from "@/lib/knowledge-base-utils";

export interface KBItem {
  id: string;
  scope: "agency" | "client" | "project" | "task";
  client_id?: string | null;
  project_id?: string | null;
  task_id?: string | null;
  source_department: string;
  category: string;
  title: string;
  description?: string | null;
  tags?: string[] | null;
  file_path?: string | null;
  external_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  metadata?: Record<string, unknown> | unknown;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface KnowledgeBaseCardProps {
  item: KBItem;
  onView?: (item: KBItem) => void;
  onEdit?: (item: KBItem) => void;
  onDelete?: (item: KBItem) => void;
  onTogglePin?: (item: KBItem) => void;
  onArchive?: (item: KBItem) => void;
  onPushToClients?: (item: KBItem) => void;
  onSelect?: (item: KBItem, selected: boolean) => void;
  onUpdate?: () => void;
  isSelected?: boolean;
  selectable?: boolean;
  compact?: boolean;
}

const categoryIcons: Record<string, React.ElementType> = {
  document: FileText,
  image: Image,
  video: Video,
  audio: Music,
  template: FileCode,
  script: FileCode,
  brand_asset: Palette,
  winning_ad: Star,
  research: BookOpen,
  playbook: Target,
  faq: HelpCircle,
  offer: Gift,
};

const categoryColors: Record<string, string> = {
  document: "bg-blue-500/20 text-blue-400",
  image: "bg-purple-500/20 text-purple-400",
  video: "bg-red-500/20 text-red-400",
  audio: "bg-amber-500/20 text-amber-400",
  template: "bg-cyan-500/20 text-cyan-400",
  script: "bg-emerald-500/20 text-emerald-400",
  brand_asset: "bg-pink-500/20 text-pink-400",
  winning_ad: "bg-yellow-500/20 text-yellow-400",
  research: "bg-indigo-500/20 text-indigo-400",
  playbook: "bg-orange-500/20 text-orange-400",
  faq: "bg-teal-500/20 text-teal-400",
  offer: "bg-rose-500/20 text-rose-400",
};

const departmentColors: Record<string, string> = {
  strategy: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  advertising: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  marketing: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  sales: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  operations: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  financials: "bg-green-500/10 text-green-400 border-green-500/30",
  admin: "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Helper component for image preview with signed URL
function KnowledgeBaseImagePreview({
  category,
  filePath,
  title,
  CategoryIcon,
  categoryColors,
}: {
  category: string;
  filePath?: string;
  title: string;
  CategoryIcon: React.ElementType;
  categoryColors: Record<string, string>;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (category === "image" && filePath) {
      getKnowledgeBaseFileUrl(filePath)
        .then((url) => {
          setImageUrl(url);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [category, filePath]);

  return (
    <div className={`h-32 flex items-center justify-center ${categoryColors[category]}`}>
      {category === "image" && filePath && imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover"
          onError={() => setImageUrl(null)}
        />
      ) : loading ? (
        <div className="h-full w-full flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <CategoryIcon className="h-12 w-12" />
      )}
    </div>
  );
}

// Helper component for download link with signed URL
function KnowledgeBaseDownloadLink({ filePath }: { filePath: string }) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getKnowledgeBaseFileUrl(filePath, 3600)
      .then((url) => {
        setDownloadUrl(url);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [filePath]);

  if (loading || !downloadUrl) {
    return (
      <DropdownMenuItem disabled>
        <Download className="mr-2 h-4 w-4" />
        Loading...
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuItem asChild>
      <a href={downloadUrl} download>
        <Download className="mr-2 h-4 w-4" />
        Download
      </a>
    </DropdownMenuItem>
  );
}

export function KnowledgeBaseCard({
  item,
  onView,
  onEdit,
  onDelete,
  onTogglePin,
  onArchive,
  onPushToClients,
  onSelect,
  isSelected,
  selectable,
  compact,
}: KnowledgeBaseCardProps) {
  const CategoryIcon = categoryIcons[item.category] || FileText;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/50 ${
          isSelected ? "ring-2 ring-primary" : ""
        } ${selectable ? "cursor-pointer" : ""}`}
        onClick={selectable && onSelect ? () => onSelect(item, !isSelected) : undefined}
      >
        {selectable && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect?.(item, e.target.checked)}
            className="h-4 w-4 rounded border-border"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${categoryColors[item.category]}`}>
          <CategoryIcon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {item.is_pinned && <Pin className="h-3 w-3 text-primary" />}
            <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {item.category.replace("_", " ")} • {formatDate(item.created_at)}
          </p>
        </div>
        {onView && (
          <Button variant="ghost" size="icon" onClick={() => onView(item)}>
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={`relative border border-border bg-card overflow-hidden transition-all hover:shadow-lg ${
      isSelected ? "ring-2 ring-primary" : ""
    }`}>
      {/* Pinned indicator */}
      {item.is_pinned && (
        <div className="absolute top-2 right-2 z-10">
          <Pin className="h-4 w-4 text-primary fill-primary" />
        </div>
      )}

      {/* Thumbnail / Icon area */}
      <KnowledgeBaseImagePreview
        category={item.category}
        filePath={item.file_path}
        title={item.title}
        CategoryIcon={CategoryIcon}
        categoryColors={categoryColors}
      />

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{item.title}</h3>
            {item.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(item)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
              )}
              {item.external_url && (
                <DropdownMenuItem asChild>
                  <a href={item.external_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open External
                  </a>
                </DropdownMenuItem>
              )}
              {item.file_path && (
                <KnowledgeBaseDownloadLink filePath={item.file_path} />
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit?.(item)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {onPushToClients && item.scope === "agency" && (
                <DropdownMenuItem onClick={() => onPushToClients(item)}>
                  <Send className="mr-2 h-4 w-4" />
                  Push to Clients
                </DropdownMenuItem>
              )}
              {onTogglePin && (
                <DropdownMenuItem onClick={() => onTogglePin(item)}>
                  <Pin className="mr-2 h-4 w-4" />
                  {item.is_pinned ? "Unpin" : "Pin"}
                </DropdownMenuItem>
              )}
              {onArchive && (
                <DropdownMenuItem onClick={() => onArchive(item)}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(item)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={departmentColors[item.source_department]}>
            {item.source_department}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {item.category.replace("_", " ")}
          </Badge>
          {item.file_size && (
            <span className="text-xs text-muted-foreground">{formatFileSize(item.file_size)}</span>
          )}
        </div>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">+{item.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
          {selectable && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect?.(item, e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
          )}
        </div>
      </div>
    </Card>
  );
}

export default KnowledgeBaseCard;

