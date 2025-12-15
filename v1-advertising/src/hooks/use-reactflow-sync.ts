import { useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Node, Edge, NodeChange, EdgeChange } from "reactflow";
import { toast } from "sonner";

interface UseReactFlowSyncProps {
  projectId: string;
}

export function useReactFlowSync({ projectId }: UseReactFlowSyncProps) {
  const queryClient = useQueryClient();
  
  // Track previous node positions/dimensions to avoid unnecessary updates
  const nodeStateRef = useRef<Map<string, { x: number; y: number; width: number; height: number }>>(new Map());
  
  // Track if canvas is initialized to prevent dimension events on initial render
  const isInitializedRef = useRef(false);

  // Update block position/dimensions
  const updateBlockMutation = useMutation({
    mutationFn: async ({
      id,
      position_x,
      position_y,
      width,
      height,
    }: {
      id: string;
      position_x?: number;
      position_y?: number;
      width?: number;
      height?: number;
    }) => {
      const updates: any = { updated_at: new Date().toISOString() };
      if (position_x !== undefined) updates.position_x = position_x;
      if (position_y !== undefined) updates.position_y = position_y;
      if (width !== undefined) updates.width = width;
      if (height !== undefined) updates.height = height;

      const { error } = await supabase
        .from("canvas_blocks")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    // Removed onSuccess invalidation to prevent refetch loop
    onError: (error) => {
      console.error("Failed to update block:", error);
      toast.error("Failed to save changes");
    },
  });

  // Update block content
  const updateBlockContentMutation = useMutation({
    mutationFn: async ({
      id,
      title,
      content,
      url,
      file_path,
      metadata,
    }: {
      id: string;
      title?: string;
      content?: string;
      url?: string;
      file_path?: string;
      metadata?: any;
    }) => {
      const updates: any = { updated_at: new Date().toISOString() };
      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;
      if (url !== undefined) updates.url = url;
      if (file_path !== undefined) updates.file_path = file_path;
      if (metadata !== undefined) updates.metadata = metadata;

      const { error } = await supabase
        .from("canvas_blocks")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-blocks", projectId] });
      toast.success("Block updated");
    },
    onError: (error) => {
      console.error("Failed to update block content:", error);
      toast.error("Failed to update block");
    },
  });

  // Add new block
  const addBlockMutation = useMutation({
    mutationFn: async (block: {
      type: string;
      position_x: number;
      position_y: number;
      width: number;
      height: number;
      title?: string;
      content?: string;
      color?: string;
      url?: string;
      file_path?: string;
      asset_id?: string;
      metadata?: any;
    }) => {
      const { data, error } = await supabase
        .from("canvas_blocks")
        .insert({
          agent_board_id: projectId,
          ...block,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-blocks", projectId] });
      toast.success("Block created");
    },
    onError: (error) => {
      console.error("Failed to create block:", error);
      toast.error("Failed to create block");
    },
  });

  // Phase 2: Upsert block (insert or update with specific ID)
  const upsertBlockMutation = useMutation({
    mutationFn: async (block: {
      id: string;
      type: string;
      position_x: number;
      position_y: number;
      width: number;
      height: number;
      title?: string;
      content?: string;
      color?: string;
      url?: string;
      file_path?: string;
      asset_id?: string;
      metadata?: any;
    }) => {
      const { data, error } = await supabase
        .from("canvas_blocks")
        .upsert({
          id: block.id,
          agent_board_id: projectId,
          type: block.type,
          position_x: block.position_x,
          position_y: block.position_y,
          width: block.width,
          height: block.height,
          title: block.title,
          content: block.content,
          color: block.color,
          url: block.url,
          file_path: block.file_path,
          asset_id: block.asset_id,
          metadata: block.metadata,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onError: (error) => {
      console.error("Failed to upsert block:", error);
    },
  });

  // Update chat session
  const updateChatSessionMutation = useMutation({
    mutationFn: async ({ sessionId, title }: { sessionId: string; title: string }) => {
      const { error } = await supabase
        .from("chat_sessions")
        .update({ title })
        .eq("id", sessionId);

      if (error) throw error;
    },
    onError: (error) => {
      console.error("Failed to update chat session:", error);
      toast.error("Failed to update chat title");
    },
  });

  // Delete block
  const deleteBlockMutation = useMutation({
    mutationFn: async (blockId: string) => {
      // Step 1: Delete all edges where this block is SOURCE or TARGET
      await supabase
        .from("canvas_edges")
        .delete()
        .or(`source_block_id.eq.${blockId},target_block_id.eq.${blockId}`);

      // Step 2: Clean chat session references (preserve sessions, just remove broken reference)
      await supabase
        .from("chat_sessions")
        .update({ canvas_block_id: null })
        .eq("canvas_block_id", blockId);

      // Step 3: If this is a group block, unlink all children to prevent orphaned references
      await supabase
        .from("canvas_blocks")
        .update({ group_id: null })
        .eq("group_id", blockId);

      // Step 4: Delete the block itself
      // Note: Chat sessions and messages are preserved for history
      const { error } = await supabase
        .from("canvas_blocks")
        .delete()
        .eq("id", blockId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-blocks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["canvas-edges", projectId] });
      toast.success("Block deleted");
    },
    onError: (error) => {
      console.error("Failed to delete block:", error);
      toast.error("Failed to delete block");
    },
  });

  // Phase 2: Delete block without toast (for undo operations)
  const deleteBlockFromDbMutation = useMutation({
    mutationFn: async (blockId: string) => {
      // Step 1: Delete all edges where this block is SOURCE or TARGET
      await supabase
        .from("canvas_edges")
        .delete()
        .or(`source_block_id.eq.${blockId},target_block_id.eq.${blockId}`);

      // Step 2: Clean chat session references (preserve sessions, just remove broken reference)
      await supabase
        .from("chat_sessions")
        .update({ canvas_block_id: null })
        .eq("canvas_block_id", blockId);

      // Step 3: If this is a group block, unlink all children to prevent orphaned references
      await supabase
        .from("canvas_blocks")
        .update({ group_id: null })
        .eq("group_id", blockId);

      // Step 4: Delete the block itself
      // Note: Chat sessions and messages are preserved for history
      const { error } = await supabase
        .from("canvas_blocks")
        .delete()
        .eq("id", blockId);

      if (error) throw error;
    },
    onError: (error) => {
      console.error("Failed to delete block from DB:", error);
    },
  });

  // Add edge
  const addEdgeMutation = useMutation({
    mutationFn: async ({
      source,
      target,
      type = "bezier",
    }: {
      source: string;
      target: string;
      type?: string;
    }) => {
      const { data, error } = await supabase
        .from("canvas_edges")
        .insert({
          agent_board_id: projectId,
          source_block_id: source,
          target_block_id: target,
          edge_type: type,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-edges", projectId] });
    },
    onError: (error) => {
      console.error("Failed to create edge:", error);
      toast.error("Failed to create connection");
    },
  });

  // Phase 2: Upsert edge (insert or update with specific ID)
  const upsertEdgeMutation = useMutation({
    mutationFn: async ({
      id,
      source,
      target,
      type = "bezier",
    }: {
      id: string;
      source: string;
      target: string;
      type?: string;
    }) => {
      const { data, error } = await supabase
        .from("canvas_edges")
        .upsert({
          id,
          agent_board_id: projectId,
          source_block_id: source,
          target_block_id: target,
          edge_type: type,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onError: (error) => {
      console.error("Failed to upsert edge:", error);
    },
  });

  // Delete edge
  const deleteEdgeMutation = useMutation({
    mutationFn: async (edgeId: string) => {
      const { error } = await supabase
        .from("canvas_edges")
        .delete()
        .eq("id", edgeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-edges", projectId] });
    },
    onError: (error) => {
      console.error("Failed to delete edge:", error);
      toast.error("Failed to delete connection");
    },
  });

  // Handle node changes (position, size, remove)
  const handleNodeChanges = useCallback(
    (changes: NodeChange[]) => {
      // Mark as initialized after first change
      if (!isInitializedRef.current) {
        isInitializedRef.current = true;
      }

      changes.forEach((change) => {
        if (change.type === "position" && change.position && !change.dragging) {
          // Only update when drag is complete and position actually changed
          const currentState = nodeStateRef.current.get(change.id);
          const newX = Math.round(change.position.x);
          const newY = Math.round(change.position.y);
          
          if (!currentState || currentState.x !== newX || currentState.y !== newY) {
            // Update ref
            nodeStateRef.current.set(change.id, {
              ...nodeStateRef.current.get(change.id),
              x: newX,
              y: newY,
            } as any);
            
            // Mutate to DB
            updateBlockMutation.mutate({
              id: change.id,
              position_x: newX,
              position_y: newY,
            });
          }
        } else if (change.type === "dimensions" && change.dimensions) {
          // Skip dimension updates on initial render (they're just measurements)
          if (!isInitializedRef.current) return;
          
          const currentState = nodeStateRef.current.get(change.id);
          const newWidth = Math.round(change.dimensions.width);
          const newHeight = Math.round(change.dimensions.height);
          
          if (!currentState || currentState.width !== newWidth || currentState.height !== newHeight) {
            // Update ref
            nodeStateRef.current.set(change.id, {
              ...nodeStateRef.current.get(change.id),
              width: newWidth,
              height: newHeight,
            } as any);
            
            // Mutate to DB
            updateBlockMutation.mutate({
              id: change.id,
              width: newWidth,
              height: newHeight,
            });
          }
        } else if (change.type === "remove") {
          nodeStateRef.current.delete(change.id);
          deleteBlockMutation.mutate(change.id);
        }
      });
    },
    [updateBlockMutation, deleteBlockMutation]
  );

  // Handle edge changes (remove)
  const handleEdgeChanges = useCallback(
    (changes: EdgeChange[]) => {
      changes.forEach((change) => {
        if (change.type === "remove") {
          deleteEdgeMutation.mutate(change.id);
        }
      });
    },
    [deleteEdgeMutation]
  );

  return {
    updateBlock: updateBlockMutation.mutate,
    updateBlockContent: updateBlockContentMutation.mutate,
    addBlock: addBlockMutation.mutateAsync,
    deleteBlock: deleteBlockMutation.mutate,
    deleteBlockFromDb: deleteBlockFromDbMutation.mutateAsync,
    upsertBlock: upsertBlockMutation.mutateAsync,
    addEdge: addEdgeMutation.mutateAsync,
    deleteEdge: deleteEdgeMutation.mutate,
    upsertEdge: upsertEdgeMutation.mutateAsync,
    updateChatSession: updateChatSessionMutation.mutate,
    handleNodeChanges,
    handleEdgeChanges,
  };
}
