-- Add new integration category for data & storage
ALTER TYPE integration_category ADD VALUE IF NOT EXISTS 'data_storage';

-- Create knowledge_entries table for the new Knowledge tab
CREATE TABLE IF NOT EXISTS public.knowledge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.agent_boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  source_url TEXT,
  tags TEXT[] DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for knowledge_entries
CREATE POLICY "Allow all operations on knowledge_entries"
  ON public.knowledge_entries
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_knowledge_entries_updated_at
  BEFORE UPDATE ON public.knowledge_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();