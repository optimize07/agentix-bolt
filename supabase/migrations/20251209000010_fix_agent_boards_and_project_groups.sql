-- Fixes after fork merge:
-- 1) Ensure project_groups.slug has a unique index so ON CONFLICT (slug) works
-- 2) Add client_id to agent_boards so client-scoped queries don't fail

-- Add unique index for slug if it was missing in an existing table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'project_groups'
      AND indexname = 'project_groups_slug_key'
  ) THEN
    CREATE UNIQUE INDEX project_groups_slug_key ON public.project_groups(slug);
  END IF;
END $$;

-- Add client_id to agent_boards if missing (nullable to avoid backfill requirement)
ALTER TABLE public.agent_boards
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Helpful index for client-scoped lookups used by the UI
CREATE INDEX IF NOT EXISTS idx_agent_boards_client_id ON public.agent_boards(client_id);

