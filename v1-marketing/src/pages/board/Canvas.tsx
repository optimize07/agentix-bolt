import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
} from "@dnd-kit/core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CentralBrainModal } from "@/components/CentralBrainModal";
import {
  Image as ImageIcon,
  Link as LinkIcon,
  FileText,
  Type,
  Layers,
  Video,
  Brain,
  Trash2,
  MessageSquare,
  Upload,
  Grid,
  ZoomIn,
  ZoomOut,
  Home,
  Plus,
  GripVertical,
  Undo,
  Redo,
  Pencil,
  MessageSquarePlus,
  Loader2,
  FolderPlus,
  X,
  Copy,
  CopyPlus,
} from "lucide-react";
import { CanvasChatWidget } from "@/components/CanvasChatWidget";
import { ChatBlock } from "@/components/canvas/ChatBlock";
import { cn } from "@/lib/utils";
import { useCanvasHistory } from "@/hooks/use-canvas-history";
import { EdgeRenderer } from "@/components/canvas/EdgeRenderer";
import { ConnectionHandle } from "@/components/canvas/ConnectionHandle";
import { HandlePosition } from "@/lib/edgeCalculations";

interface Block {
  id: string;
  type: "image" | "text" | "url" | "document" | "video" | "group" | "chat";
  content?: string;
  title?: string;
  url?: string;
  file_path?: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  color?: string;
  metadata?: any;
  group_id?: string | null;
  instruction_prompt?: string;
}

interface EdgeData {
  id: string;
  source_block_id: string;
  target_block_id: string;
  edge_type: 'bezier' | 'straight' | 'step';
  color?: string;
  metadata?: any;
}

export default function Canvas() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const activeBlockRef = useRef<Block | null>(null);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newBlockType, setNewBlockType] = useState<Block["type"] | null>(null);
  const [newBlockData, setNewBlockData] = useState({
    title: "",
    content: "",
    url: "",
    color: "#f97316",
    instruction_prompt: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeBlock, setActiveBlock] = useState<Block | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [pendingUpload, setPendingUpload] = useState<{
    file: File;
    type: "image" | "document";
    file_path: string;
    dropX?: number;
    dropY?: number;
  } | null>(null);
  const [assetDetails, setAssetDetails] = useState({
    name: "",
    description: "",
  });
  const [isAssetDetailsDialogOpen, setIsAssetDetailsDialogOpen] = useState(false);
  const [isAddToGroupDialogOpen, setIsAddToGroupDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedBlocksToAdd, setSelectedBlocksToAdd] = useState<string[]>([]);
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [clipboardBlocks, setClipboardBlocks] = useState<Block[]>([]);
  const [pasteCount, setPasteCount] = useState(0);
  
  // Refs to avoid stale closure in keyboard handler
  const selectedBlocksRef = useRef<string[]>([]);
  const clipboardBlocksRef = useRef<Block[]>([]);
  const blocksRef = useRef<Block[]>([]);
  
  const [isResizing, setIsResizing] = useState(false);
  const [resizingBlockId, setResizingBlockId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [centralBrainOpen, setCentralBrainOpen] = useState(false);
  const [selectedBlockForChat, setSelectedBlockForChat] = useState<Block | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [editBlockData, setEditBlockData] = useState({
    title: "",
    content: "",
    url: "",
    color: "#f97316",
    instruction_prompt: "",
  });
  const [pendingToolbarDrop, setPendingToolbarDrop] = useState<{ x: number; y: number } | null>(null);
  
  // Keep refs in sync with state
  useEffect(() => {
    selectedBlocksRef.current = selectedBlocks;
  }, [selectedBlocks]);

  useEffect(() => {
    clipboardBlocksRef.current = clipboardBlocks;
  }, [clipboardBlocks]);
  
  // Edge/Connection state
  const [connectionMode, setConnectionMode] = useState<{ 
    active: boolean; 
    sourceBlockId: string | null;
    sourceHandle: HandlePosition | null;
  }>({ active: false, sourceBlockId: null, sourceHandle: null });
  const [tempEdge, setTempEdge] = useState<{ 
    sourceBlockId: string; 
    sourceHandle: HandlePosition;
    targetX: number; 
    targetY: number 
  } | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  const GRID_SIZE = 20;
  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 2;
  const ZOOM_STEP = 0.25;
  const MIN_BLOCK_WIDTH = 150;
  const MIN_BLOCK_HEIGHT = 100;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Custom collision detection that prioritizes group drop zones
  const customCollisionDetection: CollisionDetection = (args) => {
    // First, check for groups using pointerWithin (more precise)
    const pointerCollisions = pointerWithin(args);
    const groupCollision = pointerCollisions.find(c => 
      c.id.toString().startsWith('group-')
    );
    
    if (groupCollision) {
      console.log("🎯 Group collision detected:", groupCollision.id);
      return [groupCollision];
    }
    
    // Fallback to standard rect intersection
    return rectIntersection(args);
  };

  const { data: blocks = [] } = useQuery({
    queryKey: ["canvas-blocks", boardId],
    queryFn: async () => {
      if (!boardId) return [];
      const { data, error } = await supabase
        .from("canvas_blocks")
        .select("*")
        .eq("agent_board_id", boardId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Block[];
    },
    enabled: !!boardId,
  });

  // Sync blocksRef after blocks is available
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  const { data: edges = [] } = useQuery({
    queryKey: ["canvas-edges", boardId],
    queryFn: async () => {
      if (!boardId) return [];
      const { data, error } = await supabase
        .from("canvas_edges")
        .select("*")
        .eq("agent_board_id", boardId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as EdgeData[];
    },
    enabled: !!boardId,
  });

  // Batch restore function for undo/redo
  const handleRestoreState = async (restoredBlocks: Block[]) => {
    if (!boardId) return;

    try {
      // Get current blocks
      const currentBlocks = blocks;
      
      // Find blocks that were deleted (in current but not in restored)
      const deletedIds = currentBlocks
        .filter(cb => !restoredBlocks.find(rb => rb.id === cb.id))
        .map(b => b.id);
      
      // Find blocks that were added (in restored but not in current)
      const addedBlocks = restoredBlocks.filter(rb => !currentBlocks.find(cb => cb.id === rb.id));
      
      // Find blocks that were modified (exist in both but different)
      const modifiedBlocks = restoredBlocks.filter(rb => {
        const current = currentBlocks.find(cb => cb.id === rb.id);
        return current && JSON.stringify(current) !== JSON.stringify(rb);
      });

      // Perform all operations
      const operations = [];

      // Delete removed blocks
      if (deletedIds.length > 0) {
        operations.push(
          supabase.from("canvas_blocks").delete().in("id", deletedIds)
        );
      }

      // Add new blocks
      if (addedBlocks.length > 0) {
        operations.push(
          supabase.from("canvas_blocks").insert(
            addedBlocks.map(b => ({
              ...b,
              agent_board_id: boardId,
            }))
          )
        );
      }

      // Update modified blocks
      for (const block of modifiedBlocks) {
        operations.push(
          supabase.from("canvas_blocks").update(block).eq("id", block.id)
        );
      }

      await Promise.all(operations);
      
      // Refresh the query
      await queryClient.invalidateQueries({ queryKey: ["canvas-blocks", boardId] });
    } catch (error) {
      console.error("Failed to restore state:", error);
      toast({
        title: "Restore failed",
        description: "Failed to restore canvas state",
        variant: "destructive",
      });
    }
  };

  // Undo/Redo history management
  const {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    isRestoring,
  } = useCanvasHistory({
    currentBlocks: blocks,
    onRestore: handleRestoreState,
  });

  const updateBlockMutation = useMutation({
    mutationFn: async ({ 
      id, 
      position_x, 
      position_y,
      width,
      height,
      title,
      content,
      url,
      color,
      instruction_prompt
    }: { 
      id: string; 
      position_x?: number; 
      position_y?: number;
      width?: number;
      height?: number;
      title?: string;
      content?: string;
      url?: string;
      color?: string;
      instruction_prompt?: string;
    }) => {
      const updateData: any = {};
      if (position_x !== undefined) updateData.position_x = position_x;
      if (position_y !== undefined) updateData.position_y = position_y;
      if (width !== undefined) updateData.width = width;
      if (height !== undefined) updateData.height = height;
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (url !== undefined) updateData.url = url;
      if (color !== undefined) updateData.color = color;
      if (instruction_prompt !== undefined) updateData.instruction_prompt = instruction_prompt;
      
      const { error } = await supabase
        .from("canvas_blocks")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["canvas-blocks", boardId] });
      const previousBlocks = queryClient.getQueryData(["canvas-blocks", boardId]);
      queryClient.setQueryData(["canvas-blocks", boardId], (old: Block[] = []) => 
        old.map(b => b.id === newData.id ? { ...b, ...newData } : b)
      );
      return { previousBlocks };
    },
    onError: (err, newData, context: any) => {
      queryClient.setQueryData(["canvas-blocks", boardId], context.previousBlocks);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-blocks", boardId] });
      saveState();
    },
  });

  const assignToGroupMutation = useMutation({
    mutationFn: async ({ blockId, groupId }: { blockId: string; groupId: string | null }) => {
      console.log("📤 Mutation starting:", { blockId, groupId });
      const { error, data } = await supabase
        .from("canvas_blocks")
        .update({ group_id: groupId })
        .eq("id", blockId)
        .select();
      
      if (error) {
        console.error("❌ Mutation error:", error);
        throw error;
      }
      console.log("✅ Mutation success:", data);
      return { groupId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["canvas-blocks", boardId] });
      saveState();
      toast({
        title: data.groupId ? "Added to group" : "Removed from group",
        description: data.groupId ? "Block has been added to the group." : "Block has been removed from the group.",
      });
    },
    onError: (error) => {
      console.error("❌ Mutation onError:", error);
      toast({
        title: "Error",
        description: "Failed to update block group assignment",
        variant: "destructive",
      });
    },
  });

  const addBlockMutation = useMutation({
    mutationFn: async (blockData: Omit<Partial<Block>, 'id'> & { type: Block['type'] }) => {
      const { error } = await supabase.from("canvas_blocks").insert([{
        agent_board_id: boardId!,
        type: blockData.type,
        content: blockData.content || null,
        title: blockData.title || null,
        url: blockData.url || null,
        file_path: blockData.file_path || null,
        position_x: Math.round(blockData.position_x || 0),
        position_y: Math.round(blockData.position_y || 0),
        width: blockData.width || 200,
        height: blockData.height || 200,
        color: blockData.color || null,
        metadata: blockData.metadata || null,
        instruction_prompt: blockData.instruction_prompt || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-blocks", boardId] });
      setIsAddDialogOpen(false);
      setNewBlockData({ title: "", content: "", url: "", color: "#f97316", instruction_prompt: "" });
      saveState();
      toast({
        title: "Block added",
        description: "New block has been added to the canvas.",
      });
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("canvas_blocks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-blocks", boardId] });
      saveState();
      toast({
        title: "Block deleted",
        description: "Block has been removed from the canvas.",
      });
    },
  });

  const addEdgeMutation = useMutation({
    mutationFn: async ({ 
      sourceBlockId, 
      targetBlockId 
    }: { 
      sourceBlockId: string; 
      targetBlockId: string;
    }) => {
      const { error } = await supabase.from("canvas_edges").insert([{
        agent_board_id: boardId!,
        source_block_id: sourceBlockId,
        target_block_id: targetBlockId,
        edge_type: 'bezier',
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-edges", boardId] });
      toast({
        title: "Connection created",
        description: "Blocks have been connected.",
      });
    },
  });

  const deleteEdgeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("canvas_edges").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-edges", boardId] });
      setSelectedEdgeId(null);
      toast({
        title: "Connection deleted",
        description: "Edge has been removed.",
      });
    },
  });

  const handleFileUpload = async (
    file: File, 
    type: "image" | "document",
    dropX?: number,
    dropY?: number
  ) => {
    if (!boardId) return;
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${boardId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("canvas-uploads")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("canvas-uploads")
        .getPublicUrl(fileName);

      // Open dialog for asset details
      setPendingUpload({
        file,
        type,
        file_path: publicUrl,
        dropX,
        dropY,
      });
      setAssetDetails({
        name: file.name,
        description: "",
      });
      setIsAssetDetailsDialogOpen(true);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveAssetDetails = () => {
    if (!pendingUpload) return;
    
    addBlockMutation.mutate({
      type: pendingUpload.type,
      title: assetDetails.name,
      file_path: pendingUpload.file_path,
      content: assetDetails.description || undefined,
      position_x: Math.round(pendingUpload.dropX ?? Math.random() * 400),
      position_y: Math.round(pendingUpload.dropY ?? Math.random() * 400),
      width: pendingUpload.type === "image" ? 300 : 200,
      height: pendingUpload.type === "image" ? 200 : 150,
    });
    
    setIsAssetDetailsDialogOpen(false);
    setPendingUpload(null);
    setAssetDetails({ name: "", description: "" });

    toast({
      title: "Asset added",
      description: `${assetDetails.name} has been added to the canvas.`,
    });
  };

  const handleSkipDetails = () => {
    if (!pendingUpload) return;
    
    addBlockMutation.mutate({
      type: pendingUpload.type,
      title: pendingUpload.file.name,
      file_path: pendingUpload.file_path,
      position_x: Math.round(pendingUpload.dropX ?? Math.random() * 400),
      position_y: Math.round(pendingUpload.dropY ?? Math.random() * 400),
      width: pendingUpload.type === "image" ? 300 : 200,
      height: pendingUpload.type === "image" ? 200 : 150,
    });
    
    setIsAssetDetailsDialogOpen(false);
    setPendingUpload(null);
    setAssetDetails({ name: "", description: "" });

    toast({
      title: "File uploaded",
      description: `${pendingUpload.file.name} has been added to the canvas.`,
    });
  };

  const handleAddBlock = () => {
    if (!newBlockType) return;

    const baseBlock = {
      type: newBlockType,
      position_x: pendingToolbarDrop ? pendingToolbarDrop.x : Math.round(Math.random() * 400),
      position_y: pendingToolbarDrop ? pendingToolbarDrop.y : Math.round(Math.random() * 400),
      width: 250,
      height: 200,
      instruction_prompt: newBlockData.instruction_prompt,
    };

    switch (newBlockType) {
      case "text":
        addBlockMutation.mutate({ ...baseBlock, title: newBlockData.title, content: newBlockData.content });
        break;
      case "url":
        addBlockMutation.mutate({ ...baseBlock, title: newBlockData.title, url: newBlockData.url, color: newBlockData.color });
        break;
      case "group":
        addBlockMutation.mutate({ ...baseBlock, title: newBlockData.title, width: 400, height: 300, color: newBlockData.color });
        break;
      case "video":
        addBlockMutation.mutate({ ...baseBlock, title: newBlockData.title, url: newBlockData.url });
        break;
      case "chat":
        addBlockMutation.mutate({ ...baseBlock, title: newBlockData.title || "Chat Widget", width: 350, height: 450 });
        break;
      default:
        addBlockMutation.mutate(baseBlock);
    }
    
    setPendingToolbarDrop(null);
  };

  const handleUseInChat = (block: Block) => {
    navigate(`/projects/${boardId}/chat`, {
      state: { referencedBlock: block },
    });
  };

  const snapToGridPosition = (x: number, y: number) => {
    if (!snapToGrid) return { x, y };
    return {
      x: Math.round(x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(y / GRID_SIZE) * GRID_SIZE,
    };
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  const handleResetView = () => {
    setPanOffset({ x: 0, y: 0 });
    setZoomLevel(1);
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Only zoom when CTRL is held
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      // deltaY < 0 = scroll up = zoom in
      // deltaY > 0 = scroll down = zoom out
      const zoomDelta = e.deltaY < 0 ? ZOOM_STEP / 2 : -ZOOM_STEP / 2;
      
      setZoomLevel(prev => {
        const newZoom = Math.min(Math.max(prev + zoomDelta, MIN_ZOOM), MAX_ZOOM);
        return newZoom;
      });
    }
  };

  // Keyboard shortcuts for zoom and undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete key for edges
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedEdgeId && !e.target || (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          e.preventDefault();
          deleteEdgeMutation.mutate(selectedEdgeId);
        }
      }
      // Escape key to cancel connection mode
      else if (e.key === 'Escape') {
        if (connectionMode.active) {
          setConnectionMode({ active: false, sourceBlockId: null, sourceHandle: null });
          setTempEdge(null);
        }
        if (selectedEdgeId) {
          setSelectedEdgeId(null);
        }
      }
      else if ((e.ctrlKey || e.metaKey)) {
        // Copy: Ctrl+C
        if (e.key === 'c' && !e.shiftKey) {
          e.preventDefault();
          handleCopy();
        }
        // Paste: Ctrl+V
        else if (e.key === 'v' && !e.shiftKey) {
          e.preventDefault();
          handlePaste();
        }
        // Duplicate: Ctrl+D
        else if (e.key === 'd' && !e.shiftKey) {
          e.preventDefault();
          handleDuplicate();
        }
        // Select All: Ctrl+A
        else if (e.key === 'a' && !e.shiftKey) {
          e.preventDefault();
          setSelectedBlocks(blocks.map(b => b.id));
        }
        // Undo: Ctrl+Z
        else if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          if (canUndo) {
            undo();
            toast({
              title: "Undo",
              description: "Previous action undone",
            });
          }
        }
        // Redo: Ctrl+Shift+Z or Ctrl+Y
        else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          if (canRedo) {
            redo();
            toast({
              title: "Redo",
              description: "Action redone",
            });
          }
        }
        // Zoom shortcuts
        else if (!e.shiftKey) {
          if (e.key === '=' || e.key === '+') {
            e.preventDefault();
            handleZoomIn();
          } else if (e.key === '-') {
            e.preventDefault();
            handleZoomOut();
          } else if (e.key === '0') {
            e.preventDefault();
            handleZoomReset();
          }
        }
      }
    };

    const keyHandler = (e: KeyboardEvent) => {
      // Only handle if canvas is focused or active
      if (canvasRef.current && document.activeElement && 
          (canvasRef.current.contains(document.activeElement) || document.activeElement === document.body)) {
        handleKeyDown(e);
      }
    };
    window.addEventListener('keydown', keyHandler, { capture: true });
    return () => window.removeEventListener('keydown', keyHandler, { capture: true });
  }, [canUndo, canRedo, undo, redo, selectedEdgeId, connectionMode]);

  // Prevent default browser zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventDefaultZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    // Use non-passive listener to allow preventDefault
    canvas.addEventListener('wheel', preventDefaultZoom, { passive: false });
    
    return () => {
      canvas.removeEventListener('wheel', preventDefaultZoom);
    };
  }, []);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start panning if a block drag is in progress
    if (activeBlock) return;
    
    const target = e.target as HTMLElement;
    const isOnBlock = target.closest('[data-block="true"]');
    const isOnInteractive = target.closest('button, a, input, [role="button"]');
    
    // Shift+click for selection rectangle
    if (e.shiftKey && e.button === 0 && !isOnBlock && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const startX = (e.clientX - rect.left - panOffset.x) / zoomLevel;
      const startY = (e.clientY - rect.top - panOffset.y) / zoomLevel;
      
      setIsSelecting(true);
      setSelectionStart({ x: startX, y: startY });
      setSelectionEnd({ x: startX, y: startY });
      e.preventDefault();
      return;
    }
    
    if (e.button === 0 && !isOnBlock && !isOnInteractive) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      // Clear selection when clicking empty canvas (without shift)
      if (!e.shiftKey) {
        clearSelection();
      }
      e.preventDefault();
    }
  };

  // Keep activeBlockRef in sync with activeBlock state
  useEffect(() => {
    activeBlockRef.current = activeBlock;
  }, [activeBlock]);

  // Global mouse listeners for panning outside canvas
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Handle selection rectangle
      if (isSelecting && canvasRef.current && selectionStart) {
        const rect = canvasRef.current.getBoundingClientRect();
        const endX = (e.clientX - rect.left - panOffset.x) / zoomLevel;
        const endY = (e.clientY - rect.top - panOffset.y) / zoomLevel;
        
        setSelectionEnd({ x: endX, y: endY });
        
        // Find blocks within selection rectangle
        const minX = Math.min(selectionStart.x, endX);
        const maxX = Math.max(selectionStart.x, endX);
        const minY = Math.min(selectionStart.y, endY);
        const maxY = Math.max(selectionStart.y, endY);
        
        const blocksInSelection = blocks.filter(block => {
          const blockX = block.position_x || 0;
          const blockY = block.position_y || 0;
          const blockW = block.width || 200;
          const blockH = block.height || 200;
          
          return (
            blockX < maxX &&
            blockX + blockW > minX &&
            blockY < maxY &&
            blockY + blockH > minY
          );
        });
        
        setSelectedBlocks(blocksInSelection.map(b => b.id));
      }
      
      // Only handle if panning started from canvas (and not dragging a block)
      if (isPanning && canvasRef.current && !activeBlockRef.current) {
        setPanOffset({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsPanning(false);
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    };

    if (isPanning || isSelecting) {
      window.addEventListener('mousemove', handleGlobalMouseMove, { capture: true });
      window.addEventListener('mouseup', handleGlobalMouseUp, { capture: true });
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove, { capture: true });
      window.removeEventListener('mouseup', handleGlobalMouseUp, { capture: true });
    };
  }, [isPanning, panStart, isSelecting, selectionStart, blocks, panOffset, zoomLevel, activeBlock]);

  const handleDragStart = (event: DragStartEvent) => {
    console.log("🚀 Drag Start:", event.active.id);
    const block = blocks.find(b => b.id === event.active.id);
    setActiveBlock(block || null);
    
    // If dragging a selected block, we'll move all selected blocks
    if (selectedBlocks.includes(event.active.id as string)) {
      console.log("🚀 Dragging multiple selected blocks:", selectedBlocks);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta, collisions } = event;
    
    // DEBUG: Log the collision info
    console.log("🎯 Drag End Event:", {
      activeId: active.id,
      overId: over?.id,
      overType: over?.data?.current?.type,
      delta,
      collisions: collisions?.map(c => ({ id: c.id, data: c.data })),
    });
    
    setActiveBlock(null);

    const block = blocks.find(b => b.id === active.id);
    if (!block) {
      console.log("❌ Block not found for active.id:", active.id);
      return;
    }

    // Check if we're dragging multiple selected blocks
    const blocksToMove = selectedBlocks.includes(active.id as string) && selectedBlocks.length > 1
      ? selectedBlocks
      : [active.id as string];

    if (over && over.id.toString().startsWith("group-")) {
      const groupId = over.id.toString().replace("group-", "");
      console.log("✅ Dropping into group:", groupId);
      
      // Add all selected blocks to the group
      blocksToMove.forEach(blockId => {
        if (groupId !== blockId) {
          assignToGroupMutation.mutate({ blockId, groupId });
        }
      });
    } else {
      console.log("📍 Moving block(s) to new position");
      const deltaX = delta.x / zoomLevel;
      const deltaY = delta.y / zoomLevel;
      
      // Move all selected blocks together
      blocksToMove.forEach(blockId => {
        const b = blocks.find(bl => bl.id === blockId);
        if (b) {
          const newX = b.position_x + deltaX;
          const newY = b.position_y + deltaY;
          const snapped = snapToGridPosition(newX, newY);
          
          updateBlockMutation.mutate({
            id: blockId,
            position_x: Math.round(snapped.x),
            position_y: Math.round(snapped.y),
          });
        }
      });
    }
  };

  const getBlocksInGroup = (groupId: string) => {
    return blocks.filter(b => b.group_id === groupId);
  };

  // Get blocks connected TO a specific block (chat blocks)
  const getConnectedBlocks = (targetBlockId: string): Block[] => {
    return edges
      .filter(edge => edge.target_block_id === targetBlockId)
      .map(edge => blocks.find(b => b.id === edge.source_block_id))
      .filter(Boolean) as Block[];
  };

  // Connection handlers - enforce right-to-left flow
  const handleConnectionHandleClick = (blockId: string, handle: HandlePosition) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    if (!connectionMode.active) {
      // Only allow starting connection from RIGHT handle of content blocks
      if (block.type !== "chat" && handle === "right") {
        setConnectionMode({ active: true, sourceBlockId: blockId, sourceHandle: handle });
      }
    } else if (connectionMode.sourceBlockId === blockId) {
      // Cancel if clicking same block
      setConnectionMode({ active: false, sourceBlockId: null, sourceHandle: null });
      setTempEdge(null);
    } else {
      // Only allow completing connection to LEFT handle of chat blocks
      if (block.type === "chat" && handle === "left") {
        addEdgeMutation.mutate({
          sourceBlockId: connectionMode.sourceBlockId!,
          targetBlockId: blockId,
        });
      }
      setConnectionMode({ active: false, sourceBlockId: null, sourceHandle: null });
      setTempEdge(null);
    }
  };

  // Update temp edge position when mouse moves during connection
  useEffect(() => {
    if (!connectionMode.active || !connectionMode.sourceBlockId || !canvasRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - panOffset.x) / zoomLevel;
      const y = (e.clientY - rect.top - panOffset.y) / zoomLevel;

      setTempEdge({
        sourceBlockId: connectionMode.sourceBlockId!,
        sourceHandle: connectionMode.sourceHandle!,
        targetX: x,
        targetY: y,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [connectionMode, panOffset, zoomLevel]);

  const openAddDialog = (type: Block["type"]) => {
    setNewBlockType(type);
    setIsAddDialogOpen(true);
  };

  function DraggableBlock({ block, children }: { block: Block; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: block.id,
      data: block,
    });

    const isSelected = selectedBlocks.includes(block.id);

    const style = {
      position: "absolute" as const,
      left: block.position_x,
      top: block.position_y,
      transform: transform ? `translate3d(${transform.x / zoomLevel}px, ${transform.y / zoomLevel}px, 0)` : undefined,
      opacity: isDragging ? 0.7 : 1,
      touchAction: "none",
      transition: isDragging ? "none" : "opacity 0.2s ease-out",
      willChange: isDragging ? "transform, opacity" : "auto",
    };

    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        {...listeners} 
        {...attributes} 
        data-block="true"
        className={cn(
          isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
        onClick={(e) => {
          if (e.shiftKey) {
            e.stopPropagation();
            toggleMultiSelect(block.id, true);
          }
        }}
      >
        {children}
      </div>
    );
  }

  const handleResizeStart = (e: React.MouseEvent, blockId: string, block: Block) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizingBlockId(blockId);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: block.width,
      height: block.height,
    });
  };

  useEffect(() => {
    if (!isResizing || !resizingBlockId) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Only handle if resizing started from canvas
      if (!canvasRef.current) return;
      
      const block = blocks.find(b => b.id === resizingBlockId);
      if (!block) return;

      const deltaX = (e.clientX - resizeStart.x) / zoomLevel;
      const deltaY = (e.clientY - resizeStart.y) / zoomLevel;

      const newWidth = Math.max(MIN_BLOCK_WIDTH, resizeStart.width + deltaX);
      const newHeight = Math.max(MIN_BLOCK_HEIGHT, resizeStart.height + deltaY);

      // Optimistic update
      queryClient.setQueryData(["canvas-blocks", boardId], (old: Block[] = []) =>
        old.map(b => b.id === resizingBlockId ? { ...b, width: Math.round(newWidth), height: Math.round(newHeight) } : b)
      );
    };

    const handleMouseUp = () => {
      if (resizingBlockId) {
        const block = blocks.find(b => b.id === resizingBlockId);
        if (block) {
          updateBlockMutation.mutate({
            id: resizingBlockId,
            width: block.width,
            height: block.height,
          });
        }
      }
      setIsResizing(false);
      setResizingBlockId(null);
    };

    window.addEventListener('mousemove', handleMouseMove, { capture: true });
    window.addEventListener('mouseup', handleMouseUp, { capture: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove, { capture: true });
      window.removeEventListener('mouseup', handleMouseUp, { capture: true });
    };
  }, [isResizing, resizingBlockId, resizeStart, zoomLevel, blocks, boardId]);

  const openAddToGroupDialog = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedBlocksToAdd([]);
    setIsAddToGroupDialogOpen(true);
  };

  const handleAddBlocksToGroup = () => {
    if (!selectedGroupId || selectedBlocksToAdd.length === 0) return;

    selectedBlocksToAdd.forEach(blockId => {
      assignToGroupMutation.mutate({ blockId, groupId: selectedGroupId });
    });

    setIsAddToGroupDialogOpen(false);
    setSelectedGroupId(null);
    setSelectedBlocksToAdd([]);
  };

  const toggleBlockSelection = (blockId: string) => {
    setSelectedBlocksToAdd(prev => 
      prev.includes(blockId) ? prev.filter(id => id !== blockId) : [...prev, blockId]
    );
  };

  const toggleMultiSelect = (blockId: string, isShiftKey: boolean = false) => {
    if (isShiftKey) {
      setSelectedBlocks(prev => 
        prev.includes(blockId) 
          ? prev.filter(id => id !== blockId)
          : [...prev, blockId]
      );
    } else {
      setSelectedBlocks([blockId]);
    }
  };

  const clearSelection = () => {
    setSelectedBlocks([]);
  };

  const handleCopy = async () => {
    const currentSelected = selectedBlocksRef.current;
    if (currentSelected.length === 0) return;
    
    const blocksToCopy = blocksRef.current.filter(b => currentSelected.includes(b.id));
    setClipboardBlocks(blocksToCopy);
    setPasteCount(0);
    
    try {
      const clipboardData = JSON.stringify({
        type: 'lovable-canvas-blocks',
        blocks: blocksToCopy,
      });
      await navigator.clipboard.writeText(clipboardData);
    } catch (err) {
      console.log('Native clipboard not available');
    }
    
    toast({
      title: "Copied",
      description: `${blocksToCopy.length} block(s) copied to clipboard`,
    });
  };

  const handlePaste = async () => {
    let blocksToPaste: Block[] = [];
    
    try {
      const clipboardText = await navigator.clipboard.readText();
      
      // Try to parse as our custom block format
      try {
        const parsed = JSON.parse(clipboardText);
        if (parsed.type === 'lovable-canvas-blocks' && parsed.blocks) {
          blocksToPaste = parsed.blocks;
        }
      } catch {
        // Not JSON or not our format - check if it's a URL or text
        const trimmed = clipboardText.trim();
        
        if (trimmed && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
          // Paste as URL block with scraping
          const centerX = -panOffset.x + (window.innerWidth - 350) / (2 * zoomLevel);
          const centerY = -panOffset.y + (window.innerHeight - 350) / (2 * zoomLevel);
          
          // Scrape URL first
          toast({
            title: "Pasting URL",
            description: "Fetching page details...",
          });
          
          const { data: scrapedData } = await supabase.functions.invoke('firecrawl-scrape', {
            body: { url: trimmed }
          });
          
          addBlockMutation.mutate({
            type: 'url',
            position_x: Math.round(centerX / GRID_SIZE) * GRID_SIZE,
            position_y: Math.round(centerY / GRID_SIZE) * GRID_SIZE,
            url: trimmed,
            title: scrapedData?.title || trimmed,
            content: scrapedData?.markdown || scrapedData?.description || '',
            metadata: scrapedData ? {
              title: scrapedData.title,
              description: scrapedData.description,
              image: scrapedData.image,
              siteName: scrapedData.siteName,
              markdown: scrapedData.markdown,
              hasFirecrawl: scrapedData.hasFirecrawl,
            } : undefined,
            width: 300,
            height: 200,
          });
          
          return;
        } else if (trimmed) {
          // Paste as text block
          const centerX = -panOffset.x + (window.innerWidth - 350) / (2 * zoomLevel);
          const centerY = -panOffset.y + (window.innerHeight - 350) / (2 * zoomLevel);
          
          addBlockMutation.mutate({
            type: 'text',
            position_x: Math.round(centerX / GRID_SIZE) * GRID_SIZE,
            position_y: Math.round(centerY / GRID_SIZE) * GRID_SIZE,
            content: trimmed,
            title: trimmed.substring(0, 50) + (trimmed.length > 50 ? '...' : ''),
            width: 300,
            height: 200,
          });
          
          return;
        }
      }
    } catch (err) {
      // Clipboard access denied or unavailable
      console.log("Clipboard error:", err);
    }
    
    // Fall back to internal clipboard if no system clipboard content
    if (blocksToPaste.length === 0) {
      blocksToPaste = clipboardBlocksRef.current;
    }
    
    if (blocksToPaste.length === 0) {
      toast({
        title: "Nothing to paste",
        description: "Copy some blocks first (Ctrl+C)",
        variant: "destructive",
      });
      return;
    }
    
    const offset = 30 * (pasteCount + 1);
    setPasteCount(prev => prev + 1);
    
    const minX = Math.min(...blocksToPaste.map(b => b.position_x));
    const minY = Math.min(...blocksToPaste.map(b => b.position_y));
    
    const newBlockIds: string[] = [];
    for (const block of blocksToPaste) {
      const { data } = await supabase
        .from("canvas_blocks")
        .insert([{
          agent_board_id: boardId,
          type: block.type,
          title: block.title,
          content: block.content,
          url: block.url,
          file_path: block.file_path,
          color: block.color,
          metadata: block.metadata,
          instruction_prompt: block.instruction_prompt,
          width: block.width,
          height: block.height,
          position_x: block.position_x - minX + offset + 100,
          position_y: block.position_y - minY + offset + 100,
        }])
        .select()
        .single();
      
      if (data) newBlockIds.push(data.id);
    }
    
    await queryClient.invalidateQueries({ queryKey: ["canvas-blocks", boardId] });
    setSelectedBlocks(newBlockIds);
    saveState();
    
    toast({
      title: "Pasted",
      description: `${blocksToPaste.length} block(s) pasted`,
    });
  };

  const handleDuplicate = async () => {
    const currentSelected = selectedBlocksRef.current;
    if (currentSelected.length === 0) return;

    const blocksToDuplicate = blocksRef.current.filter(b => currentSelected.includes(b.id));
    const newBlockIds: string[] = [];
    
    for (const block of blocksToDuplicate) {
      const { data } = await supabase
        .from("canvas_blocks")
        .insert([{
          agent_board_id: boardId,
          type: block.type,
          title: block.title ? `${block.title} (copy)` : null,
          content: block.content,
          url: block.url,
          file_path: block.file_path,
          color: block.color,
          metadata: block.metadata,
          instruction_prompt: block.instruction_prompt,
          width: block.width,
          height: block.height,
          position_x: block.position_x + 30,
          position_y: block.position_y + 30,
        }])
        .select()
        .single();
      
      if (data) newBlockIds.push(data.id);
    }
    
    await queryClient.invalidateQueries({ queryKey: ["canvas-blocks", boardId] });
    setSelectedBlocks(newBlockIds);
    saveState();
    
    toast({
      title: "Duplicated",
      description: `${blocksToDuplicate.length} block(s) duplicated`,
    });
  };

  const handleBulkDelete = () => {
    if (selectedBlocks.length === 0) return;
    
    selectedBlocks.forEach(blockId => {
      deleteBlockMutation.mutate(blockId);
    });
    setSelectedBlocks([]);
    toast({
      title: "Deleted",
      description: `Removed ${selectedBlocks.length} blocks`,
    });
  };

  const handleBulkGroup = () => {
    if (selectedBlocks.length === 0) return;
    setSelectedBlocksToAdd(selectedBlocks);
    setIsAddToGroupDialogOpen(true);
  };

  function GroupBlock({ block }: { block: Block }) {
    const nestedBlocks = getBlocksInGroup(block.id);
    const { setNodeRef: setDropRef, isOver, active } = useDroppable({
      id: `group-${block.id}`,
      data: { groupId: block.id, type: "group" },
    });

    const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
      id: block.id,
      data: block,
    });

    // Don't show drop feedback if dragging the group itself
    const showDropFeedback = isOver && active?.id !== block.id;

    return (
      <div 
        ref={setDragRef}
        style={{
          position: "absolute",
          left: block.position_x,
          top: block.position_y,
          width: block.width,
          height: block.height,
          transform: transform ? `translate3d(${transform.x / zoomLevel}px, ${transform.y / zoomLevel}px, 0)` : undefined,
          opacity: isDragging ? 0.7 : 1,
          zIndex: showDropFeedback ? 50 : 10,
          transition: isDragging ? "none" : "opacity 0.2s ease-out",
          touchAction: "none",
          willChange: isDragging ? "transform, opacity" : "auto",
        }}
        data-block="true"
      >
        <Card
          className={cn(
            "h-full border-2 overflow-hidden transition-all duration-200",
            showDropFeedback && "ring-4 ring-primary scale-[1.02] shadow-xl"
          )}
          style={{
            borderColor: block.color || "#6366f1",
            backgroundColor: `${block.color}10` || "#6366f110",
          }}
        >
          {/* Draggable header */}
          <div 
            {...listeners} 
            {...attributes} 
            className="cursor-move p-2 border-b bg-card/50 hover:bg-card/80 transition-colors"
          >
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              <Layers className="w-5 h-5" style={{ color: block.color }} />
              <h3 className="font-semibold text-sm">{block.title || "Group"}</h3>
              <span className="text-xs text-muted-foreground">
                ({nestedBlocks.length} items)
              </span>
            </div>
          </div>
          
          {/* Droppable body */}
          <div ref={setDropRef} className="p-4 h-[calc(100%-3rem)] overflow-auto">
            <div className="flex flex-wrap gap-2">
              {nestedBlocks.map(nested => (
                <div 
                  key={nested.id} 
                  className="inline-flex items-center gap-1 px-2 py-1 bg-card rounded text-xs border"
                >
                  {nested.type === "text" && <Type className="w-3 h-3" />}
                  {nested.type === "image" && <ImageIcon className="w-3 h-3" />}
                  {nested.type === "url" && <LinkIcon className="w-3 h-3" />}
                  {nested.type === "document" && <FileText className="w-3 h-3" />}
                  {nested.type === "video" && <Video className="w-3 h-3" />}
                  <span className="truncate max-w-[100px]">{nested.title || nested.type}</span>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  openAddToGroupDialog(block.id);
                }}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Item
              </Button>
              {nestedBlocks.length === 0 && (
                <div className="w-full text-xs text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">
                  <Layers className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  <p>Drag blocks here or click "Add Item"</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons for Groups */}
          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out flex gap-1 z-10">
            <Button 
              variant="secondary" 
              size="icon" 
              className="h-7 w-7 rounded-full shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                handleEditBlock(block);
              }}
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>

            <Button 
              variant="secondary" 
              size="icon" 
              className="h-7 w-7 rounded-full shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                openAddToGroupDialog(block.id);
              }}
              title="Add Items"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            
            <Button 
              variant="destructive" 
              size="icon" 
              className="h-7 w-7 rounded-full shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                deleteBlockMutation.mutate(block.id);
              }}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    // Ignore drops from draggable blocks
    const target = e.target as HTMLElement;
    if (target.closest('[data-draggable="true"]')) {
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const dropX = Math.round((e.clientX - rect.left - panOffset.x) / zoomLevel);
    const dropY = Math.round((e.clientY - rect.top - panOffset.y) / zoomLevel);
    
    // Handle toolbar block type drag
    const blockType = e.dataTransfer.getData('application/block-type');
    if (blockType) {
      setPendingToolbarDrop({ x: dropX, y: dropY });
      
      // For image/document, open file picker
      if (blockType === 'image') {
        fileInputRef.current?.click();
        return;
      }
      if (blockType === 'document') {
        docInputRef.current?.click();
        return;
      }
      
      // For chat, add directly without dialog
      if (blockType === 'chat') {
        const adjustedX = snapToGrid ? Math.round(dropX / GRID_SIZE) * GRID_SIZE : dropX;
        const adjustedY = snapToGrid ? Math.round(dropY / GRID_SIZE) * GRID_SIZE : dropY;
        addBlockMutation.mutate({
          type: 'chat',
          title: 'Chat Widget',
          position_x: adjustedX,
          position_y: adjustedY,
          width: 350,
          height: 450,
        });
        setPendingToolbarDrop(null);
        return;
      }
      
      // For others, open dialog
      openAddDialog(blockType as Block["type"]);
      return;
    }
    
    // Handle asset library drops
    const assetData = e.dataTransfer.getData('application/asset-data');
    if (assetData) {
      try {
        const asset = JSON.parse(assetData);
        addBlockMutation.mutate({
          type: asset.type === 'doc' ? 'document' : asset.type,
          title: asset.name,
          url: asset.url,
          content: asset.content,
          file_path: asset.type === 'image' || asset.type === 'video' || asset.type === 'doc' ? asset.url : undefined,
          position_x: dropX,
          position_y: dropY,
          width: asset.type === 'image' ? 300 : 250,
          height: asset.type === 'image' ? 200 : 150,
          metadata: { 
            fromAssetLibrary: true,
            assetId: asset.id 
          },
        });
        toast({
          title: "Asset added",
          description: `${asset.name} has been added to the canvas.`,
        });
      } catch (error) {
        console.error('Error parsing asset data:', error);
      }
      return;
    }
    
    // Handle files (images, documents)
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        await handleFileUpload(file, 'image', dropX, dropY);
      } else {
        await handleFileUpload(file, 'document', dropX, dropY);
      }
      return;
    }
    
    // Handle URLs from browser with Firecrawl scraping
    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (url && url.startsWith('http')) {
      try {
        const urlObj = new URL(url);
        
        // Create block immediately with loading state (optimistic)
        const { data: newBlock, error: insertError } = await supabase
          .from("canvas_blocks")
          .insert([{
            agent_board_id: boardId!,
            type: 'url',
            title: 'Scraping...',
            url: url,
            position_x: dropX,
            position_y: dropY,
            width: 300,
            height: 200,
            metadata: { isLoading: true },
          }])
          .select()
          .single();

        if (insertError) throw insertError;

        // Invalidate to show the block immediately
        queryClient.invalidateQueries({ queryKey: ["canvas-blocks", boardId] });
        
        // Scrape in background (non-blocking)
        supabase.functions.invoke('firecrawl-scrape', { 
          body: { url } 
        }).then(async ({ data: scraped, error: scrapeError }) => {
          if (scrapeError || !scraped) {
            console.error('Scrape failed:', scrapeError);
            // Update with basic info on failure
            await supabase.from("canvas_blocks").update({
              title: urlObj.hostname,
              metadata: { isLoading: false },
            }).eq('id', newBlock.id);
            queryClient.invalidateQueries({ queryKey: ["canvas-blocks", boardId] });
            return;
          }

          // Update block with scraped data
          await supabase.from("canvas_blocks").update({
            title: scraped.title || urlObj.hostname,
            content: scraped.markdown || scraped.description,
            metadata: {
              isLoading: false,
              ogImage: scraped.image,
              description: scraped.description,
              siteName: scraped.siteName,
              hasContent: !!scraped.markdown,
              hasFirecrawl: scraped.hasFirecrawl,
            },
          }).eq('id', newBlock.id);
          
          queryClient.invalidateQueries({ queryKey: ["canvas-blocks", boardId] });
          
          toast({
            title: "Page scraped",
            description: scraped.hasFirecrawl ? "Rich content extracted with Firecrawl" : "Basic metadata extracted",
          });
        });
        
        saveState();
      } catch (error) {
        console.error('Error handling URL drop:', error);
        // Fallback to basic URL block
        addBlockMutation.mutate({
          type: 'url',
          title: new URL(url).hostname,
          url: url,
          position_x: dropX,
          position_y: dropY,
          width: 250,
          height: 150,
        });
      }
      return;
    }
    
    // Handle plain text
    const text = e.dataTransfer.getData('text/plain');
    if (text && !text.startsWith('http')) {
      addBlockMutation.mutate({
        type: 'text',
        title: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
        content: text,
        position_x: dropX,
        position_y: dropY,
        width: 250,
        height: 200,
      });
    }
  };

  const handleEditBlock = (block: Block) => {
    setEditingBlock(block);
    setEditBlockData({
      title: block.title || "",
      content: block.content || "",
      url: block.url || "",
      color: block.color || "#f97316",
      instruction_prompt: block.instruction_prompt || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingBlock) return;

    const updateData: any = {
      id: editingBlock.id,
    };

    if (editBlockData.title !== editingBlock.title) {
      updateData.title = editBlockData.title;
    }
    if (editBlockData.content !== editingBlock.content) {
      updateData.content = editBlockData.content;
    }
    if (editBlockData.url !== editingBlock.url) {
      updateData.url = editBlockData.url;
    }
    if (editBlockData.color !== editingBlock.color) {
      updateData.color = editBlockData.color;
    }
    if (editBlockData.instruction_prompt !== editingBlock.instruction_prompt) {
      updateData.instruction_prompt = editBlockData.instruction_prompt;
    }

    updateBlockMutation.mutate(updateData);
    setIsEditDialogOpen(false);
    setEditingBlock(null);
  };

  const renderBlock = (block: Block) => {
    const isSelected = selectedBlockId === block.id;
    const commonStyles = cn(
      "cursor-move transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
      isSelected && "ring-2 ring-primary shadow-lg shadow-primary/20"
    );

    switch (block.type) {
      case "image":
        return (
          <Card className={`p-2 ${commonStyles} bg-card`} style={{ 
            width: block.width, 
            height: block.height,
            transition: isResizing && resizingBlockId === block.id ? "none" : "width 0.15s ease-out, height 0.15s ease-out",
          }}>
            {block.file_path ? (
              <img src={block.file_path} alt={block.title} className="w-full h-full object-cover rounded" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted rounded">
                <ImageIcon className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            {block.title && <p className="text-xs mt-1 text-muted-foreground truncate">{block.title}</p>}
          </Card>
        );

      case "url":
        return (
          <Card
            className={`p-3 ${commonStyles} bg-card`}
            style={{
              width: block.width,
              height: block.height,
              transition: isResizing && resizingBlockId === block.id ? "none" : "width 0.15s ease-out, height 0.15s ease-out",
            }}
          >
            {block.metadata?.isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Scraping page...</p>
              </div>
            ) : (
              <div className="flex flex-col h-full gap-2">
                {block.metadata?.ogImage && (
                  <div className="w-full h-20 rounded overflow-hidden bg-muted">
                    <img 
                      src={block.metadata.ogImage} 
                      alt={block.title || "Preview"}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}
                
                <div className="flex-1 min-h-0 overflow-hidden">
                  <div className="flex items-start gap-2">
                    <LinkIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <h3 className="font-semibold text-sm line-clamp-2 flex-1">{block.title || "URL Block"}</h3>
                  </div>
                  {block.metadata?.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {block.metadata.description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-between gap-2 mt-auto">
                  {block.metadata?.hasContent && (
                    <Badge variant="secondary" className="text-xs">
                      📄 Content stored
                    </Badge>
                  )}
                  {block.url && (
                    <a
                      href={block.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary underline truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {new URL(block.url).hostname}
                    </a>
                  )}
                </div>
              </div>
            )}
          </Card>
        );

      case "text":
        return (
          <Card className={`p-4 ${commonStyles} bg-card`} style={{ 
            width: block.width, 
            height: block.height,
            transition: isResizing && resizingBlockId === block.id ? "none" : "width 0.15s ease-out, height 0.15s ease-out",
          }}>
            <div className="flex flex-col h-full">
              <Type className="w-5 h-5 mb-2 text-primary" />
              <h3 className="font-semibold text-sm mb-2">{block.title || "Text Block"}</h3>
              <p className="text-xs text-muted-foreground line-clamp-4 overflow-auto">{block.content}</p>
            </div>
          </Card>
        );

      case "document":
        return (
          <Card className={`p-4 ${commonStyles} bg-card`} style={{ 
            width: block.width, 
            height: block.height,
            transition: isResizing && resizingBlockId === block.id ? "none" : "width 0.15s ease-out, height 0.15s ease-out",
          }}>
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-8 h-8 text-primary" />
                <p className="font-medium text-sm truncate flex-1">{block.title || "Document"}</p>
              </div>
              
              {block.content && (
                <p className="text-xs text-muted-foreground line-clamp-3 flex-1 italic mb-2">
                  "{block.content}"
                </p>
              )}
              
              {block.file_path && (
                <a
                  href={block.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline mt-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  Open Document
                </a>
              )}
            </div>
          </Card>
        );

      case "video":
        return (
          <Card className={`p-4 ${commonStyles} bg-card`} style={{ 
            width: block.width, 
            height: block.height,
            transition: isResizing && resizingBlockId === block.id ? "none" : "width 0.15s ease-out, height 0.15s ease-out",
          }}>
            <div className="flex flex-col items-center justify-center h-full">
              <Video className="w-12 h-12 text-primary mb-2" />
              <p className="text-sm font-medium text-center">{block.title || "Video"}</p>
              {block.url && (
                <a
                  href={block.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline mt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  Watch
                </a>
              )}
            </div>
          </Card>
        );

      case "group":
        return <GroupBlock block={block} />;

      case "chat":
        return (
          <ChatBlock
            block={block}
            connectedBlocks={getConnectedBlocks(block.id)}
            isSelected={isSelected}
            isResizing={isResizing && resizingBlockId === block.id}
          />
        );

      default:
        return null;
    }
  };

  if (!boardId) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Toolbar */}
        <div className="w-16 bg-sidebar border-r flex flex-col items-center py-4 gap-3">
        <Button 
          variant={snapToGrid ? "secondary" : "ghost"} 
          size="icon" 
          onClick={() => setSnapToGrid(!snapToGrid)}
          title={snapToGrid ? "Grid: On" : "Grid: Off"}
        >
          <Grid className="w-5 h-5 text-sidebar-foreground" />
        </Button>

        <div className="my-1 w-8 h-px bg-border" />

        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/block-type', 'image');
            e.dataTransfer.effectAllowed = 'copy';
            const dragImg = document.createElement('div');
            dragImg.style.cssText = 'position: absolute; top: -1000px; padding: 8px 12px; background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border-radius: 6px; font-size: 12px; font-weight: 500; opacity: 0.9;';
            dragImg.textContent = '🖼️ Image';
            document.body.appendChild(dragImg);
            e.dataTransfer.setDragImage(dragImg, 0, 0);
            setTimeout(() => dragImg.remove(), 0);
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="relative cursor-move"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <ImageIcon className="w-5 h-5 text-sidebar-foreground" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, "image", pendingToolbarDrop?.x, pendingToolbarDrop?.y);
                setPendingToolbarDrop(null);
              }}
            />
          </Button>
        </div>

        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/block-type', 'url');
            e.dataTransfer.effectAllowed = 'copy';
            const dragImg = document.createElement('div');
            dragImg.style.cssText = 'position: absolute; top: -1000px; padding: 8px 12px; background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border-radius: 6px; font-size: 12px; font-weight: 500; opacity: 0.9;';
            dragImg.textContent = '🔗 URL';
            document.body.appendChild(dragImg);
            e.dataTransfer.setDragImage(dragImg, 0, 0);
            setTimeout(() => dragImg.remove(), 0);
          }}
        >
          <Button variant="ghost" size="icon" className="cursor-move" onClick={() => openAddDialog("url")}>
            <LinkIcon className="w-5 h-5 text-sidebar-foreground" />
          </Button>
        </div>

        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/block-type', 'document');
            e.dataTransfer.effectAllowed = 'copy';
            const dragImg = document.createElement('div');
            dragImg.style.cssText = 'position: absolute; top: -1000px; padding: 8px 12px; background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border-radius: 6px; font-size: 12px; font-weight: 500; opacity: 0.9;';
            dragImg.textContent = '📄 Document';
            document.body.appendChild(dragImg);
            e.dataTransfer.setDragImage(dragImg, 0, 0);
            setTimeout(() => dragImg.remove(), 0);
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="cursor-move"
            onClick={() => docInputRef.current?.click()}
            disabled={isUploading}
          >
            <FileText className="w-5 h-5 text-sidebar-foreground" />
            <input
              ref={docInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, "document", pendingToolbarDrop?.x, pendingToolbarDrop?.y);
                setPendingToolbarDrop(null);
              }}
            />
          </Button>
        </div>

        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/block-type', 'text');
            e.dataTransfer.effectAllowed = 'copy';
            const dragImg = document.createElement('div');
            dragImg.style.cssText = 'position: absolute; top: -1000px; padding: 8px 12px; background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border-radius: 6px; font-size: 12px; font-weight: 500; opacity: 0.9;';
            dragImg.textContent = '📝 Text';
            document.body.appendChild(dragImg);
            e.dataTransfer.setDragImage(dragImg, 0, 0);
            setTimeout(() => dragImg.remove(), 0);
          }}
        >
          <Button variant="ghost" size="icon" className="cursor-move" onClick={() => openAddDialog("text")}>
            <Type className="w-5 h-5 text-sidebar-foreground" />
          </Button>
        </div>

        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/block-type', 'group');
            e.dataTransfer.effectAllowed = 'copy';
            const dragImg = document.createElement('div');
            dragImg.style.cssText = 'position: absolute; top: -1000px; padding: 8px 12px; background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border-radius: 6px; font-size: 12px; font-weight: 500; opacity: 0.9;';
            dragImg.textContent = '📁 Group';
            document.body.appendChild(dragImg);
            e.dataTransfer.setDragImage(dragImg, 0, 0);
            setTimeout(() => dragImg.remove(), 0);
          }}
        >
          <Button variant="ghost" size="icon" className="cursor-move" onClick={() => openAddDialog("group")}>
            <Layers className="w-5 h-5 text-sidebar-foreground" />
          </Button>
        </div>

        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/block-type', 'video');
            e.dataTransfer.effectAllowed = 'copy';
            const dragImg = document.createElement('div');
            dragImg.style.cssText = 'position: absolute; top: -1000px; padding: 8px 12px; background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border-radius: 6px; font-size: 12px; font-weight: 500; opacity: 0.9;';
            dragImg.textContent = '🎥 Video';
            document.body.appendChild(dragImg);
            e.dataTransfer.setDragImage(dragImg, 0, 0);
            setTimeout(() => dragImg.remove(), 0);
          }}
        >
          <Button variant="ghost" size="icon" className="cursor-move" onClick={() => openAddDialog("video")}>
            <Video className="w-5 h-5 text-sidebar-foreground" />
          </Button>
        </div>

        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/block-type', 'chat');
            e.dataTransfer.effectAllowed = 'copy';
            // Create custom drag image
            const dragImg = document.createElement('div');
            dragImg.style.cssText = 'position: absolute; top: -1000px; padding: 8px 12px; background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border-radius: 6px; font-size: 12px; font-weight: 500; opacity: 0.9;';
            dragImg.textContent = '💬 Chat Widget';
            document.body.appendChild(dragImg);
            e.dataTransfer.setDragImage(dragImg, 0, 0);
            setTimeout(() => dragImg.remove(), 0);
          }}
        >
          <Button 
            variant="ghost" 
            size="icon" 
            className="cursor-move" 
            onClick={() => {
              if (!canvasRef.current) return;
              const rect = canvasRef.current.getBoundingClientRect();
              const centerX = Math.round((rect.width / 2 - panOffset.x) / zoomLevel);
              const centerY = Math.round((rect.height / 2 - panOffset.y) / zoomLevel);
              const adjustedX = snapToGrid ? Math.round(centerX / GRID_SIZE) * GRID_SIZE : centerX;
              const adjustedY = snapToGrid ? Math.round(centerY / GRID_SIZE) * GRID_SIZE : centerY;
              addBlockMutation.mutate({
                type: 'chat',
                title: 'Chat Widget',
                position_x: adjustedX,
                position_y: adjustedY,
                width: 350,
                height: 450,
              });
            }}
          >
            <MessageSquarePlus className="w-5 h-5 text-sidebar-foreground" />
          </Button>
        </div>

        <div className="my-2 w-8 h-px bg-border" />

        <Button variant="ghost" size="icon" onClick={() => setCentralBrainOpen(true)}>
          <Brain className="w-5 h-5 text-sidebar-foreground" />
        </Button>

        <div className="my-2 w-8 h-px bg-border" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => undo()}
          disabled={!canUndo || isRestoring}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-5 h-5 text-sidebar-foreground" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => redo()}
          disabled={!canRedo || isRestoring}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo className="w-5 h-5 text-sidebar-foreground" />
        </Button>

        <div className="my-2 w-8 h-px bg-border" />

        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          disabled={zoomLevel <= MIN_ZOOM}
          title="Zoom Out (Ctrl+-)"
        >
          <ZoomOut className="w-5 h-5 text-sidebar-foreground" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomReset}
          className="text-xs font-medium text-sidebar-foreground px-1"
          title="Reset Zoom (Ctrl+0) | Ctrl+Scroll to zoom"
        >
          {Math.round(zoomLevel * 100)}%
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          disabled={zoomLevel >= MAX_ZOOM}
          title="Zoom In (Ctrl++)"
        >
          <ZoomIn className="w-5 h-5 text-sidebar-foreground" />
        </Button>

        <div className="my-2 w-8 h-px bg-border" />

        <Button
          variant="ghost"
          size="icon"
          onClick={handleResetView}
          title="Reset View"
        >
          <Home className="w-5 h-5 text-sidebar-foreground" />
        </Button>
      </div>

      {/* Canvas Area - Isolated stacking context */}
      <div 
        ref={canvasRef}
        className={`flex-1 relative isolate bg-background overflow-auto ${isDraggingOver ? 'ring-2 ring-primary ring-inset' : ''} ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={snapToGrid ? {
          backgroundImage: 
            'linear-gradient(to right, hsl(var(--border) / 0.3) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.3) 1px, transparent 1px)',
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
        } : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        onClick={(e) => {
          if (connectionMode.active) {
            // Cancel connection mode on canvas click
            setConnectionMode({ active: false, sourceBlockId: null, sourceHandle: null });
            setTempEdge(null);
          } else {
            setSelectedBlockId(null);
            setSelectedEdgeId(null);
          }
        }}
      >
        {/* Connection Mode Indicator */}
        {connectionMode.active && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse" />
              <span className="text-sm font-medium">Connection Mode - Click a block to connect</span>
            </div>
          </div>
        )}
        
        {isDraggingOver && (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center pointer-events-none z-50">
            <div className="text-center">
              <Upload className="w-16 h-16 text-primary mx-auto mb-2" />
              <p className="text-lg font-medium text-foreground">Drop to add to canvas</p>
            </div>
          </div>
        )}
        {blocks.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-md">
              <Layers className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Empty Canvas</h2>
              <p className="text-muted-foreground mb-6">
                Start building your agent brain by adding assets, principles, and examples.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
                <Button variant="outline" onClick={() => openAddDialog("text")}>
                  <Type className="w-4 h-4 mr-2" />
                  Add Text
                </Button>
              </div>
            </div>
          </div>
        ) : (
        <DndContext 
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          onDragStart={handleDragStart} 
          onDragEnd={handleDragEnd}
        >
            <div className="relative w-full h-full p-8 overflow-hidden">
              <div 
                className="relative origin-top-left"
                style={{ 
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  minWidth: `${2000 / zoomLevel}px`,
                  minHeight: `${2000 / zoomLevel}px`,
                  pointerEvents: isPanning ? "none" : "auto",
                }}
              >
                {/* Edge Renderer - SVG Layer */}
                <EdgeRenderer
                  edges={edges}
                  blocks={blocks}
                  selectedEdgeId={selectedEdgeId}
                  hoveredEdgeId={hoveredEdgeId}
                  onEdgeClick={setSelectedEdgeId}
                  onEdgeHover={setHoveredEdgeId}
                  tempEdge={tempEdge}
                />
                
                {/* Selection Rectangle */}
                {isSelecting && selectionStart && selectionEnd && (
                  <div
                    className="absolute border-2 border-primary bg-primary/10 pointer-events-none z-[1000]"
                    style={{
                      left: Math.min(selectionStart.x, selectionEnd.x),
                      top: Math.min(selectionStart.y, selectionEnd.y),
                      width: Math.abs(selectionEnd.x - selectionStart.x),
                      height: Math.abs(selectionEnd.y - selectionStart.y),
                    }}
                  />
                )}
                
                {blocks
                  .filter(block => !block.group_id || block.type === "group")
                  .map((block) => (
                    block.type === "group" ? (
                      // Groups handle their own dragging internally
                      <div key={block.id} className="relative group">
                        {renderBlock(block)}
                        
                        {/* Connection Handle - RIGHT only for groups */}
                        <ConnectionHandle
                          position="right"
                          blockId={block.id}
                          isActive={connectionMode.active}
                          isSource={connectionMode.sourceBlockId === block.id}
                          isTarget={false}
                          onClick={handleConnectionHandleClick}
                        />
                        
                        {/* Action Buttons for Groups */}
                        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out flex gap-1 z-10">
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-7 w-7 rounded-full shadow-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUseInChat(block);
                            }}
                            title="Use in Chat"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </Button>
                          
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="h-7 w-7 rounded-full shadow-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteBlockMutation.mutate(block.id);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Resize Handle for Groups */}
                        <div
                          className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-nwse-resize hover:scale-110 shadow-md z-10"
                          onMouseDown={(e) => handleResizeStart(e, block.id, block)}
                          title="Resize"
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Non-group blocks use DraggableBlock wrapper
                      <DraggableBlock key={block.id} block={block}>
                        <div 
                          className="relative group"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBlockId(block.id);
                            setSelectedBlockForChat(block);
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleEditBlock(block);
                          }}
                        >
                          {renderBlock(block)}
                          
                          {/* Connection Handles - RIGHT for content blocks, LEFT for chat blocks */}
                          {block.type === "chat" ? (
                            <ConnectionHandle
                              position="left"
                              blockId={block.id}
                              isActive={connectionMode.active}
                              isSource={false}
                              isTarget={connectionMode.active && connectionMode.sourceBlockId !== block.id}
                              onClick={handleConnectionHandleClick}
                            />
                          ) : (
                            <ConnectionHandle
                              position="right"
                              blockId={block.id}
                              isActive={connectionMode.active}
                              isSource={connectionMode.sourceBlockId === block.id}
                              isTarget={false}
                              onClick={handleConnectionHandleClick}
                            />
                          )}
                          
                          {/* Action Buttons */}
                          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out flex gap-1 z-10">
                            <Button 
                              variant="secondary" 
                              size="icon" 
                              className="h-7 w-7 rounded-full shadow-md"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditBlock(block);
                              }}
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>

                            <Button 
                              variant="secondary" 
                              size="icon" 
                              className="h-7 w-7 rounded-full shadow-md"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUseInChat(block);
                              }}
                              title="Use in Chat"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </Button>
                            
                            {block.group_id && (
                              <Button
                                variant="secondary" 
                                size="icon" 
                                className="h-7 w-7 rounded-full shadow-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  assignToGroupMutation.mutate({ blockId: block.id, groupId: null });
                                }}
                                title="Remove from Group"
                              >
                                <Layers className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="h-7 w-7 rounded-full shadow-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteBlockMutation.mutate(block.id);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Resize Handle */}
                        <div
                          className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-nwse-resize hover:scale-110 shadow-md z-10"
                          onMouseDown={(e) => handleResizeStart(e, block.id, block)}
                          title="Resize"
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
                          </div>
                        </div>
                      </div>
                    </DraggableBlock>
                    )
                  ))}
              </div>
            </div>
            <DragOverlay zIndex={100}>
              {activeBlock && (
                <div style={{ opacity: 0.8 }}>
                  {renderBlock(activeBlock)}
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>
      
      {/* Bulk Actions Toolbar */}
      {selectedBlocks.length > 1 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg shadow-lg p-3 flex items-center gap-2 z-50">
          <span className="text-sm font-medium px-2">
            {selectedBlocks.length} selected
          </span>
          <div className="h-6 w-px bg-border" />
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDuplicate}
            className="gap-2"
          >
            <CopyPlus className="w-4 h-4" />
            Duplicate
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkGroup}
            className="gap-2"
          >
            <FolderPlus className="w-4 h-4" />
            Group
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkDelete}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={clearSelection}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
      </div>

      {/* Add Block Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {newBlockType} Block</DialogTitle>
            <DialogDescription>Configure your new block</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newBlockData.title}
                onChange={(e) => setNewBlockData({ ...newBlockData, title: e.target.value })}
                placeholder="Block title..."
              />
            </div>

            {newBlockType === "text" && (
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={newBlockData.content}
                  onChange={(e) => setNewBlockData({ ...newBlockData, content: e.target.value })}
                  placeholder="Enter text content..."
                  rows={4}
                />
              </div>
            )}

            {(newBlockType === "url" || newBlockType === "video") && (
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={newBlockData.url}
                  onChange={(e) => setNewBlockData({ ...newBlockData, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            )}

            {(newBlockType === "url" || newBlockType === "group") && (
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={newBlockData.color}
                  onChange={(e) => setNewBlockData({ ...newBlockData, color: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="instruction">AI Instructions (optional)</Label>
              <Textarea
                id="instruction"
                value={newBlockData.instruction_prompt}
                onChange={(e) => setNewBlockData({ ...newBlockData, instruction_prompt: e.target.value })}
                placeholder="Tell the AI how to use this asset..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                1-10 lines of context to help the AI understand how to use this block
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBlock} disabled={addBlockMutation.isPending}>
              {addBlockMutation.isPending ? "Adding..." : "Add Block"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Asset Details Dialog */}
      <Dialog open={isAssetDetailsDialogOpen} onOpenChange={setIsAssetDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Asset Details</DialogTitle>
            <DialogDescription>
              Give this asset a name and describe how it should be used
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="asset-name">Asset Name</Label>
              <Input 
                id="asset-name"
                value={assetDetails.name}
                onChange={(e) => setAssetDetails(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., 100 Winning Headlines"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="asset-description">Usage Instructions (Optional)</Label>
              <Textarea
                id="asset-description"
                value={assetDetails.description}
                onChange={(e) => setAssetDetails(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g., This is a collection of 100 winning headlines for this type of product. Use as headline inspiration..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                This will help the AI understand how to use this asset in your creatives
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleSkipDetails}>Skip</Button>
            <Button onClick={handleSaveAssetDetails} disabled={!assetDetails.name.trim()}>
              Save Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Block Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Block</DialogTitle>
            <DialogDescription>
              Update the content of your {editingBlock?.type} block
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                placeholder="Enter title..."
                value={editBlockData.title}
                onChange={(e) => setEditBlockData({ ...editBlockData, title: e.target.value })}
              />
            </div>

            {editingBlock?.type === "text" && (
              <div>
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  placeholder="Enter content..."
                  value={editBlockData.content}
                  onChange={(e) => setEditBlockData({ ...editBlockData, content: e.target.value })}
                  rows={6}
                />
              </div>
            )}

            {(editingBlock?.type === "url" || editingBlock?.type === "video") && (
              <div>
                <Label htmlFor="edit-url">URL</Label>
                <Input
                  id="edit-url"
                  type="url"
                  placeholder="https://..."
                  value={editBlockData.url}
                  onChange={(e) => setEditBlockData({ ...editBlockData, url: e.target.value })}
                />
              </div>
            )}

            {editingBlock?.type === "document" && (
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Add a description..."
                  value={editBlockData.content}
                  onChange={(e) => setEditBlockData({ ...editBlockData, content: e.target.value })}
                  rows={3}
                />
              </div>
            )}

            {(editingBlock?.type === "url" || editingBlock?.type === "group") && (
              <div>
                <Label htmlFor="edit-color">Color</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="edit-color"
                    type="color"
                    value={editBlockData.color}
                    onChange={(e) => setEditBlockData({ ...editBlockData, color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={editBlockData.color}
                    onChange={(e) => setEditBlockData({ ...editBlockData, color: e.target.value })}
                    placeholder="#f97316"
                    className="flex-1"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="edit-instruction">AI Instructions (optional)</Label>
              <Textarea
                id="edit-instruction"
                placeholder="Tell the AI how to use this asset..."
                value={editBlockData.instruction_prompt}
                onChange={(e) => setEditBlockData({ ...editBlockData, instruction_prompt: e.target.value })}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                1-10 lines of context to help the AI understand how to use this block
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Blocks to Group Dialog */}
      <Dialog open={isAddToGroupDialogOpen} onOpenChange={setIsAddToGroupDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Blocks to Group</DialogTitle>
            <DialogDescription>
              Select blocks from the canvas to add to this group
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {blocks
              .filter(b => !b.group_id && b.type !== "group" && b.id !== selectedGroupId)
              .map(block => (
                <Card 
                  key={block.id}
                  className={`p-3 cursor-pointer transition-colors ${
                    selectedBlocksToAdd.includes(block.id) ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => toggleBlockSelection(block.id)}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={selectedBlocksToAdd.includes(block.id)}
                      onChange={() => toggleBlockSelection(block.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      {block.type === "text" && <Type className="w-4 h-4" />}
                      {block.type === "image" && <ImageIcon className="w-4 h-4" />}
                      {block.type === "url" && <LinkIcon className="w-4 h-4" />}
                      {block.type === "document" && <FileText className="w-4 h-4" />}
                      {block.type === "video" && <Video className="w-4 h-4" />}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{block.title || `${block.type} block`}</p>
                        {block.content && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{block.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            {blocks.filter(b => !b.group_id && b.type !== "group").length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No available blocks to add</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddToGroupDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddBlocksToGroup} 
              disabled={selectedBlocksToAdd.length === 0}
            >
              Add {selectedBlocksToAdd.length > 0 ? `(${selectedBlocksToAdd.length})` : ""} Block(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CentralBrainModal
        open={centralBrainOpen}
        onOpenChange={setCentralBrainOpen}
        onSelectPrompt={(content) => {
          addBlockMutation.mutate({
            type: "text",
            title: "Prompt Template",
            content: content,
            position_x: Math.random() * 400,
            position_y: Math.random() * 400,
            width: 300,
            height: 250,
          });
        }}
        onSelectAsset={(asset) => {
          // Map asset types to canvas block types
          let blockType: Block["type"] = "document"; // default fallback
          
          if (asset.type === "image") {
            blockType = "image";
          } else if (asset.type === "video") {
            blockType = "video";
          } else if (["pdf", "document", "doc", "spreadsheet"].includes(asset.type)) {
            blockType = "document";
          } else if (asset.type === "text" || asset.type === "copy") {
            blockType = "text";
          }
          
          // Set correct field based on block type
          const isImageOrDocument = blockType === "image" || blockType === "document";
          
          addBlockMutation.mutate({
            type: blockType,
            title: asset.name,
            content: asset.text_content || asset.description || undefined,
            url: !isImageOrDocument ? asset.url_or_path || undefined : undefined,
            file_path: isImageOrDocument ? asset.url_or_path || undefined : undefined,
            position_x: Math.random() * 400,
            position_y: Math.random() * 400,
            width: blockType === "image" ? 300 : 250,
            height: blockType === "image" ? 200 : 200,
          });
        }}
      />

      {/* Canvas Chat Widget */}
      <CanvasChatWidget
        canvasBlocks={blocks}
        selectedBlock={selectedBlockForChat}
        onAddToCanvas={(content, type) => {
          // Future: Add block directly from chat
          toast({
            title: "Add to Canvas",
            description: "This feature will allow adding content directly from chat",
          });
        }}
      />
    </div>
  );
}
