-- Create ideas table for storing generated and saved content ideas
CREATE TABLE public.ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.agent_boards(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'trend', 'current_event', 'hook', 'content_idea'
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  source TEXT DEFAULT 'ai_generated', -- 'ai_generated', 'manual', 'saved'
  status TEXT DEFAULT 'active', -- 'active', 'used', 'archived'
  platform TEXT, -- 'instagram', 'tiktok', 'facebook', 'twitter', 'linkedin'
  tags TEXT[] DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  engagement_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

-- Create policy for all operations
CREATE POLICY "Allow all operations on ideas" ON public.ideas
  FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_ideas_updated_at
  BEFORE UPDATE ON public.ideas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();