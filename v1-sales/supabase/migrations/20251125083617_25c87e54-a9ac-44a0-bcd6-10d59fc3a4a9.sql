-- Create roles for High Ticket Sales niche (using unique slugs)
INSERT INTO niche_roles (name, slug, niche_id, description, permissions, is_system_role)
VALUES 
  (
    'Admin',
    'high-ticket-admin',
    'f1e2d3c4-b5a6-7890-1234-567890abcdef',
    'Full administrative access to all features',
    '{"organization":{"manage":true,"delete":true},"users":{"manage":true,"view_all":true},"forms":{"manage":true,"view_all":true},"integrations":{"manage":true},"products":{"manage":true},"dashboards":{"manage":true}}'::jsonb,
    false
  ),
  (
    'Sales Manager',
    'high-ticket-sales-manager',
    'f1e2d3c4-b5a6-7890-1234-567890abcdef',
    'Manage sales team and view all data',
    '{"organization":{"manage":false,"delete":false},"users":{"manage":true,"view_all":true},"forms":{"manage":false,"view_all":true},"integrations":{"manage":false},"products":{"manage":true},"dashboards":{"manage":true}}'::jsonb,
    false
  ),
  (
    'Sales Rep',
    'high-ticket-sales-rep',
    'f1e2d3c4-b5a6-7890-1234-567890abcdef',
    'Basic sales representative access',
    '{"organization":{"manage":false,"delete":false},"users":{"manage":false,"view_all":false},"forms":{"manage":false,"view_all":false},"integrations":{"manage":false},"products":{"manage":false},"dashboards":{"manage":false}}'::jsonb,
    false
  );

-- Delete any existing role assignment for this user in this org (to avoid duplicates)
DELETE FROM user_roles 
WHERE user_id = '8f45d0fb-15b0-4ac8-b180-42993be801d0'
  AND organization_id = 'dd41a26e-2bff-4656-b80b-aa1dacbdc07a';

-- Assign Admin role to dev@test.com
INSERT INTO user_roles (user_id, organization_id, role_id)
SELECT 
  '8f45d0fb-15b0-4ac8-b180-42993be801d0'::uuid,
  'dd41a26e-2bff-4656-b80b-aa1dacbdc07a'::uuid,
  id
FROM niche_roles
WHERE slug = 'high-ticket-admin';