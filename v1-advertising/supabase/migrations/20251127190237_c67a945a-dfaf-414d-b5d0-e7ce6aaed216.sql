-- Create canvas_edges table for node connections
CREATE TABLE public.canvas_edges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_board_id UUID NOT NULL,
  source_block_id UUID NOT NULL REFERENCES public.canvas_blocks(id) ON DELETE CASCADE,
  target_block_id UUID NOT NULL REFERENCES public.canvas_blocks(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL DEFAULT 'bezier',
  color TEXT DEFAULT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.canvas_edges ENABLE ROW LEVEL SECURITY;

-- Create policies for canvas_edges
CREATE POLICY "Allow all operations on canvas_edges" 
ON public.canvas_edges 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_canvas_edges_updated_at
BEFORE UPDATE ON public.canvas_edges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_canvas_edges_board_id ON public.canvas_edges(agent_board_id);
CREATE INDEX idx_canvas_edges_source ON public.canvas_edges(source_block_id);
CREATE INDEX idx_canvas_edges_target ON public.canvas_edges(target_block_id);