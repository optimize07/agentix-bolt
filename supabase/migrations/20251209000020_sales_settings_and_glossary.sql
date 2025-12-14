-- ==============================================================================
-- Sales Settings: Industry Niches, Glossary Terms, Form Templates, Sales Processes
-- Adapted from sales-spotlight-hub for client-based architecture
-- ==============================================================================

-- 1. Create sales_niches table (industry templates)
CREATE TABLE IF NOT EXISTS public.sales_niches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system_template BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create glossary_terms table
CREATE TABLE IF NOT EXISTS public.glossary_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id UUID REFERENCES public.sales_niches(id) ON DELETE CASCADE NOT NULL,
  term_key TEXT NOT NULL,
  default_label TEXT NOT NULL,
  description TEXT,
  category TEXT,
  alternative_examples TEXT,
  display_order INTEGER DEFAULT 999,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(niche_id, term_key)
);

-- 3. Create client_glossary_overrides table
CREATE TABLE IF NOT EXISTS public.client_glossary_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  glossary_term_id UUID REFERENCES public.glossary_terms(id) ON DELETE CASCADE NOT NULL,
  custom_label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, glossary_term_id)
);

-- 4. Create sales_processes table
CREATE TABLE IF NOT EXISTS public.sales_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id UUID REFERENCES public.sales_niches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  stages JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(niche_id, slug)
);

-- 5. Create client_sales_processes junction table
CREATE TABLE IF NOT EXISTS public.client_sales_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  sales_process_id UUID REFERENCES public.sales_processes(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, sales_process_id)
);

-- 6. Create form_template_presets table
CREATE TABLE IF NOT EXISTS public.form_template_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id UUID REFERENCES public.sales_niches(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  icon TEXT,
  fields JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Create client_form_template_presets junction table
CREATE TABLE IF NOT EXISTS public.client_form_template_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  form_template_preset_id UUID REFERENCES public.form_template_presets(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, form_template_preset_id)
);

-- 8. Add niche_id to clients table for industry selection
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS sales_niche_id UUID REFERENCES public.sales_niches(id);

-- ==============================================================================
-- Create indexes for performance
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_glossary_terms_niche ON public.glossary_terms(niche_id);
CREATE INDEX IF NOT EXISTS idx_glossary_terms_category ON public.glossary_terms(category);
CREATE INDEX IF NOT EXISTS idx_client_glossary_overrides_client ON public.client_glossary_overrides(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_processes_niche ON public.sales_processes(niche_id);
CREATE INDEX IF NOT EXISTS idx_client_sales_processes_client ON public.client_sales_processes(client_id);
CREATE INDEX IF NOT EXISTS idx_form_template_presets_niche ON public.form_template_presets(niche_id);
CREATE INDEX IF NOT EXISTS idx_client_form_template_presets_client ON public.client_form_template_presets(client_id);

-- ==============================================================================
-- Enable RLS
-- ==============================================================================

ALTER TABLE public.sales_niches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_glossary_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_sales_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_template_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_form_template_presets ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- RLS Policies
-- ==============================================================================

-- Sales niches: viewable by all authenticated users
CREATE POLICY "Sales niches viewable by all authenticated users"
  ON public.sales_niches FOR SELECT TO authenticated USING (true);

-- Glossary terms: viewable by all authenticated users
CREATE POLICY "Glossary terms viewable by all authenticated users"
  ON public.glossary_terms FOR SELECT TO authenticated USING (true);

-- Client glossary overrides: users can view/manage for their clients
CREATE POLICY "Users can view glossary overrides for their clients"
  ON public.client_glossary_overrides FOR SELECT TO authenticated
  USING (client_id IN (SELECT client_id FROM public.client_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert glossary overrides for their clients"
  ON public.client_glossary_overrides FOR INSERT TO authenticated
  WITH CHECK (client_id IN (SELECT client_id FROM public.client_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update glossary overrides for their clients"
  ON public.client_glossary_overrides FOR UPDATE TO authenticated
  USING (client_id IN (SELECT client_id FROM public.client_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete glossary overrides for their clients"
  ON public.client_glossary_overrides FOR DELETE TO authenticated
  USING (client_id IN (SELECT client_id FROM public.client_members WHERE user_id = auth.uid()));

-- Sales processes: viewable by all authenticated users
CREATE POLICY "Sales processes viewable by all authenticated users"
  ON public.sales_processes FOR SELECT TO authenticated USING (true);

-- Client sales processes: users can view/manage for their clients
CREATE POLICY "Users can view sales processes for their clients"
  ON public.client_sales_processes FOR SELECT TO authenticated
  USING (client_id IN (SELECT client_id FROM public.client_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert sales processes for their clients"
  ON public.client_sales_processes FOR INSERT TO authenticated
  WITH CHECK (client_id IN (SELECT client_id FROM public.client_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update sales processes for their clients"
  ON public.client_sales_processes FOR UPDATE TO authenticated
  USING (client_id IN (SELECT client_id FROM public.client_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete sales processes for their clients"
  ON public.client_sales_processes FOR DELETE TO authenticated
  USING (client_id IN (SELECT client_id FROM public.client_members WHERE user_id = auth.uid()));

-- Form template presets: viewable by all authenticated users
CREATE POLICY "Form template presets viewable by all authenticated users"
  ON public.form_template_presets FOR SELECT TO authenticated USING (true);

-- Client form template presets: users can view/manage for their clients
CREATE POLICY "Users can view form template presets for their clients"
  ON public.client_form_template_presets FOR SELECT TO authenticated
  USING (client_id IN (SELECT client_id FROM public.client_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert form template presets for their clients"
  ON public.client_form_template_presets FOR INSERT TO authenticated
  WITH CHECK (client_id IN (SELECT client_id FROM public.client_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update form template presets for their clients"
  ON public.client_form_template_presets FOR UPDATE TO authenticated
  USING (client_id IN (SELECT client_id FROM public.client_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete form template presets for their clients"
  ON public.client_form_template_presets FOR DELETE TO authenticated
  USING (client_id IN (SELECT client_id FROM public.client_members WHERE user_id = auth.uid()));

-- ==============================================================================
-- SEED DATA: Industry Niches
-- ==============================================================================

INSERT INTO public.sales_niches (name, slug, description, is_system_template) VALUES
  ('High Ticket Sales', 'high-ticket-sales', 'High-value B2B/B2C sales teams with closers and setters', true),
  ('Online Sales', 'online-sales', 'E-commerce and digital product sales', true),
  ('SaaS Sales', 'saas-sales', 'Software as a Service sales teams', true),
  ('Real Estate', 'real-estate', 'Real estate agencies and brokerages', true),
  ('Insurance', 'insurance', 'Insurance agencies and brokers', true),
  ('Dentistry', 'dentistry', 'Dental practices and clinics', true),
  ('Legal Services', 'legal-services', 'Law firms and legal practices', true),
  ('Consulting', 'consulting', 'Business and management consulting', true)
ON CONFLICT (slug) DO NOTHING;

-- ==============================================================================
-- SEED DATA: Glossary Terms (for all niches)
-- ==============================================================================

DO $$
DECLARE
  niche_record RECORD;
BEGIN
  FOR niche_record IN SELECT id FROM public.sales_niches LOOP
    -- General/Core Business Entities (display_order = 1 for top terms)
    INSERT INTO public.glossary_terms (niche_id, term_key, default_label, category, description, display_order, alternative_examples) VALUES
      (niche_record.id, 'entity.lead', 'Lead', 'Business Entities', 'Potential customer who has shown interest', 1, 'Also called: Prospect, Inquiry, Unqualified Contact'),
      (niche_record.id, 'entity.contact', 'Contact', 'Business Entities', 'Any individual person in your database', 1, 'Also called: Person, Individual, Record'),
      (niche_record.id, 'entity.customer', 'Customer', 'Business Entities', 'Person or company that has purchased', 1, 'Also called: Client, Patient, Member, Buyer'),
      (niche_record.id, 'entity.prospect', 'Prospect', 'Business Entities', 'Qualified lead being actively worked', 1, 'Also called: Qualified Lead, Opportunity Contact'),
      (niche_record.id, 'entity.opportunity', 'Opportunity', 'Business Entities', 'Active sales deal with projected value', 1, 'Also called: Deal, Case, Matter, Transaction'),
      (niche_record.id, 'entity.account', 'Account', 'Business Entities', 'Company or organization entity', 1, 'Also called: Company, Organization, Business Entity'),
      (niche_record.id, 'entity.deal', 'Deal', 'Business Entities', 'Specific revenue-generating sales cycle', 1, 'Also called: Opportunity, Case, Transaction, Sale'),
      (niche_record.id, 'entity.client', 'Client', 'Business Entities', 'Ongoing relationship with repeat business', 1, 'Also called: Customer, Patient, Member')
    ON CONFLICT (niche_id, term_key) DO NOTHING;

    -- Contact Stages
    INSERT INTO public.glossary_terms (niche_id, term_key, default_label, category, description, display_order) VALUES
      (niche_record.id, 'stage.cold_lead', 'Cold Lead', 'Contact Stages', 'New lead with no prior engagement', 3),
      (niche_record.id, 'stage.warm_lead', 'Warm Lead', 'Contact Stages', 'Lead showing engagement through opens, visits, or responses', 3),
      (niche_record.id, 'stage.qualified_lead', 'Qualified Lead', 'Contact Stages', 'Lead that meets BANT criteria for active pursuit', 3),
      (niche_record.id, 'stage.opportunity', 'Opportunity', 'Contact Stages', 'Active deal with qualified prospect and projected close date', 3),
      (niche_record.id, 'stage.champion', 'Champion', 'Contact Stages', 'Internal advocate who supports your solution', 3)
    ON CONFLICT (niche_id, term_key) DO NOTHING;

    -- Team Roles
    INSERT INTO public.glossary_terms (niche_id, term_key, default_label, category, description, display_order) VALUES
      (niche_record.id, 'role.sdr', 'SDR', 'Team Roles', 'Sales Development Rep - qualifies inbound leads and books meetings', 4),
      (niche_record.id, 'role.account_executive', 'Account Executive', 'Team Roles', 'Manages full sales cycle from demo to close', 4),
      (niche_record.id, 'role.bdr', 'BDR', 'Team Roles', 'Business Development Rep - outbound prospecting', 4),
      (niche_record.id, 'role.closer', 'Closer', 'Team Roles', 'Specializes in final negotiation and contract signing', 4),
      (niche_record.id, 'role.setter', 'Setter', 'Team Roles', 'Sets appointments for closers', 4),
      (niche_record.id, 'role.account_manager', 'Account Manager', 'Team Roles', 'Manages post-sale relationships for retention and upsells', 4),
      (niche_record.id, 'role.sales_manager', 'Sales Manager', 'Team Roles', 'Leads the sales team by setting strategy and coaching', 4)
    ON CONFLICT (niche_id, term_key) DO NOTHING;

    -- Activity Types
    INSERT INTO public.glossary_terms (niche_id, term_key, default_label, category, description, display_order) VALUES
      (niche_record.id, 'activity.call', 'Call', 'Activity Types', 'Voice conversation via phone', 5),
      (niche_record.id, 'activity.email', 'Email', 'Activity Types', 'Written electronic message', 5),
      (niche_record.id, 'activity.meeting', 'Meeting', 'Activity Types', 'Scheduled interactive conversation', 5),
      (niche_record.id, 'activity.task', 'Task', 'Activity Types', 'To-do item or follow-up action', 5),
      (niche_record.id, 'activity.note', 'Note', 'Activity Types', 'Free-form text documenting context', 5),
      (niche_record.id, 'activity.demo', 'Demo', 'Activity Types', 'Product demonstration meeting', 5)
    ON CONFLICT (niche_id, term_key) DO NOTHING;

    -- Activity Outcomes
    INSERT INTO public.glossary_terms (niche_id, term_key, default_label, category, description, display_order) VALUES
      (niche_record.id, 'outcome.completed', 'Completed', 'Activity Outcomes', 'Activity was successfully finished', 7),
      (niche_record.id, 'outcome.successful', 'Successful', 'Activity Outcomes', 'Activity achieved its intended goal', 7),
      (niche_record.id, 'outcome.no_show', 'No-Show', 'Activity Outcomes', 'Prospect did not attend scheduled meeting', 7),
      (niche_record.id, 'outcome.rescheduled', 'Rescheduled', 'Activity Outcomes', 'Meeting moved to different date/time', 7),
      (niche_record.id, 'outcome.cancelled', 'Cancelled', 'Activity Outcomes', 'Activity was terminated without rescheduling', 7),
      (niche_record.id, 'outcome.left_voicemail', 'Left Voicemail', 'Activity Outcomes', 'Reached voicemail and left message', 7),
      (niche_record.id, 'outcome.no_answer', 'No Answer', 'Activity Outcomes', 'Called but no one answered', 7),
      (niche_record.id, 'outcome.sent', 'Sent', 'Activity Outcomes', 'Email was delivered to recipient', 7)
    ON CONFLICT (niche_id, term_key) DO NOTHING;

    -- Performance Metrics
    INSERT INTO public.glossary_terms (niche_id, term_key, default_label, category, description, display_order) VALUES
      (niche_record.id, 'metrics.acv', 'ACV', 'Performance Metrics', 'Annual Contract Value', 9),
      (niche_record.id, 'metrics.conversion_rate', 'Conversion Rate', 'Performance Metrics', 'Percentage of prospects that convert', 9),
      (niche_record.id, 'metrics.sets', 'Sets', 'Performance Metrics', 'Scheduled appointments set by lead gen team', 9),
      (niche_record.id, 'metrics.conversations', 'Conversations', 'Performance Metrics', 'Total sales conversations conducted', 9),
      (niche_record.id, 'metrics.triages', 'Triages', 'Performance Metrics', 'Initial qualification conversations', 9),
      (niche_record.id, 'metrics.close_rate', 'Close Rate', 'Performance Metrics', 'Percentage of opportunities that close', 9),
      (niche_record.id, 'metrics.pipeline_value', 'Pipeline Value', 'Performance Metrics', 'Total value of opportunities in pipeline', 9)
    ON CONFLICT (niche_id, term_key) DO NOTHING;
  END LOOP;
END $$;

-- ==============================================================================
-- SEED DATA: Sales Processes
-- ==============================================================================

-- High Ticket Sales Process
INSERT INTO public.sales_processes (niche_id, name, slug, stages, is_default)
SELECT id, 'High Ticket Sales Process', 'high-ticket-sales-process',
'[
  {"id": "1", "name": "New Lead", "order": 1, "color": "#94a3b8"},
  {"id": "2", "name": "Triage Call", "order": 2, "color": "#3b82f6"},
  {"id": "3", "name": "Discovery", "order": 3, "color": "#8b5cf6"},
  {"id": "4", "name": "Demo/Presentation", "order": 4, "color": "#f59e0b"},
  {"id": "5", "name": "Proposal", "order": 5, "color": "#f97316"},
  {"id": "6", "name": "Negotiation", "order": 6, "color": "#ef4444"},
  {"id": "7", "name": "Closed Won", "order": 7, "color": "#22c55e"},
  {"id": "8", "name": "Closed Lost", "order": 8, "color": "#6b7280"}
]'::jsonb,
true
FROM public.sales_niches WHERE slug = 'high-ticket-sales'
ON CONFLICT (niche_id, slug) DO NOTHING;

-- SaaS Sales Process  
INSERT INTO public.sales_processes (niche_id, name, slug, stages, is_default)
SELECT id, 'SaaS Sales Process', 'saas-sales-process',
'[
  {"id": "1", "name": "Lead In", "order": 1, "color": "#94a3b8"},
  {"id": "2", "name": "Qualified", "order": 2, "color": "#3b82f6"},
  {"id": "3", "name": "Demo Scheduled", "order": 3, "color": "#8b5cf6"},
  {"id": "4", "name": "Demo Complete", "order": 4, "color": "#f59e0b"},
  {"id": "5", "name": "Trial Started", "order": 5, "color": "#f97316"},
  {"id": "6", "name": "Proposal Sent", "order": 6, "color": "#ef4444"},
  {"id": "7", "name": "Closed Won", "order": 7, "color": "#22c55e"},
  {"id": "8", "name": "Closed Lost", "order": 8, "color": "#6b7280"}
]'::jsonb,
true
FROM public.sales_niches WHERE slug = 'saas-sales'
ON CONFLICT (niche_id, slug) DO NOTHING;

-- Real Estate Sales Process
INSERT INTO public.sales_processes (niche_id, name, slug, stages, is_default)
SELECT id, 'Real Estate Sales Process', 'real-estate-process',
'[
  {"id": "1", "name": "Initial Contact", "order": 1, "color": "#3b82f6"},
  {"id": "2", "name": "Property Viewing", "order": 2, "color": "#8b5cf6"},
  {"id": "3", "name": "Offer Made", "order": 3, "color": "#f59e0b"},
  {"id": "4", "name": "Under Contract", "order": 4, "color": "#22c55e"},
  {"id": "5", "name": "Closed", "order": 5, "color": "#10b981"}
]'::jsonb,
true
FROM public.sales_niches WHERE slug = 'real-estate'
ON CONFLICT (niche_id, slug) DO NOTHING;

-- Dentistry Treatment Process
INSERT INTO public.sales_processes (niche_id, name, slug, stages, is_default)
SELECT id, 'Standard Treatment Process', 'standard-treatment',
'[
  {"id": "1", "name": "Consultation Booked", "order": 1, "color": "#3b82f6"},
  {"id": "2", "name": "Consultation Complete", "order": 2, "color": "#8b5cf6"},
  {"id": "3", "name": "Treatment Proposed", "order": 3, "color": "#f59e0b"},
  {"id": "4", "name": "Treatment Accepted", "order": 4, "color": "#22c55e"}
]'::jsonb,
true
FROM public.sales_niches WHERE slug = 'dentistry'
ON CONFLICT (niche_id, slug) DO NOTHING;

-- ==============================================================================
-- SEED DATA: Form Template Presets
-- ==============================================================================

-- High Ticket Sales Form Templates
INSERT INTO public.form_template_presets (niche_id, name, description, category, icon, fields)
SELECT id, 'Daily Activity Log', 'Track daily sales activities including calls, emails, meetings, and demos', 'Daily Reporting', 'CalendarCheck',
'[
  {"field_label": "Date", "field_type": "date", "is_required": true},
  {"field_label": "Calls Made", "field_type": "number", "is_required": true, "glossary_term_key": "activity.call"},
  {"field_label": "Emails Sent", "field_type": "number", "is_required": true, "glossary_term_key": "activity.email"},
  {"field_label": "Meetings Held", "field_type": "number", "is_required": true, "glossary_term_key": "activity.meeting"},
  {"field_label": "Demos Completed", "field_type": "number", "is_required": true, "glossary_term_key": "activity.demo"},
  {"field_label": "Notes", "field_type": "textarea", "is_required": false}
]'::jsonb
FROM public.sales_niches WHERE slug = 'high-ticket-sales'
ON CONFLICT DO NOTHING;

INSERT INTO public.form_template_presets (niche_id, name, description, category, icon, fields)
SELECT id, 'Deal Pipeline Update', 'Update deal status, value, and next steps', 'Deal Management', 'TrendingUp',
'[
  {"field_label": "Deal Name", "field_type": "text", "is_required": true, "glossary_term_key": "entity.deal"},
  {"field_label": "Deal Stage", "field_type": "select", "is_required": true, "options": ["Prospecting", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"]},
  {"field_label": "Deal Value", "field_type": "number", "is_required": true, "glossary_term_key": "metrics.acv"},
  {"field_label": "Next Steps", "field_type": "textarea", "is_required": true},
  {"field_label": "Expected Close Date", "field_type": "date", "is_required": false}
]'::jsonb
FROM public.sales_niches WHERE slug = 'high-ticket-sales'
ON CONFLICT DO NOTHING;

INSERT INTO public.form_template_presets (niche_id, name, description, category, icon, fields)
SELECT id, 'Lead Qualification Form', 'Qualify new leads with contact info and interest level', 'Lead Management', 'UserCheck',
'[
  {"field_label": "Contact Name", "field_type": "text", "is_required": true, "glossary_term_key": "entity.contact"},
  {"field_label": "Company", "field_type": "text", "is_required": true},
  {"field_label": "Email", "field_type": "email", "is_required": true},
  {"field_label": "Phone", "field_type": "tel", "is_required": false},
  {"field_label": "Lead Source", "field_type": "select", "is_required": true, "options": ["Website", "Referral", "Cold Outreach", "Event", "Partner"]},
  {"field_label": "Interest Level", "field_type": "select", "is_required": true, "options": ["Cold", "Warm", "Hot"]},
  {"field_label": "Budget Range", "field_type": "text", "is_required": false},
  {"field_label": "Notes", "field_type": "textarea", "is_required": false}
]'::jsonb
FROM public.sales_niches WHERE slug = 'high-ticket-sales'
ON CONFLICT DO NOTHING;

INSERT INTO public.form_template_presets (niche_id, name, description, category, icon, fields)
SELECT id, 'Weekly Performance Report', 'Summarize weekly metrics, wins, and challenges', 'Reporting', 'BarChart3',
'[
  {"field_label": "Week Starting", "field_type": "date", "is_required": true},
  {"field_label": "Total Calls", "field_type": "number", "is_required": true, "glossary_term_key": "activity.call"},
  {"field_label": "Demos Completed", "field_type": "number", "is_required": true, "glossary_term_key": "activity.demo"},
  {"field_label": "Deals Closed", "field_type": "number", "is_required": true, "glossary_term_key": "entity.deal"},
  {"field_label": "Revenue Generated", "field_type": "number", "is_required": true, "glossary_term_key": "metrics.acv"},
  {"field_label": "Conversion Rate", "field_type": "number", "is_required": false, "glossary_term_key": "metrics.conversion_rate"},
  {"field_label": "Key Wins", "field_type": "textarea", "is_required": false},
  {"field_label": "Challenges", "field_type": "textarea", "is_required": false}
]'::jsonb
FROM public.sales_niches WHERE slug = 'high-ticket-sales'
ON CONFLICT DO NOTHING;

-- SaaS Sales Form Templates
INSERT INTO public.form_template_presets (niche_id, name, description, category, icon, fields)
SELECT id, 'Demo Debrief', 'Record demo outcomes, interest level, and objections', 'Demo Management', 'Presentation',
'[
  {"field_label": "Company Name", "field_type": "text", "is_required": true, "glossary_term_key": "entity.contact"},
  {"field_label": "Demo Date", "field_type": "date", "is_required": true},
  {"field_label": "Attendees", "field_type": "text", "is_required": true},
  {"field_label": "Demo Type", "field_type": "select", "is_required": true, "options": ["Discovery", "Product Demo", "Technical Deep Dive", "Executive Briefing"]},
  {"field_label": "Interest Level", "field_type": "select", "is_required": true, "options": ["Low", "Medium", "High"]},
  {"field_label": "Key Objections", "field_type": "textarea", "is_required": false},
  {"field_label": "Next Steps", "field_type": "textarea", "is_required": true},
  {"field_label": "Follow-up Date", "field_type": "date", "is_required": false}
]'::jsonb
FROM public.sales_niches WHERE slug = 'saas-sales'
ON CONFLICT DO NOTHING;

INSERT INTO public.form_template_presets (niche_id, name, description, category, icon, fields)
SELECT id, 'Trial Conversion Tracker', 'Monitor trial status and engagement metrics', 'Customer Success', 'Users',
'[
  {"field_label": "Company Name", "field_type": "text", "is_required": true, "glossary_term_key": "entity.contact"},
  {"field_label": "Trial Start Date", "field_type": "date", "is_required": true},
  {"field_label": "Trial Status", "field_type": "select", "is_required": true, "options": ["Active", "At Risk", "Engaged", "Converted", "Churned"]},
  {"field_label": "Login Frequency", "field_type": "select", "is_required": false, "options": ["Daily", "Weekly", "Rarely", "Never"]},
  {"field_label": "Features Used", "field_type": "textarea", "is_required": false},
  {"field_label": "Engagement Score", "field_type": "number", "is_required": false},
  {"field_label": "Conversion Likelihood", "field_type": "select", "is_required": true, "options": ["Low", "Medium", "High"]},
  {"field_label": "Notes", "field_type": "textarea", "is_required": false}
]'::jsonb
FROM public.sales_niches WHERE slug = 'saas-sales'
ON CONFLICT DO NOTHING;

INSERT INTO public.form_template_presets (niche_id, name, description, category, icon, fields)
SELECT id, 'MRR Update Form', 'Track monthly recurring revenue changes', 'Revenue Tracking', 'DollarSign',
'[
  {"field_label": "Month", "field_type": "date", "is_required": true},
  {"field_label": "New MRR", "field_type": "number", "is_required": true, "glossary_term_key": "metrics.acv"},
  {"field_label": "Expansion MRR", "field_type": "number", "is_required": false},
  {"field_label": "Churned MRR", "field_type": "number", "is_required": false},
  {"field_label": "Net New MRR", "field_type": "number", "is_required": true},
  {"field_label": "Total MRR", "field_type": "number", "is_required": true},
  {"field_label": "New Customers", "field_type": "number", "is_required": false},
  {"field_label": "Churned Customers", "field_type": "number", "is_required": false},
  {"field_label": "Notes", "field_type": "textarea", "is_required": false}
]'::jsonb
FROM public.sales_niches WHERE slug = 'saas-sales'
ON CONFLICT DO NOTHING;

-- Dentistry Form Templates
INSERT INTO public.form_template_presets (niche_id, name, description, category, icon, fields)
SELECT id, 'Patient Intake Form', 'Collect new patient information and medical history', 'Patient Management', 'ClipboardPlus',
'[
  {"field_label": "Patient Name", "field_type": "text", "is_required": true, "glossary_term_key": "entity.contact"},
  {"field_label": "Date of Birth", "field_type": "date", "is_required": true},
  {"field_label": "Phone Number", "field_type": "tel", "is_required": true},
  {"field_label": "Email", "field_type": "email", "is_required": true},
  {"field_label": "Emergency Contact", "field_type": "text", "is_required": true},
  {"field_label": "Insurance Provider", "field_type": "text", "is_required": false},
  {"field_label": "Medical Conditions", "field_type": "textarea", "is_required": false},
  {"field_label": "Current Medications", "field_type": "textarea", "is_required": false},
  {"field_label": "Reason for Visit", "field_type": "textarea", "is_required": true}
]'::jsonb
FROM public.sales_niches WHERE slug = 'dentistry'
ON CONFLICT DO NOTHING;

INSERT INTO public.form_template_presets (niche_id, name, description, category, icon, fields)
SELECT id, 'Daily Treatment Log', 'Record procedures and treatments completed', 'Daily Reporting', 'FileText',
'[
  {"field_label": "Date", "field_type": "date", "is_required": true},
  {"field_label": "Patient Name", "field_type": "text", "is_required": true, "glossary_term_key": "entity.contact"},
  {"field_label": "Procedure Type", "field_type": "select", "is_required": true, "options": ["Cleaning", "Filling", "Crown", "Root Canal", "Extraction", "Whitening", "Other"]},
  {"field_label": "Tooth Number", "field_type": "text", "is_required": false},
  {"field_label": "Treatment Notes", "field_type": "textarea", "is_required": true},
  {"field_label": "Follow-up Required", "field_type": "checkbox", "is_required": false},
  {"field_label": "Next Appointment", "field_type": "date", "is_required": false}
]'::jsonb
FROM public.sales_niches WHERE slug = 'dentistry'
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- Add generic form templates for all niches
-- ==============================================================================

DO $$
DECLARE
  niche_record RECORD;
BEGIN
  FOR niche_record IN SELECT id FROM public.sales_niches LOOP
    -- Daily Activity Log (generic version)
    INSERT INTO public.form_template_presets (niche_id, name, description, category, icon, fields)
    VALUES (
      niche_record.id,
      'Daily Activity Log',
      'Track daily sales activities',
      'Daily Reporting',
      'CalendarCheck',
      '[
        {"field_label": "Date", "field_type": "date", "is_required": true},
        {"field_label": "Calls Made", "field_type": "number", "is_required": true},
        {"field_label": "Emails Sent", "field_type": "number", "is_required": true},
        {"field_label": "Meetings Held", "field_type": "number", "is_required": true},
        {"field_label": "Notes", "field_type": "textarea", "is_required": false}
      ]'::jsonb
    ) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
