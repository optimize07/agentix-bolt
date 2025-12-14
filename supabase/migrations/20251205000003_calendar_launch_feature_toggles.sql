-- Add Calendar and Launch Feature Definitions
-- These features can be toggled in the admin panel

-- =============================================================================
-- CORE FEATURES: Calendar and Launch
-- =============================================================================
INSERT INTO public.feature_definitions (key, name, description, category, parent_key, default_enabled, sort_order, icon)
VALUES
  ('feature.calendar', 'Calendar', 'Campaign scheduling and content calendar', 'feature', NULL, true, 60, 'Calendar'),
  ('feature.launch', 'Launch', 'AI chat assistant for quick questions and brainstorming', 'feature', NULL, true, 70, 'Rocket')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  icon = EXCLUDED.icon;

-- =============================================================================
-- Initialize platform defaults (enabled by default)
-- =============================================================================
INSERT INTO public.platform_feature_toggles (feature_key, enabled)
VALUES 
  ('feature.calendar', true),
  ('feature.launch', true)
ON CONFLICT (feature_key) DO NOTHING;

-- Add comment
COMMENT ON TABLE public.feature_definitions IS 'Updated with Calendar and Launch features on 2025-12-05';

