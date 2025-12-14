-- Purpose: Promote all existing users to agency admins so they have the same
-- access level as the seeded admin@admin.com account, including visibility
-- across all clients via is_agency_admin() checks in RLS.

-- Promote every current profile to agency_admin
UPDATE public.user_profiles
SET role = 'agency_admin'
WHERE role <> 'agency_admin';

