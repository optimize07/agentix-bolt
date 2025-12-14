-- Create theme_templates table for reusable presets
CREATE TABLE public.theme_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  preview_colors jsonb DEFAULT '[]'::jsonb,
  theme_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_public boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create agency_theme_settings table (single row per agency/user)
CREATE TABLE public.agency_theme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  theme_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create client_theme_settings table (per-client customization)
CREATE TABLE public.client_theme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  theme_source text DEFAULT 'agency' CHECK (theme_source IN ('agency', 'template', 'custom')),
  template_id uuid REFERENCES public.theme_templates(id) ON DELETE SET NULL,
  theme_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_locked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(client_id, user_id)
);

-- Create custom_theme_presets table for user-saved presets
CREATE TABLE public.custom_theme_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  theme_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.theme_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_theme_presets ENABLE ROW LEVEL SECURITY;

-- RLS for theme_templates
CREATE POLICY "theme_templates_select" ON public.theme_templates
  FOR SELECT USING (user_id = auth.uid() OR is_public = true);
CREATE POLICY "theme_templates_insert" ON public.theme_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "theme_templates_update" ON public.theme_templates
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "theme_templates_delete" ON public.theme_templates
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for agency_theme_settings
CREATE POLICY "agency_theme_select" ON public.agency_theme_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "agency_theme_insert" ON public.agency_theme_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "agency_theme_update" ON public.agency_theme_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS for client_theme_settings
CREATE POLICY "client_theme_select" ON public.client_theme_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "client_theme_insert" ON public.client_theme_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "client_theme_update" ON public.client_theme_settings
  FOR UPDATE USING (auth.uid() = user_id AND is_locked = false);
CREATE POLICY "client_theme_delete" ON public.client_theme_settings
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for custom_theme_presets
CREATE POLICY "custom_presets_select" ON public.custom_theme_presets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "custom_presets_insert" ON public.custom_theme_presets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "custom_presets_delete" ON public.custom_theme_presets
  FOR DELETE USING (auth.uid() = user_id);

-- Update triggers
CREATE TRIGGER update_theme_templates_updated_at
  BEFORE UPDATE ON public.theme_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_clients_updated_at();

CREATE TRIGGER update_agency_theme_updated_at
  BEFORE UPDATE ON public.agency_theme_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_clients_updated_at();

CREATE TRIGGER update_client_theme_updated_at
  BEFORE UPDATE ON public.client_theme_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_clients_updated_at();