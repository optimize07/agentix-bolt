-- Add new fields to glossary_terms table for richer descriptions
ALTER TABLE public.glossary_terms
ADD COLUMN IF NOT EXISTS long_description TEXT,
ADD COLUMN IF NOT EXISTS usage_example TEXT,
ADD COLUMN IF NOT EXISTS differs_from JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS industry_notes TEXT;