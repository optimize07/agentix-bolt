import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from './nodes';
import { CanvasToolbar } from './toolbar/CanvasToolbar';
import CentralBrainPanel from './CentralBrainPanel';
import { useCanvasBlocks } from '@/hooks/useCanvasBlocks';
import { useCanvasEdges } from '@/hooks/useCanvasEdges';
import { useCanvasHistory } from '@/hooks/useCanvasHistory';
import { CanvasBlock, CanvasBlockType, blockToNode, edgeToReactFlowEdge } from '@/types/canvas';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CanvasProps {
  projectId: string;
}

type CanvasNode = Node<any>;

const CanvasInner: React.FC<CanvasProps> = ({ projectId }) => {
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const [brainPanelOpen, setBrainPanelOpen] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);

  // Database hooks
  const {
    blocks,
    isLoading: blocksLoading,
    createBlock,
    updateBlock,
    deleteBlock,
    updatePositions,
  } = useCanvasBlocks(projectId);

  // Use refs for callbacks to avoid infinite loop in useMemo
  const updateBlockRef = useRef(updateBlock);
  const deleteBlockRef = useRef(deleteBlock);
  const createBlockRef = useRef(createBlock);

  useEffect(() => {
    updateBlockRef.current = updateBlock;
    deleteBlockRef.current = deleteBlock;
    createBlockRef.current = createBlock;
  }, [updateBlock, deleteBlock, createBlock]);

  const {
    edges: dbEdges,
    isLoading: edgesLoading,
    createEdge,
    deleteEdge,
  } = useCanvasEdges(projectId);

  // Get blocks connected to a target node (for ChatNode context)
  const getConnectedBlocks = useCallback((targetId: string): CanvasBlock[] => {
    const incomingEdgeIds = dbEdges
      .filter(e => e.target_block_id === targetId)
      .map(e => e.source_block_id);

    const connectedBlocks = blocks.filter(b => incomingEdgeIds.includes(b.id));

    // Expand group nodes to include their connected children
    const expandedBlocks: CanvasBlock[] = [];
    for (const block of connectedBlocks) {
      if (block.type === 'group') {
        // Get blocks connected TO this group
        const groupChildIds = dbEdges
          .filter(e => e.target_block_id === block.id)
          .map(e => e.source_block_id);
        const groupChildren = blocks.filter(b => groupChildIds.includes(b.id));
        expandedBlocks.push(...groupChildren);
      }
      expandedBlocks.push(block);
    }

    return expandedBlocks;
  }, [blocks, dbEdges]);

  // Get child blocks for a group node (blocks connected TO the group)
  const getGroupChildren = useCallback((groupId: string): CanvasBlock[] => {
    const childEdgeIds = dbEdges
      .filter(e => e.target_block_id === groupId)
      .map(e => e.source_block_id);
    return blocks.filter(b => childEdgeIds.includes(b.id));
  }, [blocks, dbEdges]);

  // Remove a child from group (delete the edge)
  const handleRemoveFromGroup = useCallback(async (childId: string, groupId: string) => {
    const edge = dbEdges.find(e => e.source_block_id === childId && e.target_block_id === groupId);
    if (edge) {
      try {
        await deleteEdge.mutateAsync(edge.id);
        toast.success('Removed from group');
      } catch (err) {
        toast.error('Failed to remove from group');
      }
    }
  }, [dbEdges, deleteEdge]);

  // Handle node deletion - use ref to avoid dependency changes
  const handleDeleteNode = useCallback(async (nodeId: string) => {
    try {
      await deleteBlockRef.current.mutateAsync(nodeId);
    } catch (err) {
      toast.error('Failed to delete node');
    }
  }, []);

  // Store blocks in ref for stable callback access
  const blocksRef = useRef(blocks);
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  // Create creative node with pre-filled content from ChatNode - use refs to avoid dependency changes
  const handlePushToCreative = useCallback(async (
    sourceNodeId: string,
    content: string,
    contentType: string
  ) => {
    // Find source node position to place creative node nearby
    const sourceBlock = blocksRef.current.find(b => b.id === sourceNodeId);
    const position = {
      x: (sourceBlock?.position_x || 200) + 400,
      y: (sourceBlock?.position_y || 200),
    };

    // Parse content type to determine where to put the content
    const lowerType = contentType.toLowerCase();
    const metadata: Record<string, any> = { status: 'draft' };

    if (lowerType.includes('headline') || lowerType.includes('hook')) {
      metadata.headline = content;
    } else if (lowerType.includes('cta') || lowerType.includes('call to action')) {
      metadata.cta = content;
    } else if (lowerType.includes('copy') || lowerType.includes('text') || lowerType.includes('body')) {
      metadata.primaryText = content;
    } else {
      // Default: put in primary text
      metadata.primaryText = content;
    }

    try {
      await createBlockRef.current.mutateAsync({
        agent_board_id: projectId,
        type: 'creative' as CanvasBlockType,
        position_x: position.x,
        position_y: position.y,
        title: `Creative - ${contentType}`,
        metadata,
      });

      toast.success(`Created creative from ${contentType}`);
    } catch (err) {
      toast.error('Failed to create creative');
    }
  }, [projectId]);

  // Convert DB data to ReactFlow format - use refs for callbacks to prevent infinite loop
  const initialNodes = useMemo((): CanvasNode[] => {
    return blocks.map(block => {
      const node = blockToNode(block);

      // Get child blocks for group nodes
      const childBlocks = block.type === 'group' ? getGroupChildren(block.id) : undefined;

      return {
        ...node,
        data: {
          ...node.data,
          connectedBlocks: getConnectedBlocks(block.id),
          // Pass boardId for ChatNode persistence
          metadata: {
            ...(node.data.metadata || {}),
            boardId: projectId,
          },
          // GroupNode specific props
          childBlocks,
          onRemoveChild: block.type === 'group'
            ? (childId: string) => handleRemoveFromGroup(childId, block.id)
            : undefined,
          onContentChange: (content: string) => updateBlockRef.current.mutate({ id: block.id, content }),
          onTitleChange: (title: string) => updateBlockRef.current.mutate({ id: block.id, title }),
          onInstructionChange: (instruction: string) => updateBlockRef.current.mutate({ id: block.id, instruction_prompt: instruction }),
          onDelete: () => handleDeleteNode(block.id),
          onResize: (width: number, height: number) => updateBlockRef.current.mutate({ id: block.id, width, height }),
          onPushToCreative: block.type === 'chat'
            ? (content: string, contentType: string) => handlePushToCreative(block.id, content, contentType)
            : undefined,
        },
      };
    });
  }, [blocks, dbEdges, getConnectedBlocks, getGroupChildren, handleRemoveFromGroup, handleDeleteNode, handlePushToCreative, projectId]);

  const initialEdges = useMemo(() => {
    return dbEdges.map(edgeToReactFlowEdge);
  }, [dbEdges]);

  // ReactFlow state
  const [nodes, setNodes] = useNodesState<CanvasNode>(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);

  // Sync nodes/edges when DB data changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Track selected count
  useEffect(() => {
    const selected = nodes.filter(n => n.selected);
    setSelectedCount(selected.length);
  }, [nodes]);

  // History for undo/redo
  const {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo
  } = useCanvasHistory();

  // Handle undo
  const handleUndo = useCallback(() => {
    const state = undo();
    if (state) {
      setNodes(state.nodes as CanvasNode[]);
      setEdges(state.edges);
    }
  }, [undo, setNodes, setEdges]);

  // Handle redo
  const handleRedo = useCallback(() => {
    const state = redo();
    if (state) {
      setNodes(state.nodes as CanvasNode[]);
      setEdges(state.edges);
    }
  }, [redo, setNodes, setEdges]);

  // Handle node changes (position, selection, etc.)
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(nds => applyNodeChanges(changes, nds) as CanvasNode[]);

    // Save position changes to database (debounced)
    const positionChanges = changes.filter(c => c.type === 'position' && (c as any).position && (c as any).dragging === false);
    if (positionChanges.length > 0) {
      const updates = positionChanges.map(c => ({
        id: (c as any).id,
        position_x: (c as any).position?.x || 0,
        position_y: (c as any).position?.y || 0,
      }));
      updatePositions.mutate(updates);
    }
  }, [setNodes, updatePositions]);

  // Handle edge changes
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges(eds => applyEdgeChanges(changes, eds));
  }, [setEdges]);

  // Handle new connections
  const onConnect = useCallback(async (connection: Connection) => {
    if (!connection.source || !connection.target) return;

    try {
      await createEdge.mutateAsync({
        agent_board_id: projectId,
        source_block_id: connection.source,
        target_block_id: connection.target,
      });

      pushState(nodes, edges);
    } catch (err) {
      toast.error('Failed to create connection');
    }
  }, [createEdge, projectId, nodes, edges, pushState]);

  // Handle edge deletion
  const onEdgesDelete = useCallback(async (deletedEdges: Edge[]) => {
    for (const edge of deletedEdges) {
      try {
        await deleteEdge.mutateAsync(edge.id);
      } catch (err) {
        console.error('Failed to delete edge:', err);
      }
    }
  }, [deleteEdge]);

  // Add new node
  const addNode = useCallback(async (type: string, position?: { x: number; y: number }) => {
    const pos = position || {
      x: Math.random() * 400 + 100,
      y: Math.random() * 400 + 100,
    };

    try {
      await createBlock.mutateAsync({
        agent_board_id: projectId,
        type: type as CanvasBlockType,
        position_x: pos.x,
        position_y: pos.y,
        title: getDefaultTitle(type as CanvasBlockType),
      });
      pushState(nodes, edges);
    } catch (err) {
      toast.error('Failed to add node');
    }
  }, [createBlock, projectId, nodes, edges, pushState]);

  // Get default title for node type
  const getDefaultTitle = (type: CanvasBlockType): string => {
    const titles: Record<CanvasBlockType, string> = {
      text: 'Text Block',
      image: 'Image',
      url: 'URL',
      document: 'Document',
      video: 'Video',
      group: 'Group',
      chat: 'AI Chat',
      brain: 'Central Brain',
      creative: 'Creative',
    };
    return titles[type] || 'New Block';
  };

  // Handle drop from Central Brain panel
  const onDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();

    // Check for block type drag from toolbar
    const blockType = event.dataTransfer.getData('application/block-type');
    if (blockType) {
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (bounds) {
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        });
        addNode(blockType, position);
      }
      return;
    }

    // Check for brain drop
    const brainDrop = event.dataTransfer.getData('application/brain-drop');
    if (brainDrop) {
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (bounds) {
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        });
        addNode('brain', position);
      }
      return;
    }

    // Check for JSON data from Central Brain panel
    const data = event.dataTransfer.getData('application/json');
    if (!data) return;

    try {
      const { type, item } = JSON.parse(data);
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      // Determine node type and content based on dropped item
      let nodeType: CanvasBlockType = 'brain';
      let title = item.title || 'Untitled';
      let content = '';
      let fileUrl = '';

      switch (type) {
        case 'knowledge':
          nodeType = 'brain';
          content = item.description || '';
          break;
        case 'swipe':
          nodeType = item.image_url ? 'image' : 'brain';
          fileUrl = item.image_url || '';
          content = item.content || item.description || '';
          break;
        case 'asset':
          nodeType = item.asset_type === 'image' ? 'image' : 'brain';
          fileUrl = item.file_url || item.thumbnail_url || '';
          break;
        case 'template':
          nodeType = 'text';
          content = item.prompt_text || '';
          break;
        case 'offer':
          nodeType = 'brain';
          content = `${item.description || ''}\n\nPrice: ${item.price || 'N/A'}${item.discount ? `\nDiscount: ${item.discount}` : ''}`;
          break;
      }

      await createBlock.mutateAsync({
        agent_board_id: projectId,
        type: nodeType,
        position_x: position.x,
        position_y: position.y,
        title,
        content,
        file_url: fileUrl || undefined,
      });

      toast.success(`Added ${title} to canvas`);
    } catch (err) {
      console.error('Drop error:', err);
      toast.error('Failed to add item to canvas');
    }
  }, [createBlock, projectId, addNode, reactFlowInstance]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Delete selected nodes
  const handleDeleteSelected = useCallback(() => {
    const selected = nodes.filter(n => n.selected);
    selected.forEach(n => handleDeleteNode(n.id));
  }, [nodes, handleDeleteNode]);

  // Clipboard paste handler - create blocks from pasted content
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    // Skip if user is typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // Get viewport center for positioning new blocks
    const viewport = reactFlowInstance.getViewport();
    const centerX = (window.innerWidth / 2 - viewport.x) / viewport.zoom;
    const centerY = (window.innerHeight / 2 - viewport.y) / viewport.zoom;

    // Check for images first
    const items = clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        try {
          // Upload the image to storage
          const fileExt = file.type.split('/')[1] || 'png';
          const fileName = `paste-${Date.now()}.${fileExt}`;
          const filePath = `canvas-images/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('canvas-files')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            toast.error('Failed to upload image');
            return;
          }

          const { data: urlData } = supabase.storage
            .from('canvas-files')
            .getPublicUrl(filePath);

          await createBlock.mutateAsync({
            agent_board_id: projectId,
            type: 'image',
            position_x: centerX,
            position_y: centerY,
            title: 'Pasted Image',
            file_url: urlData.publicUrl,
          });

          toast.success('Image pasted to canvas');
        } catch (err) {
          console.error('Paste image error:', err);
          toast.error('Failed to paste image');
        }
        return;
      }
    }

    // Check for text content
    const text = clipboardData.getData('text/plain');
    if (!text) return;

    e.preventDefault();

    // Detect if it's a URL
    const urlPattern = /^https?:\/\/[^\s]+$/;
    if (urlPattern.test(text.trim())) {
      try {
        await createBlock.mutateAsync({
          agent_board_id: projectId,
          type: 'url',
          position_x: centerX,
          position_y: centerY,
          title: 'Pasted URL',
          url: text.trim(),
        });
        toast.success('URL pasted to canvas');
      } catch (err) {
        console.error('Paste URL error:', err);
        toast.error('Failed to paste URL');
      }
      return;
    }

    // Otherwise create a text block
    try {
      await createBlock.mutateAsync({
        agent_board_id: projectId,
        type: 'text',
        position_x: centerX,
        position_y: centerY,
        title: 'Pasted Text',
        content: text,
      });
      toast.success('Text pasted to canvas');
    } catch (err) {
      console.error('Paste text error:', err);
      toast.error('Failed to paste text');
    }
  }, [reactFlowInstance, createBlock, projectId]);

  // Keyboard shortcuts and paste handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Undo: Cmd/Ctrl + Z
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Cmd/Ctrl + Shift + Z
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleRedo();
      }
      // Fit view
      if (e.key === 'f' || e.key === 'F') reactFlowInstance.fitView();
      // Zoom
      if (e.key === '+' || e.key === '=') reactFlowInstance.zoomIn();
      if (e.key === '-') reactFlowInstance.zoomOut();
      // Delete selected nodes
      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
    };
  }, [handleUndo, handleRedo, reactFlowInstance, handleDeleteSelected, handlePaste]);

  // Handle Brain panel drag start
  const handleBrainDragStart = useCallback((type: string, item: any) => {
    // This is tracked for visual feedback if needed
  }, []);

  if (blocksLoading || edgesLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/20">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading canvas...</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={reactFlowWrapper} className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        panOnScroll
        panOnDrag={[1, 2]}
        zoomOnScroll={true}
        zoomOnPinch={true}
        selectionKeyCode="Shift"
        multiSelectionKeyCode="Shift"
        deleteKeyCode="Delete"
        defaultEdgeOptions={{
          type: 'default',
          style: { stroke: 'hsl(var(--border))', strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
        className="bg-background"
        colorMode="dark"
      >
        <Background color="hsl(var(--border))" gap={24} size={1} />
        <Controls className="bg-background border border-border rounded-lg" />
        <MiniMap
          className="bg-background border border-border rounded-lg"
          nodeColor="hsl(var(--primary))"
          maskColor="hsl(var(--background) / 0.8)"
        />
      </ReactFlow>

      {/* Toolbar */}
      <CanvasToolbar
        onAddBlock={addNode}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        selectedCount={selectedCount}
        onDelete={handleDeleteSelected}
        onOpenBrain={() => setBrainPanelOpen(true)}
        onZoomIn={() => reactFlowInstance.zoomIn()}
        onZoomOut={() => reactFlowInstance.zoomOut()}
        onFitView={() => reactFlowInstance.fitView()}
      />

      {/* Central Brain Panel */}
      <CentralBrainPanel
        isOpen={brainPanelOpen}
        onToggle={() => setBrainPanelOpen(!brainPanelOpen)}
        onDragStart={handleBrainDragStart}
      />
    </div>
  );
};

// Wrap with ReactFlowProvider
const Canvas: React.FC<CanvasProps> = (props) => (
  <ReactFlowProvider>
    <CanvasInner {...props} />
  </ReactFlowProvider>
);

export default Canvas;
