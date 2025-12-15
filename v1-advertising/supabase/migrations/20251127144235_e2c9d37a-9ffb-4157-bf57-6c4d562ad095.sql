-- Create content_groups table for organizing all content types
CREATE TABLE public.content_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.agent_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('knowledge', 'swipe', 'asset', 'research', 'strategy', 'tool', 'prompt')),
  color TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on content_groups
ALTER TABLE public.content_groups ENABLE ROW LEVEL SECURITY;

-- Allow all operations on content_groups
CREATE POLICY "Allow all operations on content_groups"
ON public.content_groups
FOR ALL
USING (true)
WITH CHECK (true);

-- Add group_id to knowledge_entries
ALTER TABLE public.knowledge_entries
ADD COLUMN group_id UUID REFERENCES public.content_groups(id) ON DELETE SET NULL;

-- Add group_id to swipe_files
ALTER TABLE public.swipe_files
ADD COLUMN group_id UUID REFERENCES public.content_groups(id) ON DELETE SET NULL;

-- Add group_id to assets (update existing column if needed)
ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.content_groups(id) ON DELETE SET NULL;

-- Add group_id to market_research
ALTER TABLE public.market_research
ADD COLUMN group_id UUID REFERENCES public.content_groups(id) ON DELETE SET NULL;

-- Add group_id to project_strategies
ALTER TABLE public.project_strategies
ADD COLUMN group_id UUID REFERENCES public.content_groups(id) ON DELETE SET NULL;

-- Add group_id to project_tools
ALTER TABLE public.project_tools
ADD COLUMN group_id UUID REFERENCES public.content_groups(id) ON DELETE SET NULL;

-- Add group_id to prompt_templates
ALTER TABLE public.prompt_templates
ADD COLUMN group_id UUID REFERENCES public.content_groups(id) ON DELETE SET NULL;

-- Create trigger for updating content_groups updated_at
CREATE TRIGGER update_content_groups_updated_at
BEFORE UPDATE ON public.content_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_content_groups_project_id ON public.content_groups(project_id);
CREATE INDEX idx_content_groups_content_type ON public.content_groups(content_type);
CREATE INDEX idx_knowledge_entries_group_id ON public.knowledge_entries(group_id);
CREATE INDEX idx_swipe_files_group_id ON public.swipe_files(group_id);
CREATE INDEX idx_assets_group_id ON public.assets(group_id);
CREATE INDEX idx_market_research_group_id ON public.market_research(group_id);
CREATE INDEX idx_project_strategies_group_id ON public.project_strategies(group_id);
CREATE INDEX idx_project_tools_group_id ON public.project_tools(group_id);
CREATE INDEX idx_prompt_templates_group_id ON public.prompt_templates(group_id);