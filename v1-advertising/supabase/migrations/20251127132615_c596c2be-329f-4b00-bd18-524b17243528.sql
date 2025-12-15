-- Phase 1: Database Preparation
-- Add status column to assets table
ALTER TABLE public.assets 
ADD COLUMN status text NOT NULL DEFAULT 'active';

-- Create swipe_files table
CREATE TABLE public.swipe_files (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  source_url text,
  tags text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on swipe_files
ALTER TABLE public.swipe_files ENABLE ROW LEVEL SECURITY;

-- Create policy for swipe_files
CREATE POLICY "Allow all operations on swipe_files"
ON public.swipe_files
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for swipe_files updated_at
CREATE TRIGGER update_swipe_files_updated_at
BEFORE UPDATE ON public.swipe_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create funnels table
CREATE TABLE public.funnels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  stages jsonb DEFAULT '[]'::jsonb,
  enabled boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on funnels
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;

-- Create policy for funnels
CREATE POLICY "Allow all operations on funnels"
ON public.funnels
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for funnels updated_at
CREATE TRIGGER update_funnels_updated_at
BEFORE UPDATE ON public.funnels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();