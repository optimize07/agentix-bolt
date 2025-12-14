import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Database } from "@/integrations/supabase/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Grid,
  List,
  SortAsc,
  Filter,
  MoreVertical,
  Pin,
  Pencil,
  Trash2,
  Archive,
  Eye,
  Download,
  ExternalLink,
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
} from "lucide-react";
import { KnowledgeBaseCard, type KBItem } from "./KnowledgeBaseCard";
import { KnowledgeBaseEditModal } from "./KnowledgeBaseEditModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getKnowledgeBaseFileUrl } from "@/lib/knowledge-base-utils";

interface KnowledgeBaseTableProps {
  clientId?: string;
  department?: string;
  scope?: "agency" | "client" | "project" | "task";
  projectId?: string;
  onSelect?: (items: KBItem[]) => void;
  selectable?: boolean;
  maxSelect?: number;
  categoryFilter?: string[];
  showUpload?: boolean;
  onUploadClick?: () => void;
  onEdit?: (item: KBItem) => void;
  onPushToClients?: (item: KBItem) => void;
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

function formatFileSize(bytes?: number): string {
  if (!bytes) return "-";
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

export function KnowledgeBaseTable({
  clientId,
  department,
  scope,
  projectId,
  onSelect,
  selectable = false,
  maxSelect,
  categoryFilter,
  showUpload = true,
  onUploadClick,
  onEdit,
  onPushToClients,
}: KnowledgeBaseTableProps) {
  const [items, setItems] = useState<KBItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [editItem, setEditItem] = useState<KBItem | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  async function fetchItems() {
    setLoading(true);
    try {
      let query = supabase
        .from("knowledge_base_items")
        .select("*")
        .eq("is_archived", false)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (clientId) query = query.eq("client_id", clientId);
      if (department) query = query.eq("source_department", department);
      if (scope) query = query.eq("scope", scope);
      if (projectId) query = query.eq("project_id", projectId);
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
    fetchItems();
  }, [clientId, department, scope, projectId]);

  // Filter items based on search and filters
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase()) ||
      item.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    const matchesDepartment = filterDepartment === "all" || item.source_department === filterDepartment;

    return matchesSearch && matchesCategory && matchesDepartment;
  });

  const handleSelectItem = (item: KBItem, selected: boolean) => {
    const newSelected = new Set(selectedItems);
    if (selected) {
      if (maxSelect && newSelected.size >= maxSelect) {
        toast.info(`Maximum ${maxSelect} items can be selected`);
        return;
      }
      newSelected.add(item.id);
    } else {
      newSelected.delete(item.id);
    }
    setSelectedItems(newSelected);
    onSelect?.(filteredItems.filter((i) => newSelected.has(i.id)));
  };

  const handleTogglePin = async (item: KBItem) => {
    try {
      const { error } = await supabase
        .from("knowledge_base_items")
        .update({ is_pinned: !item.is_pinned })
        .eq("id", item.id);

      if (error) throw error;
      toast.success(item.is_pinned ? "Unpinned" : "Pinned");
      fetchItems();
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  const handleArchive = async (item: KBItem) => {
    try {
      const { error } = await supabase
        .from("knowledge_base_items")
        .update({ is_archived: true })
        .eq("id", item.id);

      if (error) throw error;
      toast.success("Archived");
      fetchItems();
    } catch (err) {
      toast.error("Failed to archive");
    }
  };

  const handleDelete = async (item: KBItem) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      // Delete from storage if file exists
      if (item.file_path) {
        await supabase.storage.from("knowledge-base").remove([item.file_path]);
      }

      const { error } = await supabase.from("knowledge_base_items").delete().eq("id", item.id);

      if (error) throw error;
      toast.success("Deleted");
      fetchItems();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const handleEdit = (item: KBItem) => {
    if (onEdit) {
      onEdit(item);
    } else {
      setEditItem(item);
      setEditModalOpen(true);
    }
  };

  const handleEditSuccess = () => {
    fetchItems();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search knowledge base..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[160px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
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

        <Select value={filterDepartment} onValueChange={setFilterDepartment}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departmentOptions.map((dept) => (
              <SelectItem key={dept.value} value={dept.value}>
                {dept.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        {showUpload && onUploadClick && (
          <Button onClick={onUploadClick}>Upload</Button>
        )}
      </div>

      {/* Selection info */}
      {selectable && selectedItems.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2">
          <span className="text-sm font-medium text-primary">
            {selectedItems.size} item{selectedItems.size > 1 ? "s" : ""} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedItems(new Set());
              onSelect?.([]);
            }}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredItems.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No items found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {search || filterCategory !== "all" || filterDepartment !== "all"
              ? "Try adjusting your search or filters"
              : "Upload your first knowledge base item to get started"}
          </p>
        </div>
      )}

      {/* Grid View */}
      {!loading && filteredItems.length > 0 && viewMode === "grid" && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <KnowledgeBaseCard
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onTogglePin={handleTogglePin}
              onArchive={handleArchive}
              onDelete={handleDelete}
              onPushToClients={onPushToClients}
              onSelect={selectable ? handleSelectItem : undefined}
              isSelected={selectedItems.has(item.id)}
              selectable={selectable}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {!loading && filteredItems.length > 0 && viewMode === "list" && (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                {selectable && <TableHead className="w-[40px]" />}
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const Icon = categoryOptions.find((c) => c.value === item.category)?.icon || FileText;
                return (
                  <TableRow key={item.id} className={selectedItems.has(item.id) ? "bg-primary/5" : ""}>
                    {selectable && (
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={(e) => handleSelectItem(item, e.target.checked)}
                          className="h-4 w-4 rounded border-border"
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {item.is_pinned && <Pin className="h-3 w-3 text-primary" />}
                            <span className="font-medium">{item.title}</span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.category.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.source_department}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatFileSize(item.file_size)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(item.created_at)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {item.external_url && (
                            <DropdownMenuItem asChild>
                              <a href={item.external_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open External
                              </a>
                            </DropdownMenuItem>
                          )}
                          {item.file_path && (
                            <KnowledgeBaseTableDownloadLink filePath={item.file_path} />
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(item)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePin(item)}>
                            <Pin className="mr-2 h-4 w-4" />
                            {item.is_pinned ? "Unpin" : "Pin"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleArchive(item)}>
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(item)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Modal */}
      <KnowledgeBaseEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        item={editItem}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}

// Helper component for download link in table
function KnowledgeBaseTableDownloadLink({ filePath }: { filePath: string }) {
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

export default KnowledgeBaseTable;

