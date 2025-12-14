-- ============================================
-- Knowledge Base + Enhanced Agent Configs
-- ============================================

-- KB Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kb_scope') THEN
    CREATE TYPE kb_scope AS ENUM ('agency', 'client', 'project', 'task');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kb_category') THEN
    CREATE TYPE kb_category AS ENUM (
      'document', 'image', 'video', 'audio', 'template', 'script',
      'brand_asset', 'winning_ad', 'research', 'playbook', 'faq', 'offer'
    );
  END IF;
END
$$;

-- KB Items Table
CREATE TABLE IF NOT EXISTS public.knowledge_base_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope kb_scope NOT NULL DEFAULT 'client',
  client_id TEXT,
  project_id UUID,
  task_id UUID,
  source_department TEXT NOT NULL CHECK (source_department IN (
    'strategy', 'advertising', 'marketing', 'sales', 'operations', 'financials', 'admin'
  )),
  category kb_category NOT NULL DEFAULT 'document',
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  file_path TEXT,
  external_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kb_items_user ON public.knowledge_base_items(user_id);
CREATE INDEX IF NOT EXISTS idx_kb_items_scope_client ON public.knowledge_base_items(scope, client_id);
CREATE INDEX IF NOT EXISTS idx_kb_items_source_dept ON public.knowledge_base_items(source_department);
CREATE INDEX IF NOT EXISTS idx_kb_items_category ON public.knowledge_base_items(category);
CREATE INDEX IF NOT EXISTS idx_kb_items_project ON public.knowledge_base_items(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kb_items_tags ON public.knowledge_base_items USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_kb_items_pinned ON public.knowledge_base_items(is_pinned) WHERE is_pinned = TRUE;

ALTER TABLE public.knowledge_base_items ENABLE ROW LEVEL SECURITY;

DO $policies$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'knowledge_base_items' AND policyname = 'kb_items_select_own') THEN
    CREATE POLICY kb_items_select_own ON public.knowledge_base_items FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'knowledge_base_items' AND policyname = 'kb_items_insert_own') THEN
    CREATE POLICY kb_items_insert_own ON public.knowledge_base_items FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'knowledge_base_items' AND policyname = 'kb_items_update_own') THEN
    CREATE POLICY kb_items_update_own ON public.knowledge_base_items FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'knowledge_base_items' AND policyname = 'kb_items_delete_own') THEN
    CREATE POLICY kb_items_delete_own ON public.knowledge_base_items FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $policies$;

CREATE OR REPLACE FUNCTION public.update_kb_items_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trigger_kb_items_updated_at ON public.knowledge_base_items;
CREATE TRIGGER trigger_kb_items_updated_at BEFORE UPDATE ON public.knowledge_base_items FOR EACH ROW EXECUTE FUNCTION public.update_kb_items_updated_at();

-- Add to realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'knowledge_base_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.knowledge_base_items;
  END IF;
END
$$;

-- KB Collections
CREATE TABLE IF NOT EXISTS public.knowledge_base_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope kb_scope NOT NULL DEFAULT 'client',
  client_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kb_collections_user ON public.knowledge_base_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_kb_collections_client ON public.knowledge_base_collections(client_id);
ALTER TABLE public.knowledge_base_collections ENABLE ROW LEVEL SECURITY;

DO $policies$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'knowledge_base_collections' AND policyname = 'kb_collections_select_own') THEN
    CREATE POLICY kb_collections_select_own ON public.knowledge_base_collections FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'knowledge_base_collections' AND policyname = 'kb_collections_insert_own') THEN
    CREATE POLICY kb_collections_insert_own ON public.knowledge_base_collections FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'knowledge_base_collections' AND policyname = 'kb_collections_update_own') THEN
    CREATE POLICY kb_collections_update_own ON public.knowledge_base_collections FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'knowledge_base_collections' AND policyname = 'kb_collections_delete_own') THEN
    CREATE POLICY kb_collections_delete_own ON public.knowledge_base_collections FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $policies$;

-- KB Item Collections Junction
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

DO $policies$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'knowledge_base_item_collections' AND policyname = 'kb_item_collections_access') THEN
    CREATE POLICY kb_item_collections_access ON public.knowledge_base_item_collections FOR ALL USING (
      EXISTS (SELECT 1 FROM public.knowledge_base_items i WHERE i.id = knowledge_base_item_collections.item_id AND i.user_id = auth.uid())
    );
  END IF;
END $policies$;

-- Agent Config Enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'execution_mode') THEN
    CREATE TYPE execution_mode AS ENUM ('n8n', 'internal');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'output_behavior') THEN
    CREATE TYPE output_behavior AS ENUM ('chat_stream', 'modal_display', 'field_populate');
  END IF;
END $$;

-- Enhance agent_configs
ALTER TABLE IF EXISTS public.agent_configs
  ADD COLUMN IF NOT EXISTS display_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS display_role TEXT NULL,
  ADD COLUMN IF NOT EXISTS description TEXT NULL,
  ADD COLUMN IF NOT EXISTS webhook_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS input_schema JSONB NULL,
  ADD COLUMN IF NOT EXISTS output_behavior TEXT NULL DEFAULT 'modal_display',
  ADD COLUMN IF NOT EXISTS execution_mode TEXT NULL DEFAULT 'n8n',
  ADD COLUMN IF NOT EXISTS is_predefined BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT NULL;

-- Make nullable for predefined agents
ALTER TABLE IF EXISTS public.agent_configs ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE IF EXISTS public.agent_configs ALTER COLUMN connection_id DROP NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_configs_output_behavior_check') THEN
    ALTER TABLE public.agent_configs ADD CONSTRAINT agent_configs_output_behavior_check CHECK (output_behavior IN ('chat_stream', 'modal_display', 'field_populate'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_configs_execution_mode_check') THEN
    ALTER TABLE public.agent_configs ADD CONSTRAINT agent_configs_execution_mode_check CHECK (execution_mode IN ('n8n', 'internal'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_agent_configs_predefined ON public.agent_configs(is_predefined, area, agent_key);

-- Update RLS
DO $policies$ BEGIN
  DROP POLICY IF EXISTS agent_configs_select_own ON public.agent_configs;
  CREATE POLICY agent_configs_select_own ON public.agent_configs FOR SELECT USING ((auth.uid() = user_id) OR (is_predefined = TRUE));
END $policies$;

-- Seed function
CREATE OR REPLACE FUNCTION seed_predefined_agent(
  p_area TEXT, p_agent_key TEXT, p_display_name TEXT, p_display_role TEXT,
  p_description TEXT, p_webhook_url TEXT, p_input_schema JSONB,
  p_output_behavior TEXT, p_avatar_url TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.agent_configs WHERE area = p_area AND agent_key = p_agent_key AND is_predefined = TRUE) THEN
    INSERT INTO public.agent_configs (
      user_id, scope, client_id, area, agent_key, display_name, display_role,
      description, connection_id, workflow_id, webhook_url, input_schema,
      input_mapping, output_behavior, execution_mode, is_predefined, avatar_url
    ) VALUES (
      NULL, 'agency', NULL, p_area, p_agent_key, p_display_name, p_display_role,
      p_description, NULL, 'webhook', p_webhook_url, p_input_schema,
      p_input_schema, p_output_behavior, 'n8n', TRUE, p_avatar_url
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Seed agents
SELECT seed_predefined_agent('operations', 'meeting-agent', 'Meeting Agent', 'Meeting Intelligence',
  'Query your meeting records from Airtable/Fathom. Find calls, attendees, action items, and summaries.',
  'https://agentix-n8n.app.n8n.cloud/webhook/d1007cb5-fe82-4e98-9905-31c9197c2597',
  '{"fields":[{"key":"query","label":"Ask about a meeting","type":"textarea","placeholder":"Find calls with Client X last week...","required":true}]}'::JSONB,
  'chat_stream', '/placeholder.svg');

SELECT seed_predefined_agent('operations', 'personal-assistant', 'Personal Assistant', 'Calendar & Email Concierge',
  'Manage your calendar and draft emails. Book meetings, reschedule events, and compose email drafts.',
  'https://agentix-n8n.app.n8n.cloud/webhook/e101258b-7388-4da6-a427-82191acef0c3',
  '{"fields":[{"key":"instruction","label":"Instruction","type":"textarea","placeholder":"Book a meeting with Nick for Tuesday at 2pm...","required":true}]}'::JSONB,
  'chat_stream', '/placeholder.svg');

SELECT seed_predefined_agent('marketing', 'prompt-engineer', 'Prompt Engineer', 'LLM Prompt Optimizer',
  'Transform your rough ideas into well-structured, effective LLM prompts. Get better results from AI tools.',
  'https://agentix-n8n.app.n8n.cloud/webhook/a35caabc-5dd3-4f07-b36e-927b7647d691',
  '{"fields":[{"key":"topic","label":"Topic/Task","type":"text","placeholder":"Blog post about...","required":true},{"key":"rough_draft","label":"Rough Idea","type":"textarea","placeholder":"I need a blog post about...","required":true}]}'::JSONB,
  'modal_display', '/placeholder.svg');

SELECT seed_predefined_agent('strategy', 'rag-agent', 'Company Brain', 'Knowledge Base RAG',
  'Query your vectorized company knowledge - SOPs, training videos, documentation, and more.',
  'https://agentix-n8n.app.n8n.cloud/webhook/7ddce9e5-57bf-4bf4-b496-87204f235f62',
  '{"fields":[{"key":"query","label":"Question","type":"textarea","placeholder":"What is our SOP for refund requests?","required":true}]}'::JSONB,
  'chat_stream', '/placeholder.svg');

SELECT seed_predefined_agent('marketing', 'copywriter', 'Copywriter', 'AI Copy Generator',
  'Generate high-converting copy for ads, emails, and landing pages based on your offer and target avatar.',
  'https://agentix-n8n.app.n8n.cloud/webhook/86d7a192-cc8e-4966-aa43-33d61a0d2f9f',
  '{"fields":[{"key":"content_type","label":"Content Type","type":"select","options":["Email","Facebook Ad","Landing Page"],"required":true},{"key":"offer_details","label":"Offer Description","type":"textarea","placeholder":"Describe your offer, pricing, and key benefits...","required":true},{"key":"vsl_context","label":"VSL/Context","type":"textarea","placeholder":"Paste transcript or key points from your VSL..."},{"key":"avatar","label":"Target Avatar","type":"text","placeholder":"e.g., Small business owner, 35-55, struggling with..."}]}'::JSONB,
  'modal_display', '/placeholder.svg');

DROP FUNCTION IF EXISTS seed_predefined_agent;