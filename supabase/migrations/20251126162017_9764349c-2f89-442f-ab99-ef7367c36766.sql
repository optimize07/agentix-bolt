-- Fix projects RLS policies for agency-wide access
-- This migration only runs if the projects table exists (created in a later migration)

DO $$
BEGIN
  -- Only proceed if the projects table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'projects'
  ) THEN
    -- Drop existing restrictive policies
    DROP POLICY IF EXISTS projects_select_own ON public.projects;
    DROP POLICY IF EXISTS projects_insert_own ON public.projects;
    DROP POLICY IF EXISTS projects_update_own ON public.projects;
    DROP POLICY IF EXISTS projects_delete_own ON public.projects;

    -- Create agency-wide policies
    -- Allow all authenticated users to view all projects
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'projects_select_all'
    ) THEN
      CREATE POLICY projects_select_all ON public.projects
        FOR SELECT
        TO authenticated
        USING (true);
    END IF;

    -- Users can create projects with their own user_id
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'projects_insert_own'
    ) THEN
      CREATE POLICY projects_insert_own ON public.projects
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Users can update any project (agency-wide)
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'projects_update_all'
    ) THEN
      CREATE POLICY projects_update_all ON public.projects
        FOR UPDATE
        TO authenticated
        USING (true);
    END IF;

    -- Users can delete any project (agency-wide)
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'projects_delete_all'
    ) THEN
      CREATE POLICY projects_delete_all ON public.projects
        FOR DELETE
        TO authenticated
        USING (true);
    END IF;
  END IF;
END
$$;