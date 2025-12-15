-- Create project_strategies table
CREATE TABLE public.project_strategies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_strategies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on project_strategies"
ON public.project_strategies
FOR ALL
USING (true)
WITH CHECK (true);

-- Create project_tools table
CREATE TABLE public.project_tools (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'custom'::text,
  config jsonb DEFAULT '{}'::jsonb,
  enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_tools ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on project_tools"
ON public.project_tools
FOR ALL
USING (true)
WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_project_strategies_updated_at
BEFORE UPDATE ON public.project_strategies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_tools_updated_at
BEFORE UPDATE ON public.project_tools
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();