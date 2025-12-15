-- Create board_tools table for tool manager integration
CREATE TABLE IF NOT EXISTS public.board_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_board_id UUID NOT NULL REFERENCES public.agent_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'custom',
  config JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.board_tools ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on board_tools" ON public.board_tools
  FOR ALL USING (true) WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_board_tools_updated_at
  BEFORE UPDATE ON public.board_tools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();