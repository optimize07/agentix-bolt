-- Fix clients RLS policies
-- This migration only runs if the clients table exists (created in a later migration)

DO $$
BEGIN
  -- Only proceed if the clients table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'clients'
  ) THEN
    -- Drop all existing policies to start fresh
    DROP POLICY IF EXISTS clients_select_own ON public.clients;
    DROP POLICY IF EXISTS clients_select_all_active ON public.clients;
    DROP POLICY IF EXISTS clients_insert_own ON public.clients;
    DROP POLICY IF EXISTS clients_update_own ON public.clients;
    DROP POLICY IF EXISTS clients_delete_own ON public.clients;

    -- Create clean policies
    -- Allow all authenticated users to view active clients (agency-level access)
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'clients' AND policyname = 'clients_select_all_active'
    ) THEN
      CREATE POLICY clients_select_all_active ON public.clients
        FOR SELECT
        TO authenticated
        USING (is_active = true);
    END IF;

    -- Only allow users to create clients with their own user_id
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'clients' AND policyname = 'clients_insert_own'
    ) THEN
      CREATE POLICY clients_insert_own ON public.clients
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Only allow users to update their own clients
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'clients' AND policyname = 'clients_update_own'
    ) THEN
      CREATE POLICY clients_update_own ON public.clients
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = user_id);
    END IF;

    -- Only allow users to delete their own clients
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'clients' AND policyname = 'clients_delete_own'
    ) THEN
      CREATE POLICY clients_delete_own ON public.clients
        FOR DELETE
        TO authenticated
        USING (auth.uid() = user_id);
    END IF;
  END IF;
END
$$;