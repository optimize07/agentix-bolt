-- Create custom theme presets table
CREATE TABLE public.custom_theme_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('light', 'dark')),
  colors jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_theme_presets ENABLE ROW LEVEL SECURITY;

-- Users can view presets in their org
CREATE POLICY "Users can view presets in their org"
ON public.custom_theme_presets
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Users can create their own presets
CREATE POLICY "Users can create their own presets"
ON public.custom_theme_presets
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Users can update their own presets
CREATE POLICY "Users can update their own presets"
ON public.custom_theme_presets
FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own presets
CREATE POLICY "Users can delete their own presets"
ON public.custom_theme_presets
FOR DELETE
USING (user_id = auth.uid());

-- Add updated_at trigger
CREATE TRIGGER update_custom_theme_presets_updated_at
BEFORE UPDATE ON public.custom_theme_presets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();