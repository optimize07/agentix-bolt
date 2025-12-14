-- Feature Toggle Definition for Theme Builder
-- Adds feature toggles for the Theme Builder functionality

-- =============================================================================
-- THEME BUILDER FEATURE DEFINITION
-- =============================================================================

INSERT INTO public.feature_definitions (key, name, description, category, parent_key, default_enabled, sort_order, icon)
VALUES
  -- Theme Builder - Top level feature (under settings)
  ('feature.theme-builder', 'Theme Builder', 'Customize application appearance with colors, gradients, cards, glass effects, and more', 'feature', NULL, true, 40, 'Brush')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  icon = EXCLUDED.icon;

-- =============================================================================
-- THEME BUILDER SUB-FEATURES (Modules under Theme Builder)
-- =============================================================================

INSERT INTO public.feature_definitions (key, name, description, category, parent_key, default_enabled, sort_order, icon)
VALUES
  -- Theme Builder modules
  ('module.theme-builder.agency-themes', 'Agency Themes', 'Set default themes for all clients', 'module', 'feature.theme-builder', true, 401, 'Building2'),
  ('module.theme-builder.templates', 'Theme Templates', 'Create and manage reusable theme templates', 'module', 'feature.theme-builder', true, 402, 'Palette'),
  ('module.theme-builder.client-themes', 'Client Themes', 'Per-client theme customization', 'module', 'feature.theme-builder', true, 403, 'Users'),
  ('module.theme-builder.presets', 'Custom Presets', 'Save and apply custom theme presets', 'module', 'feature.theme-builder', true, 404, 'Bookmark'),
  ('module.theme-builder.gradients', 'Gradient Editor', 'Advanced gradient customization', 'module', 'feature.theme-builder', true, 405, 'Blend'),
  ('module.theme-builder.glass-effects', 'Glass Effects', 'Glass morphism styling controls', 'module', 'feature.theme-builder', true, 406, 'Sparkles')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  icon = EXCLUDED.icon;

-- =============================================================================
-- Initialize platform defaults for theme builder features (all enabled by default)
-- =============================================================================

INSERT INTO public.platform_feature_toggles (feature_key, enabled)
SELECT key, default_enabled FROM public.feature_definitions
WHERE key LIKE 'feature.theme-builder%'
   OR key LIKE 'module.theme-builder%'
ON CONFLICT (feature_key) DO NOTHING;

-- Comment
COMMENT ON TABLE public.feature_definitions IS 'Updated with Theme Builder feature on 2025-12-05';







