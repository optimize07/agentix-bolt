-- Create offers table
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  discount TEXT,
  guarantee TEXT,
  usp TEXT,
  cta TEXT,
  tags TEXT[] DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  group_id UUID REFERENCES public.content_groups(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for offers
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on offers" 
  ON public.offers 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Auto-update updated_at trigger
CREATE TRIGGER update_offers_updated_at 
  BEFORE UPDATE ON public.offers 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create offer_assets table
CREATE TABLE public.offer_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'document')),
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for offer_assets
ALTER TABLE public.offer_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on offer_assets" 
  ON public.offer_assets 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);