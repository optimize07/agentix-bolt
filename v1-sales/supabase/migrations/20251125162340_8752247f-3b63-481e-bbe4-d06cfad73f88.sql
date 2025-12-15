-- Add missing niche_roles for High Ticket Sales niche
INSERT INTO niche_roles (niche_id, name, slug, description, is_system_role, permissions)
VALUES 
  ('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'Owner', 'owner', 'Full access to all features', true, 
   '{"dashboards":{"view":true,"edit":true,"delete":true},"forms":{"view_all":true,"manage":true},"users":{"view":true,"invite":true,"manage":true,"edit_roles":true},"integrations":{"view":true,"manage":true},"organization":{"view":true,"manage":true}}'::jsonb),
  ('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'Admin', 'admin', 'Administrative access', true,
   '{"dashboards":{"view":true,"edit":true},"forms":{"view_all":true,"manage":true},"users":{"view":true,"invite":true},"integrations":{"view":true},"organization":{"view":true}}'::jsonb),
  ('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'Sales Rep', 'sales_rep', 'Sales team member', true,
   '{"dashboards":{"view":true},"forms":{"view":true},"users":{"view":false},"integrations":{"view":false},"organization":{"view":false}}'::jsonb),
  ('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'Member', 'member', 'Standard team member', true,
   '{"dashboards":{"view":true},"forms":{"view":true},"users":{"view":false},"integrations":{"view":false},"organization":{"view":false}}'::jsonb)
ON CONFLICT (id) DO NOTHING;