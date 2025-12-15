-- Remove duplicate niche roles that were created by mistake
DELETE FROM niche_roles 
WHERE niche_id = 'f1e2d3c4-b5a6-7890-1234-567890abcdef' 
  AND slug IN ('high-ticket-admin', 'high-ticket-sales-rep')
  AND is_system_role = false;