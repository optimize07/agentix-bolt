-- 1. Insert the new "Online Sales" niche
INSERT INTO niches (id, name, slug, description, organizational_type, is_system_template)
VALUES (
  'f1e2d3c4-b5a6-7890-1234-567890abcdef',
  'Online Sales',
  'online-sales',
  'E-commerce and online sales teams',
  'teams',
  true
);

-- 2. Create comprehensive glossary terms for Online Sales (50+ terms)
INSERT INTO glossary_terms (niche_id, term_key, default_label, category, description) VALUES
-- Navigation Terms
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'nav.dashboard', 'Dashboard', 'Navigation', 'Main dashboard view'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'nav.analytics', 'Analytics', 'Navigation', 'Analytics section'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'nav.actions', 'Actions', 'Navigation', 'Actions section'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'nav.data_entry', 'Data Entry', 'Navigation', 'Data entry section'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'nav.targets', 'Targets', 'Navigation', 'Targets section'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'nav.leaderboards', 'Leaderboards', 'Navigation', 'Leaderboards section'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'nav.settings', 'Settings', 'Navigation', 'Settings section'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'nav.organization', 'Organization', 'Navigation', 'Organization section'),

-- Settings Terms
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'settings.users', 'Users', 'Settings', 'User management'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'settings.products', 'Products', 'Settings', 'Product catalog'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'settings.customization', 'Customization', 'Settings', 'Customization options'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'settings.integrations', 'Integrations', 'Settings', 'Integration management'),

-- User Management Terms
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'users.team_members', 'Team Members', 'Users', 'Team members list'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'users.invite_user', 'Invite User', 'Users', 'Invite new user'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'users.role', 'Role', 'Users', 'User role'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'users.unit', 'Unit', 'Users', 'Organizational unit'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'users.manage', 'Manage Users', 'Users', 'User management permission'),

-- Product Terms
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'products.catalog', 'Product Catalog', 'Products', 'Product catalog'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'products.add_product', 'Add Product', 'Products', 'Add new product'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'products.variations', 'Variations', 'Products', 'Product variations'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'products.pricing', 'Pricing', 'Products', 'Product pricing'),

-- Dashboard Terms
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'dashboard.last_saved', 'Last saved', 'Dashboard', 'Last saved timestamp'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'dashboard.saving', 'Saving', 'Dashboard', 'Saving indicator'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'dashboard.unsaved_changes', 'Unsaved changes', 'Dashboard', 'Unsaved changes indicator'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'dashboard.add_component', 'Add Component', 'Dashboard', 'Add component button'),

-- Sales Terms
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'sales.lead', 'Lead', 'Sales', 'Sales lead'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'sales.prospect', 'Prospect', 'Sales', 'Sales prospect'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'sales.customer', 'Customer', 'Sales', 'Customer'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'sales.deal', 'Deal', 'Sales', 'Sales deal'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'sales.opportunity', 'Opportunity', 'Sales', 'Sales opportunity'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'sales.pipeline', 'Pipeline', 'Sales', 'Sales pipeline'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'sales.conversion', 'Conversion', 'Sales', 'Conversion rate'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'sales.revenue', 'Revenue', 'Sales', 'Revenue'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'sales.target', 'Target', 'Sales', 'Sales target'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'sales.quota', 'Quota', 'Sales', 'Sales quota'),

-- Action Terms
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'action.call', 'Call', 'Actions', 'Phone call'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'action.email', 'Email', 'Actions', 'Email'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'action.meeting', 'Meeting', 'Actions', 'Meeting'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'action.demo', 'Demo', 'Actions', 'Product demo'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'action.proposal', 'Proposal', 'Actions', 'Sales proposal'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'action.follow_up', 'Follow-up', 'Actions', 'Follow-up action'),

-- Organization Terms
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'organization.name', 'Organization', 'Organization', 'Organization name'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'organization.manage', 'Manage Organization', 'Organization', 'Organization management permission'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'organization.settings', 'Organization Settings', 'Organization', 'Organization settings'),

-- Integration Terms
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'integrations.manage', 'Manage Integrations', 'Integrations', 'Integration management permission'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'integrations.connected', 'Connected', 'Integrations', 'Integration status'),
('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'integrations.configure', 'Configure', 'Integrations', 'Configure integration');

-- 3. Update existing "General Business" organizations to use "Online Sales" instead
UPDATE organizations 
SET niche_id = 'f1e2d3c4-b5a6-7890-1234-567890abcdef'
WHERE niche_id = 'a161aa7d-7e7b-4f33-ac03-c58648d32843';

-- 4. Archive "General Business" since it has no terms
UPDATE niches 
SET is_system_template = false
WHERE id = 'a161aa7d-7e7b-4f33-ac03-c58648d32843';

-- 5. Update RLS policies for organizations
DROP POLICY IF EXISTS "Users can update their organization" ON organizations;
CREATE POLICY "Users can update their organization" ON organizations
FOR UPDATE TO authenticated
USING (
  id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  AND user_has_permission(auth.uid(), id, 'organization.manage'::text)
)
WITH CHECK (
  id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  AND user_has_permission(auth.uid(), id, 'organization.manage'::text)
);

-- 6. Add RLS policies for organization_sales_process
CREATE POLICY "Users can insert sales process for their org"
ON organization_sales_process FOR INSERT TO authenticated
WITH CHECK (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  AND user_has_permission(auth.uid(), organization_id, 'organization.manage'::text)
);

CREATE POLICY "Users can update sales process for their org"
ON organization_sales_process FOR UPDATE TO authenticated
USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  AND user_has_permission(auth.uid(), organization_id, 'organization.manage'::text)
);

CREATE POLICY "Users can delete sales process for their org"
ON organization_sales_process FOR DELETE TO authenticated
USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  AND user_has_permission(auth.uid(), organization_id, 'organization.manage'::text)
);

-- 7. Add RLS policies for organization_glossary_overrides
CREATE POLICY "Users can insert glossary overrides"
ON organization_glossary_overrides FOR INSERT TO authenticated
WITH CHECK (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can update glossary overrides"
ON organization_glossary_overrides FOR UPDATE TO authenticated
USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can delete glossary overrides"
ON organization_glossary_overrides FOR DELETE TO authenticated
USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);