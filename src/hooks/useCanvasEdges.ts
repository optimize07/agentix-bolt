import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CanvasEdge, CreateEdgeInput } from '@/types/canvas';
import { useToast } from '@/hooks/use-toast';

export function useCanvasEdges(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = ['canvas-edges', projectId];

  // Fetch all edges for a project
  const { data: edges = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('canvas_edges')
        .select('*')
        .eq('agent_board_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as CanvasEdge[];
    },
    enabled: !!projectId,
  });

  // Create a new edge
  const createEdge = useMutation({
    mutationFn: async (input: CreateEdgeInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('canvas_edges')
        .insert({
          ...input,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CanvasEdge;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast({
        title: 'Error creating connection',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete an edge
  const deleteEdge = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('canvas_edges')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting connection',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete edges by block ID (when a block is deleted)
  const deleteEdgesByBlock = useMutation({
    mutationFn: async (blockId: string) => {
      const { error } = await supabase
        .from('canvas_edges')
        .delete()
        .or(`source_block_id.eq.${blockId},target_block_id.eq.${blockId}`);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    edges,
    isLoading,
    error,
    createEdge,
    deleteEdge,
    deleteEdgesByBlock,
  };
}
