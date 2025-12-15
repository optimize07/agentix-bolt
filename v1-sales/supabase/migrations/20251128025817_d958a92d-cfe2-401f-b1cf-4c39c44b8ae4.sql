-- Add new columns for glass, status, and divider configurations
ALTER TABLE public.organization_theme_settings
ADD COLUMN light_glass_config jsonb,
ADD COLUMN dark_glass_config jsonb,
ADD COLUMN light_status_colors jsonb,
ADD COLUMN dark_status_colors jsonb,
ADD COLUMN light_divider_config jsonb,
ADD COLUMN dark_divider_config jsonb;