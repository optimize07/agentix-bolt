-- Create organization_form_template_presets junction table
CREATE TABLE organization_form_template_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  form_template_preset_id UUID REFERENCES form_template_presets(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, form_template_preset_id)
);

-- Enable RLS
ALTER TABLE organization_form_template_presets ENABLE ROW LEVEL SECURITY;

-- Users can view their org's presets
CREATE POLICY "Users can view their org's presets"
  ON organization_form_template_presets FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Users can manage their org's presets
CREATE POLICY "Users can manage their org's presets"
  ON organization_form_template_presets FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));