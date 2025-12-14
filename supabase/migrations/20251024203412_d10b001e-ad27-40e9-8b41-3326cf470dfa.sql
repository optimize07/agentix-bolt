-- Create ad_spy_searches table
CREATE TABLE public.ad_spy_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  search_query TEXT NOT NULL,
  search_type TEXT NOT NULL CHECK (search_type IN ('url', 'creator')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ad_spy_ads table
CREATE TABLE public.ad_spy_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  search_id UUID NOT NULL REFERENCES public.ad_spy_searches(id) ON DELETE CASCADE,
  ad_library_url TEXT,
  platform TEXT NOT NULL DEFAULT 'facebook',
  video_url TEXT,
  image_url TEXT,
  ad_copy TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ad_spy_analysis table
CREATE TABLE public.ad_spy_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES public.ad_spy_ads(id) ON DELETE CASCADE,
  hook TEXT,
  angle TEXT,
  emotion TEXT,
  cta TEXT,
  script_summary TEXT,
  why_it_works TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ad_spy_recreations table
CREATE TABLE public.ad_spy_recreations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES public.ad_spy_ads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  recreated_script TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ad_spy_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_spy_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_spy_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_spy_recreations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ad_spy_searches
CREATE POLICY "Users can view their own searches"
  ON public.ad_spy_searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own searches"
  ON public.ad_spy_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own searches"
  ON public.ad_spy_searches FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for ad_spy_ads
CREATE POLICY "Users can view ads from their searches"
  ON public.ad_spy_ads FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ad_spy_searches
    WHERE ad_spy_searches.id = ad_spy_ads.search_id
    AND ad_spy_searches.user_id = auth.uid()
  ));

CREATE POLICY "Users can create ads for their searches"
  ON public.ad_spy_ads FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ad_spy_searches
    WHERE ad_spy_searches.id = ad_spy_ads.search_id
    AND ad_spy_searches.user_id = auth.uid()
  ));

-- Create RLS policies for ad_spy_analysis
CREATE POLICY "Users can view analysis of their ads"
  ON public.ad_spy_analysis FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ad_spy_ads
    JOIN public.ad_spy_searches ON ad_spy_searches.id = ad_spy_ads.search_id
    WHERE ad_spy_ads.id = ad_spy_analysis.ad_id
    AND ad_spy_searches.user_id = auth.uid()
  ));

CREATE POLICY "Users can create analysis for their ads"
  ON public.ad_spy_analysis FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ad_spy_ads
    JOIN public.ad_spy_searches ON ad_spy_searches.id = ad_spy_ads.search_id
    WHERE ad_spy_ads.id = ad_spy_analysis.ad_id
    AND ad_spy_searches.user_id = auth.uid()
  ));

-- Create RLS policies for ad_spy_recreations
CREATE POLICY "Users can view their own recreations"
  ON public.ad_spy_recreations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recreations"
  ON public.ad_spy_recreations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recreations"
  ON public.ad_spy_recreations FOR UPDATE
  USING (auth.uid() = user_id);