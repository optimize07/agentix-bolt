-- Create scheduled_posts table for campaign scheduling
CREATE TABLE public.scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  platform TEXT DEFAULT 'facebook',
  content TEXT,
  image_url TEXT,
  agent_board_id UUID REFERENCES public.agent_boards(id) ON DELETE SET NULL,
  creative_card_id UUID REFERENCES public.creative_cards(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Allow all operations (matching existing pattern)
CREATE POLICY "Allow all operations on scheduled_posts" 
ON public.scheduled_posts FOR ALL USING (true) WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_scheduled_posts_updated_at
BEFORE UPDATE ON public.scheduled_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();