import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CanvasBlock, CreateBlockInput, UpdateBlockInput } from '@/types/canvas';
import { useToast } from '@/hooks/use-toast';

export function useCanvasBlocks(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = ['canvas-blocks', projectId];

  // Fetch all blocks for a project
  const { data: blocks = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('canvas_blocks')
        .select('*')
        .eq('agent_board_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as CanvasBlock[];
    },
    enabled: !!projectId,
  });

  // Create a new block
  const createBlock = useMutation({
    mutationFn: async (input: CreateBlockInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('canvas_blocks')
        .insert({
          ...input,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CanvasBlock;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast({
        title: 'Error creating block',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update a block
  const updateBlock = useMutation({
    mutationFn: async ({ id, ...input }: UpdateBlockInput & { id: string }) => {
      const { data, error } = await supabase
        .from('canvas_blocks')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CanvasBlock;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast({
        title: 'Error updating block',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete a block
  const deleteBlock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('canvas_blocks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting block',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Batch update positions (for drag operations)
  const updatePositions = useMutation({
    mutationFn: async (updates: Array<{ id: string; position_x: number; position_y: number }>) => {
      const promises = updates.map(({ id, position_x, position_y }) =>
        supabase
          .from('canvas_blocks')
          .update({ position_x, position_y, updated_at: new Date().toISOString() })
          .eq('id', id)
      );

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    blocks,
    isLoading,
    error,
    createBlock,
    updateBlock,
    deleteBlock,
    updatePositions,
  };
}
