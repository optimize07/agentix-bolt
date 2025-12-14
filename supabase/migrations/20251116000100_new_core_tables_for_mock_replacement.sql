-- Create core tables to replace UI mock data
-- These tables are designed to be minimal, flexible, and safe for production.
-- They use JSONB for variable per-department metrics so we can iterate without schema churn.

-- admin_tasks: supports Admin dashboard TasksTable
CREATE TABLE IF NOT EXISTS public.admin_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  client TEXT,
  department TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('Low','Medium','High')),
  status TEXT NOT NULL CHECK (status IN ('Pending','Waiting','In Progress','Completed')),
  assigned_to TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;

-- CRUD limited to row owner
DROP POLICY IF EXISTS "Users can view their own admin tasks" ON public.admin_tasks;
CREATE POLICY "Users can view their own admin tasks"
  ON public.admin_tasks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own admin tasks" ON public.admin_tasks;
CREATE POLICY "Users can create their own admin tasks"
  ON public.admin_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own admin tasks" ON public.admin_tasks;
CREATE POLICY "Users can update their own admin tasks"
  ON public.admin_tasks FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own admin tasks" ON public.admin_tasks;
CREATE POLICY "Users can delete their own admin tasks"
  ON public.admin_tasks FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_admin_tasks_user ON public.admin_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_department ON public.admin_tasks(department);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_due_date ON public.admin_tasks(due_date);

-- campaigns: supports CampaignsTable and Advertising overview
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  project TEXT,
  status TEXT NOT NULL CHECK (status IN ('Active','Paused','Review','Testing','Archived')),
  spend NUMERIC(14,2),          -- e.g., 4250.00
  impressions BIGINT,           -- e.g., 842000
  ctr NUMERIC(6,3),             -- e.g., 3.800
  roas NUMERIC(8,3),            -- e.g., 6.200
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)         -- logical de-dupe
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own campaigns" ON public.campaigns;
CREATE POLICY "Users can view their own campaigns"
  ON public.campaigns FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own campaigns" ON public.campaigns;
CREATE POLICY "Users can create their own campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own campaigns" ON public.campaigns;
CREATE POLICY "Users can update their own campaigns"
  ON public.campaigns FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own campaigns" ON public.campaigns;
CREATE POLICY "Users can delete their own campaigns"
  ON public.campaigns FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_campaigns_user ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON public.campaigns(created_at DESC);

-- department_agents: generic agent records with flexible metrics
CREATE TABLE IF NOT EXISTS public.department_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  department TEXT NOT NULL,       -- e.g., 'marketing', 'advertising', etc.
  name TEXT NOT NULL,
  role TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('online','busy','offline','active','on-leave')),
  metrics JSONB,                  -- department-specific numbers/labels
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.department_agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own department agents" ON public.department_agents;
CREATE POLICY "Users can view their own department agents"
  ON public.department_agents FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own department agents" ON public.department_agents;
CREATE POLICY "Users can create their own department agents"
  ON public.department_agents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own department agents" ON public.department_agents;
CREATE POLICY "Users can update their own department agents"
  ON public.department_agents FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own department agents" ON public.department_agents;
CREATE POLICY "Users can delete their own department agents"
  ON public.department_agents FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_department_agents_user ON public.department_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_department_agents_dept ON public.department_agents(department);

-- department_kpis: three-card KPI blocks per department
CREATE TABLE IF NOT EXISTS public.department_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  department TEXT NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  trend JSONB,                    -- { "direction": "up" | "down", "value": "+5%" | "Excellent" }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.department_kpis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own department KPIs" ON public.department_kpis;
CREATE POLICY "Users can view their own department KPIs"
  ON public.department_kpis FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own department KPIs" ON public.department_kpis;
CREATE POLICY "Users can create their own department KPIs"
  ON public.department_kpis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own department KPIs" ON public.department_kpis;
CREATE POLICY "Users can update their own department KPIs"
  ON public.department_kpis FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own department KPIs" ON public.department_kpis;
CREATE POLICY "Users can delete their own department KPIs"
  ON public.department_kpis FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_department_kpis_user ON public.department_kpis(user_id);
CREATE INDEX IF NOT EXISTS idx_department_kpis_dept ON public.department_kpis(department);

-- Realtime optional
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.department_agents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.department_kpis;





