-- Create table for organization theme settings
CREATE TABLE IF NOT EXISTS public.organization_theme_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Mode setting
  mode TEXT DEFAULT 'dark' CHECK (mode IN ('light', 'dark', 'system')),
  
  -- Light mode configs (stored as JSONB)
  light_colors JSONB,
  light_button_config JSONB,
  light_sidebar_config JSONB,
  light_background_config JSONB,
  
  -- Dark mode configs (stored as JSONB)
  dark_colors JSONB,
  dark_button_config JSONB,
  dark_sidebar_config JSONB,
  dark_background_config JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(organization_id, user_id)
);

-- Enable RLS
ALTER TABLE public.organization_theme_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their organization theme settings"
  ON public.organization_theme_settings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Users can insert their theme settings"
  ON public.organization_theme_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their theme settings"
  ON public.organization_theme_settings FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their theme settings"
  ON public.organization_theme_settings FOR DELETE
  USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_organization_theme_settings_updated_at
  BEFORE UPDATE ON public.organization_theme_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();