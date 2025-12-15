-- Add new columns for simplified market research
ALTER TABLE market_research 
ADD COLUMN file_url text,
ADD COLUMN prompt text;

-- Convert content from JSONB to text
-- First, convert existing JSONB content to text representation
ALTER TABLE market_research 
ALTER COLUMN content TYPE text USING content::text;