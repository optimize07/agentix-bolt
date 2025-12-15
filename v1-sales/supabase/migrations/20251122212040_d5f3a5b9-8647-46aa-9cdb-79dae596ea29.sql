-- Add RLS policies for organization_integrations
CREATE POLICY "Users can create integrations for their org"
ON organization_integrations FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
  AND user_has_permission(auth.uid(), organization_id, 'integrations.manage')
);

CREATE POLICY "Users can update integrations in their org"
ON organization_integrations FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
  AND user_has_permission(auth.uid(), organization_id, 'integrations.manage')
);

CREATE POLICY "Users can delete integrations in their org"
ON organization_integrations FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
  AND user_has_permission(auth.uid(), organization_id, 'integrations.manage')
);

-- Add RLS policies for integration_field_mappings
CREATE POLICY "Users can create field mappings for their org integrations"
ON integration_field_mappings FOR INSERT
TO authenticated
WITH CHECK (
  integration_id IN (
    SELECT id FROM organization_integrations
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update field mappings for their org integrations"
ON integration_field_mappings FOR UPDATE
TO authenticated
USING (
  integration_id IN (
    SELECT id FROM organization_integrations
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete field mappings for their org integrations"
ON integration_field_mappings FOR DELETE
TO authenticated
USING (
  integration_id IN (
    SELECT id FROM organization_integrations
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Add RLS policy for viewing shared dashboards
CREATE POLICY "Users can view shared dashboards in their org"
ON dashboard_layouts FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
  AND (
    user_id = auth.uid() OR  -- Own dashboards
    user_id IS NULL OR       -- Shared dashboards
    is_default = true        -- Organization defaults
  )
);

-- Drop the old SELECT policy first
DROP POLICY IF EXISTS "Users can view dashboards in their org" ON dashboard_layouts;

-- Add RLS policies for organizations management
CREATE POLICY "Users can update their organization"
ON organizations FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
  AND user_has_permission(auth.uid(), id, 'organization.manage')
);

-- Insert new glossary terms for Phase 2C
INSERT INTO glossary_terms (niche_id, term_key, default_label, category, description)
SELECT 
  n.id,
  terms.term_key,
  terms.default_label,
  terms.category,
  terms.description
FROM niches n
CROSS JOIN (
  VALUES
    -- Integrations
    ('integrations.title', 'CRM Integrations', 'integrations', 'Title for integrations management'),
    ('integrations.description', 'Connect to GoHighLevel, HubSpot, Salesforce, and other CRM platforms', 'integrations', 'Description for integrations'),
    ('integrations.connect', 'Connect', 'integrations', 'Button to connect an integration'),
    ('integrations.disconnect', 'Disconnect', 'integrations', 'Button to disconnect an integration'),
    ('integrations.connected', 'Connected', 'integrations', 'Status label for connected integration'),
    ('integrations.configure', 'Configure', 'integrations', 'Button to configure integration'),
    ('integrations.sync_now', 'Sync Now', 'integrations', 'Button to trigger manual sync'),
    ('integrations.last_sync', 'Last Synced', 'integrations', 'Label for last sync time'),
    ('integrations.field_mapping', 'Field Mapping', 'integrations', 'Title for field mapping section'),
    ('integrations.api_key', 'API Key', 'integrations', 'Label for API key input'),
    ('integrations.oauth', 'OAuth Connection', 'integrations', 'Label for OAuth connection'),
    
    -- Dashboard Sharing
    ('dashboard.share', 'Share Dashboard', 'dashboard', 'Title for share dialog'),
    ('dashboard.share_with', 'Share With', 'dashboard', 'Label for sharing options'),
    ('dashboard.personal', 'Personal Dashboard', 'dashboard', 'Label for personal dashboard'),
    ('dashboard.team', 'Shared with Team', 'dashboard', 'Label for team-shared dashboard'),
    ('dashboard.org_default', 'Organization Default', 'dashboard', 'Label for org default dashboard'),
    ('dashboard.access_level', 'Access Level', 'dashboard', 'Label for access level'),
    ('dashboard.view_only', 'View Only', 'dashboard', 'View only access level'),
    ('dashboard.can_edit', 'Can Edit', 'dashboard', 'Edit access level'),
    ('dashboard.shared_by', 'Shared by', 'dashboard', 'Label showing who shared'),
    ('dashboard.switch', 'Switch Dashboard', 'dashboard', 'Button to switch dashboards'),
    
    -- Organization Management
    ('organization.title', 'Organization Management', 'organization', 'Title for org management page'),
    ('organization.details', 'Organization Details', 'organization', 'Section title for org details'),
    ('organization.members', 'Members', 'organization', 'Section title for members'),
    ('organization.units', 'Organizational Units', 'organization', 'Section title for units'),
    ('organization.settings', 'Organization Settings', 'organization', 'Title for org settings'),
    ('organization.name', 'Organization Name', 'organization', 'Label for org name'),
    ('organization.niche', 'Industry/Niche', 'organization', 'Label for org niche'),
    ('organization.created', 'Created', 'organization', 'Label for creation date'),
    ('organization.member_count', 'Total Members', 'organization', 'Label for member count'),
    ('organization.archive', 'Archive Organization', 'organization', 'Button to archive org'),
    ('organization.delete', 'Delete Organization', 'organization', 'Button to delete org'),
    
    -- Permissions
    ('permission.integrations_manage', 'Manage Integrations', 'permissions', 'Permission to manage integrations'),
    ('permission.organization_manage', 'Manage Organization', 'permissions', 'Permission to manage organization'),
    ('permission.dashboard_share', 'Share Dashboards', 'permissions', 'Permission to share dashboards')
) AS terms(term_key, default_label, category, description)
WHERE n.is_system_template = true
ON CONFLICT (niche_id, term_key) DO NOTHING;