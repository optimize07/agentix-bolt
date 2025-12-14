-- Canvas Blocks table - stores all nodes on the canvas
CREATE TABLE public.canvas_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_board_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'url', 'document', 'video', 'group', 'chat', 'brain', 'creative')),
  title text,
  content text,
  url text,
  file_path text,
  file_url text,
  position_x numeric DEFAULT 100,
  position_y numeric DEFAULT 100,
  width numeric DEFAULT 280,
  height numeric DEFAULT 200,
  color text,
  instruction_prompt text,
  group_id uuid REFERENCES public.canvas_blocks(id) ON DELETE SET NULL,
  parsing_status text DEFAULT 'none' CHECK (parsing_status IN ('none', 'pending', 'processing', 'completed', 'failed')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Canvas Edges table - stores connections between nodes
CREATE TABLE public.canvas_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_board_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  source_block_id uuid NOT NULL REFERENCES public.canvas_blocks(id) ON DELETE CASCADE,
  target_block_id uuid NOT NULL REFERENCES public.canvas_blocks(id) ON DELETE CASCADE,
  edge_type text DEFAULT 'default',
  color text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.canvas_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_edges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for canvas_blocks
CREATE POLICY "canvas_blocks_select_own" ON public.canvas_blocks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "canvas_blocks_insert_own" ON public.canvas_blocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "canvas_blocks_update_own" ON public.canvas_blocks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "canvas_blocks_delete_own" ON public.canvas_blocks
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for canvas_edges
CREATE POLICY "canvas_edges_select_own" ON public.canvas_edges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "canvas_edges_insert_own" ON public.canvas_edges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "canvas_edges_update_own" ON public.canvas_edges
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "canvas_edges_delete_own" ON public.canvas_edges
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_canvas_blocks_agent_board ON public.canvas_blocks(agent_board_id);
CREATE INDEX idx_canvas_blocks_group ON public.canvas_blocks(group_id);
CREATE INDEX idx_canvas_edges_agent_board ON public.canvas_edges(agent_board_id);
CREATE INDEX idx_canvas_edges_source ON public.canvas_edges(source_block_id);
CREATE INDEX idx_canvas_edges_target ON public.canvas_edges(target_block_id);

-- Trigger for updated_at
CREATE TRIGGER update_canvas_blocks_updated_at
  BEFORE UPDATE ON public.canvas_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_projects_updated_at();