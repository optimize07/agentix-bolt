-- Add openrouter_api_key column to app_settings table
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS openrouter_api_key text;