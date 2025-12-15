import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDocumentParsing } from "@/contexts/DocumentParsingContext";
import ReactFlow, {
  Background,
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  ReactFlowProvider,
  NodeChange,
  EdgeChange,
  EdgeProps,
  getSmoothStepPath,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { supabase } from "@/integrations/supabase/client";
import { X, Pencil } from "lucide-react";
import {
  ImageNode,
  TextNode,
  UrlNode,
  DocumentNode,
  VideoNode,
  GroupNode,
  ChatNode,
  BrainNode,
  CreativeNode,
} from "@/components/canvas/nodes";
import { useProject } from "@/contexts/ProjectContext";
import { CanvasToolbar } from "@/components/canvas/toolbar/CanvasToolbar";
import { useReactFlowSync } from "@/hooks/use-reactflow-sync";
import { useReactFlowHistory } from "@/hooks/use-reactflow-history";
import { toast } from "sonner";
import { BlockEditDialog } from "@/components/canvas/BlockEditDialog";
import { CentralBrainModal } from "@/components/CentralBrainModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";


// Custom edge with delete button on hover
function CustomEdgeWithDelete({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
}: EdgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const queryClient = useQueryClient();
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onDelete = useCallback(
    async (event: React.MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
      
      try {
        // Remove from local state IMMEDIATELY for instant visual feedback
        setEdges((edges) => edges.filter((e) => e.id !== id));
        
        // Delete from database
        const { error } = await supabase
          .from("canvas_edges")
          .delete()
          .eq("id", id);
        
        if (error) throw error;
        
        queryClient.invalidateQueries({ queryKey: ["canvas-edges"] });
        toast.success("Connection deleted");
      } catch (error) {
        console.error("Failed to delete edge:", error);
        toast.error("Failed to delete connection");
        // Optionally restore edge on failure by re-fetching
        queryClient.invalidateQueries({ queryKey: ["canvas-edges"] });
      }
    },
    [id, queryClient, setEdges]
  );

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Invisible wider path for easier hover detection (3x larger) */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={60}
        stroke="transparent"
        className="cursor-pointer"
      />
      {/* Visible edge */}
      <path
        d={edgePath}
        fill="none"
        stroke={style?.stroke || "hsl(var(--primary))"}
        strokeWidth={2}
        className="react-flow__edge-path pointer-events-none"
        markerEnd={markerEnd}
      />
      {/* Delete button - enlarged for better visibility */}
      {isHovered && (
        <foreignObject
          x={labelX - 16}
          y={labelY - 16}
          width={32}
          height={32}
        >
          <div className="w-full h-full flex items-center justify-center">
            <button
              onClick={onDelete}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-destructive/80 transition-colors cursor-pointer border border-destructive-foreground/20"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </foreignObject>
      )}
    </g>
  );
}

// Define node types for ReactFlow
const nodeTypes = {
  image: ImageNode,
  text: TextNode,
  url: UrlNode,
  document: DocumentNode,
  video: VideoNode,
  group: GroupNode,
  chat: ChatNode,
  brain: BrainNode,
  creative: CreativeNode,
};

// Define edge types with custom deletable edge
const edgeTypes = {
  deletable: CustomEdgeWithDelete,
};

interface Block {
  id: string;
  type: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  content?: string;
  title?: string;
  url?: string;
  file_path?: string;
  color?: string;
  metadata?: any;
  instruction_prompt?: string;
  group_id?: string;
}

interface EdgeData {
  id: string;
  source_block_id: string;
  target_block_id: string;
  edge_type: string;
  color?: string;
}

function CanvasV2Inner() {
  const { boardId } = useParams();
  const { selectedProjectId } = useProject();
  const projectId = boardId || selectedProjectId;
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [editingBlock, setEditingBlock] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [brainModalOpen, setBrainModalOpen] = useState(false);
  const [selectingForBrainNode, setSelectingForBrainNode] = useState(false);
  const [pendingBrainNode, setPendingBrainNode] = useState<any>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: Node } | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const { addToQueue } = useDocumentParsing();
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);

  // Initialize history hook first so we can use isRestoring in queries
  const { canUndo, canRedo, undo, redo, saveState, clearHistory, isRestoring, markRestoringComplete } = useReactFlowHistory();

  // Fetch blocks from Supabase
  const { data: blocks = [], isFetched: blocksLoaded } = useQuery({
    queryKey: ["canvas-blocks", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("canvas_blocks")
        .select("*")
        .eq("agent_board_id", projectId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Block[];
    },
    enabled: !!projectId && !isRestoring,
  });

  // Fetch edges from Supabase
  const { data: edges = [] } = useQuery({
    queryKey: ["canvas-edges", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("canvas_edges")
        .select("*")
        .eq("agent_board_id", projectId);
      if (error) throw error;
      return data as EdgeData[];
    },
    enabled: !!projectId && !isRestoring,
  });

  // Convert Supabase blocks to ReactFlow nodes
  const initialNodes: Node[] = useMemo(() => {
    // Get all valid group IDs to validate parent references
    const validGroupIds = new Set(blocks.filter(b => b.type === 'group').map(b => b.id));
    
    return blocks
      .filter((block) =>
        ["image", "text", "url", "document", "video", "group", "chat", "brain", "creative"].includes(block.type)
      )
      .map((block) => {
        // Base node data
        const baseData: any = {
          url: block.url,
          file_path: block.file_path,
          title: block.title,
          content: block.content,
          color: block.color,
          metadata: block.metadata,
          instruction_prompt: block.instruction_prompt,
          // Add critical data for chat blocks
          blockId: block.id,  // Pass block ID for independent chat sessions
          sessionId: (block.metadata as any)?.sessionId,
          boardId: projectId,
          projectId: selectedProjectId,
          // Add group membership indicators
          isGroupChild: !!block.group_id,
          parentGroupId: block.group_id,
          // Add edit callback for hover actions
            onEdit: () => {
              setNodes((currentNodes) => {
                const node = currentNodes.find(n => n.id === block.id);
                if (node) {
                  setEditingBlock(node);
                  setEditDialogOpen(true);
                }
                return currentNodes;
              });
            },
        };

        // Add connected blocks for chat nodes (INPUT connections)
        if (block.type === 'chat') {
          const incomingEdges = edges.filter(e => e.target_block_id === block.id);
          
          // Get directly connected blocks
          const directlyConnected = blocks.filter(b => 
            incomingEdges.some(e => e.source_block_id === b.id)
          );
          
          // Expand group blocks to include their children
          const expandedBlocks: any[] = [];
          directlyConnected.forEach(b => {
            expandedBlocks.push(b);
            
            // If it's a group, also include all children
            if (b.type === 'group') {
              const children = blocks.filter(child => child.group_id === b.id);
              children.forEach(child => {
                expandedBlocks.push({
                  ...child,
                  title: `[In ${b.title || 'Group'}] ${child.title || 'Untitled'}`,
                });
              });
            }
          });
          
          const connectedBlocks = expandedBlocks.map(b => ({
            id: b.id,
            type: b.type,
            title: b.title,
            content: b.content,
            url: b.url,
            file_path: b.file_path,
            instruction_prompt: b.instruction_prompt,
          }));
          baseData.connectedBlocks = connectedBlocks;
          
          // Add OUTPUT connections (nodes this chat pushes TO)
          const outgoingEdges = edges.filter(e => e.source_block_id === block.id);
          const connectedOutputNodes = blocks
            .filter(b => outgoingEdges.some(e => e.target_block_id === b.id))
            .map(b => ({
              id: b.id,
              type: b.type,
              title: b.title,
              metadata: b.metadata,
            }));
          baseData.connectedOutputNodes = connectedOutputNodes;
        }

        // Add group-specific data
        if (block.type === "group") {
          baseData.instructions = block.instruction_prompt;
          baseData.childCount = blocks.filter((b) => b.group_id === block.id).length;
          // onUpdateNodeData will be added in a useEffect after nodes are created
        }

        const nodeConfig: any = {
          id: block.id,
          type: block.type,
          position: { x: block.position_x || 0, y: block.position_y || 0 },
          data: baseData,
          style: {
            width: block.width || 200,
            height: block.height || 200,
          },
        };

        // Set parentNode relationship for children - ONLY if parent group exists
        if (block.group_id) {
          if (validGroupIds.has(block.group_id)) {
            nodeConfig.parentNode = block.group_id;
            nodeConfig.extent = "parent";
          } else {
            // Parent group doesn't exist - clean up orphaned reference
            console.warn(`Block ${block.id} references non-existent group ${block.group_id}, cleaning up...`);
            void supabase
              .from('canvas_blocks')
              .update({ group_id: null })
              .eq('id', block.id);
          }
        }

        return nodeConfig;
      });
  }, [blocks, projectId, selectedProjectId, edges]);

  // Convert Supabase edges to ReactFlow edges
  const initialEdges: Edge[] = useMemo(() => {
    return edges.map((edge) => ({
      id: edge.id,
      source: edge.source_block_id,
      target: edge.target_block_id,
      type: "deletable",  // Use custom deletable edge
      animated: true,
      style: {
        stroke: edge.color || "hsl(var(--primary))",
        strokeWidth: 2,
      },
    }));
  }, [edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Track initial sync per project to avoid snapping back on refetches
  const lastSyncedProjectId = useRef<string | null>(null);
  const hasInitialSync = useRef(false);

  // Initialize sync hook
  const { 
    handleNodeChanges, 
    handleEdgeChanges, 
    addEdge: addEdgeToDb, 
    addBlock, 
    deleteBlock, 
    deleteBlockFromDb,
    deleteEdge,
    upsertBlock,
    upsertEdge,
    updateBlock,
    updateBlockContent 
  } = useReactFlowSync({ projectId: projectId || "" });
  const queryClient = useQueryClient();

  // Phase 5: Reset history on project change
  useEffect(() => {
    if (!projectId) return;
    if (lastSyncedProjectId.current !== projectId) {
      console.log('[Canvas] Project changed, resetting history');
      lastSyncedProjectId.current = projectId;
      clearHistory();
      hasInitialSave.current = false;
      hasInitialSync.current = false;
    }
  }, [projectId, clearHistory]);

  // Sync nodes/edges when data is actually loaded
  useEffect(() => {
    if (!projectId) return;
    if (hasInitialSync.current) return;
    
    // Check if data has loaded or query confirmed empty project
    const hasLoadedData = blocks.length > 0 || blocksLoaded;
    
    if (hasLoadedData) {
      console.log('[Canvas] Initial data loaded, syncing nodes');
      setNodes(initialNodes);
      setEdges(initialEdges);
      hasInitialSync.current = true;
    }
  }, [projectId, blocks.length, blocksLoaded, initialNodes, initialEdges, setNodes, setEdges]);

  // Phase 5: Save initial state only when blocks are loaded
  const hasInitialSave = useRef(false);
  useEffect(() => {
    if (reactFlowInstance && !hasInitialSave.current && blocks.length > 0) {
      saveState(nodes, flowEdges);
      hasInitialSave.current = true;
      console.log('[Canvas] Saved initial state');
    }
  }, [reactFlowInstance, blocks.length, nodes, flowEdges, saveState]);

  // Update chat node connected blocks and output nodes when edges change
  useEffect(() => {
    setNodes(currentNodes => 
      currentNodes.map(node => {
        if (node.type !== 'chat') return node;
        
        // Recompute INPUT connected blocks
        const incomingEdges = flowEdges.filter(e => e.target === node.id);
        
        // Get directly connected blocks
        const directlyConnected = blocks?.filter(b => 
          incomingEdges.some(e => e.source === b.id)
        ) || [];
        
        // Expand group blocks to include their children
        const expandedBlocks: any[] = [];
        directlyConnected.forEach(b => {
          expandedBlocks.push(b);
          if (b.type === 'group') {
            const children = blocks?.filter(child => child.group_id === b.id) || [];
            children.forEach(child => {
              expandedBlocks.push({
                ...child,
                title: `[In ${b.title || 'Group'}] ${child.title || 'Untitled'}`,
              });
            });
          }
        });
        
        const connectedBlocks = expandedBlocks.map(b => ({
          id: b.id,
          type: b.type,
          title: b.title,
          content: b.content,
          url: b.url,
          file_path: b.file_path,
          instruction_prompt: b.instruction_prompt,
        }));
        
        // Recompute OUTPUT connected nodes
        const outgoingEdges = flowEdges.filter(e => e.source === node.id);
        const connectedOutputNodes = blocks
          ?.filter(b => outgoingEdges.some(e => e.target === b.id))
          .map(b => ({
            id: b.id,
            type: b.type,
            title: b.title,
            metadata: b.metadata,
          })) || [];
        
        return {
          ...node,
          data: { 
            ...node.data, 
            connectedBlocks,
            connectedOutputNodes
          }
        };
      })
    );
  }, [flowEdges, blocks, setNodes]);

  // Handle node changes without saving to history (position, resize, etc.)
  const handleNodesChangeWithHistory = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      handleNodeChanges(changes);
    },
    [onNodesChange, handleNodeChanges]
  );

  // Handle edge changes without saving to history
  const handleEdgesChangeWithHistory = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      handleEdgeChanges(changes);
    },
    [onEdgesChange, handleEdgeChanges]
  );

  // Helper to find group at drop position
  const findGroupAtPosition = useCallback((x: number, y: number) => {
    return nodes.find((node) => {
      if (node.type !== "group") return false;
      
      const nodeX = node.position.x;
      const nodeY = node.position.y;
      const nodeWidth = (node.style?.width as number) || 400;
      const nodeHeight = (node.style?.height as number) || 300;
      
      return (
        x >= nodeX &&
        x <= nodeX + nodeWidth &&
        y >= nodeY &&
        y <= nodeY + nodeHeight
      );
    });
  }, [nodes]);

  // Phase 3: Add drag stop handler with grouping/ungrouping detection
  const handleUnlinkFromGroup = useCallback(async (blockId: string) => {
    const nodeToUngroup = nodes.find(n => n.id === blockId);
    if (!nodeToUngroup?.parentNode) return;

    const parentGroup = nodes.find(n => n.id === nodeToUngroup.parentNode);
    if (!parentGroup) return;

    // Convert relative position to absolute
    const absoluteX = parentGroup.position.x + nodeToUngroup.position.x;
    const absoluteY = parentGroup.position.y + nodeToUngroup.position.y;

    // Update database
    await supabase
      .from("canvas_blocks")
      .update({ 
        group_id: null,
        position_x: Math.round(absoluteX),
        position_y: Math.round(absoluteY)
      })
      .eq("id", blockId);

    // Update local state
    setNodes((currentNodes) => currentNodes.map(n => {
      if (n.id === blockId) {
        return {
          ...n,
          parentNode: undefined,
          extent: undefined,
          position: { x: absoluteX, y: absoluteY },
          data: {
            ...n.data,
            isGroupChild: false,
            parentGroupId: undefined,
          },
        };
      }
      // Decrement parent group's child count
      if (n.id === nodeToUngroup.parentNode) {
        return {
          ...n,
          data: {
            ...n.data,
            childCount: Math.max(0, (n.data.childCount || 1) - 1),
          },
        };
      }
      return n;
    }));

    toast.success("Removed from group");
    saveState(nodes, flowEdges);
  }, [nodes, flowEdges, saveState]);

  // Callback to update a node's data directly
  const handleUpdateNodeData = useCallback((nodeId: string, newData: Partial<any>) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...newData,
              _lastUpdated: Date.now(), // Force reference change for memo
            }
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Store callbacks in refs to avoid infinite loops
  const handleUnlinkRef = useRef(handleUnlinkFromGroup);
  const handleUpdateNodeDataRef = useRef(handleUpdateNodeData);
  
  useEffect(() => {
    handleUnlinkRef.current = handleUnlinkFromGroup;
    handleUpdateNodeDataRef.current = handleUpdateNodeData;
  });

  // Inject callbacks into nodes only once on mount
  useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onUnlinkFromGroup: (blockId: string) => handleUnlinkRef.current(blockId),
          onUpdateNodeData: (nodeId: string, newData: any) => handleUpdateNodeDataRef.current(nodeId, newData),
        },
      }))
    );
  }, []); // Only run once

  // Re-inject callbacks whenever nodes are updated from database
  useEffect(() => {
    if (!initialNodes.length) return;
    
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onUnlinkFromGroup: (blockId: string) => handleUnlinkRef.current(blockId),
          onUpdateNodeData: (nodeId: string, newData: any) => handleUpdateNodeDataRef.current(nodeId, newData),
        },
      }))
    );
  }, [initialNodes.length]); // Re-run when nodes from DB change

  const onNodeDragStop = useCallback(async (event: React.MouseEvent, node: Node) => {
    // Check if this node has a parent (is grouped)
    const currentNode = nodes.find(n => n.id === node.id);
    const parentNodeId = currentNode?.parentNode;
    
    if (parentNodeId) {
      // Node is currently in a group - check if dragged outside
      const parentGroup = nodes.find(n => n.id === parentNodeId);
      
      if (parentGroup) {
        const groupWidth = (parentGroup.style?.width as number) || 400;
        const groupHeight = (parentGroup.style?.height as number) || 300;
        
        // Node position is relative to parent, check if outside bounds (with tolerance)
        const isOutsideGroup = 
          node.position.x < -50 ||
          node.position.y < -50 ||
          node.position.x > groupWidth + 50 ||
          node.position.y > groupHeight + 50;
        
        if (isOutsideGroup) {
          // UNGROUP: Convert relative position to absolute
          const absoluteX = parentGroup.position.x + node.position.x;
          const absoluteY = parentGroup.position.y + node.position.y;
          
          // Update database to remove group_id
          await supabase
            .from("canvas_blocks")
            .update({ 
              group_id: null,
              position_x: Math.round(absoluteX),
              position_y: Math.round(absoluteY)
            })
            .eq("id", node.id);
          
          // Update local state to remove parentNode and update data flags
          setNodes((currentNodes) => {
            return currentNodes.map(n => {
              if (n.id === node.id) {
                return {
                  ...n,
                  parentNode: undefined,
                  extent: undefined,
                  position: { x: absoluteX, y: absoluteY },
                  data: {
                    ...n.data,
                    isGroupChild: false,
                    parentGroupId: undefined,
                  },
                };
              }
              // Update parent group's child count
              if (n.id === parentNodeId) {
                return {
                  ...n,
                  data: {
                    ...n.data,
                    childCount: Math.max(0, (n.data.childCount || 1) - 1),
                  },
                };
              }
              return n;
            });
          });
          
          toast.success("Removed from group");
          saveState(nodes, flowEdges);
          return;
        }
      }
    }
    
    // If node doesn't have a parent, check if dropped INTO a group
    if (!parentNodeId && node.type !== 'group') {
      const targetGroup = findGroupAtPosition(node.position.x, node.position.y);
      
      if (targetGroup) {
        // Convert to relative position
        const relativeX = node.position.x - targetGroup.position.x;
        const relativeY = node.position.y - targetGroup.position.y;
        
        // Update database
        await supabase
          .from("canvas_blocks")
          .update({ 
            group_id: targetGroup.id,
            position_x: Math.round(relativeX),
            position_y: Math.round(relativeY)
          })
          .eq("id", node.id);
        
        // Update local state
        setNodes((currentNodes) => currentNodes.map(n => {
          if (n.id === node.id) {
            return {
              ...n,
              parentNode: targetGroup.id,
              extent: "parent" as const,
              position: { x: relativeX, y: relativeY },
              data: {
                ...n.data,
                isGroupChild: true,
                parentGroupId: targetGroup.id,
              },
            };
          }
          // Update target group's child count
          if (n.id === targetGroup.id) {
            return {
              ...n,
              data: {
                ...n.data,
                childCount: (n.data.childCount || 0) + 1,
              },
            };
          }
          return n;
        }));
        
        toast.success(`Added to "${targetGroup.data.title || 'group'}"`);
        saveState(nodes, flowEdges);
        return;
      }
    }
    
    // Normal position update (no grouping changes)
    updateBlock({
      id: node.id,
      position_x: Math.round(node.position.x),
      position_y: Math.round(node.position.y)
    });
    
    // Update state with the actual new position and save with latest edges
    setNodes((currentNodes) => {
      const updatedNodes = currentNodes.map(n => 
        n.id === node.id 
          ? { ...n, position: { x: node.position.x, y: node.position.y } }
          : n
      );
      // Use setEdges callback to get latest edges
      setEdges((currentEdges) => {
        saveState(updatedNodes, currentEdges);
        return currentEdges;
      });
      return updatedNodes;
    });
  }, [nodes, flowEdges, updateBlock, setNodes, setEdges, saveState, findGroupAtPosition]);

  // Phase 3 & 7: Handle undo with proper restoration and query disabling
  const handleUndo = useCallback(async () => {
    const previousState = undo();
    
    if (!previousState) {
      markRestoringComplete();
      return;
    }

    try {
      // Phase 3: Find deleted nodes (in previous but not current)
      const currentNodeIds = new Set(nodes.map(n => n.id));
      const deletedNodes = previousState.nodes.filter(n => !currentNodeIds.has(n.id));
      
      // Phase 3: Find deleted edges (in previous but not current)
      const currentEdgeIds = new Set(flowEdges.map(e => e.id));
      const deletedEdges = previousState.edges.filter(e => !currentEdgeIds.has(e.id));
      
      // Phase 3: Find newly added nodes (in current but not previous)
      const previousNodeIds = new Set(previousState.nodes.map(n => n.id));
      const newlyAddedNodes = nodes.filter(n => !previousNodeIds.has(n.id));

      // Phase 3: Re-insert deleted blocks with ORIGINAL IDs using upsert
      for (const node of deletedNodes) {
        try {
          await upsertBlock({
            id: node.id,
            type: node.type || 'text',
            position_x: node.position.x,
            position_y: node.position.y,
            width: (node.style?.width as number) || 200,
            height: (node.style?.height as number) || 200,
            title: node.data.title,
            content: node.data.content,
            url: node.data.url,
            file_path: node.data.file_path,
            color: node.data.color,
            metadata: node.data.metadata,
          });
          console.log('[Canvas] Restored deleted block with original ID:', node.id);
        } catch (error) {
          console.error('[Canvas] Failed to restore block:', error);
        }
      }

      // Phase 3: Re-insert deleted edges with ORIGINAL IDs using upsert
      for (const edge of deletedEdges) {
        try {
          await upsertEdge({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: edge.type === 'smoothstep' ? 'bezier' : (edge.type || 'bezier'),
          });
          console.log('[Canvas] Restored deleted edge with original ID:', edge.id);
        } catch (error) {
          console.error('[Canvas] Failed to restore edge:', error);
        }
      }

      // Phase 3: Delete newly added blocks from database
      for (const node of newlyAddedNodes) {
        try {
          await deleteBlockFromDb(node.id);
          console.log('[Canvas] Deleted newly added block:', node.id);
        } catch (error) {
          console.error('[Canvas] Failed to delete newly added block:', error);
        }
      }
      
      setNodes(previousState.nodes);
      setEdges(previousState.edges);
      toast.success("Undo successful");
    } catch (error) {
      console.error('[Canvas] Undo failed:', error);
      toast.error("Undo failed");
    } finally {
      markRestoringComplete();
    }
  }, [undo, setNodes, setEdges, nodes, flowEdges, upsertBlock, upsertEdge, deleteBlockFromDb, markRestoringComplete]);

  // Phase 3 & 7: Handle redo with proper restoration and query disabling
  const handleRedo = useCallback(async () => {
    const nextState = redo();
    
    if (!nextState) {
      markRestoringComplete();
      return;
    }

    try {
      // Phase 3: Find deleted nodes (in next but not current)
      const currentNodeIds = new Set(nodes.map(n => n.id));
      const deletedNodes = nextState.nodes.filter(n => !currentNodeIds.has(n.id));
      
      // Phase 3: Find deleted edges (in next but not current)
      const currentEdgeIds = new Set(flowEdges.map(e => e.id));
      const deletedEdges = nextState.edges.filter(e => !currentEdgeIds.has(e.id));
      
      // Phase 3: Find removed nodes (in current but not next)
      const nextNodeIds = new Set(nextState.nodes.map(n => n.id));
      const removedNodes = nodes.filter(n => !nextNodeIds.has(n.id));

      // Phase 3: Re-insert blocks with ORIGINAL IDs
      for (const node of deletedNodes) {
        try {
          await upsertBlock({
            id: node.id,
            type: node.type || 'text',
            position_x: node.position.x,
            position_y: node.position.y,
            width: (node.style?.width as number) || 200,
            height: (node.style?.height as number) || 200,
            title: node.data.title,
            content: node.data.content,
            url: node.data.url,
            file_path: node.data.file_path,
            color: node.data.color,
            metadata: node.data.metadata,
          });
          console.log('[Canvas] Restored block with original ID:', node.id);
        } catch (error) {
          console.error('[Canvas] Failed to restore block:', error);
        }
      }

      // Phase 3: Re-insert edges with ORIGINAL IDs
      for (const edge of deletedEdges) {
        try {
          await upsertEdge({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: edge.type === 'smoothstep' ? 'bezier' : (edge.type || 'bezier'),
          });
          console.log('[Canvas] Restored edge with original ID:', edge.id);
        } catch (error) {
          console.error('[Canvas] Failed to restore edge:', error);
        }
      }

      // Phase 3: Delete removed blocks
      for (const node of removedNodes) {
        try {
          await deleteBlockFromDb(node.id);
          console.log('[Canvas] Deleted removed block:', node.id);
        } catch (error) {
          console.error('[Canvas] Failed to delete removed block:', error);
        }
      }
      
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      toast.success("Redo successful");
    } catch (error) {
      console.error('[Canvas] Redo failed:', error);
      toast.error("Redo failed");
    } finally {
      markRestoringComplete();
    }
  }, [redo, setNodes, setEdges, nodes, flowEdges, upsertBlock, upsertEdge, deleteBlockFromDb, markRestoringComplete]);

  // Phase 3: Handle new connections - save state synchronously
  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      try {
        const newEdge = await addEdgeToDb({
          source: connection.source,
          target: connection.target,
          type: "bezier",
        });

        const currentNodes = nodes;
        const newEdgeObject: Edge = {
          id: newEdge.id,
          source: connection.source!,
          target: connection.target!,
          type: "deletable",  // Use custom deletable edge
          animated: true,
          style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
        };

        const updatedEdges = addEdge(newEdgeObject, flowEdges);
        setEdges(updatedEdges);

        // Phase 3: Save state synchronously with exact new state
        saveState(currentNodes, updatedEdges);
        
        // Invalidate queries to ensure fresh block data with new connections
        queryClient.invalidateQueries({ queryKey: ["canvas-blocks", projectId] });
      } catch (error) {
        console.error("Failed to create connection:", error);
      }
    },
    [setEdges, addEdgeToDb, saveState, nodes, flowEdges]
  );

  // Handle adding new blocks from toolbar
  const handleAddBlock = useCallback(
    async (type: string, position?: { x: number; y: number }) => {
      if (!projectId || !reactFlowInstance) {
        toast.error("Canvas not ready");
        return;
      }

      try {
        const defaultSizes: Record<string, { width: number; height: number }> = {
          image: { width: 200, height: 200 },
          text: { width: 250, height: 150 },
          url: { width: 300, height: 180 },
          document: { width: 280, height: 180 },
          video: { width: 320, height: 240 },
          chat: { width: 600, height: 700 },
          group: { width: 400, height: 300 },
          creative: { width: 960, height: 1200 },
        };

        const size = defaultSizes[type] || { width: 200, height: 200 };

        let centerPos = position;
        if (!centerPos) {
          const viewport = reactFlowInstance.getViewport();
          centerPos = {
            x: (window.innerWidth / 2 - viewport.x) / viewport.zoom,
            y: (window.innerHeight / 2 - viewport.y) / viewport.zoom,
          };
        }

        // For chat blocks: create block first, then session with block ID
        if (type === "chat") {
          // Step 1: Create the canvas block WITHOUT session
          const newBlock = await addBlock({
            type,
            position_x: Math.round(centerPos.x - size.width / 2),
            position_y: Math.round(centerPos.y - size.height / 2),
            width: size.width,
            height: size.height,
            title: "New Chat",
          });

          // Step 2: Create chat session WITH canvas_block_id
          const { data: sessionData, error } = await supabase
            .from("chat_sessions")
            .insert({
              agent_board_id: projectId,
              canvas_block_id: newBlock.id,  // Link to canvas block
              title: "New Chat",
            })
            .select()
            .single();

          // Step 3: Update block metadata with session ID
          if (!error && sessionData) {
            await updateBlockContent({
              id: newBlock.id,
              metadata: { sessionId: sessionData.id }
            });
          }

          // Add to local state
          const newNode: Node = {
            id: newBlock.id,
            type: newBlock.type,
            position: { x: newBlock.position_x, y: newBlock.position_y },
            data: {
              title: newBlock.title,
              content: newBlock.content,
              sessionId: sessionData?.id,
              blockId: newBlock.id,  // Pass block ID for chat isolation
              boardId: projectId,
              projectId: selectedProjectId,
            },
            style: {
              width: newBlock.width,
              height: newBlock.height,
            },
          };

          const currentNodes = nodes;
          const currentEdges = flowEdges;
          const newNodes = [...currentNodes, newNode];
          
          setNodes(newNodes);
          saveState(newNodes, currentEdges);
          return;  // Early return for chat blocks
        }

        // For non-chat blocks: proceed normally
        const newBlock = await addBlock({
          type,
          position_x: Math.round(centerPos.x - size.width / 2),
          position_y: Math.round(centerPos.y - size.height / 2),
          width: size.width,
          height: size.height,
          title: `New ${type}`,
        });

        // Add to local state
        const newNode: Node = {
          id: newBlock.id,
          type: newBlock.type,
          position: { x: newBlock.position_x, y: newBlock.position_y },
          data: {
            title: newBlock.title,
            content: newBlock.content,
            sessionId: (newBlock.metadata as any)?.sessionId,
            boardId: projectId,
            projectId: selectedProjectId,
          },
          style: {
            width: newBlock.width,
            height: newBlock.height,
          },
        };

        const currentNodes = nodes;
        const currentEdges = flowEdges;
        const newNodes = [...currentNodes, newNode];
        
        setNodes(newNodes);

        // Phase 3: Save state synchronously with exact new state
        saveState(newNodes, currentEdges);
      } catch (error) {
        console.error("Failed to add block:", error);
      }
    },
    [projectId, reactFlowInstance, addBlock, setNodes, saveState, nodes, flowEdges, selectedProjectId]
  );

  // Get selected nodes
  const selectedNodes = useMemo(() => nodes.filter((node) => node.selected), [nodes]);

  // Phase 7: Bulk delete with edge cleanup
  const handleDeleteSelected = useCallback(async () => {
    if (selectedNodes.length === 0) return;
    
    // Save state BEFORE deleting
    saveState(nodes, flowEdges);
    
    const nodeIdsToDelete = new Set(selectedNodes.map(n => n.id));
    
    try {
      // First, find and delete/unlink children of any group nodes being deleted
      const groupNodesToDelete = selectedNodes.filter(n => n.type === 'group');
      for (const groupNode of groupNodesToDelete) {
        const children = nodes.filter(n => n.parentNode === groupNode.id);
        for (const child of children) {
          // Delete child blocks from database
          await deleteBlockFromDb(child.id);
          nodeIdsToDelete.add(child.id);
        }
      }
      
      // Find all edges connected to nodes being deleted
      const edgesToDelete = flowEdges.filter(
        e => nodeIdsToDelete.has(e.source) || nodeIdsToDelete.has(e.target)
      );
      
      // Delete edges from database
      await Promise.allSettled(edgesToDelete.map(edge => deleteEdge(edge.id)));
      
      // Delete blocks from database
      await Promise.allSettled(selectedNodes.map(node => deleteBlock(node.id)));
      
      // Remove nodes from state (including children)
      setNodes((nds) => nds.filter((node) => !nodeIdsToDelete.has(node.id)));
      
      // Remove connected edges from state
      setEdges((eds) => eds.filter(
        e => !nodeIdsToDelete.has(e.source) && !nodeIdsToDelete.has(e.target)
      ));
      
      toast.success(`Deleted ${selectedNodes.length} blocks`);
    } catch (error) {
      console.error("Failed to delete blocks:", error);
      toast.error("Failed to delete some blocks");
    }
  }, [selectedNodes, deleteBlock, deleteBlockFromDb, deleteEdge, setNodes, setEdges, nodes, flowEdges, saveState]);

  const handleDuplicateSelected = useCallback(async () => {
    if (!projectId) return;

    const duplicatedNodes: Node[] = [];
    
    for (const node of selectedNodes) {
      try {
        const newBlock = await addBlock({
          type: node.type || "text",
          position_x: (node.position.x || 0) + 50,
          position_y: (node.position.y || 0) + 50,
          width: node.style?.width as number || 200,
          height: node.style?.height as number || 200,
          title: `${node.data.title || "Copy"} (Copy)`,
          content: node.data.content,
        });

        duplicatedNodes.push({
          id: newBlock.id,
          type: newBlock.type,
          position: { x: newBlock.position_x, y: newBlock.position_y },
          data: {
            ...node.data,
            title: newBlock.title,
          },
          style: {
            width: newBlock.width,
            height: newBlock.height,
          },
        });
      } catch (error) {
        console.error("Failed to duplicate block:", error);
      }
    }

    const currentNodes = nodes;
    const currentEdges = flowEdges;
    const newNodes = [...currentNodes, ...duplicatedNodes];
    
    setNodes(newNodes);

    // Phase 3: Save state synchronously with exact new state
    saveState(newNodes, currentEdges);
    
    toast.success(`Duplicated ${selectedNodes.length} blocks`);
  }, [selectedNodes, projectId, addBlock, setNodes, saveState, nodes, flowEdges]);

  const handleGroupSelected = useCallback(async () => {
    if (!projectId || !reactFlowInstance || selectedNodes.length === 0) return;

    try {
      // Calculate bounding box of selected nodes
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      selectedNodes.forEach((node) => {
        const x = node.position.x || 0;
        const y = node.position.y || 0;
        const width = (node.style?.width as number) || 200;
        const height = (node.style?.height as number) || 200;
        
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, y + height);
      });

      // Add padding
      const padding = 50;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;

      const newGroup = await addBlock({
        type: "group",
        position_x: minX,
        position_y: minY,
        width: maxX - minX,
        height: maxY - minY,
        title: `Group of ${selectedNodes.length}`,
      });

      // Link children by updating their group_id in database
      for (const node of selectedNodes) {
        const { error } = await supabase
          .from("canvas_blocks")
          .update({ group_id: newGroup.id })
          .eq("id", node.id);
        
        if (error) {
          console.error(`Failed to link child ${node.id}:`, error);
        }
      }

      // Update child node positions to be relative to group and set parentNode
      const selectedNodeIds = selectedNodes.map(n => n.id);
      setNodes((currentNodes) => currentNodes.map((node) => {
        if (selectedNodeIds.includes(node.id)) {
          return {
            ...node,
            parentNode: newGroup.id,
            extent: "parent" as const,
            position: {
              x: node.position.x - minX,
              y: node.position.y - minY,
            },
          };
        }
        return node;
      }));

      const newNode: Node = {
        id: newGroup.id,
        type: "group",
        position: { x: newGroup.position_x, y: newGroup.position_y },
        data: {
          blockId: newGroup.id,
          title: newGroup.title,
          childCount: selectedNodes.length,
          instructions: "",
          boardId: projectId,
        },
        style: {
          width: newGroup.width,
          height: newGroup.height,
        },
      };

      const currentNodes = nodes;
      const currentEdges = flowEdges;
      const newNodes = [...currentNodes, newNode];
      
      setNodes(newNodes);

      // Phase 3: Save state synchronously with exact new state
      saveState(newNodes, currentEdges);

      toast.success(`Grouped ${selectedNodes.length} items successfully`);
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  }, [selectedNodes, projectId, reactFlowInstance, addBlock, setNodes, saveState, nodes, flowEdges]);

  const handleClearSelection = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: false,
      }))
    );
  }, [setNodes]);

  // Handle double-click to edit block
  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // Open brain selector for brain nodes
      if (node.type === "brain") {
        setPendingBrainNode(node);
        setSelectingForBrainNode(true);
        setBrainModalOpen(true);
        return;
      }
      // Don't open edit for group, chat, or creative nodes
      if (node.type === "group" || node.type === "chat" || node.type === "creative") return;
      setEditingBlock(node as any);
      setEditDialogOpen(true);
    },
    []
  );

  // Phase 6: Handle block content update with history save
  const handleBlockContentUpdate = useCallback(
    (blockId: string, updates: any) => {
      // Phase 6: Save state BEFORE updating content
      saveState(nodes, flowEdges);
      
      updateBlockContent({ id: blockId, ...updates });
      // Update local state
      setNodes((nds) =>
        nds.map((node) =>
          node.id === blockId
            ? { ...node, data: { ...node.data, ...updates } }
            : node
        )
      );
    },
    [updateBlockContent, setNodes, nodes, flowEdges, saveState]
  );

  // Handle Central Brain selections
  const handleSelectAsset = useCallback(
    async (asset: any) => {
      if (!projectId || !reactFlowInstance) return;

      const viewport = reactFlowInstance.getViewport();
      const center = {
        x: (window.innerWidth / 2 - viewport.x) / viewport.zoom,
        y: (window.innerHeight / 2 - viewport.y) / viewport.zoom,
      };

      const blockType = asset.type === "image" ? "image" : "document";
      const newBlock = await addBlock({
        type: blockType,
        position_x: Math.round(center.x - 100),
        position_y: Math.round(center.y - 100),
        width: 200,
        height: 200,
        title: asset.name,
        url: asset.type === "image" ? asset.url_or_path : undefined,
        file_path: asset.type !== "image" ? asset.url_or_path : undefined,
        content: asset.type !== "image" ? asset.text_content : undefined,
      });

      const newNode: Node = {
        id: newBlock.id,
        type: blockType,
        position: { x: newBlock.position_x, y: newBlock.position_y },
        data: {
          blockId: newBlock.id,
          instruction_prompt: newBlock.instruction_prompt || '',
          title: newBlock.title,
          url: newBlock.url,
          file_path: newBlock.file_path,
          content: newBlock.content,
        },
        style: {
          width: newBlock.width,
          height: newBlock.height,
        },
      };

      const currentNodes = nodes;
      const currentEdges = flowEdges;
      const newNodes = [...currentNodes, newNode];
      
      setNodes(newNodes);
      
      // Phase 5: Save state for asset selection
      saveState(newNodes, currentEdges);
    },
    [projectId, reactFlowInstance, addBlock, setNodes, nodes, flowEdges, saveState]
  );

  const handleSelectPrompt = useCallback(
    async (prompt: any) => {
      if (!projectId || !reactFlowInstance) return;

      const viewport = reactFlowInstance.getViewport();
      const center = {
        x: (window.innerWidth / 2 - viewport.x) / viewport.zoom,
        y: (window.innerHeight / 2 - viewport.y) / viewport.zoom,
      };

      // Handle both string (backward compat) and object formats
      const title = typeof prompt === 'string' ? 'Prompt' : (prompt.name || 'Prompt');
      const content = typeof prompt === 'string' ? prompt : prompt.content;

      const newBlock = await addBlock({
        type: "text",
        position_x: Math.round(center.x - 100),
        position_y: Math.round(center.y - 100),
        width: 300,
        height: 200,
        title: title,
        content: content,
      });

      const newNode: Node = {
        id: newBlock.id,
        type: "text",
        position: { x: newBlock.position_x, y: newBlock.position_y },
        data: {
          blockId: newBlock.id,
          instruction_prompt: newBlock.instruction_prompt || '',
          title: newBlock.title,
          content: newBlock.content,
        },
        style: {
          width: newBlock.width,
          height: newBlock.height,
        },
      };

      const currentNodes = nodes;
      const currentEdges = flowEdges;
      const newNodes = [...currentNodes, newNode];
      
      setNodes(newNodes);
      
      // Phase 5: Save state for prompt selection
      saveState(newNodes, currentEdges);
    },
    [projectId, reactFlowInstance, addBlock, setNodes, nodes, flowEdges, saveState]
  );

  const handleSelectKnowledge = useCallback(
    async (knowledge: any) => {
      if (!projectId || !reactFlowInstance) return;

      const viewport = reactFlowInstance.getViewport();
      const center = {
        x: (window.innerWidth / 2 - viewport.x) / viewport.zoom,
        y: (window.innerHeight / 2 - viewport.y) / viewport.zoom,
      };

      const newBlock = await addBlock({
        type: "text",
        position_x: Math.round(center.x - 100),
        position_y: Math.round(center.y - 100),
        width: 300,
        height: 200,
        title: knowledge.title,
        content: knowledge.content,
      });

      const newNode: Node = {
        id: newBlock.id,
        type: "text",
        position: { x: newBlock.position_x, y: newBlock.position_y },
        data: {
          blockId: newBlock.id,
          instruction_prompt: newBlock.instruction_prompt || '',
          title: newBlock.title,
          content: newBlock.content,
        },
        style: {
          width: newBlock.width,
          height: newBlock.height,
        },
      };

      const currentNodes = nodes;
      const currentEdges = flowEdges;
      const newNodes = [...currentNodes, newNode];
      
      setNodes(newNodes);
      
      // Phase 5: Save state for knowledge selection
      saveState(newNodes, currentEdges);
    },
    [projectId, reactFlowInstance, addBlock, setNodes, nodes, flowEdges, saveState]
  );

  // Add missing handlers for roles, tools, strategies, swipe files, ad spy boards
  const handleSelectRole = useCallback(
    async (role: any) => {
      if (!projectId || !reactFlowInstance) return;

      const viewport = reactFlowInstance.getViewport();
      const center = {
        x: (window.innerWidth / 2 - viewport.x) / viewport.zoom,
        y: (window.innerHeight / 2 - viewport.y) / viewport.zoom,
      };

      const newBlock = await addBlock({
        type: "text",
        position_x: Math.round(center.x - 100),
        position_y: Math.round(center.y - 100),
        width: 350,
        height: 300,
        title: role.name,
        content: `## ${role.name}\n\n${role.description || ''}\n\n### System Prompt\n${role.system_prompt}`,
      });

      const newNode: Node = {
        id: newBlock.id,
        type: "text",
        position: { x: newBlock.position_x, y: newBlock.position_y },
        data: {
          blockId: newBlock.id,
          instruction_prompt: newBlock.instruction_prompt || '',
          title: newBlock.title,
          content: newBlock.content,
        },
        style: {
          width: newBlock.width,
          height: newBlock.height,
        },
      };

      const currentNodes = nodes;
      const currentEdges = flowEdges;
      const newNodes = [...currentNodes, newNode];
      
      setNodes(newNodes);
      saveState(newNodes, currentEdges);
    },
    [projectId, reactFlowInstance, addBlock, setNodes, nodes, flowEdges, saveState]
  );

  const handleSelectTool = useCallback(
    async (tool: any) => {
      if (!projectId || !reactFlowInstance) return;

      const viewport = reactFlowInstance.getViewport();
      const center = {
        x: (window.innerWidth / 2 - viewport.x) / viewport.zoom,
        y: (window.innerHeight / 2 - viewport.y) / viewport.zoom,
      };

      const newBlock = await addBlock({
        type: "text",
        position_x: Math.round(center.x - 100),
        position_y: Math.round(center.y - 100),
        width: 300,
        height: 200,
        title: tool.name,
        content: `## ${tool.name}\n\n${tool.description || ''}`,
      });

      const newNode: Node = {
        id: newBlock.id,
        type: "text",
        position: { x: newBlock.position_x, y: newBlock.position_y },
        data: {
          blockId: newBlock.id,
          instruction_prompt: newBlock.instruction_prompt || '',
          title: newBlock.title,
          content: newBlock.content,
        },
        style: {
          width: newBlock.width,
          height: newBlock.height,
        },
      };

      const currentNodes = nodes;
      const currentEdges = flowEdges;
      const newNodes = [...currentNodes, newNode];
      
      setNodes(newNodes);
      saveState(newNodes, currentEdges);
    },
    [projectId, reactFlowInstance, addBlock, setNodes, nodes, flowEdges, saveState]
  );

  const handleSelectStrategy = useCallback(
    async (strategy: any) => {
      if (!projectId || !reactFlowInstance) return;

      const viewport = reactFlowInstance.getViewport();
      const center = {
        x: (window.innerWidth / 2 - viewport.x) / viewport.zoom,
        y: (window.innerHeight / 2 - viewport.y) / viewport.zoom,
      };

      const newBlock = await addBlock({
        type: "text",
        position_x: Math.round(center.x - 100),
        position_y: Math.round(center.y - 100),
        width: 300,
        height: 200,
        title: strategy.title,
        content: strategy.content,
      });

      const newNode: Node = {
        id: newBlock.id,
        type: "text",
        position: { x: newBlock.position_x, y: newBlock.position_y },
        data: {
          blockId: newBlock.id,
          instruction_prompt: newBlock.instruction_prompt || '',
          title: newBlock.title,
          content: newBlock.content,
        },
        style: {
          width: newBlock.width,
          height: newBlock.height,
        },
      };

      const currentNodes = nodes;
      const currentEdges = flowEdges;
      const newNodes = [...currentNodes, newNode];
      
      setNodes(newNodes);
      saveState(newNodes, currentEdges);
    },
    [projectId, reactFlowInstance, addBlock, setNodes, nodes, flowEdges, saveState]
  );

  const handleSelectSwipeFile = useCallback(
    async (swipeFile: any) => {
      if (!projectId || !reactFlowInstance) return;

      const viewport = reactFlowInstance.getViewport();
      const center = {
        x: (window.innerWidth / 2 - viewport.x) / viewport.zoom,
        y: (window.innerHeight / 2 - viewport.y) / viewport.zoom,
      };

      // Determine block type based on swipe file content
      let blockType = 'text';
      let blockUrl = null;
      let blockContent = swipeFile.text_content || '';
      let blockWidth = 300;
      let blockHeight = 200;

      if (swipeFile.image_url) {
        blockType = 'image';
        blockUrl = swipeFile.image_url;
        blockWidth = 200;
        blockHeight = 200;
      } else if (swipeFile.video_url) {
        blockType = 'video';
        blockUrl = swipeFile.video_url;
        blockWidth = 320;
        blockHeight = 240;
      } else if (swipeFile.file_url) {
        blockType = 'document';
        blockUrl = swipeFile.file_url;
        blockWidth = 280;
        blockHeight = 180;
      }

      const newBlock = await addBlock({
        type: blockType,
        position_x: Math.round(center.x - blockWidth / 2),
        position_y: Math.round(center.y - blockHeight / 2),
        width: blockWidth,
        height: blockHeight,
        title: swipeFile.title,
        content: blockContent,
        url: blockUrl || undefined,
      });

      const newNode: Node = {
        id: newBlock.id,
        type: blockType,
        position: { x: newBlock.position_x, y: newBlock.position_y },
        data: {
          blockId: newBlock.id,
          instruction_prompt: newBlock.instruction_prompt || '',
          title: newBlock.title,
          content: newBlock.content,
          url: newBlock.url,
        },
        style: {
          width: newBlock.width,
          height: newBlock.height,
        },
      };

      const currentNodes = nodes;
      const currentEdges = flowEdges;
      const newNodes = [...currentNodes, newNode];
      
      setNodes(newNodes);
      saveState(newNodes, currentEdges);
    },
    [projectId, reactFlowInstance, addBlock, setNodes, nodes, flowEdges, saveState]
  );

  const handleSelectAdSpyBoardToCanvas = useCallback(
    async (board: any, ads: any[]) => {
      if (!projectId || !reactFlowInstance || !ads || ads.length === 0) return;

      const viewport = reactFlowInstance.getViewport();
      const startX = (window.innerWidth / 2 - viewport.x) / viewport.zoom;
      const startY = (window.innerHeight / 2 - viewport.y) / viewport.zoom;

      // Create blocks in a grid
      const gridCols = 3;
      const spacing = 20;
      const blockWidth = 200;
      const blockHeight = 200;
      
      const newNodes: Node[] = [];

      for (let i = 0; i < ads.length; i++) {
        const ad = ads[i];
        const col = i % gridCols;
        const row = Math.floor(i / gridCols);
        
        const x = startX + col * (blockWidth + spacing);
        const y = startY + row * (blockHeight + spacing);

        const newBlock = await addBlock({
          type: 'image',
          position_x: Math.round(x),
          position_y: Math.round(y),
          width: blockWidth,
          height: blockHeight,
          title: ad.title || `Ad ${i + 1}`,
          url: ad.media_url || ad.thumbnail_url,
        });

        newNodes.push({
          id: newBlock.id,
          type: 'image',
          position: { x: newBlock.position_x, y: newBlock.position_y },
          data: {
            title: newBlock.title,
            url: newBlock.url,
          },
          style: {
            width: newBlock.width,
            height: newBlock.height,
          },
        });
      }

      const currentNodes = nodes;
      const currentEdges = flowEdges;
      const allNewNodes = [...currentNodes, ...newNodes];
      
      setNodes(allNewNodes);
      saveState(allNewNodes, currentEdges);
      
      toast.success(`Added ${ads.length} ads from ${board.name} to canvas`);
    },
    [projectId, reactFlowInstance, addBlock, setNodes, nodes, flowEdges, saveState]
  );

  const handleSelectGroup = useCallback(
    async (groupId: string, contentType: string) => {
      if (!projectId || !reactFlowInstance) return;

      try {
        // Close modal immediately to prevent duplicate additions
        setBrainModalOpen(false);

        // Fetch the content group name and color
        const { data: contentGroup } = await supabase
          .from('content_groups')
          .select('name, color')
          .eq('id', groupId)
          .single();

        // Fetch all items in the group based on content type
        let items: any[] = [];
        
        switch (contentType) {
          case 'strategy':
            const { data: strategies } = await supabase
              .from('project_strategies')
              .select('*')
              .eq('group_id', groupId);
            items = strategies || [];
            break;
          case 'tool':
            const { data: tools } = await supabase
              .from('project_tools')
              .select('*')
              .eq('group_id', groupId);
            items = tools || [];
            break;
          case 'role':
            const { data: roles } = await supabase
              .from('ai_roles')
              .select('*')
              .eq('group_id', groupId);
            items = roles || [];
            break;
          case 'prompt':
            const { data: prompts } = await supabase
              .from('prompt_templates')
              .select('*')
              .eq('group_id', groupId);
            items = prompts || [];
            break;
          case 'knowledge':
            const { data: knowledge } = await supabase
              .from('knowledge_entries')
              .select('*')
              .eq('group_id', groupId);
            items = knowledge || [];
            break;
          case 'asset':
            const { data: assets } = await supabase
              .from('assets')
              .select('*')
              .eq('group_id', groupId);
            items = assets || [];
            break;
          case 'swipe':
            const { data: swipes } = await supabase
              .from('swipe_files')
              .select('*')
              .eq('group_id', groupId);
            items = swipes || [];
            break;
          default:
            toast.error(`Cannot add ${contentType} groups to canvas`);
            return;
        }

        if (items.length === 0) {
          toast.info('No items in this group');
          return;
        }

        // Create blocks in a grid
        const viewport = reactFlowInstance.getViewport();
        const startX = (window.innerWidth / 2 - viewport.x) / viewport.zoom;
        const startY = (window.innerHeight / 2 - viewport.y) / viewport.zoom;
        
        const gridCols = 3;
        const spacing = 20;
        const blockWidth = 250;
        const blockHeight = 150;
        const padding = 50;
        
        const newBlocks: any[] = [];

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const col = i % gridCols;
          const row = Math.floor(i / gridCols);
          
          const x = startX + padding + col * (blockWidth + spacing);
          const y = startY + padding + row * (blockHeight + spacing);

          // Use createBlockFromBrainItem logic for each item
          let blockType = 'text';
          let blockContent = '';
          let blockUrl = null;
          let blockTitle = '';

          switch (contentType) {
            case 'asset':
              if (item.type === 'image') {
                blockType = 'image';
                blockUrl = item.url_or_path;
              } else if (item.type === 'video') {
                blockType = 'video';
                blockUrl = item.url_or_path;
              } else {
                blockType = 'document';
                blockUrl = item.url_or_path;
                blockContent = item.text_content;
              }
              blockTitle = item.name;
              break;
            case 'strategy':
              blockContent = `## ${item.title}\n\n${item.content}`;
              blockTitle = item.title;
              break;
            case 'role':
              blockContent = `## ${item.name}\n\n${item.description || ''}\n\n### System Prompt\n${item.system_prompt}`;
              blockTitle = item.name;
              break;
            case 'tool':
              blockContent = `## ${item.name}\n\n${item.description || ''}`;
              blockTitle = item.name;
              break;
            case 'prompt':
              blockContent = item.content;
              blockTitle = item.name;
              break;
            case 'knowledge':
              blockContent = item.content;
              blockTitle = item.title;
              break;
            case 'swipe':
              if (item.image_url) {
                blockType = 'image';
                blockUrl = item.image_url;
              } else if (item.video_url) {
                blockType = 'video';
                blockUrl = item.video_url;
              } else if (item.file_url) {
                blockType = 'document';
                blockUrl = item.file_url;
              } else {
                blockContent = item.text_content || '';
              }
              blockTitle = item.title;
              break;
          }

          const newBlock = await addBlock({
            type: blockType,
            position_x: Math.round(x),
            position_y: Math.round(y),
            width: blockWidth,
            height: blockHeight,
            title: blockTitle,
            content: blockContent,
            url: blockUrl || undefined,
          });

          newBlocks.push(newBlock);
        }

        // Calculate bounding box for the group
        const groupWidth = gridCols * (blockWidth + spacing) + padding * 2;
        const groupRows = Math.ceil(items.length / gridCols);
        const groupHeight = groupRows * (blockHeight + spacing) + padding * 2;

        // Create the parent group node
        const groupBlock = await addBlock({
          type: "group",
          position_x: Math.round(startX),
          position_y: Math.round(startY),
          width: groupWidth,
          height: groupHeight,
          title: contentGroup?.name || `Group (${items.length} items)`,
          color: contentGroup?.color,
        });

        // Update all child blocks to have group_id
        await Promise.all(
          newBlocks.map(block =>
            supabase
              .from("canvas_blocks")
              .update({ group_id: groupBlock.id })
              .eq("id", block.id)
          )
        );

        // Create ReactFlow nodes with parent relationship
        const childNodes: Node[] = newBlocks.map((block, i) => {
          const col = i % gridCols;
          const row = Math.floor(i / gridCols);
          
          return {
            id: block.id,
            type: block.type,
            position: { 
              x: padding + col * (blockWidth + spacing),
              y: padding + row * (blockHeight + spacing),
            },
            parentNode: groupBlock.id,
            extent: "parent" as const,
            data: {
              blockId: block.id,
              title: block.title,
              content: block.content,
              url: block.url,
              groupId: groupBlock.id,
            },
            style: {
              width: block.width,
              height: block.height,
            },
          };
        });

        // Create the group node
        const groupNode: Node = {
          id: groupBlock.id,
          type: "group",
          position: { x: groupBlock.position_x, y: groupBlock.position_y },
          data: {
            blockId: groupBlock.id,
            title: groupBlock.title,
            color: groupBlock.color,
            childCount: items.length,
            boardId: projectId,
            onUpdateNodeData: (nodeId: string, newData: Partial<any>) => {
              setNodes((nds) =>
                nds.map((node) =>
                  node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
                )
              );
            },
          },
          style: {
            width: groupBlock.width,
            height: groupBlock.height,
          },
        };

        const currentNodes = nodes;
        const currentEdges = flowEdges;
        const allNewNodes = [...currentNodes, groupNode, ...childNodes];
        
        setNodes(allNewNodes);
        saveState(allNewNodes, currentEdges);
        
        toast.success(`Added ${items.length} items in a group to canvas`);
      } catch (error) {
        console.error('Failed to add group to canvas:', error);
        toast.error('Failed to add group to canvas');
      }
    },
    [projectId, reactFlowInstance, addBlock, setNodes, nodes, flowEdges, saveState]
  );


  // Phase 4: Handle drag and drop (memoized)
  const handleCanvasDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();

    if (!reactFlowInstance) return;

    const reactFlowBounds = e.currentTarget.getBoundingClientRect();

    // NEW: Handle native file drops from desktop
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      
      const position = reactFlowInstance.project({
        x: e.clientX - reactFlowBounds.left,
        y: e.clientY - reactFlowBounds.top,
      });
      
      // Check if dropping inside a group
      const targetGroup = findGroupAtPosition(position.x, position.y);
      
      let offsetX = 0;
      const uploadQueue: Array<{
        file: File;
        blockType: string;
        blockWidth: number;
        blockHeight: number;
        offsetX: number;
        targetGroup: typeof targetGroup;
      }> = [];
      
      for (const file of files) {
        try {
          // Determine block type from MIME type
          let blockType: string;
          let blockWidth = 200;
          let blockHeight = 200;
          
          if (file.type.startsWith('image/')) {
            blockType = 'image';
            blockWidth = 200;
            blockHeight = 200;
          } else if (file.type.startsWith('video/')) {
            blockType = 'video';
            blockWidth = 320;
            blockHeight = 240;
          } else if (file.type === 'application/pdf' || file.type.includes('document')) {
            blockType = 'document';
            blockWidth = 280;
            blockHeight = 180;
          } else if (file.type.startsWith('text/') || 
                     file.name.endsWith('.txt') || 
                     file.name.endsWith('.md')) {
            // For text files, read content
            const textContent = await file.text();
            blockType = 'text';
            blockWidth = 300;
            blockHeight = 200;
            
            // Create text block with content
            const newBlock = await addBlock({
              type: blockType,
              position_x: targetGroup 
                ? Math.round(position.x - targetGroup.position.x + offsetX)
                : Math.round(position.x + offsetX),
              position_y: targetGroup
                ? Math.round(position.y - targetGroup.position.y)
                : Math.round(position.y),
              width: blockWidth,
              height: blockHeight,
              title: file.name,
              content: textContent,
            });
            
            // Link to group if inside one
            if (targetGroup) {
              await supabase
                .from("canvas_blocks")
                .update({ group_id: targetGroup.id })
                .eq("id", newBlock.id);
            }
            
            const newNode: Node = {
              id: newBlock.id,
              type: blockType,
              position: { x: newBlock.position_x, y: newBlock.position_y },
              parentNode: targetGroup?.id,
              extent: targetGroup ? "parent" as const : undefined,
            data: {
              title: newBlock.title,
              content: newBlock.content,
              isGroupChild: !!targetGroup,
              parentGroupId: targetGroup?.id,
              blockId: newBlock.id,
              onUnlinkFromGroup: handleUnlinkFromGroup,
            },
              style: { width: newBlock.width, height: newBlock.height },
            };
            
            setNodes((currentNodes) => [...currentNodes, newNode]);
            offsetX += blockWidth + 20;
            
            if (targetGroup) {
              toast.success(`Added ${file.name} to "${targetGroup.data.title || 'group'}"`);
            } else {
              toast.success(`Added ${file.name} to canvas`);
            }
            continue;
          } else {
            // Default to document for other file types
            blockType = 'document';
            blockWidth = 280;
            blockHeight = 180;
          }
          
          // For non-text files, upload to storage first
          uploadQueue.push({
            file,
            blockType,
            blockWidth,
            blockHeight,
            offsetX,
            targetGroup
          });
          offsetX += blockWidth + 20;
        } catch (error) {
          console.error(`Failed to process ${file.name}:`, error);
          toast.error(`Failed to add ${file.name}`);
        }
      }
      
      // Process upload queue in parallel batches
      if (uploadQueue.length > 0) {
        const batchToastId = toast.loading(`Processing ${uploadQueue.length} document${uploadQueue.length > 1 ? 's' : ''}...`, {
          description: 'Uploading and extracting text content'
        });

        try {
          // Process in batches of 3 to avoid overwhelming the server
          const batchSize = 3;
          let processedCount = 0;
          
          for (let i = 0; i < uploadQueue.length; i += batchSize) {
            const batch = uploadQueue.slice(i, i + batchSize);
            
            await Promise.all(batch.map(async (item) => {
              try {
                // Upload file to Supabase storage
                const timestamp = Date.now();
                const randomStr = Math.random().toString(36).substring(2, 8);
                const fileName = `${timestamp}-${randomStr}-${item.file.name}`;
                const filePath = `assets/${fileName}`;
                
                const { error: uploadError } = await supabase.storage
                  .from('canvas-uploads')
                  .upload(filePath, item.file);
                
                if (uploadError) throw uploadError;
                
                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                  .from('canvas-uploads')
                  .getPublicUrl(filePath);
                
                // Create block
                const newBlock = await addBlock({
                  type: item.blockType,
                  position_x: item.targetGroup 
                    ? Math.round(position.x - item.targetGroup.position.x + item.offsetX)
                    : Math.round(position.x + item.offsetX),
                  position_y: item.targetGroup
                    ? Math.round(position.y - item.targetGroup.position.y)
                    : Math.round(position.y),
                  width: item.blockWidth,
                  height: item.blockHeight,
                  title: item.file.name,
                  url: publicUrl,
                  content: undefined,
                });
                
                // Queue document for background parsing if it's a document
                if (item.blockType === 'document') {
                  // Update parsing status to pending
                  await supabase
                    .from("canvas_blocks")
                    .update({ parsing_status: 'pending' })
                    .eq("id", newBlock.id);
                    
                  addToQueue(
                    item.file,
                    newBlock.id,
                    "canvas_blocks",
                    item.file.name
                  );
                }
                
                // Link to group if inside one
                if (item.targetGroup) {
                  await supabase
                    .from("canvas_blocks")
                    .update({ group_id: item.targetGroup.id })
                    .eq("id", newBlock.id);
                }
                
                // Add node to state
                const newNode: Node = {
                  id: newBlock.id,
                  type: item.blockType,
                  position: { x: newBlock.position_x, y: newBlock.position_y },
                  parentNode: item.targetGroup?.id,
                  extent: item.targetGroup ? "parent" as const : undefined,
                  data: {
                    title: newBlock.title,
                    url: newBlock.url,
                    content: newBlock.content,
                    isGroupChild: !!item.targetGroup,
                    parentGroupId: item.targetGroup?.id,
                    blockId: newBlock.id,
                    onUnlinkFromGroup: handleUnlinkFromGroup,
                  },
                  style: { width: newBlock.width, height: newBlock.height },
                };
                
                setNodes((currentNodes) => [...currentNodes, newNode]);
                
                // Update group child count
                if (item.targetGroup) {
                  setNodes((currentNodes) =>
                    currentNodes.map((node) =>
                      node.id === item.targetGroup.id
                        ? {
                            ...node,
                            data: {
                              ...node.data,
                              childCount: (node.data.childCount || 0) + 1,
                            },
                          }
                        : node
                    )
                  );
                }
                
                processedCount++;
                toast.loading(`Processing ${uploadQueue.length} document${uploadQueue.length > 1 ? 's' : ''}...`, {
                  id: batchToastId,
                  description: `${processedCount}/${uploadQueue.length} completed`
                });
              } catch (error) {
                console.error(`Failed to upload ${item.file.name}:`, error);
              }
            }));
          }
          
          toast.success(`Added ${processedCount} document${processedCount !== 1 ? 's' : ''} to canvas`, {
            id: batchToastId
          });
        } catch (error) {
          console.error('Batch upload failed:', error);
          toast.error('Some files failed to upload', { id: batchToastId });
        }
      }
      
      // Save state after all files processed
      saveState([...nodes], flowEdges);
      return;
    }

    // Check for central brain item
    const centralBrainData = e.dataTransfer.getData("application/central-brain-item");
    if (centralBrainData) {
      try {
        const { item, type } = JSON.parse(centralBrainData);
        const position = reactFlowInstance.project({
          x: e.clientX - reactFlowBounds.left,
          y: e.clientY - reactFlowBounds.top,
        });

        // Use createBlockFromBrainItem logic with position
        let blockType = 'text';
        let blockWidth = 250;
        let blockHeight = 150;
        let blockUrl: string | undefined;
        let blockContent: string | undefined;
        let blockTitle = item.name || item.title;

        switch (type) {
          case 'asset':
            if (item.type === 'image') {
              blockType = 'image';
              blockUrl = item.url_or_path;
              blockWidth = 200;
              blockHeight = 200;
            } else if (item.type === 'video') {
              blockType = 'video';
              blockUrl = item.url_or_path;
              blockWidth = 320;
              blockHeight = 180;
            } else {
              blockType = 'document';
              blockUrl = item.url_or_path;
              blockContent = item.text_content || item.description;
              blockWidth = 280;
              blockHeight = 180;
            }
            break;
          
          case 'swipe_file':
            if (item.image_url) {
              blockType = 'image';
              blockUrl = item.image_url;
              blockWidth = 200;
              blockHeight = 200;
            } else if (item.video_url) {
              blockType = 'video';
              blockUrl = item.video_url;
              blockWidth = 320;
              blockHeight = 180;
            } else if (item.file_url) {
              blockType = 'document';
              blockUrl = item.file_url;
              blockContent = item.text_content;
              blockWidth = 280;
              blockHeight = 180;
            } else {
              blockContent = item.text_content;
            }
            break;

          case 'prompt':
            blockContent = `## ${item.name}\n\n${item.content}`;
            blockWidth = 300;
            blockHeight = 200;
            break;

          case 'role':
            blockContent = `## ${item.name}\n\n${item.description || ''}\n\n### System Prompt\n${item.system_prompt}`;
            blockWidth = 350;
            blockHeight = 300;
            break;

          case 'tool':
            blockContent = `## ${item.name}\n\n${item.description}`;
            break;

          case 'knowledge':
            blockContent = item.content;
            blockWidth = 300;
            blockHeight = 250;
            break;

          case 'strategy':
            blockContent = item.content;
            blockWidth = 300;
            blockHeight = 250;
            break;

          case 'research':
            blockContent = typeof item.content === 'string' ? item.content : JSON.stringify(item.content);
            blockWidth = 400;
            blockHeight = 300;
            break;
        }

        const newBlock = await addBlock({
          type: blockType,
          position_x: Math.round(position.x),
          position_y: Math.round(position.y),
          width: blockWidth,
          height: blockHeight,
          title: blockTitle,
          content: blockContent,
          url: blockUrl,
        });

        const newNode: Node = {
          id: newBlock.id,
          type: blockType,
          position: { x: newBlock.position_x, y: newBlock.position_y },
          data: {
            title: newBlock.title,
            content: newBlock.content,
            url: newBlock.url,
          },
          style: {
            width: newBlock.width,
            height: newBlock.height,
          },
        };

        const currentNodes = nodes;
        const currentEdges = flowEdges;
        const newNodes = [...currentNodes, newNode];
        
        setNodes(newNodes);
        saveState(newNodes, currentEdges);
        toast.success(`Added ${blockTitle} to canvas`);
      } catch (error) {
        console.error("Failed to add central brain item:", error);
        toast.error("Failed to add item to canvas");
      }
      return;
    }

    // Check for brain drop
    const isBrainDrop = e.dataTransfer.getData("application/brain-drop");
    if (isBrainDrop) {
      const position = reactFlowInstance.project({
        x: e.clientX - reactFlowBounds.left,
        y: e.clientY - reactFlowBounds.top,
      });

      try {
        const newBlock = await addBlock({
          type: "brain",
          position_x: Math.round(position.x - 125),
          position_y: Math.round(position.y - 75),
          width: 250,
          height: 150,
          title: "Brain Node",
        });

        const newNode: Node = {
          id: newBlock.id,
          type: "brain",
          position: { x: newBlock.position_x, y: newBlock.position_y },
          data: {
            title: newBlock.title,
          },
          style: {
            width: newBlock.width,
            height: newBlock.height,
          },
        };

        const currentNodes = nodes;
        const currentEdges = flowEdges;
        const newNodes = [...currentNodes, newNode];
        
        setNodes(newNodes);
        setPendingBrainNode(newNode);
        setSelectingForBrainNode(true);
        setBrainModalOpen(true);
        
        // Phase 5: Save state for brain drop
        saveState(newNodes, currentEdges);
      } catch (error) {
        console.error("Failed to add brain node:", error);
      }
      return;
    }

    // Check for block type from toolbar
    const blockType = e.dataTransfer.getData("application/block-type");
    if (blockType) {
      const position = reactFlowInstance.project({
        x: e.clientX - reactFlowBounds.left,
        y: e.clientY - reactFlowBounds.top,
      });

      handleAddBlock(blockType, position);
      return;
    }

    // Check for asset data
    const assetData = e.dataTransfer.getData("application/asset-data");
    if (assetData) {
      try {
        const asset = JSON.parse(assetData);
        const position = reactFlowInstance.project({
          x: e.clientX - reactFlowBounds.left,
          y: e.clientY - reactFlowBounds.top,
        });

        const blockType = asset.type === "image" ? "image" : asset.type === "video" ? "video" : "text";
        
        const newBlock = await addBlock({
          type: blockType,
          position_x: Math.round(position.x),
          position_y: Math.round(position.y),
          width: blockType === "image" ? 200 : 250,
          height: blockType === "image" ? 200 : 150,
          title: asset.name,
          content: asset.text_content || undefined,
          url: asset.url_or_path || undefined,
          asset_id: asset.id,
        });

        const newNode: Node = {
          id: newBlock.id,
          type: blockType,
          position: { x: newBlock.position_x, y: newBlock.position_y },
          data: {
            title: newBlock.title,
            content: newBlock.content,
            url: newBlock.url,
          },
          style: {
            width: newBlock.width,
            height: newBlock.height,
          },
        };

        const currentNodes = nodes;
        const currentEdges = flowEdges;
        const newNodes = [...currentNodes, newNode];
        
        setNodes(newNodes);
        
        // Phase 5: Save state for asset drop
        saveState(newNodes, currentEdges);
      } catch (error) {
        console.error("Failed to parse asset data:", error);
      }
    }
  }, [reactFlowInstance, addBlock, setNodes, nodes, flowEdges, saveState, handleAddBlock]);

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  // Phase 6: Brain content selector handlers with history save
  const handleSelectAssetGroup = useCallback(
    (groupId: string, assets: any[]) => {
      if (pendingBrainNode) {
        // Phase 6: Save state before brain update
        saveState(nodes, flowEdges);
        
        updateBlockContent({
          id: pendingBrainNode.id,
          metadata: { contentType: "asset_group", groupId, itemCount: assets.length },
        });
        setNodes((nds) =>
          nds.map((node) =>
            node.id === pendingBrainNode.id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    contentType: "asset_group",
                    itemCount: assets.length,
                  },
                }
              : node
          )
        );
        toast.success(`Connected ${assets.length} assets to brain node`);
      }
      setPendingBrainNode(null);
    },
    [pendingBrainNode, updateBlockContent, setNodes, nodes, flowEdges, saveState]
  );

  // Clipboard paste handler
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Don't intercept paste in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!reactFlowInstance || !projectId) return;
      
      const items = e.clipboardData?.items;
      if (!items) return;
      
      e.preventDefault();
      
      // Get paste position (center of viewport)
      const viewport = reactFlowInstance.getViewport();
      const position = {
        x: (window.innerWidth / 2 - (viewport?.x || 0)) / (viewport?.zoom || 1),
        y: (window.innerHeight / 2 - (viewport?.y || 0)) / (viewport?.zoom || 1),
      };
      
      // Check for images first
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            try {
              toast.loading("Uploading image...", { id: 'paste-image' });
              
              // Upload to storage
              const timestamp = Date.now();
              const randomStr = Math.random().toString(36).substring(2, 8);
              const fileName = `${timestamp}-${randomStr}-${file.name || 'image.png'}`;
              const filePath = `assets/${fileName}`;
              
              const { error: uploadError } = await supabase.storage
                .from('canvas-uploads')
                .upload(filePath, file);
              
              if (uploadError) throw uploadError;
              
              const { data: { publicUrl } } = supabase.storage
                .from('canvas-uploads')
                .getPublicUrl(filePath);
              
              // Create image block
              const newBlock = await addBlock({
                type: 'image',
                position_x: Math.round(position.x - 100),
                position_y: Math.round(position.y - 100),
                width: 200,
                height: 200,
                title: file.name || 'Pasted Image',
                url: publicUrl,
              });
              
              const newNode: Node = {
                id: newBlock.id,
                type: 'image',
                position: { x: newBlock.position_x, y: newBlock.position_y },
                data: {
                  title: newBlock.title,
                  url: newBlock.url,
                },
                style: { width: 200, height: 200 },
              };
              
              setNodes((currentNodes) => [...currentNodes, newNode]);
              toast.success("Image pasted to canvas", { id: 'paste-image' });
            } catch (error) {
              console.error("Failed to paste image:", error);
              toast.error("Failed to paste image", { id: 'paste-image' });
            }
            return;
          }
        }
      }
      
      // Check for text/URLs
      const text = e.clipboardData?.getData('text/plain')?.trim();
      if (text) {
        // Detect YouTube URLs
        const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
        const isYouTube = youtubeRegex.test(text);
        
        if (isYouTube) {
          try {
            toast.loading("Fetching YouTube video summary...", { id: 'paste-youtube' });
            
            const { data, error } = await supabase.functions.invoke('youtube-summary', {
              body: { url: text }
            });
            
            if (error) throw error;
            
            // Create text block with video summary
            const summaryContent = `# ${data.title}\n\n**Channel:** ${data.author}\n\n## Summary\n\n${data.summary}\n\n[Watch Video](${data.url})`;
            
            const newBlock = await addBlock({
              type: 'text',
              position_x: Math.round(position.x - 150),
              position_y: Math.round(position.y - 100),
              width: 350,
              height: 300,
              title: data.title,
              content: summaryContent,
            });
            
            const newNode: Node = {
              id: newBlock.id,
              type: 'text',
              position: { x: newBlock.position_x, y: newBlock.position_y },
              data: {
                title: newBlock.title,
                content: newBlock.content,
              },
              style: { width: 350, height: 300 },
            };
            
            setNodes((currentNodes) => [...currentNodes, newNode]);
            toast.success("YouTube video summary added to canvas", { id: 'paste-youtube' });
          } catch (error) {
            console.error("Failed to get YouTube summary:", error);
            toast.error("Failed to get YouTube summary", { id: 'paste-youtube' });
          }
          return;
        }
        
        // Check if it's a URL (but not YouTube)
        const urlRegex = /^https?:\/\/.+/i;
        const isUrl = urlRegex.test(text);
        
        if (isUrl) {
          try {
            toast.loading("Fetching URL metadata...", { id: 'paste-url' });
            
            // Try to scrape URL metadata using Firecrawl for better page-specific content
            const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
              body: { url: text }
            });
            
            if (!error && data) {
              const newBlock = await addBlock({
                type: 'url',
                position_x: Math.round(position.x - 140),
                position_y: Math.round(position.y - 100),
                width: 280,
                height: 200,
                title: data.title || 'URL',
                url: text,
                content: data.markdown || data.description || '',
                metadata: {
                  title: data.title,
                  description: data.description,
                  image: data.image,
                  siteName: data.siteName,
                  markdown: data.markdown,
                  hasFirecrawl: data.hasFirecrawl,
                },
              });
              
              const newNode: Node = {
                id: newBlock.id,
                type: 'url',
                position: { x: newBlock.position_x, y: newBlock.position_y },
                data: {
                  title: newBlock.title,
                  url: newBlock.url,
                  metadata: newBlock.metadata,
                },
                style: { width: 280, height: 200 },
              };
              
              setNodes((currentNodes) => [...currentNodes, newNode]);
              toast.success("URL added to canvas", { id: 'paste-url' });
            } else {
              throw new Error("Failed to scrape URL");
            }
          } catch (error) {
            console.error("Failed to scrape URL:", error);
            // Fallback: create simple text block with URL
            const newBlock = await addBlock({
              type: 'text',
              position_x: Math.round(position.x - 150),
              position_y: Math.round(position.y - 75),
              width: 300,
              height: 150,
              title: 'Link',
              content: text,
            });
            
            const newNode: Node = {
              id: newBlock.id,
              type: 'text',
              position: { x: newBlock.position_x, y: newBlock.position_y },
              data: {
                title: newBlock.title,
                content: newBlock.content,
              },
              style: { width: 300, height: 150 },
            };
            
            setNodes((currentNodes) => [...currentNodes, newNode]);
            toast.success("URL added to canvas", { id: 'paste-url' });
          }
          return;
        }
        
        // Plain text
        try {
          const newBlock = await addBlock({
            type: 'text',
            position_x: Math.round(position.x - 150),
            position_y: Math.round(position.y - 100),
            width: 300,
            height: 200,
            title: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
            content: text,
          });
          
          const newNode: Node = {
            id: newBlock.id,
            type: 'text',
            position: { x: newBlock.position_x, y: newBlock.position_y },
            data: {
              title: newBlock.title,
              content: newBlock.content,
            },
            style: { width: 300, height: 200 },
          };
          
          setNodes((currentNodes) => [...currentNodes, newNode]);
          toast.success("Text pasted to canvas");
        } catch (error) {
          console.error("Failed to paste text:", error);
          toast.error("Failed to paste text");
        }
      }
    };
    
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [reactFlowInstance, projectId, addBlock, setNodes]);

  const handleSelectSwipeGroup = useCallback(
    (groupId: string, swipes: any[]) => {
      if (pendingBrainNode) {
        // Phase 6: Save state before brain update
        saveState(nodes, flowEdges);
        
        updateBlockContent({
          id: pendingBrainNode.id,
          metadata: { contentType: "swipe_group", groupId, itemCount: swipes.length },
        });
        setNodes((nds) =>
          nds.map((node) =>
            node.id === pendingBrainNode.id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    contentType: "swipe_group",
                    itemCount: swipes.length,
                  },
                }
              : node
          )
        );
        toast.success(`Connected ${swipes.length} swipe files to brain node`);
      }
      setPendingBrainNode(null);
    },
    [pendingBrainNode, updateBlockContent, setNodes, nodes, flowEdges, saveState]
  );

  const handleSelectAdSpyBoard = useCallback(
    (board: any, ads: any[]) => {
      if (pendingBrainNode) {
        // Phase 6: Save state before brain update
        saveState(nodes, flowEdges);
        
        updateBlockContent({
          id: pendingBrainNode.id,
          metadata: { contentType: "ad_spy_board", boardId: board.id, itemCount: ads.length },
        });
        setNodes((nds) =>
          nds.map((node) =>
            node.id === pendingBrainNode.id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    contentType: "ad_spy_board",
                    itemCount: ads.length,
                  },
                }
              : node
          )
        );
        toast.success(`Connected board "${board.name}" with ${ads.length} ads to brain node`);
      }
      setPendingBrainNode(null);
    },
    [pendingBrainNode, updateBlockContent, setNodes, nodes, flowEdges, saveState]
  );

  // Phase 5: New brain content handlers
  const handleSelectToolForBrain = useCallback(
    (tool: any) => {
      if (pendingBrainNode) {
        saveState(nodes, flowEdges);
        updateBlockContent({
          id: pendingBrainNode.id,
          metadata: { contentType: "tools", toolId: tool.id, itemCount: 1 },
        });
        setNodes((nds) =>
          nds.map((node) =>
            node.id === pendingBrainNode.id
              ? { ...node, data: { ...node.data, contentType: "tools", itemCount: 1 } }
              : node
          )
        );
        toast.success(`Connected tool "${tool.name}" to brain node`);
      }
      setPendingBrainNode(null);
    },
    [pendingBrainNode, updateBlockContent, setNodes, nodes, flowEdges, saveState]
  );

  const handleSelectKnowledgeForBrain = useCallback(
    (knowledge: any) => {
      if (pendingBrainNode) {
        saveState(nodes, flowEdges);
        updateBlockContent({
          id: pendingBrainNode.id,
          metadata: { contentType: "knowledge", knowledgeId: knowledge.id, itemCount: 1 },
        });
        setNodes((nds) =>
          nds.map((node) =>
            node.id === pendingBrainNode.id
              ? { ...node, data: { ...node.data, contentType: "knowledge", itemCount: 1 } }
              : node
          )
        );
        toast.success(`Connected knowledge "${knowledge.title}" to brain node`);
      }
      setPendingBrainNode(null);
    },
    [pendingBrainNode, updateBlockContent, setNodes, nodes, flowEdges, saveState]
  );

  const handleSelectStrategyForBrain = useCallback(
    (strategy: any) => {
      if (pendingBrainNode) {
        saveState(nodes, flowEdges);
        updateBlockContent({
          id: pendingBrainNode.id,
          metadata: { contentType: "strategy", strategyId: strategy.id, itemCount: 1 },
        });
        setNodes((nds) =>
          nds.map((node) =>
            node.id === pendingBrainNode.id
              ? { ...node, data: { ...node.data, contentType: "strategy", itemCount: 1 } }
              : node
          )
        );
        toast.success(`Connected strategy "${strategy.title}" to brain node`);
      }
      setPendingBrainNode(null);
    },
    [pendingBrainNode, updateBlockContent, setNodes, nodes, flowEdges, saveState]
  );

  const handleSelectRoleForBrain = useCallback(
    (role: any) => {
      if (pendingBrainNode) {
        saveState(nodes, flowEdges);
        updateBlockContent({
          id: pendingBrainNode.id,
          metadata: { contentType: "role", roleId: role.id, itemCount: 1 },
        });
        setNodes((nds) =>
          nds.map((node) =>
            node.id === pendingBrainNode.id
              ? { ...node, data: { ...node.data, contentType: "role", itemCount: 1 } }
              : node
          )
        );
        toast.success(`Connected role "${role.name}" to brain node`);
      }
      setPendingBrainNode(null);
    },
    [pendingBrainNode, updateBlockContent, setNodes, nodes, flowEdges, saveState]
  );

  const handleSelectPromptForBrain = useCallback(
    (prompt: any) => {
      if (pendingBrainNode) {
        saveState(nodes, flowEdges);
        updateBlockContent({
          id: pendingBrainNode.id,
          metadata: { contentType: "prompt", promptId: prompt.id, itemCount: 1 },
        });
        setNodes((nds) =>
          nds.map((node) =>
            node.id === pendingBrainNode.id
              ? { ...node, data: { ...node.data, contentType: "prompt", itemCount: 1 } }
              : node
          )
        );
        toast.success(`Connected prompt "${prompt.name}" to brain node`);
      }
      setPendingBrainNode(null);
    },
    [pendingBrainNode, updateBlockContent, setNodes, nodes, flowEdges, saveState]
  );

  const handleSelectResearchForBrain = useCallback(
    (research: any) => {
      if (pendingBrainNode) {
        saveState(nodes, flowEdges);
        updateBlockContent({
          id: pendingBrainNode.id,
          metadata: { contentType: "research", researchId: research.id, itemCount: 1 },
        });
        setNodes((nds) =>
          nds.map((node) =>
            node.id === pendingBrainNode.id
              ? { ...node, data: { ...node.data, contentType: "research", itemCount: 1 } }
              : node
          )
        );
        toast.success(`Connected research "${research.name}" to brain node`);
      }
      setPendingBrainNode(null);
    },
    [pendingBrainNode, updateBlockContent, setNodes, nodes, flowEdges, saveState]
  );

  // Handle node context menu (right-click)
  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, node });
  }, []);

  // Close context menu
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Add node to a group
  const handleAddToGroup = useCallback(async (groupId: string) => {
    if (!contextMenu) return;
    
    const node = contextMenu.node;
    const targetGroup = nodes.find(n => n.id === groupId);
    
    if (!targetGroup || node.parentNode) {
      setContextMenu(null);
      return;
    }

    // Convert to relative position
    const relativeX = node.position.x - targetGroup.position.x;
    const relativeY = node.position.y - targetGroup.position.y;

    // Update database
    await supabase
      .from("canvas_blocks")
      .update({ 
        group_id: groupId,
        position_x: Math.round(relativeX),
        position_y: Math.round(relativeY)
      })
      .eq("id", node.id);

    // Update local state
    setNodes((currentNodes) => currentNodes.map(n => {
      if (n.id === node.id) {
        return {
          ...n,
          parentNode: groupId,
          extent: "parent" as const,
          position: { x: relativeX, y: relativeY },
          data: {
            ...n.data,
            isGroupChild: true,
            parentGroupId: groupId,
          },
        };
      }
      if (n.id === groupId) {
        return {
          ...n,
          data: {
            ...n.data,
            childCount: (n.data.childCount || 0) + 1,
          },
        };
      }
      return n;
    }));

    toast.success(`Added to "${targetGroup.data.title || 'group'}"`);
    saveState(nodes, flowEdges);
    setContextMenu(null);
  }, [contextMenu, nodes, flowEdges, saveState, setNodes]);

  // Duplicate node
  const handleDuplicateNode = useCallback(async () => {
    if (!contextMenu || !projectId) return;
    
    const node = contextMenu.node;
    const offset = 20;

    try {
      const newBlock = await addBlock({
        type: node.type!,
        position_x: Math.round(node.position.x + offset),
        position_y: Math.round(node.position.y + offset),
        width: (node.style?.width as number) || 200,
        height: (node.style?.height as number) || 200,
        title: node.data.title ? `${node.data.title} (Copy)` : undefined,
        content: node.data.content,
        url: node.data.url,
        file_path: node.data.file_path,
        color: node.data.color,
        metadata: node.data.metadata,
      });

      // If the original node was in a group, link the duplicate to the same group
      if (node.parentNode) {
        await supabase
          .from("canvas_blocks")
          .update({ group_id: node.parentNode })
          .eq("id", newBlock.id);
      }

      const newNode: Node = {
        id: newBlock.id,
        type: node.type,
        position: { x: newBlock.position_x, y: newBlock.position_y },
        parentNode: node.parentNode,
        extent: node.extent,
        data: {
          ...node.data,
          blockId: newBlock.id,
        },
        style: node.style,
      };

      const currentNodes = nodes;
      const currentEdges = flowEdges;
      const newNodes = [...currentNodes, newNode];
      
      setNodes(newNodes);
      saveState(newNodes, currentEdges);
      
      toast.success("Node duplicated");
    } catch (error) {
      console.error("Failed to duplicate node:", error);
      toast.error("Failed to duplicate node");
    }

    setContextMenu(null);
  }, [contextMenu, nodes, flowEdges, projectId, addBlock, setNodes, saveState]);

  // Delete node from context menu
  const handleDeleteNode = useCallback(() => {
    if (!contextMenu) return;
    
    const node = contextMenu.node;
    saveState(nodes, flowEdges);
    
    deleteBlockFromDb(node.id);
    
    const nodeIdsToDelete = new Set([node.id]);
    const edgesToDelete = flowEdges.filter(
      edge => edge.source === node.id || edge.target === node.id
    );
    
    edgesToDelete.forEach(edge => {
      deleteEdge(edge.id);
    });

    setNodes((nds) => nds.filter((n) => !nodeIdsToDelete.has(n.id)));
    setEdges((eds) => eds.filter((e) => !edgesToDelete.some((del) => del.id === e.id)));
    
    toast.success("Node deleted");
    setContextMenu(null);
  }, [contextMenu, nodes, flowEdges, deleteBlockFromDb, deleteEdge, saveState, setNodes, setEdges]);

  // Open rename dialog from context menu
  const handleOpenRename = useCallback(() => {
    if (contextMenu?.node) {
      setRenameValue(contextMenu.node.data.title || "");
      setRenamingNodeId(contextMenu.node.id);
      setRenameDialogOpen(true);
      setContextMenu(null);
    }
  }, [contextMenu]);

  // Submit rename from dialog
  const handleRenameSubmit = useCallback(async () => {
    if (!renamingNodeId) return;
    
    await supabase
      .from("canvas_blocks")
      .update({ title: renameValue })
      .eq("id", renamingNodeId);
    
    setNodes((currentNodes) => currentNodes.map(n => 
      n.id === renamingNodeId 
        ? { ...n, data: { ...n.data, title: renameValue } }
        : n
    ));
    
    toast.success("Group renamed");
    setRenameDialogOpen(false);
    setRenamingNodeId(null);
  }, [renamingNodeId, renameValue, setNodes]);

  // Create canvas block from brain item
  const createBlockFromBrainItem = useCallback(
    async (item: any, itemType: string) => {
      if (!projectId || !reactFlowInstance) {
        toast.error("Canvas not ready");
        return;
      }

      try {
        const viewport = reactFlowInstance.getViewport();
        const centerPos = {
          x: (window.innerWidth / 2 - viewport.x) / viewport.zoom,
          y: (window.innerHeight / 2 - viewport.y) / viewport.zoom,
        };

        let blockType: string;
        let blockContent: string | undefined;
        let blockUrl: string | null = null;
        let blockTitle: string;
        let blockWidth = 250;
        let blockHeight = 150;

        switch (itemType) {
          case 'asset':
            if (item.type === 'image') {
              blockType = 'image';
              blockUrl = item.url_or_path;
              blockWidth = 200;
              blockHeight = 200;
            } else if (item.type === 'video') {
              blockType = 'video';
              blockUrl = item.url_or_path;
              blockWidth = 320;
              blockHeight = 240;
            } else {
              blockType = 'document';
              blockContent = item.text_content || '';
              blockUrl = item.url_or_path;
              blockWidth = 280;
              blockHeight = 180;
            }
            blockTitle = item.name;
            break;
          case 'knowledge':
            blockType = 'document';
            blockContent = item.content;
            blockTitle = item.title;
            blockWidth = 300;
            blockHeight = 200;
            break;
          case 'strategy':
            blockType = 'text';
            blockContent = `## ${item.title}\n\n${item.content}`;
            blockTitle = item.title;
            blockWidth = 300;
            blockHeight = 200;
            break;
          case 'prompt':
            blockType = 'text';
            blockContent = item.content;
            blockTitle = item.name;
            blockWidth = 300;
            blockHeight = 200;
            break;
          case 'swipe_file':
            if (item.image_url) {
              blockType = 'image';
              blockUrl = item.image_url;
              blockWidth = 200;
              blockHeight = 200;
            } else if (item.video_url) {
              blockType = 'video';
              blockUrl = item.video_url;
              blockWidth = 320;
              blockHeight = 240;
            } else if (item.file_url) {
              blockType = 'document';
              blockUrl = item.file_url;
              blockContent = item.text_content || '';
              blockWidth = 280;
              blockHeight = 180;
            } else {
              blockType = 'text';
              blockContent = item.text_content || '';
            }
            blockTitle = item.title;
            break;
          case 'role':
            blockType = 'text';
            blockContent = `## ${item.name}\n\n${item.description || ''}\n\n### System Prompt\n${item.system_prompt}`;
            blockTitle = item.name;
            blockWidth = 350;
            blockHeight = 300;
            break;
          case 'tool':
            blockType = 'text';
            blockContent = `## ${item.name}\n\n${item.description || ''}`;
            blockTitle = item.name;
            break;
          case 'research':
            blockType = 'text';
            blockContent = typeof item.content === 'string' ? item.content : JSON.stringify(item.content);
            blockTitle = item.name;
            blockWidth = 400;
            blockHeight = 300;
            break;
          default:
            toast.error(`Cannot add ${itemType} to canvas`);
            return;
        }

        const newBlock = await addBlock({
          type: blockType,
          position_x: Math.round(centerPos.x - blockWidth / 2),
          position_y: Math.round(centerPos.y - blockHeight / 2),
          width: blockWidth,
          height: blockHeight,
          title: blockTitle,
          content: blockContent,
          url: blockUrl || undefined,
        });

        const newNode: Node = {
          id: newBlock.id,
          type: blockType,
          position: { x: newBlock.position_x, y: newBlock.position_y },
          data: {
            blockId: newBlock.id,
            instruction_prompt: newBlock.instruction_prompt || '',
            title: newBlock.title,
            content: newBlock.content,
            url: newBlock.url,
            file_path: newBlock.file_path,
          },
          style: {
            width: newBlock.width,
            height: newBlock.height,
          },
        };

        const currentNodes = nodes;
        const currentEdges = flowEdges;
        const newNodes = [...currentNodes, newNode];
        
        setNodes(newNodes);
        saveState(newNodes, currentEdges);
        
        // If document block has no content but has a file URL, trigger parsing
        if (blockType === 'document' && !blockContent && blockUrl) {
          try {
            await supabase
              .from('canvas_blocks')
              .update({ parsing_status: 'pending' })
              .eq('id', newBlock.id);
            
            const response = await fetch(blockUrl);
            const blob = await response.blob();
            const file = new File([blob], blockTitle, { type: blob.type });
            
            addToQueue(file, newBlock.id, 'canvas_blocks', blockTitle);
          } catch (error) {
            console.error('Error queuing document for parsing:', error);
          }
        }
        
        toast.success(`Added ${blockTitle} to canvas`);
        setBrainModalOpen(false);
      } catch (error) {
        console.error("Failed to create block from brain item:", error);
        toast.error("Failed to add item to canvas");
      }
    },
    [projectId, reactFlowInstance, addBlock, setNodes, nodes, flowEdges, saveState]
  );

  return (
    <div 
      className="w-full h-full bg-background relative"
      onDrop={handleCanvasDrop}
      onDragOver={handleCanvasDragOver}
    >
      <CanvasToolbar
        onAddBlock={handleAddBlock}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        selectedCount={selectedNodes.length}
        onDelete={handleDeleteSelected}
        onDuplicate={handleDuplicateSelected}
        onGroup={handleGroupSelected}
        onClearSelection={handleClearSelection}
        onOpenBrain={() => setBrainModalOpen(true)}
      />
      <ReactFlow
        nodes={nodes}
        edges={flowEdges}
        onNodesChange={handleNodesChangeWithHistory}
        onEdgesChange={handleEdgesChangeWithHistory}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onNodeDoubleClick={handleNodeDoubleClick}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        minZoom={0.1}
        maxZoom={4}
        defaultEdgeOptions={{
          type: "deletable",
          animated: true,
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="hsl(var(--muted-foreground))"
          className="bg-muted/20"
        />
      </ReactFlow>
      <BlockEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        block={editingBlock}
        onSave={handleBlockContentUpdate}
      />
      <CentralBrainModal
        open={brainModalOpen}
        onOpenChange={(open) => {
          setBrainModalOpen(open);
          if (!open) {
            setSelectingForBrainNode(false);
            setPendingBrainNode(null);
          }
        }}
        onSelectAsset={handleSelectAsset}
        onSelectPrompt={selectingForBrainNode ? handleSelectPromptForBrain : handleSelectPrompt}
        onSelectKnowledge={selectingForBrainNode ? handleSelectKnowledgeForBrain : handleSelectKnowledge}
        onSelectRole={selectingForBrainNode ? handleSelectRoleForBrain : handleSelectRole}
        onSelectTool={selectingForBrainNode ? handleSelectToolForBrain : handleSelectTool}
        onSelectStrategy={selectingForBrainNode ? handleSelectStrategyForBrain : handleSelectStrategy}
        onSelectMarketResearch={selectingForBrainNode ? handleSelectResearchForBrain : undefined}
        onSelectSwipeFile={handleSelectSwipeFile}
        onSelectAdSpyBoard={selectingForBrainNode ? handleSelectAdSpyBoard : handleSelectAdSpyBoardToCanvas}
        onSelectGroup={handleSelectGroup}
        onAddToCanvas={createBlockFromBrainItem}
        onSelectAssetGroup={handleSelectAssetGroup}
        onSelectSwipeGroup={handleSelectSwipeGroup}
        selectingForBrainNode={selectingForBrainNode}
      />

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={handleCloseContextMenu}
          />
          <div
            className="fixed z-50 min-w-[200px] rounded-lg border bg-popover p-1 shadow-lg"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {/* Rename - only for groups */}
            {contextMenu.node.type === 'group' && (
              <button
                onClick={handleOpenRename}
                className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <Pencil className="h-4 w-4" />
                <span>Rename</span>
              </button>
            )}

            {/* Add to Group submenu */}
            {!contextMenu.node.parentNode && contextMenu.node.type !== 'group' && (
              <div className="relative group">
                <button
                  className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <span>Add to Group</span>
                  <span className="ml-auto text-xs">›</span>
                </button>
                <div className="absolute left-full top-0 ml-1 hidden group-hover:block min-w-[160px] rounded-lg border bg-popover p-1 shadow-lg">
                  {nodes
                    .filter(n => n.type === 'group')
                    .map(group => (
                      <button
                        key={group.id}
                        onClick={() => handleAddToGroup(group.id)}
                        className="w-full text-left rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        {group.data.title || 'Untitled Group'}
                      </button>
                    ))}
                  {nodes.filter(n => n.type === 'group').length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No groups available
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Unlink from Group */}
            {contextMenu.node.parentNode && (
              <button
                onClick={() => {
                  handleUnlinkFromGroup(contextMenu.node.id);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <span>Unlink from Group</span>
              </button>
            )}

            {/* Duplicate */}
            <button
              onClick={handleDuplicateNode}
              className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <span>Duplicate</span>
            </button>

            {/* Delete */}
            <button
              onClick={handleDeleteNode}
              className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <span>Delete</span>
            </button>
          </div>
        </>
      )}

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Group</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Group name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Wrap with ReactFlowProvider
export default function CanvasV2() {
  return (
    <ReactFlowProvider>
      <CanvasV2Inner />
    </ReactFlowProvider>
  );
}
