-- Insert new sales process models
INSERT INTO sales_processes (name, slug, niche_id, stages, is_default) VALUES
  ('1 Call Close', 'one-call-close', 
   (SELECT id FROM niches WHERE slug = 'online-sales'), 
   '[
     {"id": 1, "name": "Discovery", "order": 1, "color": "#3b82f6"},
     {"id": 2, "name": "Presentation", "order": 2, "color": "#8b5cf6"},
     {"id": 3, "name": "Close", "order": 3, "color": "#22c55e"}
   ]'::jsonb, 
   false),
   
  ('2 Call Close', 'two-call-close',
   (SELECT id FROM niches WHERE slug = 'online-sales'),
   '[
     {"id": 1, "name": "Discovery Call", "order": 1, "color": "#3b82f6"},
     {"id": 2, "name": "Follow-up Scheduled", "order": 2, "color": "#f59e0b"},
     {"id": 3, "name": "Presentation Call", "order": 3, "color": "#8b5cf6"},
     {"id": 4, "name": "Close", "order": 4, "color": "#22c55e"}
   ]'::jsonb,
   false),
   
  ('VSL Funnel', 'vsl-funnel',
   (SELECT id FROM niches WHERE slug = 'online-sales'),
   '[
     {"id": 1, "name": "VSL View", "order": 1, "color": "#3b82f6"},
     {"id": 2, "name": "Application", "order": 2, "color": "#8b5cf6"},
     {"id": 3, "name": "Qualification", "order": 3, "color": "#f59e0b"},
     {"id": 4, "name": "Booking Call", "order": 4, "color": "#22c55e"}
   ]'::jsonb,
   false),
   
  ('Inbound Lead Flow', 'inbound-flow',
   (SELECT id FROM niches WHERE slug = 'online-sales'),
   '[
     {"id": 1, "name": "Lead Captured", "order": 1, "color": "#3b82f6"},
     {"id": 2, "name": "Contacted", "order": 2, "color": "#8b5cf6"},
     {"id": 3, "name": "Qualified", "order": 3, "color": "#f59e0b"},
     {"id": 4, "name": "Proposal Sent", "order": 4, "color": "#22c55e"},
     {"id": 5, "name": "Closed Won", "order": 5, "color": "#10b981"}
   ]'::jsonb,
   false),
   
  ('Reception Desk', 'reception-desk',
   (SELECT id FROM niches WHERE slug = 'online-sales'),
   '[
     {"id": 1, "name": "Walk-in", "order": 1, "color": "#3b82f6"},
     {"id": 2, "name": "Greeted", "order": 2, "color": "#8b5cf6"},
     {"id": 3, "name": "Consultation", "order": 3, "color": "#f59e0b"},
     {"id": 4, "name": "Appointment Set", "order": 4, "color": "#22c55e"}
   ]'::jsonb,
   false),
   
  ('At-Home Check', 'at-home-check',
   (SELECT id FROM niches WHERE slug = 'online-sales'),
   '[
     {"id": 1, "name": "Appointment Scheduled", "order": 1, "color": "#3b82f6"},
     {"id": 2, "name": "Site Visit", "order": 2, "color": "#8b5cf6"},
     {"id": 3, "name": "Proposal Created", "order": 3, "color": "#f59e0b"},
     {"id": 4, "name": "Follow-up", "order": 4, "color": "#f59e0b"},
     {"id": 5, "name": "Contract Signed", "order": 5, "color": "#22c55e"}
   ]'::jsonb,
   false);

-- Create new junction table for many-to-many relationship
CREATE TABLE organization_sales_processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sales_process_id uuid NOT NULL REFERENCES sales_processes(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, sales_process_id)
);

-- Enable RLS
ALTER TABLE organization_sales_processes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their org sales processes"
  ON organization_sales_processes FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can manage their org sales processes"
  ON organization_sales_processes FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND user_has_permission(auth.uid(), organization_id, 'organization.manage')
  );

-- Migrate existing data from organization_sales_process
INSERT INTO organization_sales_processes (organization_id, sales_process_id)
SELECT organization_id, sales_process_id 
FROM organization_sales_process
ON CONFLICT DO NOTHING;