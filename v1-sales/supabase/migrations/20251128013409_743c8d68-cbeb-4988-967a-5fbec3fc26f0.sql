-- Add card configuration columns to organization_theme_settings
ALTER TABLE organization_theme_settings
ADD COLUMN light_card_config jsonb,
ADD COLUMN dark_card_config jsonb;