-- Create ad_spy_competitors table
CREATE TABLE public.ad_spy_competitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  industry TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ad_spy_ads table
CREATE TABLE public.ad_spy_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_id UUID REFERENCES public.ad_spy_competitors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  hook TEXT,
  media_type TEXT NOT NULL DEFAULT 'image',
  media_url TEXT,
  thumbnail_url TEXT,
  landing_page_url TEXT,
  duration_days INTEGER,
  first_seen_at TIMESTAMP WITH TIME ZONE,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  metrics JSONB DEFAULT '{}',
  is_breakout BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ad_spy_boards table
CREATE TABLE public.ad_spy_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ad_spy_board_items table
CREATE TABLE public.ad_spy_board_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.ad_spy_boards(id) ON DELETE CASCADE,
  ad_id UUID NOT NULL REFERENCES public.ad_spy_ads(id) ON DELETE CASCADE,
  notes TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ad_spy_search_history table
CREATE TABLE public.ad_spy_search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT,
  filters JSONB DEFAULT '{}',
  results_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ad_spy_settings table
CREATE TABLE public.ad_spy_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  google_sheets_url TEXT,
  auto_push_enabled BOOLEAN DEFAULT false,
  breakout_rules JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ad_spy_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_spy_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_spy_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_spy_board_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_spy_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_spy_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for all tables (allow all operations for now)
CREATE POLICY "Allow all operations on ad_spy_competitors" ON public.ad_spy_competitors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on ad_spy_ads" ON public.ad_spy_ads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on ad_spy_boards" ON public.ad_spy_boards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on ad_spy_board_items" ON public.ad_spy_board_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on ad_spy_search_history" ON public.ad_spy_search_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on ad_spy_settings" ON public.ad_spy_settings FOR ALL USING (true) WITH CHECK (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_ad_spy_competitors_updated_at
  BEFORE UPDATE ON public.ad_spy_competitors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ad_spy_ads_updated_at
  BEFORE UPDATE ON public.ad_spy_ads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ad_spy_boards_updated_at
  BEFORE UPDATE ON public.ad_spy_boards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ad_spy_settings_updated_at
  BEFORE UPDATE ON public.ad_spy_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();