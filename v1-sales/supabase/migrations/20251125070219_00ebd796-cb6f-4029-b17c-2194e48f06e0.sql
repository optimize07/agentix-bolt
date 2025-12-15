-- Add high-ticket sales glossary terms
INSERT INTO glossary_terms (term_key, default_label, category, description, niche_id, display_order)
SELECT 
  'metric.sets', 
  'Sets', 
  'Performance Metrics',
  'Scheduled appointments set by lead generation team',
  id,
  100
FROM niches 
WHERE slug = 'high-ticket-sales' OR organizational_type = 'Sales'
ON CONFLICT (term_key, niche_id) DO NOTHING;

INSERT INTO glossary_terms (term_key, default_label, category, description, niche_id, display_order)
SELECT 
  'metric.conversations', 
  'Conversations', 
  'Performance Metrics',
  'Total sales conversations conducted',
  id,
  101
FROM niches 
WHERE slug = 'high-ticket-sales' OR organizational_type = 'Sales'
ON CONFLICT (term_key, niche_id) DO NOTHING;

INSERT INTO glossary_terms (term_key, default_label, category, description, niche_id, display_order)
SELECT 
  'metric.triages', 
  'Triages', 
  'Performance Metrics',
  'Initial qualification conversations',
  id,
  102
FROM niches 
WHERE slug = 'high-ticket-sales' OR organizational_type = 'Sales'
ON CONFLICT (term_key, niche_id) DO NOTHING;

INSERT INTO glossary_terms (term_key, default_label, category, description, niche_id, display_order)
SELECT 
  'role.setter', 
  'Setter', 
  'Team Roles',
  'Sets appointments for closers',
  id,
  200
FROM niches 
WHERE slug = 'high-ticket-sales' OR organizational_type = 'Sales'
ON CONFLICT (term_key, niche_id) DO NOTHING;

INSERT INTO glossary_terms (term_key, default_label, category, description, niche_id, display_order)
SELECT 
  'role.closer', 
  'Closer', 
  'Team Roles',
  'Closes high-ticket deals',
  id,
  201
FROM niches 
WHERE slug = 'high-ticket-sales' OR organizational_type = 'Sales'
ON CONFLICT (term_key, niche_id) DO NOTHING;

-- Create form_templates table
CREATE TABLE form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_form_templates_org ON form_templates(organization_id);
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view forms in their org"
  ON form_templates FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage forms"
  ON form_templates FOR ALL
  USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND user_has_permission(auth.uid(), organization_id, 'forms.manage')
  );

-- Create form_fields table
CREATE TABLE form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_template_id uuid NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
  glossary_term_id uuid REFERENCES glossary_terms(id),
  field_label text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'select', 'textarea', 'checkbox')),
  is_required boolean DEFAULT false,
  placeholder text,
  default_value text,
  validation_rules jsonb,
  options jsonb,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_form_fields_template ON form_fields(form_template_id);
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view fields for their org forms"
  ON form_fields FOR SELECT
  USING (form_template_id IN (
    SELECT id FROM form_templates 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Admins can manage fields"
  ON form_fields FOR ALL
  USING (
    form_template_id IN (
      SELECT id FROM form_templates 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
    AND EXISTS (
      SELECT 1 FROM form_templates ft
      WHERE ft.id = form_template_id
      AND user_has_permission(auth.uid(), ft.organization_id, 'forms.manage')
    )
  );

-- Create form_role_assignments table
CREATE TABLE form_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_template_id uuid NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES niche_roles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(form_template_id, role_id)
);

CREATE INDEX idx_form_role_form ON form_role_assignments(form_template_id);
CREATE INDEX idx_form_role_role ON form_role_assignments(role_id);
ALTER TABLE form_role_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view role assignments"
  ON form_role_assignments FOR SELECT
  USING (form_template_id IN (
    SELECT id FROM form_templates 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Admins can manage role assignments"
  ON form_role_assignments FOR ALL
  USING (
    form_template_id IN (
      SELECT id FROM form_templates 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
    AND EXISTS (
      SELECT 1 FROM form_templates ft
      WHERE ft.id = form_template_id
      AND user_has_permission(auth.uid(), ft.organization_id, 'forms.manage')
    )
  );

-- Create form_submissions table
CREATE TABLE form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_template_id uuid NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  submission_data jsonb NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_form_submissions_template ON form_submissions(form_template_id);
CREATE INDEX idx_form_submissions_user ON form_submissions(user_id);
CREATE INDEX idx_form_submissions_org ON form_submissions(organization_id);
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own submissions"
  ON form_submissions FOR SELECT
  USING (
    user_id = auth.uid() 
    OR (
      organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
      AND user_has_permission(auth.uid(), organization_id, 'forms.view_all')
    )
  );

CREATE POLICY "Users can create submissions for their forms"
  ON form_submissions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their own submissions"
  ON form_submissions FOR UPDATE
  USING (user_id = auth.uid());

-- Update permissions for forms management
UPDATE niche_roles 
SET permissions = permissions || '{"forms": {"manage": true, "view_all": true}}'::jsonb
WHERE slug = 'admin';

UPDATE niche_roles 
SET permissions = permissions || '{"forms": {"manage": false, "view_all": true}}'::jsonb
WHERE slug = 'manager';

UPDATE niche_roles 
SET permissions = permissions || '{"forms": {"manage": false, "view_all": false}}'::jsonb
WHERE slug = 'member';