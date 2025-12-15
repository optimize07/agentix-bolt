-- Phase 1: Make project_id columns nullable for global Central Brain content

-- Make project_id nullable in knowledge_entries
ALTER TABLE public.knowledge_entries 
ALTER COLUMN project_id DROP NOT NULL;

-- Make project_id nullable in market_research
ALTER TABLE public.market_research 
ALTER COLUMN project_id DROP NOT NULL;

-- Make project_id nullable in project_strategies
ALTER TABLE public.project_strategies 
ALTER COLUMN project_id DROP NOT NULL;

-- Make project_id nullable in project_tools
ALTER TABLE public.project_tools 
ALTER COLUMN project_id DROP NOT NULL;

-- Make project_id nullable in ai_roles
ALTER TABLE public.ai_roles 
ALTER COLUMN project_id DROP NOT NULL;

-- Make project_id nullable in swipe_files
ALTER TABLE public.swipe_files 
ALTER COLUMN project_id DROP NOT NULL;

-- Make project_id nullable in offers
ALTER TABLE public.offers 
ALTER COLUMN project_id DROP NOT NULL;

-- Make project_id nullable in content_groups
ALTER TABLE public.content_groups 
ALTER COLUMN project_id DROP NOT NULL;

-- Make project_id nullable in funnels
ALTER TABLE public.funnels 
ALTER COLUMN project_id DROP NOT NULL;

-- Make project_id nullable in integrations
ALTER TABLE public.integrations 
ALTER COLUMN project_id DROP NOT NULL;

COMMENT ON COLUMN public.knowledge_entries.project_id IS 'NULL = global content, otherwise project-specific';
COMMENT ON COLUMN public.market_research.project_id IS 'NULL = global content, otherwise project-specific';
COMMENT ON COLUMN public.project_strategies.project_id IS 'NULL = global content, otherwise project-specific';
COMMENT ON COLUMN public.project_tools.project_id IS 'NULL = global content, otherwise project-specific';
COMMENT ON COLUMN public.ai_roles.project_id IS 'NULL = global content, otherwise project-specific';
COMMENT ON COLUMN public.swipe_files.project_id IS 'NULL = global content, otherwise project-specific';
COMMENT ON COLUMN public.offers.project_id IS 'NULL = global content, otherwise project-specific';
COMMENT ON COLUMN public.content_groups.project_id IS 'NULL = global content, otherwise project-specific';
COMMENT ON COLUMN public.funnels.project_id IS 'NULL = global content, otherwise project-specific';
COMMENT ON COLUMN public.integrations.project_id IS 'NULL = global content, otherwise project-specific';