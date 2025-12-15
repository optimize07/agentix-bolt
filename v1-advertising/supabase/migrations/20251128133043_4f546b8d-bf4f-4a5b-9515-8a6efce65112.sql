-- Create ai_roles table for managing AI specialist personas
CREATE TABLE public.ai_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.agent_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  icon TEXT DEFAULT 'user',
  color TEXT,
  tags TEXT[] DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  group_id UUID REFERENCES public.content_groups(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_roles ENABLE ROW LEVEL SECURITY;

-- Allow all operations (matching existing pattern)
CREATE POLICY "Allow all operations on ai_roles" ON public.ai_roles
FOR ALL USING (true) WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_ai_roles_updated_at
BEFORE UPDATE ON public.ai_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_ai_roles_project_id ON public.ai_roles(project_id);
CREATE INDEX idx_ai_roles_enabled ON public.ai_roles(enabled) WHERE enabled = true;