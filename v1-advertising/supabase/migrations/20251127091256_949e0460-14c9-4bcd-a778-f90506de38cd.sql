-- Add enabled column to prompt_templates
ALTER TABLE prompt_templates ADD COLUMN enabled boolean DEFAULT true;

-- Add enabled column to market_research
ALTER TABLE market_research ADD COLUMN enabled boolean DEFAULT true;

-- Add enabled column to assets
ALTER TABLE assets ADD COLUMN enabled boolean DEFAULT true;