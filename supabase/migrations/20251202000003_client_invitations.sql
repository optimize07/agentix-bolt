-- Client Invitations System
-- Tracks invitation state for client user onboarding

-- =============================================================================
-- CLIENT INVITATIONS: Track invite status and tokens
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.client_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  email text NOT NULL,
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  message text, -- Optional personal message from inviter
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_invitations ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_invitations_client ON public.client_invitations(client_id);
CREATE INDEX IF NOT EXISTS idx_client_invitations_email ON public.client_invitations(email);
CREATE INDEX IF NOT EXISTS idx_client_invitations_token ON public.client_invitations(token);
CREATE INDEX IF NOT EXISTS idx_client_invitations_status ON public.client_invitations(status);
CREATE INDEX IF NOT EXISTS idx_client_invitations_expires ON public.client_invitations(expires_at) WHERE status = 'pending';

-- RLS Policies
-- Agency admins can see all invitations
CREATE POLICY client_invitations_select_admin ON public.client_invitations
  FOR SELECT USING (public.is_agency_admin());

-- Client owners/admins can see invitations for their clients
CREATE POLICY client_invitations_select_client_admin ON public.client_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.client_members cm
      WHERE cm.client_id = client_invitations.client_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
  );

-- Users can see invitations sent to their email (for accepting)
CREATE POLICY client_invitations_select_own_email ON public.client_invitations
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Agency admins can create invitations
CREATE POLICY client_invitations_insert_admin ON public.client_invitations
  FOR INSERT WITH CHECK (public.is_agency_admin());

-- Client admins can create invitations for their clients
CREATE POLICY client_invitations_insert_client_admin ON public.client_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.client_members cm
      WHERE cm.client_id = client_invitations.client_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
  );

-- Agency admins can update invitations
CREATE POLICY client_invitations_update_admin ON public.client_invitations
  FOR UPDATE USING (public.is_agency_admin());

-- Allow updating invitation status when accepting (by the invited user)
CREATE POLICY client_invitations_update_accept ON public.client_invitations
  FOR UPDATE USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending'
  )
  WITH CHECK (
    status IN ('accepted', 'pending') -- Can only change to accepted
  );

-- Agency admins can delete invitations
CREATE POLICY client_invitations_delete_admin ON public.client_invitations
  FOR DELETE USING (public.is_agency_admin());

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Validate and get invitation by token (public for signup flow)
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token text)
RETURNS TABLE (
  id uuid,
  client_id uuid,
  client_name text,
  client_slug text,
  email text,
  role text,
  message text,
  status text,
  expires_at timestamptz,
  is_valid boolean
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    ci.id,
    ci.client_id,
    c.name as client_name,
    c.slug as client_slug,
    ci.email,
    ci.role,
    ci.message,
    ci.status,
    ci.expires_at,
    (ci.status = 'pending' AND ci.expires_at > now()) as is_valid
  FROM public.client_invitations ci
  JOIN public.clients c ON c.id = ci.client_id
  WHERE ci.token = p_token;
$$;

-- Accept invitation and create membership
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation record;
  v_user_id uuid;
  v_user_email text;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get user email
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  
  -- Get and validate invitation
  SELECT * INTO v_invitation
  FROM public.client_invitations
  WHERE token = p_token;
  
  IF v_invitation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid invitation token');
  END IF;
  
  IF v_invitation.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation has already been ' || v_invitation.status);
  END IF;
  
  IF v_invitation.expires_at < now() THEN
    -- Mark as expired
    UPDATE public.client_invitations 
    SET status = 'expired', updated_at = now()
    WHERE id = v_invitation.id;
    RETURN jsonb_build_object('success', false, 'error', 'Invitation has expired');
  END IF;
  
  IF lower(v_invitation.email) != lower(v_user_email) THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation was sent to a different email address');
  END IF;
  
  -- Create client membership
  INSERT INTO public.client_members (client_id, user_id, role, invited_at, joined_at)
  VALUES (v_invitation.client_id, v_user_id, v_invitation.role, v_invitation.created_at, now())
  ON CONFLICT (client_id, user_id) DO UPDATE
  SET role = EXCLUDED.role, joined_at = now(), updated_at = now();
  
  -- Mark invitation as accepted
  UPDATE public.client_invitations
  SET 
    status = 'accepted',
    accepted_at = now(),
    accepted_by = v_user_id,
    updated_at = now()
  WHERE id = v_invitation.id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'client_id', v_invitation.client_id,
    'role', v_invitation.role
  );
END;
$$;

-- Create invitation (with duplicate check)
CREATE OR REPLACE FUNCTION public.create_client_invitation(
  p_client_id uuid,
  p_email text,
  p_role text DEFAULT 'member',
  p_message text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_pending record;
  v_existing_member record;
  v_new_invitation record;
BEGIN
  -- Check if user is authorized
  IF NOT public.is_agency_admin() AND NOT EXISTS (
    SELECT 1 FROM public.client_members 
    WHERE client_id = p_client_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized to invite users to this client');
  END IF;
  
  -- Check for existing membership
  SELECT cm.* INTO v_existing_member
  FROM public.client_members cm
  JOIN auth.users u ON u.id = cm.user_id
  WHERE cm.client_id = p_client_id AND lower(u.email) = lower(p_email);
  
  IF v_existing_member IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User is already a member of this client');
  END IF;
  
  -- Check for existing pending invitation
  SELECT * INTO v_existing_pending
  FROM public.client_invitations
  WHERE client_id = p_client_id 
    AND lower(email) = lower(p_email) 
    AND status = 'pending'
    AND expires_at > now();
  
  IF v_existing_pending IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'A pending invitation already exists for this email',
      'invitation_id', v_existing_pending.id
    );
  END IF;
  
  -- Revoke any old pending invitations
  UPDATE public.client_invitations
  SET status = 'revoked', updated_at = now()
  WHERE client_id = p_client_id 
    AND lower(email) = lower(p_email) 
    AND status = 'pending';
  
  -- Create new invitation
  INSERT INTO public.client_invitations (client_id, email, invited_by, role, message)
  VALUES (p_client_id, lower(p_email), auth.uid(), p_role, p_message)
  RETURNING * INTO v_new_invitation;
  
  RETURN jsonb_build_object(
    'success', true,
    'invitation_id', v_new_invitation.id,
    'token', v_new_invitation.token,
    'expires_at', v_new_invitation.expires_at
  );
END;
$$;

-- Revoke invitation
CREATE OR REPLACE FUNCTION public.revoke_invitation(p_invitation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation record;
BEGIN
  SELECT * INTO v_invitation FROM public.client_invitations WHERE id = p_invitation_id;
  
  IF v_invitation IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check authorization
  IF NOT public.is_agency_admin() AND NOT EXISTS (
    SELECT 1 FROM public.client_members 
    WHERE client_id = v_invitation.client_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
  ) THEN
    RETURN false;
  END IF;
  
  UPDATE public.client_invitations
  SET status = 'revoked', updated_at = now()
  WHERE id = p_invitation_id AND status = 'pending';
  
  RETURN true;
END;
$$;

-- Auto-expire old invitations (can be called by cron)
CREATE OR REPLACE FUNCTION public.expire_old_invitations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.client_invitations
  SET status = 'expired', updated_at = now()
  WHERE status = 'pending' AND expires_at < now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_client_invitations_updated_at()
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

DROP TRIGGER IF EXISTS trigger_client_invitations_updated_at ON public.client_invitations;
CREATE TRIGGER trigger_client_invitations_updated_at
  BEFORE UPDATE ON public.client_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_client_invitations_updated_at();

-- =============================================================================
-- REALTIME
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_invitations;

-- Comments
COMMENT ON TABLE public.client_invitations IS 'Tracks invitations for client user onboarding';
COMMENT ON FUNCTION public.get_invitation_by_token(text) IS 'Validate and retrieve invitation details by token';
COMMENT ON FUNCTION public.accept_invitation(text) IS 'Accept invitation and create client membership';
COMMENT ON FUNCTION public.create_client_invitation(uuid, text, text, text) IS 'Create a new client invitation';

