-- Theme Builder Schema
-- Implements hierarchical theming: Agency Default -> Templates -> Client-specific
-- Uses existing is_agency_admin() helper and clients table

-- =============================================================================
-- AGENCY THEME SETTINGS: Single row for agency-wide default theme
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.agency_theme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Mode setting (light/dark/system)
  mode text DEFAULT 'dark' CHECK (mode IN ('light', 'dark', 'system')),
  
  -- Light mode configs (stored as JSONB)
  light_colors jsonb,
  light_button_config jsonb,
  light_sidebar_config jsonb,
  light_background_config jsonb,
  light_card_config jsonb,
  light_glass_config jsonb,
  light_status_colors jsonb,
  light_divider_config jsonb,
  
  -- Dark mode configs (stored as JSONB)
  dark_colors jsonb,
  dark_button_config jsonb,
  dark_sidebar_config jsonb,
  dark_background_config jsonb,
  dark_card_config jsonb,
  dark_glass_config jsonb,
  dark_status_colors jsonb,
  dark_divider_config jsonb,
  
  -- Metadata
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Only one row allowed (agency-wide settings)
CREATE UNIQUE INDEX IF NOT EXISTS idx_agency_theme_singleton ON public.agency_theme_settings ((true));

ALTER TABLE public.agency_theme_settings ENABLE ROW LEVEL SECURITY;

-- RLS: All authenticated users can view agency theme
CREATE POLICY agency_theme_select_all ON public.agency_theme_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS: Only agency admins can insert/update/delete
CREATE POLICY agency_theme_insert_admin ON public.agency_theme_settings
  FOR INSERT WITH CHECK (public.is_agency_admin());

CREATE POLICY agency_theme_update_admin ON public.agency_theme_settings
  FOR UPDATE USING (public.is_agency_admin());

CREATE POLICY agency_theme_delete_admin ON public.agency_theme_settings
  FOR DELETE USING (public.is_agency_admin());

-- =============================================================================
-- THEME TEMPLATES: Library of reusable theme presets
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.theme_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template metadata
  name text NOT NULL,
  description text,
  mode text NOT NULL CHECK (mode IN ('light', 'dark')),
  is_default boolean DEFAULT false, -- Mark one as default per mode
  is_locked boolean DEFAULT false, -- Locked templates can't be deleted
  
  -- Complete theme configuration (JSONB containing all configs)
  theme_config jsonb NOT NULL,
  
  -- Preview colors for display (extracted from theme_config)
  preview_colors jsonb, -- { primary, secondary, accent }
  
  -- Metadata
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_theme_templates_mode ON public.theme_templates(mode);
CREATE INDEX IF NOT EXISTS idx_theme_templates_default ON public.theme_templates(is_default) WHERE is_default = true;

ALTER TABLE public.theme_templates ENABLE ROW LEVEL SECURITY;

-- RLS: All authenticated users can view templates
CREATE POLICY theme_templates_select_all ON public.theme_templates
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS: Only agency admins can insert/update/delete
CREATE POLICY theme_templates_insert_admin ON public.theme_templates
  FOR INSERT WITH CHECK (public.is_agency_admin());

CREATE POLICY theme_templates_update_admin ON public.theme_templates
  FOR UPDATE USING (public.is_agency_admin());

CREATE POLICY theme_templates_delete_admin ON public.theme_templates
  FOR DELETE USING (public.is_agency_admin() AND NOT is_locked);

-- =============================================================================
-- CLIENT THEME SETTINGS: Per-client theme configuration
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.client_theme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Theme source: 'template' (uses template_id) or 'custom' (uses custom configs)
  theme_source text NOT NULL DEFAULT 'agency' CHECK (theme_source IN ('agency', 'template', 'custom')),
  
  -- If using a template
  template_id uuid REFERENCES public.theme_templates(id) ON DELETE SET NULL,
  
  -- Agency override controls
  is_locked boolean DEFAULT false, -- Agency can lock to prevent client changes
  locked_by uuid REFERENCES auth.users(id),
  locked_at timestamptz,
  
  -- Mode setting (if custom)
  mode text DEFAULT 'dark' CHECK (mode IN ('light', 'dark', 'system')),
  
  -- Custom theme configs (only used if theme_source = 'custom')
  light_colors jsonb,
  light_button_config jsonb,
  light_sidebar_config jsonb,
  light_background_config jsonb,
  light_card_config jsonb,
  light_glass_config jsonb,
  light_status_colors jsonb,
  light_divider_config jsonb,
  
  dark_colors jsonb,
  dark_button_config jsonb,
  dark_sidebar_config jsonb,
  dark_background_config jsonb,
  dark_card_config jsonb,
  dark_glass_config jsonb,
  dark_status_colors jsonb,
  dark_divider_config jsonb,
  
  -- Metadata
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(client_id)
);

CREATE INDEX IF NOT EXISTS idx_client_theme_client ON public.client_theme_settings(client_id);
CREATE INDEX IF NOT EXISTS idx_client_theme_template ON public.client_theme_settings(template_id);
CREATE INDEX IF NOT EXISTS idx_client_theme_source ON public.client_theme_settings(theme_source);

ALTER TABLE public.client_theme_settings ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view theme for clients they have access to
CREATE POLICY client_theme_select ON public.client_theme_settings
  FOR SELECT USING (
    public.is_agency_admin() 
    OR public.can_access_client(client_id)
  );

-- RLS: Agency admins can insert for any client
CREATE POLICY client_theme_insert_admin ON public.client_theme_settings
  FOR INSERT WITH CHECK (public.is_agency_admin());

-- RLS: Agency admins can update any client theme
-- Client admins/owners can update their client theme if not locked
CREATE POLICY client_theme_update ON public.client_theme_settings
  FOR UPDATE USING (
    public.is_agency_admin() 
    OR (
      NOT is_locked 
      AND public.get_client_role(client_id) IN ('owner', 'admin')
    )
  );

-- RLS: Only agency admins can delete
CREATE POLICY client_theme_delete_admin ON public.client_theme_settings
  FOR DELETE USING (public.is_agency_admin());

-- =============================================================================
-- CUSTOM THEME PRESETS: User-saved presets (for agency admins)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.custom_theme_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('light', 'dark')),
  theme_config jsonb NOT NULL,
  
  -- Preview colors
  preview_colors jsonb,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_presets_user ON public.custom_theme_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_presets_mode ON public.custom_theme_presets(mode);

ALTER TABLE public.custom_theme_presets ENABLE ROW LEVEL SECURITY;

-- RLS: Agency admins can view all presets, others only their own
CREATE POLICY custom_presets_select ON public.custom_theme_presets
  FOR SELECT USING (
    public.is_agency_admin() OR user_id = auth.uid()
  );

-- RLS: Users can only manage their own presets
CREATE POLICY custom_presets_insert ON public.custom_theme_presets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY custom_presets_update ON public.custom_theme_presets
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY custom_presets_delete ON public.custom_theme_presets
  FOR DELETE USING (user_id = auth.uid());

-- =============================================================================
-- TRIGGERS: Auto-update updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_theme_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_agency_theme_updated_at ON public.agency_theme_settings;
CREATE TRIGGER trigger_agency_theme_updated_at
  BEFORE UPDATE ON public.agency_theme_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_theme_updated_at();

DROP TRIGGER IF EXISTS trigger_theme_templates_updated_at ON public.theme_templates;
CREATE TRIGGER trigger_theme_templates_updated_at
  BEFORE UPDATE ON public.theme_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_theme_updated_at();

DROP TRIGGER IF EXISTS trigger_client_theme_updated_at ON public.client_theme_settings;
CREATE TRIGGER trigger_client_theme_updated_at
  BEFORE UPDATE ON public.client_theme_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_theme_updated_at();

DROP TRIGGER IF EXISTS trigger_custom_presets_updated_at ON public.custom_theme_presets;
CREATE TRIGGER trigger_custom_presets_updated_at
  BEFORE UPDATE ON public.custom_theme_presets
  FOR EACH ROW EXECUTE FUNCTION public.update_theme_updated_at();

-- =============================================================================
-- HELPER FUNCTION: Get resolved theme for a client
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_client_theme(target_client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  client_settings RECORD;
  template_config jsonb;
  agency_settings RECORD;
  result jsonb;
BEGIN
  -- Get client theme settings
  SELECT * INTO client_settings
  FROM public.client_theme_settings
  WHERE client_id = target_client_id;
  
  -- If no client settings, return agency default
  IF client_settings IS NULL OR client_settings.theme_source = 'agency' THEN
    SELECT * INTO agency_settings
    FROM public.agency_theme_settings
    LIMIT 1;
    
    IF agency_settings IS NULL THEN
      RETURN NULL;
    END IF;
    
    RETURN jsonb_build_object(
      'source', 'agency',
      'mode', agency_settings.mode,
      'light_colors', agency_settings.light_colors,
      'dark_colors', agency_settings.dark_colors,
      'light_button_config', agency_settings.light_button_config,
      'dark_button_config', agency_settings.dark_button_config,
      'light_sidebar_config', agency_settings.light_sidebar_config,
      'dark_sidebar_config', agency_settings.dark_sidebar_config,
      'light_background_config', agency_settings.light_background_config,
      'dark_background_config', agency_settings.dark_background_config,
      'light_card_config', agency_settings.light_card_config,
      'dark_card_config', agency_settings.dark_card_config,
      'light_glass_config', agency_settings.light_glass_config,
      'dark_glass_config', agency_settings.dark_glass_config,
      'light_status_colors', agency_settings.light_status_colors,
      'dark_status_colors', agency_settings.dark_status_colors,
      'light_divider_config', agency_settings.light_divider_config,
      'dark_divider_config', agency_settings.dark_divider_config
    );
  END IF;
  
  -- If using template
  IF client_settings.theme_source = 'template' AND client_settings.template_id IS NOT NULL THEN
    SELECT theme_config INTO template_config
    FROM public.theme_templates
    WHERE id = client_settings.template_id;
    
    IF template_config IS NOT NULL THEN
      RETURN jsonb_build_object(
        'source', 'template',
        'template_id', client_settings.template_id,
        'is_locked', client_settings.is_locked
      ) || template_config;
    END IF;
  END IF;
  
  -- Custom theme
  RETURN jsonb_build_object(
    'source', 'custom',
    'is_locked', client_settings.is_locked,
    'mode', client_settings.mode,
    'light_colors', client_settings.light_colors,
    'dark_colors', client_settings.dark_colors,
    'light_button_config', client_settings.light_button_config,
    'dark_button_config', client_settings.dark_button_config,
    'light_sidebar_config', client_settings.light_sidebar_config,
    'dark_sidebar_config', client_settings.dark_sidebar_config,
    'light_background_config', client_settings.light_background_config,
    'dark_background_config', client_settings.dark_background_config,
    'light_card_config', client_settings.light_card_config,
    'dark_card_config', client_settings.dark_card_config,
    'light_glass_config', client_settings.light_glass_config,
    'dark_glass_config', client_settings.dark_glass_config,
    'light_status_colors', client_settings.light_status_colors,
    'dark_status_colors', client_settings.dark_status_colors,
    'light_divider_config', client_settings.light_divider_config,
    'dark_divider_config', client_settings.dark_divider_config
  );
END;
$$;

-- =============================================================================
-- REALTIME
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.agency_theme_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.theme_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_theme_settings;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE public.agency_theme_settings IS 'Agency-wide default theme settings';
COMMENT ON TABLE public.theme_templates IS 'Library of reusable theme templates';
COMMENT ON TABLE public.client_theme_settings IS 'Per-client theme configuration';
COMMENT ON TABLE public.custom_theme_presets IS 'User-saved custom theme presets';
COMMENT ON FUNCTION public.get_client_theme(uuid) IS 'Get resolved theme for a client (cascades: client -> template -> agency)';

