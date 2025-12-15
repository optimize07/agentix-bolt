-- Add 'llm' to integration_category enum
ALTER TYPE public.integration_category ADD VALUE IF NOT EXISTS 'llm';