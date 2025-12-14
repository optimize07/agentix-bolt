-- Knowledge Base Core Tables
-- This migration creates the foundational tables for the Knowledge Base system
-- Assets are siloed by: agency > client > project > task with department-level sourcing

-- Scope enum for knowledge base items
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kb_scope') THEN
    CREATE TYPE kb_scope AS ENUM ('agency', 'client', 'project', 'task');
  END IF;
END
$$;

-- Category enum for asset types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kb_category') THEN
    CREATE TYPE kb_category AS ENUM (
      'document',     -- PDFs, docs, spreadsheets
      'image',        -- Images for ads, branding
      'video',        -- Video content
      'audio',        -- Audio files, voiceovers
      'template',     -- Reusable templates
      'script',       -- Ad scripts, VSL scripts
      'brand_asset',  -- Logos, brand guidelines
      'winning_ad',   -- Proven ad creatives
      'research',     -- Market research, reports
      'playbook',     -- Strategy playbooks
      'faq',          -- FAQ documents
      'offer'         -- Offer details
    );
  END IF;
END
$$;

-- Main knowledge base items table
CREATE TABLE IF NOT EXISTS public.knowledge_base_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Hierarchical scoping
  scope kb_scope NOT NULL DEFAULT 'client',
  client_id TEXT,           -- For client/project/task scoped items
  project_id UUID,          -- For project/task scoped items
  task_id UUID,             -- For task scoped items
  
  -- Source department that added this item
  source_department TEXT NOT NULL CHECK (source_department IN (
    'strategy', 'advertising', 'marketing', 'sales', 'operations', 'financials', 'admin'
  )),
  
  -- Item metadata
  category kb_category NOT NULL DEFAULT 'document',
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- File storage reference
  file_path TEXT,           -- Path in storage bucket (null for external URLs)
  external_url TEXT,        -- External URL if not uploaded
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  
  -- Extended metadata (dimensions for images, duration for video, etc.)
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  
  -- Organization
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_kb_items_user ON public.knowledge_base_items(user_id);
CREATE INDEX IF NOT EXISTS idx_kb_items_scope_client ON public.knowledge_base_items(scope, client_id);
CREATE INDEX IF NOT EXISTS idx_kb_items_source_dept ON public.knowledge_base_items(source_department);
CREATE INDEX IF NOT EXISTS idx_kb_items_category ON public.knowledge_base_items(category);
CREATE INDEX IF NOT EXISTS idx_kb_items_project ON public.knowledge_base_items(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kb_items_tags ON public.knowledge_base_items USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_kb_items_pinned ON public.knowledge_base_items(is_pinned) WHERE is_pinned = TRUE;

-- Enable RLS
ALTER TABLE public.knowledge_base_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: User ownership based
DO $policies$
BEGIN
  -- SELECT: Users can see their own items
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'knowledge_base_items' AND policyname = 'kb_items_select_own'
  ) THEN
    CREATE POLICY kb_items_select_own ON public.knowledge_base_items
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- INSERT: Users can create their own items
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'knowledge_base_items' AND policyname = 'kb_items_insert_own'
  ) THEN
    CREATE POLICY kb_items_insert_own ON public.knowledge_base_items
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- UPDATE: Users can update their own items
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'knowledge_base_items' AND policyname = 'kb_items_update_own'
  ) THEN
    CREATE POLICY kb_items_update_own ON public.knowledge_base_items
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  -- DELETE: Users can delete their own items
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'knowledge_base_items' AND policyname = 'kb_items_delete_own'
  ) THEN
    CREATE POLICY kb_items_delete_own ON public.knowledge_base_items
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$policies$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_kb_items_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_kb_items_updated_at ON public.knowledge_base_items;
CREATE TRIGGER trigger_kb_items_updated_at
  BEFORE UPDATE ON public.knowledge_base_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_kb_items_updated_at();

-- Enable realtime for status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.knowledge_base_items;

-- ============================================
-- Knowledge Base Collections (for organizing)
-- ============================================

CREATE TABLE IF NOT EXISTS public.knowledge_base_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  scope kb_scope NOT NULL DEFAULT 'client',
  client_id TEXT,
  
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,           -- Lucide icon name
  color TEXT,          -- Hex color for UI
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kb_collections_user ON public.knowledge_base_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_kb_collections_client ON public.knowledge_base_collections(client_id);

ALTER TABLE public.knowledge_base_collections ENABLE ROW LEVEL SECURITY;

DO $policies$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'knowledge_base_collections' AND policyname = 'kb_collections_select_own'
  ) THEN
    CREATE POLICY kb_collections_select_own ON public.knowledge_base_collections
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'knowledge_base_collections' AND policyname = 'kb_collections_insert_own'
  ) THEN
    CREATE POLICY kb_collections_insert_own ON public.knowledge_base_collections
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'knowledge_base_collections' AND policyname = 'kb_collections_update_own'
  ) THEN
    CREATE POLICY kb_collections_update_own ON public.knowledge_base_collections
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'knowledge_base_collections' AND policyname = 'kb_collections_delete_own'
  ) THEN
    CREATE POLICY kb_collections_delete_own ON public.knowledge_base_collections
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$policies$;

-- Junction table for items in collections
CREATE TABLE IF NOT EXISTS public.knowledge_base_item_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.knowledge_base_items(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES public.knowledge_base_collections(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(item_id, collection_id)
);

CREATE INDEX IF NOT EXISTS idx_kb_item_collections_item ON public.knowledge_base_item_collections(item_id);
CREATE INDEX IF NOT EXISTS idx_kb_item_collections_collection ON public.knowledge_base_item_collections(collection_id);

ALTER TABLE public.knowledge_base_item_collections ENABLE ROW LEVEL SECURITY;

-- RLS for junction table (through item ownership)
DO $policies$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'knowledge_base_item_collections' AND policyname = 'kb_item_collections_access'
  ) THEN
    CREATE POLICY kb_item_collections_access ON public.knowledge_base_item_collections
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.knowledge_base_items i
          WHERE i.id = knowledge_base_item_collections.item_id
            AND i.user_id = auth.uid()
        )
      );
  END IF;
END
$policies$;

-- ============================================
-- Storage bucket configuration (run in Supabase dashboard or via API)
-- ============================================
-- Note: Storage buckets need to be created via Supabase Dashboard or API
-- Bucket name: knowledge-base
-- Policy: Authenticated users can upload to their own folder (user_id prefix)

COMMENT ON TABLE public.knowledge_base_items IS 'Central knowledge base for storing assets across agency/client/project/task scopes';
COMMENT ON TABLE public.knowledge_base_collections IS 'User-defined collections for organizing knowledge base items';
COMMENT ON TABLE public.knowledge_base_item_collections IS 'Junction table linking items to collections';

