-- Create security definer function to get user's organization without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1;
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can view profiles in their org" ON public.profiles;

-- Create new non-recursive policy
CREATE POLICY "Users can view profiles in their org"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  organization_id = public.get_user_organization_id(auth.uid())
  OR id = auth.uid()
);