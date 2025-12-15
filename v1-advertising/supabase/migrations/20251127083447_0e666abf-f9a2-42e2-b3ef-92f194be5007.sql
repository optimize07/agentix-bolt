-- Create enum for market research types
CREATE TYPE public.market_research_type AS ENUM (
  'customer_avatar',
  'competitor',
  'market_trend',
  'other'
);

-- Create enum for integration categories
CREATE TYPE public.integration_category AS ENUM (
  'network',
  'crm',
  'video_creation'
);

-- Create market_research table
CREATE TABLE public.market_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.agent_boards(id) ON DELETE CASCADE,
  type public.market_research_type NOT NULL,
  name TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on market_research
ALTER TABLE public.market_research ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for market_research
CREATE POLICY "Allow all operations on market_research"
ON public.market_research
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for market_research updated_at
CREATE TRIGGER update_market_research_updated_at
BEFORE UPDATE ON public.market_research
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create integrations table
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.agent_boards(id) ON DELETE CASCADE,
  category public.integration_category NOT NULL,
  platform TEXT NOT NULL,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_connected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on integrations
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for integrations
CREATE POLICY "Allow all operations on integrations"
ON public.integrations
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for integrations updated_at
CREATE TRIGGER update_integrations_updated_at
BEFORE UPDATE ON public.integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();