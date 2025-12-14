-- User Profiles and Client Membership
-- Creates user_profiles table for role management and client_members for multi-tenant access

-- =============================================================================
-- USER PROFILES: Track user roles and profile information
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'client_user' CHECK (role IN ('agency_admin', 'client_user')),
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- RLS Policies for user_profiles
-- Users can view their own profile
CREATE POLICY user_profiles_select_own ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Agency admins can view all profiles
CREATE POLICY user_profiles_select_admin ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() AND up.role = 'agency_admin'
    )
  );

-- Users can update their own profile (but not role)
CREATE POLICY user_profiles_update_own ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Only agency admins can insert profiles (for invites)
CREATE POLICY user_profiles_insert_admin ON public.user_profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() AND up.role = 'agency_admin'
    )
    OR auth.uid() = id -- Allow self-insert on signup
  );

-- =============================================================================
-- CLIENT MEMBERS: Link users to clients (many-to-many)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.client_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_at timestamptz,
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, user_id)
);

ALTER TABLE public.client_members ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_members_client ON public.client_members(client_id);
CREATE INDEX IF NOT EXISTS idx_client_members_user ON public.client_members(user_id);
CREATE INDEX IF NOT EXISTS idx_client_members_role ON public.client_members(role);

-- RLS Policies for client_members
-- Users can view their own memberships
CREATE POLICY client_members_select_own ON public.client_members
  FOR SELECT USING (auth.uid() = user_id);

-- Agency admins can view all memberships
CREATE POLICY client_members_select_admin ON public.client_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() AND up.role = 'agency_admin'
    )
  );

-- Client owners/admins can view members of their clients
CREATE POLICY client_members_select_client_admin ON public.client_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.client_members cm 
      WHERE cm.client_id = client_members.client_id 
        AND cm.user_id = auth.uid() 
        AND cm.role IN ('owner', 'admin')
    )
  );

-- Agency admins can insert/update/delete memberships
CREATE POLICY client_members_insert_admin ON public.client_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() AND up.role = 'agency_admin'
    )
  );

CREATE POLICY client_members_update_admin ON public.client_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() AND up.role = 'agency_admin'
    )
  );

CREATE POLICY client_members_delete_admin ON public.client_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() AND up.role = 'agency_admin'
    )
  );

-- =============================================================================
-- HELPER FUNCTIONS for RLS
-- =============================================================================

-- Check if current user is an agency admin
CREATE OR REPLACE FUNCTION public.is_agency_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'agency_admin'
  );
$$;

-- Check if current user can access a specific client
CREATE OR REPLACE FUNCTION public.can_access_client(target_client_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    public.is_agency_admin() 
    OR EXISTS (
      SELECT 1 FROM public.client_members 
      WHERE client_id = target_client_id AND user_id = auth.uid()
    );
$$;

-- Get user's role for a specific client
CREATE OR REPLACE FUNCTION public.get_client_role(target_client_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.client_members 
     WHERE client_id = target_client_id AND user_id = auth.uid()),
    CASE WHEN public.is_agency_admin() THEN 'agency_admin' ELSE NULL END
  );
$$;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Updated at trigger for user_profiles
CREATE OR REPLACE FUNCTION public.update_user_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_user_profiles_updated_at();

-- Updated at trigger for client_members
CREATE OR REPLACE FUNCTION public.update_client_members_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_client_members_updated_at ON public.client_members;
CREATE TRIGGER trigger_client_members_updated_at
  BEFORE UPDATE ON public.client_members
  FOR EACH ROW EXECUTE FUNCTION public.update_client_members_updated_at();

-- =============================================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================================================

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role, display_name)
  VALUES (
    NEW.id,
    'client_user', -- Default role, can be upgraded by admin
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- REALTIME
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_members;

-- Comments
COMMENT ON TABLE public.user_profiles IS 'User profile and role information';
COMMENT ON TABLE public.client_members IS 'Links users to clients they can access';
COMMENT ON FUNCTION public.is_agency_admin() IS 'Check if current user is an agency admin';
COMMENT ON FUNCTION public.can_access_client(uuid) IS 'Check if current user can access a specific client';

