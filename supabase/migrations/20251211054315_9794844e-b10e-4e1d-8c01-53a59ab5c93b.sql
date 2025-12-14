-- Add user_id column to canvas_blocks if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'canvas_blocks' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.canvas_blocks ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid();
  END IF;
END $$;

-- Add user_id column to canvas_edges if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'canvas_edges' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.canvas_edges ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid();
  END IF;
END $$;

-- Enable RLS on both tables
ALTER TABLE public.canvas_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_edges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "canvas_blocks_select_own" ON public.canvas_blocks;
DROP POLICY IF EXISTS "canvas_blocks_insert_own" ON public.canvas_blocks;
DROP POLICY IF EXISTS "canvas_blocks_update_own" ON public.canvas_blocks;
DROP POLICY IF EXISTS "canvas_blocks_delete_own" ON public.canvas_blocks;

DROP POLICY IF EXISTS "canvas_edges_select_own" ON public.canvas_edges;
DROP POLICY IF EXISTS "canvas_edges_insert_own" ON public.canvas_edges;
DROP POLICY IF EXISTS "canvas_edges_update_own" ON public.canvas_edges;
DROP POLICY IF EXISTS "canvas_edges_delete_own" ON public.canvas_edges;

-- Create RLS policies for canvas_blocks
CREATE POLICY "canvas_blocks_select_own" ON public.canvas_blocks 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "canvas_blocks_insert_own" ON public.canvas_blocks 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "canvas_blocks_update_own" ON public.canvas_blocks 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "canvas_blocks_delete_own" ON public.canvas_blocks 
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for canvas_edges
CREATE POLICY "canvas_edges_select_own" ON public.canvas_edges 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "canvas_edges_insert_own" ON public.canvas_edges 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "canvas_edges_update_own" ON public.canvas_edges 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "canvas_edges_delete_own" ON public.canvas_edges 
  FOR DELETE USING (auth.uid() = user_id);