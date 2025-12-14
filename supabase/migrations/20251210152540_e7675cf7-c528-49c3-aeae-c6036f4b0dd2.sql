
-- Create visibility enum if not exists
DO $$ BEGIN
  CREATE TYPE public.asset_visibility AS ENUM ('internal_only', 'client_ready', 'published');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create assets table
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id TEXT,
  scope kb_scope NOT NULL DEFAULT 'client',
  visibility asset_visibility NOT NULL DEFAULT 'internal_only',
  title TEXT NOT NULL,
  description TEXT,
  asset_type TEXT NOT NULL,
  file_path TEXT,
  file_url TEXT,
  thumbnail_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}'::text[],
  is_pinned BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assets_select_own_and_agency" ON public.assets
  FOR SELECT USING (
    auth.uid() = user_id 
    OR (scope = 'agency' AND visibility IN ('client_ready', 'published'))
  );

CREATE POLICY "assets_insert_own" ON public.assets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "assets_update_own" ON public.assets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "assets_delete_own" ON public.assets
  FOR DELETE USING (auth.uid() = user_id);

-- Create swipe_files table
CREATE TABLE IF NOT EXISTS public.swipe_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id TEXT,
  scope kb_scope NOT NULL DEFAULT 'client',
  visibility asset_visibility NOT NULL DEFAULT 'internal_only',
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  content TEXT,
  image_url TEXT,
  source_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}'::text[],
  is_pinned BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.swipe_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "swipe_files_select_own_and_agency" ON public.swipe_files
  FOR SELECT USING (
    auth.uid() = user_id 
    OR (scope = 'agency' AND visibility IN ('client_ready', 'published'))
  );

CREATE POLICY "swipe_files_insert_own" ON public.swipe_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "swipe_files_update_own" ON public.swipe_files
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "swipe_files_delete_own" ON public.swipe_files
  FOR DELETE USING (auth.uid() = user_id);

-- Create offers table
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id TEXT,
  scope kb_scope NOT NULL DEFAULT 'client',
  visibility asset_visibility NOT NULL DEFAULT 'internal_only',
  title TEXT NOT NULL,
  description TEXT,
  offer_type TEXT,
  price TEXT,
  discount TEXT,
  terms TEXT,
  valid_from DATE,
  valid_until DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}'::text[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offers_select_own_and_agency" ON public.offers
  FOR SELECT USING (
    auth.uid() = user_id 
    OR (scope = 'agency' AND visibility IN ('client_ready', 'published'))
  );

CREATE POLICY "offers_insert_own" ON public.offers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "offers_update_own" ON public.offers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "offers_delete_own" ON public.offers
  FOR DELETE USING (auth.uid() = user_id);

-- Create prompt_templates table
CREATE TABLE IF NOT EXISTS public.prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id TEXT,
  scope kb_scope NOT NULL DEFAULT 'client',
  visibility asset_visibility NOT NULL DEFAULT 'internal_only',
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  prompt_text TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}'::text[],
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prompt_templates_select_own_and_agency" ON public.prompt_templates
  FOR SELECT USING (
    auth.uid() = user_id 
    OR (scope = 'agency' AND visibility IN ('client_ready', 'published'))
  );

CREATE POLICY "prompt_templates_insert_own" ON public.prompt_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prompt_templates_update_own" ON public.prompt_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "prompt_templates_delete_own" ON public.prompt_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Create content_groups table
CREATE TABLE IF NOT EXISTS public.content_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id TEXT,
  scope kb_scope NOT NULL DEFAULT 'client',
  visibility asset_visibility NOT NULL DEFAULT 'internal_only',
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_groups_select_own_and_agency" ON public.content_groups
  FOR SELECT USING (
    auth.uid() = user_id 
    OR (scope = 'agency' AND visibility IN ('client_ready', 'published'))
  );

CREATE POLICY "content_groups_insert_own" ON public.content_groups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "content_groups_update_own" ON public.content_groups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "content_groups_delete_own" ON public.content_groups
  FOR DELETE USING (auth.uid() = user_id);

-- Create integrations table
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id TEXT,
  scope kb_scope NOT NULL DEFAULT 'client',
  visibility asset_visibility NOT NULL DEFAULT 'internal_only',
  name TEXT NOT NULL,
  description TEXT,
  integration_type TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  credentials_encrypted TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integrations_select_own_and_agency" ON public.integrations
  FOR SELECT USING (
    auth.uid() = user_id 
    OR (scope = 'agency' AND visibility IN ('client_ready', 'published'))
  );

CREATE POLICY "integrations_insert_own" ON public.integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "integrations_update_own" ON public.integrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "integrations_delete_own" ON public.integrations
  FOR DELETE USING (auth.uid() = user_id);

-- Add visibility column to knowledge_base_items if it doesn't have proper enum type
-- (already has visibility as text, so we leave it)
