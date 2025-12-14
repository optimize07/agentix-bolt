-- Feature Toggle System
-- Creates feature definitions and hierarchical toggle tables for platform and client levels

-- =============================================================================
-- FEATURE DEFINITIONS: Master list of toggleable features
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.feature_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE, -- e.g., 'department.advertising', 'agent.ad-spy'
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('department', 'agent', 'feature', 'module')),
  parent_key text REFERENCES public.feature_definitions(key) ON DELETE SET NULL,
  default_enabled boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  icon text, -- Icon name for UI display
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_definitions ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feature_definitions_category ON public.feature_definitions(category);
CREATE INDEX IF NOT EXISTS idx_feature_definitions_parent ON public.feature_definitions(parent_key);
CREATE INDEX IF NOT EXISTS idx_feature_definitions_sort ON public.feature_definitions(sort_order);

-- RLS Policies - Everyone can read feature definitions
CREATE POLICY feature_definitions_select_all ON public.feature_definitions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only agency admins can modify feature definitions
CREATE POLICY feature_definitions_insert_admin ON public.feature_definitions
  FOR INSERT WITH CHECK (public.is_agency_admin());

CREATE POLICY feature_definitions_update_admin ON public.feature_definitions
  FOR UPDATE USING (public.is_agency_admin());

CREATE POLICY feature_definitions_delete_admin ON public.feature_definitions
  FOR DELETE USING (public.is_agency_admin());

-- =============================================================================
-- PLATFORM FEATURE TOGGLES: Agency-wide defaults
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.platform_feature_toggles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text NOT NULL REFERENCES public.feature_definitions(key) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(feature_key)
);

ALTER TABLE public.platform_feature_toggles ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_platform_toggles_feature ON public.platform_feature_toggles(feature_key);
CREATE INDEX IF NOT EXISTS idx_platform_toggles_enabled ON public.platform_feature_toggles(enabled);

-- RLS Policies - Everyone can read platform toggles
CREATE POLICY platform_toggles_select_all ON public.platform_feature_toggles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only agency admins can modify platform toggles
CREATE POLICY platform_toggles_insert_admin ON public.platform_feature_toggles
  FOR INSERT WITH CHECK (public.is_agency_admin());

CREATE POLICY platform_toggles_update_admin ON public.platform_feature_toggles
  FOR UPDATE USING (public.is_agency_admin());

CREATE POLICY platform_toggles_delete_admin ON public.platform_feature_toggles
  FOR DELETE USING (public.is_agency_admin());

-- =============================================================================
-- CLIENT FEATURE TOGGLES: Client-specific overrides
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.client_feature_toggles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  feature_key text NOT NULL REFERENCES public.feature_definitions(key) ON DELETE CASCADE,
  enabled boolean, -- NULL = inherit from platform default
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, feature_key)
);

ALTER TABLE public.client_feature_toggles ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_toggles_client ON public.client_feature_toggles(client_id);
CREATE INDEX IF NOT EXISTS idx_client_toggles_feature ON public.client_feature_toggles(feature_key);
CREATE INDEX IF NOT EXISTS idx_client_toggles_enabled ON public.client_feature_toggles(enabled) WHERE enabled IS NOT NULL;

-- RLS Policies
-- Users can read toggles for clients they can access
CREATE POLICY client_toggles_select_accessible ON public.client_feature_toggles
  FOR SELECT USING (
    public.is_agency_admin() 
    OR public.can_access_client(client_id)
  );

-- Only agency admins can modify client toggles
CREATE POLICY client_toggles_insert_admin ON public.client_feature_toggles
  FOR INSERT WITH CHECK (public.is_agency_admin());

CREATE POLICY client_toggles_update_admin ON public.client_feature_toggles
  FOR UPDATE USING (public.is_agency_admin());

CREATE POLICY client_toggles_delete_admin ON public.client_feature_toggles
  FOR DELETE USING (public.is_agency_admin());

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get effective toggle state for a feature (resolves hierarchy)
CREATE OR REPLACE FUNCTION public.get_feature_enabled(
  p_feature_key text,
  p_client_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_client_enabled boolean;
  v_platform_enabled boolean;
  v_default_enabled boolean;
  v_parent_key text;
  v_parent_enabled boolean;
BEGIN
  -- Get the feature definition default and parent
  SELECT default_enabled, parent_key 
  INTO v_default_enabled, v_parent_key
  FROM public.feature_definitions 
  WHERE key = p_feature_key;
  
  -- If feature doesn't exist, return false
  IF v_default_enabled IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check parent feature first (if parent is disabled, child is disabled)
  IF v_parent_key IS NOT NULL THEN
    v_parent_enabled := public.get_feature_enabled(v_parent_key, p_client_id);
    IF NOT v_parent_enabled THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Check client-specific override first (if client_id provided)
  IF p_client_id IS NOT NULL THEN
    SELECT enabled INTO v_client_enabled
    FROM public.client_feature_toggles
    WHERE client_id = p_client_id AND feature_key = p_feature_key;
    
    -- If client has explicit override, use it
    IF v_client_enabled IS NOT NULL THEN
      RETURN v_client_enabled;
    END IF;
  END IF;
  
  -- Check platform toggle
  SELECT enabled INTO v_platform_enabled
  FROM public.platform_feature_toggles
  WHERE feature_key = p_feature_key;
  
  -- If platform has toggle, use it
  IF v_platform_enabled IS NOT NULL THEN
    RETURN v_platform_enabled;
  END IF;
  
  -- Fall back to feature definition default
  RETURN v_default_enabled;
END;
$$;

-- Get all effective toggles for a client (batch operation)
CREATE OR REPLACE FUNCTION public.get_client_features(p_client_id uuid)
RETURNS TABLE (
  feature_key text,
  name text,
  category text,
  parent_key text,
  enabled boolean,
  is_overridden boolean
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    fd.key as feature_key,
    fd.name,
    fd.category,
    fd.parent_key,
    public.get_feature_enabled(fd.key, p_client_id) as enabled,
    (cft.enabled IS NOT NULL) as is_overridden
  FROM public.feature_definitions fd
  LEFT JOIN public.client_feature_toggles cft 
    ON cft.feature_key = fd.key AND cft.client_id = p_client_id
  ORDER BY fd.sort_order, fd.category, fd.name;
$$;

-- Bulk update client feature toggles
CREATE OR REPLACE FUNCTION public.set_client_feature_toggles(
  p_client_id uuid,
  p_toggles jsonb -- Array of {feature_key, enabled} objects
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_toggle jsonb;
BEGIN
  -- Verify caller is agency admin
  IF NOT public.is_agency_admin() THEN
    RAISE EXCEPTION 'Only agency admins can modify client feature toggles';
  END IF;
  
  FOR v_toggle IN SELECT * FROM jsonb_array_elements(p_toggles)
  LOOP
    INSERT INTO public.client_feature_toggles (client_id, feature_key, enabled, updated_by)
    VALUES (
      p_client_id,
      v_toggle->>'feature_key',
      (v_toggle->>'enabled')::boolean,
      auth.uid()
    )
    ON CONFLICT (client_id, feature_key) 
    DO UPDATE SET 
      enabled = (v_toggle->>'enabled')::boolean,
      updated_by = auth.uid(),
      updated_at = now();
  END LOOP;
END;
$$;

-- Reset client toggle to inherit from platform
CREATE OR REPLACE FUNCTION public.reset_client_feature_toggle(
  p_client_id uuid,
  p_feature_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_agency_admin() THEN
    RAISE EXCEPTION 'Only agency admins can modify client feature toggles';
  END IF;
  
  DELETE FROM public.client_feature_toggles
  WHERE client_id = p_client_id AND feature_key = p_feature_key;
END;
$$;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Updated at trigger for feature_definitions
CREATE OR REPLACE FUNCTION public.update_feature_definitions_updated_at()
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

DROP TRIGGER IF EXISTS trigger_feature_definitions_updated_at ON public.feature_definitions;
CREATE TRIGGER trigger_feature_definitions_updated_at
  BEFORE UPDATE ON public.feature_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_feature_definitions_updated_at();

-- Updated at trigger for platform_feature_toggles
CREATE OR REPLACE FUNCTION public.update_platform_toggles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_platform_toggles_updated_at ON public.platform_feature_toggles;
CREATE TRIGGER trigger_platform_toggles_updated_at
  BEFORE UPDATE ON public.platform_feature_toggles
  FOR EACH ROW EXECUTE FUNCTION public.update_platform_toggles_updated_at();

-- Updated at trigger for client_feature_toggles
CREATE OR REPLACE FUNCTION public.update_client_toggles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_client_toggles_updated_at ON public.client_feature_toggles;
CREATE TRIGGER trigger_client_toggles_updated_at
  BEFORE UPDATE ON public.client_feature_toggles
  FOR EACH ROW EXECUTE FUNCTION public.update_client_toggles_updated_at();

-- =============================================================================
-- REALTIME
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.feature_definitions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_feature_toggles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_feature_toggles;

-- Comments
COMMENT ON TABLE public.feature_definitions IS 'Master list of toggleable features in the system';
COMMENT ON TABLE public.platform_feature_toggles IS 'Agency-wide default toggle states';
COMMENT ON TABLE public.client_feature_toggles IS 'Client-specific toggle overrides';
COMMENT ON FUNCTION public.get_feature_enabled(text, uuid) IS 'Get effective toggle state resolving hierarchy';
COMMENT ON FUNCTION public.get_client_features(uuid) IS 'Get all features with effective states for a client';

