import { useState, useCallback, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  FileText,
  Image,
  Link,
  MessageSquare,
  Trash2,
  Loader2,
  Move,
  GripVertical,
  BookText,
  Video,
  Sparkles,
  Brain,
  ZoomIn,
  ZoomOut,
  Focus,
  Undo2,
  Redo2,
  Box,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface CanvasBlock {
  id: string;
  type: string;
  title: string | null;
  content: string | null;
  url: string | null;
  file_path: string | null;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
}

export default function Canvas() {
  const { boardId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [addBlockDialogOpen, setAddBlockDialogOpen] = useState(false);
  const [newBlockType, setNewBlockType] = useState("text");
  const [newBlockTitle, setNewBlockTitle] = useState("");
  const [newBlockContent, setNewBlockContent] = useState("");
  const [newBlockUrl, setNewBlockUrl] = useState("");
  const [draggingBlock, setDraggingBlock] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  // viewScale renders the canvas; coordinates stored in DB stay unscaled integers.
  const [viewScale, setViewScale] = useState(1);
  const [brainDialogOpen, setBrainDialogOpen] = useState(false);
  const [brainSearch, setBrainSearch] = useState("");
  const [spacePressed, setSpacePressed] = useState(false);

  // Track spacebar for pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !spacePressed) {
        setSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setSpacePressed(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [spacePressed]);

  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ["canvas-blocks", boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("canvas_blocks")
        .select("*")
        .eq("agent_board_id", boardId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as CanvasBlock[];
    },
    enabled: !!boardId,
  });

  const addBlockMutation = useMutation({
    mutationFn: async (newBlock: Partial<CanvasBlock>) => {
      const { error } = await supabase.from("canvas_blocks").insert([{
        agent_board_id: boardId,
        ...newBlock,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-blocks", boardId] });
      toast({ title: "Block added", description: "New block added to canvas" });
      setAddBlockDialogOpen(false);
      setNewBlockTitle("");
      setNewBlockContent("");
      setNewBlockUrl("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateBlockMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CanvasBlock> }) => {
      const { error } = await supabase
        .from("canvas_blocks")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-blocks", boardId] });
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("canvas_blocks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-blocks", boardId] });
      toast({ title: "Block deleted" });
    },
  });

  const handleAddBlock = () => {
    // Place new blocks at a random position
    const posX = Math.round(Math.random() * 400 + 50);
    const posY = Math.round(Math.random() * 300 + 50);

    addBlockMutation.mutate({
      type: newBlockType,
      title: newBlockTitle || `New ${newBlockType} block`,
      content: newBlockContent || null,
      url: newBlockUrl || null,
      position_x: posX,
      position_y: posY,
      width: 280,
      height: 200,
    });
  };

  const handleMouseDown = (e: React.MouseEvent, blockId: string, block: CanvasBlock) => {
    if ((e.target as HTMLElement).closest(".drag-handle")) {
      e.preventDefault();
      const rect = contentRef.current?.getBoundingClientRect();
      if (rect) {
        setDraggingBlock(blockId);
        setDragOffset({
          x: (e.clientX - rect.left) / viewScale - block.position_x,
          y: (e.clientY - rect.top) / viewScale - block.position_y,
        });
      }
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // start panning when clicking empty space or holding spacebar + click
    const target = e.target as HTMLElement;
    const isOnBlock = target.closest(".canvas-block");
    const isSpacePan = e.button === 0 && spacePressed;
    if ((!isOnBlock || isSpacePan) && canvasRef.current) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX,
        y: e.clientY,
        scrollLeft: canvasRef.current.scrollLeft,
        scrollTop: canvasRef.current.scrollTop,
      });
      // prevent text selection
      e.preventDefault();
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && canvasRef.current) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      canvasRef.current.scrollLeft = panStart.scrollLeft - deltaX;
      canvasRef.current.scrollTop = panStart.scrollTop - deltaY;
      return;
    }

    if (draggingBlock) {
      const rect = contentRef.current?.getBoundingClientRect();
      if (!rect) return;

      const newX = Math.round((e.clientX - rect.left) / viewScale - dragOffset.x);
      const newY = Math.round((e.clientY - rect.top) / viewScale - dragOffset.y);
      
      queryClient.setQueryData(["canvas-blocks", boardId], (old: CanvasBlock[] | undefined) =>
        old?.map(block => 
          block.id === draggingBlock 
            ? { ...block, position_x: newX, position_y: newY }
            : block
        )
      );
    }
  }, [draggingBlock, dragOffset, boardId, queryClient, isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (draggingBlock) {
      const block = blocks.find(b => b.id === draggingBlock);
      if (block) {
        updateBlockMutation.mutate({
          id: draggingBlock,
          updates: { position_x: block.position_x, position_y: block.position_y },
        });
      }
      setDraggingBlock(null);
    }
  }, [draggingBlock, blocks, updateBlockMutation, isPanning]);

  const getBlockIcon = (type: string) => {
    switch (type) {
      case "text": return <FileText className="w-4 h-4" />;
      case "image": return <Image className="w-4 h-4" />;
      case "url": return <Link className="w-4 h-4" />;
      case "chat": return <MessageSquare className="w-4 h-4" />;
    case "doc": return <BookText className="w-4 h-4" />;
    case "video": return <Video className="w-4 h-4" />;
    case "creative": return <Sparkles className="w-4 h-4" />;
    case "brain": return <Brain className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

const toolItems = [
  { type: "image", label: "Image", icon: <Image className="w-4 h-4" />, hint: "References, inspo" },
  { type: "text", label: "Text", icon: <FileText className="w-4 h-4" />, hint: "Notes, concepts" },
  { type: "url", label: "URL", icon: <Link className="w-4 h-4" />, hint: "Competitive links" },
  { type: "doc", label: "Doc", icon: <BookText className="w-4 h-4" />, hint: "Briefs, scripts" },
  { type: "video", label: "Video", icon: <Video className="w-4 h-4" />, hint: "Cuts, references" },
  { type: "creative", label: "Creative", icon: <Sparkles className="w-4 h-4" />, hint: "Ideas, variants" },
  { type: "brain", label: "Brain", icon: <Brain className="w-4 h-4" />, hint: "From Central Brain" },
  { type: "chat", label: "Chat", icon: <MessageSquare className="w-4 h-4" />, hint: "Prompt threads" },
];

const CanvasToolPalette = ({
  onSelect,
  onZoomIn,
  onZoomOut,
  onCenter,
}: {
  onSelect: (type: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenter: () => void;
}) => (
  <Card className="p-3 shadow-lg border-border/70 bg-card/95 backdrop-blur">
    <div className="text-xs font-semibold text-muted-foreground mb-2">Canvas tools</div>
    <div className="flex flex-col gap-2">
      {toolItems.map((tool) => (
        <Button
          key={tool.type}
          variant="ghost"
          size="sm"
          className="justify-start gap-2"
          onClick={() => onSelect(tool.type)}
        >
          {tool.icon}
          <div className="flex flex-col items-start leading-tight">
            <span className="text-sm text-foreground">{tool.label}</span>
            <span className="text-[11px] text-muted-foreground">{tool.hint}</span>
          </div>
        </Button>
      ))}
    </div>
    <div className="my-3 border-t border-border/50" />
    <div className="grid grid-cols-3 gap-1">
      <Button variant="ghost" size="icon" onClick={onZoomIn} title="Zoom in">
        <ZoomIn className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onZoomOut} title="Zoom out">
        <ZoomOut className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onCenter} title="Center canvas">
        <Focus className="w-4 h-4" />
      </Button>
    </div>
    <div className="my-3 border-t border-border/50" />
    <div className="grid grid-cols-3 gap-1 opacity-60">
      <Button variant="ghost" size="icon" disabled title="Undo (coming soon)">
        <Undo2 className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" disabled title="Redo (coming soon)">
        <Redo2 className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" disabled title="Add Box (coming soon)">
        <Box className="w-4 h-4" />
      </Button>
    </div>
  </Card>
);

  if (!boardId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please select a project</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b bg-card flex items-center gap-2">
        <Button onClick={() => setAddBlockDialogOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Block
        </Button>
        <div className="text-sm text-muted-foreground ml-4">
          {blocks.length} block{blocks.length !== 1 ? "s" : ""} on canvas
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        ref={canvasRef}
        className="flex-1 relative overflow-auto bg-muted/30"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseDown={handleCanvasMouseDown}
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
      >
        {/* Canvas tool palette */}
        <div className="absolute top-4 left-4 z-30 w-52 pointer-events-auto">
          <CanvasToolPalette
            onSelect={(type) => {
              if (type === "brain") {
                setBrainDialogOpen(true);
                return;
              }
              setNewBlockType(type);
              setAddBlockDialogOpen(true);
            }}
            onZoomIn={() => setViewScale((s) => Math.min(2, +(s * 1.1).toFixed(2)))}
            onZoomOut={() => setViewScale((s) => Math.max(0.5, +(s / 1.1).toFixed(2)))}
            onCenter={() => {
              setViewScale(1);
              if (!canvasRef.current || blocks.length === 0) {
                canvasRef.current?.scrollTo({ top: 1000, left: 1000, behavior: "smooth" });
                return;
              }
              const bounds = blocks.reduce(
                (acc, b) => ({
                  minX: Math.min(acc.minX, b.position_x),
                  minY: Math.min(acc.minY, b.position_y),
                  maxX: Math.max(acc.maxX, b.position_x + (b.width || 0)),
                  maxY: Math.max(acc.maxY, b.position_y + (b.height || 0)),
                }),
                { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
              );
              const viewportW = canvasRef.current.clientWidth || 0;
              const viewportH = canvasRef.current.clientHeight || 0;
              const centerX = bounds.minX + (bounds.maxX - bounds.minX) / 2;
              const centerY = bounds.minY + (bounds.maxY - bounds.minY) / 2;
              const targetX = Math.max(0, centerX - viewportW / 2);
              const targetY = Math.max(0, centerY - viewportH / 2);
              canvasRef.current.scrollTo({ top: targetY, left: targetX, behavior: "smooth" });
            }}
          />
        </div>

        <div
          ref={contentRef}
          className="min-h-full min-w-full relative"
          style={{
            minHeight: "4000px",
            minWidth: "4000px",
            transform: `scale(${viewScale})`,
            transformOrigin: "top left",
          }}
        >
          {/* Grid background */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          {/* Blocks */}
          {blocks.map((block) => (
            <div
              key={block.id}
              className="canvas-block absolute group"
              style={{
                left: block.position_x,
                top: block.position_y,
                width: block.width,
                zIndex: draggingBlock === block.id ? 100 : 1,
              }}
              onMouseDown={(e) => handleMouseDown(e, block.id, block)}
            >
              <Card className="h-full p-0 overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all">
                {/* Block Header */}
                <div className="flex items-center justify-between gap-2 p-3 border-b bg-muted/50">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="drag-handle cursor-move p-1 hover:bg-muted rounded">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                    </div>
                    {getBlockIcon(block.type)}
                    <span className="font-medium text-sm truncate">{block.title}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="outline" className="text-xs">{block.type}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => deleteBlockMutation.mutate(block.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Block Content */}
                <div className="p-3 max-h-[200px] overflow-auto">
                  {block.type === "image" && block.url && (
                    <img src={block.url} alt={block.title || ""} className="w-full h-auto rounded" />
                  )}
                  {block.type === "url" && block.url && (
                    <a 
                      href={block.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm break-all"
                    >
                      {block.url}
                    </a>
                  )}
                  {block.content && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {block.content}
                    </p>
                  )}
                  {!block.content && !block.url && (
                    <p className="text-sm text-muted-foreground italic">No content</p>
                  )}
                </div>
              </Card>
            </div>
          ))}

          {/* Empty state */}
          {blocks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Empty Canvas</h3>
                <p className="text-muted-foreground mb-4">
                  Add blocks to start building your creative workflow
                </p>
                <Button onClick={() => setAddBlockDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Block
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Block Dialog */}
      <Dialog open={addBlockDialogOpen} onOpenChange={setAddBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Block</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Block Type</Label>
              <Select value={newBlockType} onValueChange={setNewBlockType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                      <SelectItem value="doc">Doc</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                      <SelectItem value="brain">Brain</SelectItem>
                      <SelectItem value="chat">Chat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={newBlockTitle}
                onChange={(e) => setNewBlockTitle(e.target.value)}
                placeholder="Block title..."
              />
            </div>

            {(newBlockType === "text" || newBlockType === "chat") && (
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={newBlockContent}
                  onChange={(e) => setNewBlockContent(e.target.value)}
                  placeholder="Enter content..."
                  className="min-h-[100px]"
                />
              </div>
            )}

            {(newBlockType === "image" || newBlockType === "url") && (
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={newBlockUrl}
                  onChange={(e) => setNewBlockUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddBlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBlock} disabled={addBlockMutation.isPending}>
              Add Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Brain Picker Dialog */}
      <BrainPickerDialog
        open={brainDialogOpen}
        onOpenChange={setBrainDialogOpen}
        search={brainSearch}
        onSearchChange={setBrainSearch}
        onSelectItem={(item) => {
          const posX = Math.random() * 400 + 50;
          const posY = Math.random() * 300 + 50;
          addBlockMutation.mutate({
            type: "brain",
            title: item.title,
            content: item.description || null,
            url: item.external_url || item.file_path || null,
            position_x: posX,
            position_y: posY,
            width: 320,
            height: 220,
          });
          setBrainDialogOpen(false);
        }}
      />
    </div>
  );
}


interface BrainItem {
  id: string;
  title: string;
  description: string | null;
  category?: string | null;
  external_url?: string | null;
  file_path?: string | null;
  source_department?: string | null;
  tags?: string[] | null;
}

interface BrainPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onSelectItem: (item: BrainItem) => void;
}

function BrainPickerDialog({
  open,
  onOpenChange,
  search,
  onSearchChange,
  onSelectItem,
}: BrainPickerDialogProps) {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["brain-items"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_base_items")
        .select("id,title,description,category,external_url,file_path,source_department,tags,indexing_status,is_archived")
        .eq("is_archived", false)
        .in("indexing_status", ["indexed", "processing"])
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as BrainItem[];
    },
  });

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q) ||
      (item.category || "").toLowerCase().includes(q) ||
      (item.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add from Brain</DialogTitle>
          <DialogDescription>Select indexed knowledge base items to drop onto the canvas.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            placeholder="Search Brain items..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />

          <div className="max-h-[320px] overflow-auto space-y-2">
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading knowledge base...
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
              <p className="text-sm text-muted-foreground">No items found.</p>
            )}

            {filtered.map((item) => (
              <Card
                key={item.id}
                className="p-3 hover:border-primary/50 cursor-pointer transition-colors"
                onClick={() => onSelectItem(item)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.category && (
                        <Badge variant="secondary" className="text-xs">
                          {item.category}
                        </Badge>
                      )}
                      {item.source_department && (
                        <Badge variant="outline" className="text-xs">
                          {item.source_department}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => onSelectItem(item)}>
                    Add
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
