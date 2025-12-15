-- Create app_settings table for global API configurations
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nanobanan_api_key text,
  redtrack_api_key text,
  composio_config_json jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for app_settings
CREATE POLICY "Allow all operations on app_settings" 
ON public.app_settings 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Extend canvas_blocks table with new fields
ALTER TABLE public.canvas_blocks
ADD COLUMN IF NOT EXISTS group_id uuid,
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS url text,
ADD COLUMN IF NOT EXISTS file_path text,
ADD COLUMN IF NOT EXISTS color text,
ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Create canvas_groups table
CREATE TABLE IF NOT EXISTS public.canvas_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_board_id uuid NOT NULL,
  name text NOT NULL,
  position_x integer DEFAULT 0,
  position_y integer DEFAULT 0,
  width integer DEFAULT 400,
  height integer DEFAULT 300,
  color text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.canvas_groups ENABLE ROW LEVEL SECURITY;

-- Create policy for canvas_groups
CREATE POLICY "Allow all operations on canvas_groups" 
ON public.canvas_groups 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_canvas_groups_updated_at
BEFORE UPDATE ON public.canvas_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for canvas uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('canvas-uploads', 'canvas-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for canvas uploads
CREATE POLICY "Canvas uploads are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'canvas-uploads');

CREATE POLICY "Anyone can upload to canvas" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'canvas-uploads');

CREATE POLICY "Anyone can update canvas uploads" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'canvas-uploads');

CREATE POLICY "Anyone can delete canvas uploads" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'canvas-uploads');