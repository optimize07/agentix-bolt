-- Create table for research agents
CREATE TABLE ad_spy_research_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'industry', 'brand', 'keyword', 'category'
  query TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'paused'
  last_run_at TIMESTAMPTZ,
  schedule TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'
  filters JSONB DEFAULT '{}',
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE ad_spy_research_agents ENABLE ROW LEVEL SECURITY;

-- Allow all operations
CREATE POLICY "Allow all operations on ad_spy_research_agents"
ON ad_spy_research_agents
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_ad_spy_research_agents_updated_at
BEFORE UPDATE ON ad_spy_research_agents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();