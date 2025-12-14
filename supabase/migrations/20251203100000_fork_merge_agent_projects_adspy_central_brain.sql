-- =====================================================
-- Fork Merge Migration: Agent Projects, AdSpy, Central Brain
-- From: adpilot-ai-command fork
-- This creates all tables needed for Agent Projects, enhanced AdSpy, and Central Brain
-- =====================================================

-- =====================================================
-- SECTION 1: CORE TABLES
-- =====================================================

-- Create AgentBoard table (project workspaces for advertising)
CREATE TABLE IF NOT EXISTS public.agent_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  goal TEXT,
  default_platform TEXT DEFAULT 'Meta/Facebook',
  budget_cap_note TEXT,
  creative_style_notes TEXT,
  facebook_ad_account_id TEXT,
  redtrack_workspace_id TEXT,
  position INTEGER DEFAULT 0,
  group_name TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_groups table for organizing projects
CREATE TABLE IF NOT EXISTS public.project_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  position INTEGER DEFAULT 0,
  color TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create CreativeCard table (Kanban cards)
CREATE TABLE IF NOT EXISTS public.creative_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_board_id UUID NOT NULL REFERENCES public.agent_boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  image_url TEXT,
  headline TEXT,
  primary_text TEXT,
  description_text TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'AI_DRAFT' CHECK (status IN ('AI_DRAFT', 'REVIEWED', 'READY_TO_LAUNCH', 'LAUNCHED', 'ARCHIVED')),
  is_winner BOOLEAN DEFAULT false,
  notes TEXT,
  redtrack_metrics JSONB,
  compliance_status TEXT DEFAULT 'unchecked' CHECK (compliance_status IN ('unchecked', 'passed', 'flagged')),
  compliance_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Asset table (extends existing if needed)
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'text', 'url', 'doc')),
  url_or_path TEXT,
  text_content TEXT,
  tags TEXT[] DEFAULT '{}',
  niche_tag TEXT,
  agent_board_id UUID REFERENCES public.agent_boards(id) ON DELETE SET NULL,
  enabled BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active',
  group_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create PromptTemplate table
CREATE TABLE IF NOT EXISTS public.prompt_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  default_variables JSONB,
  enabled BOOLEAN DEFAULT true,
  group_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- SECTION 2: AGENT CHAT TABLES (separate from general chat_sessions)
-- =====================================================

-- Create Agent ChatSession table (for agent board conversations)
CREATE TABLE IF NOT EXISTS public.agent_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_board_id UUID NOT NULL REFERENCES public.agent_boards(id) ON DELETE CASCADE,
  canvas_block_id UUID,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Agent ChatMessage table
CREATE TABLE IF NOT EXISTS public.agent_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_chat_session_id UUID NOT NULL REFERENCES public.agent_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create BoardSettings table
CREATE TABLE IF NOT EXISTS public.board_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_board_id UUID NOT NULL UNIQUE REFERENCES public.agent_boards(id) ON DELETE CASCADE,
  nanobanan_api_key TEXT,
  redtrack_api_key TEXT,
  composio_config_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- SECTION 3: CANVAS TABLES
-- =====================================================

-- Create CanvasBlock table
CREATE TABLE IF NOT EXISTS public.canvas_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_board_id UUID NOT NULL REFERENCES public.agent_boards(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'text', 'url', 'doc', 'document', 'video', 'group', 'chat', 'creative', 'brain')),
  content TEXT,
  asset_id UUID,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  width INTEGER DEFAULT 200,
  height INTEGER DEFAULT 200,
  group_id UUID,
  title TEXT,
  url TEXT,
  file_path TEXT,
  color TEXT,
  metadata JSONB,
  associated_prompt_id UUID,
  instruction_prompt TEXT,
  parsing_status TEXT DEFAULT 'none' CHECK (parsing_status IN ('none', 'pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add FK constraint for agent_chat_sessions.canvas_block_id after canvas_blocks exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'agent_chat_sessions_canvas_block_id_fkey'
  ) THEN
    ALTER TABLE public.agent_chat_sessions 
    ADD CONSTRAINT agent_chat_sessions_canvas_block_id_fkey 
    FOREIGN KEY (canvas_block_id) REFERENCES public.canvas_blocks(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add FK constraint for canvas_blocks.asset_id after assets exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'canvas_blocks_asset_id_fkey'
  ) THEN
    ALTER TABLE public.canvas_blocks 
    ADD CONSTRAINT canvas_blocks_asset_id_fkey 
    FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add FK constraint for canvas_blocks.associated_prompt_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'canvas_blocks_associated_prompt_id_fkey'
  ) THEN
    ALTER TABLE public.canvas_blocks 
    ADD CONSTRAINT canvas_blocks_associated_prompt_id_fkey 
    FOREIGN KEY (associated_prompt_id) REFERENCES public.prompt_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create canvas_groups table
CREATE TABLE IF NOT EXISTS public.canvas_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_board_id UUID NOT NULL,
  name TEXT NOT NULL,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  width INTEGER DEFAULT 400,
  height INTEGER DEFAULT 300,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create canvas_edges table
CREATE TABLE IF NOT EXISTS public.canvas_edges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_board_id UUID NOT NULL,
  source_block_id UUID NOT NULL REFERENCES public.canvas_blocks(id) ON DELETE CASCADE,
  target_block_id UUID NOT NULL REFERENCES public.canvas_blocks(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL DEFAULT 'bezier',
  color TEXT DEFAULT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- SECTION 4: CONTENT/KNOWLEDGE TABLES
-- =====================================================

-- Create content_groups table for organizing all content types
CREATE TABLE IF NOT EXISTS public.content_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  name TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('knowledge', 'swipe', 'asset', 'research', 'strategy', 'tool', 'prompt', 'offer', 'role')),
  color TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create knowledge_entries table (Central Brain knowledge)
CREATE TABLE IF NOT EXISTS public.knowledge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  title TEXT NOT NULL,
  content TEXT,
  source_url TEXT,
  tags TEXT[] DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'in_review' CHECK (status IN ('in_review', 'active', 'archived')),
  group_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create swipe_files table
CREATE TABLE IF NOT EXISTS public.swipe_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  source_url TEXT,
  tags TEXT[] DEFAULT '{}'::text[],
  type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'text', 'pdf', 'video', 'link', 'document')),
  text_content TEXT,
  file_url TEXT,
  video_url TEXT,
  group_id UUID,
  parsing_status TEXT DEFAULT 'none' CHECK (parsing_status IN ('none', 'pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_strategies table
CREATE TABLE IF NOT EXISTS public.project_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  group_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_tools table
CREATE TABLE IF NOT EXISTS public.project_tools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'custom'::text,
  config JSONB DEFAULT '{}'::jsonb,
  enabled BOOLEAN DEFAULT true,
  group_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ai_roles table
CREATE TABLE IF NOT EXISTS public.ai_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  icon TEXT DEFAULT 'user',
  color TEXT,
  tags TEXT[] DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  group_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create board_tools table
CREATE TABLE IF NOT EXISTS public.board_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_board_id UUID NOT NULL REFERENCES public.agent_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'custom',
  config JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- SECTION 5: MARKET RESEARCH & INTEGRATIONS
-- =====================================================

-- Create enums if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'market_research_type') THEN
    CREATE TYPE public.market_research_type AS ENUM (
      'customer_avatar',
      'competitor',
      'market_trend',
      'other'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_category') THEN
    CREATE TYPE public.integration_category AS ENUM (
      'network',
      'crm',
      'video_creation',
      'data_storage',
      'llm'
    );
  END IF;
END $$;

-- Create market_research table
CREATE TABLE IF NOT EXISTS public.market_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  type public.market_research_type NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  file_url TEXT,
  prompt TEXT,
  enabled BOOLEAN DEFAULT true,
  group_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create integrations table
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  category public.integration_category NOT NULL,
  platform TEXT NOT NULL,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_connected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create funnels table
CREATE TABLE IF NOT EXISTS public.funnels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  stages JSONB DEFAULT '[]'::jsonb,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- SECTION 6: OFFERS
-- =====================================================

-- Create offers table
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  discount TEXT,
  guarantee TEXT,
  usp TEXT,
  cta TEXT,
  tags TEXT[] DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  group_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create offer_assets table
CREATE TABLE IF NOT EXISTS public.offer_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'document')),
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- SECTION 7: AD SPY TABLES
-- =====================================================

-- Create ad_spy_competitors table
CREATE TABLE IF NOT EXISTS public.ad_spy_competitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  industry TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ad_spy_ads table
CREATE TABLE IF NOT EXISTS public.ad_spy_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_id UUID REFERENCES public.ad_spy_competitors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  hook TEXT,
  media_type TEXT NOT NULL DEFAULT 'image',
  media_url TEXT,
  thumbnail_url TEXT,
  landing_page_url TEXT,
  duration_days INTEGER,
  first_seen_at TIMESTAMP WITH TIME ZONE,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  metrics JSONB DEFAULT '{}',
  is_breakout BOOLEAN DEFAULT false,
  channel TEXT DEFAULT 'facebook',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add channel column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_spy_ads' 
    AND column_name = 'channel'
  ) THEN
    ALTER TABLE public.ad_spy_ads ADD COLUMN channel TEXT DEFAULT 'facebook';
  END IF;
END $$;

-- Add is_breakout column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_spy_ads' 
    AND column_name = 'is_breakout'
  ) THEN
    ALTER TABLE public.ad_spy_ads ADD COLUMN is_breakout BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create ad_spy_boards table
CREATE TABLE IF NOT EXISTS public.ad_spy_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ad_spy_board_items table
CREATE TABLE IF NOT EXISTS public.ad_spy_board_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.ad_spy_boards(id) ON DELETE CASCADE,
  ad_id UUID NOT NULL REFERENCES public.ad_spy_ads(id) ON DELETE CASCADE,
  notes TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ad_spy_search_history table
CREATE TABLE IF NOT EXISTS public.ad_spy_search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT,
  filters JSONB DEFAULT '{}',
  results_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ad_spy_settings table
CREATE TABLE IF NOT EXISTS public.ad_spy_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  google_sheets_url TEXT,
  auto_push_enabled BOOLEAN DEFAULT false,
  breakout_rules JSONB DEFAULT '{}',
  last_assessment_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ad_spy_research_agents table
CREATE TABLE IF NOT EXISTS public.ad_spy_research_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  query TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  last_run_at TIMESTAMPTZ,
  schedule TEXT DEFAULT 'daily',
  filters JSONB DEFAULT '{}',
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- SECTION 8: APP SETTINGS
-- =====================================================

-- Create app_settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nanobanan_api_key TEXT,
  redtrack_api_key TEXT,
  composio_config_json JSONB,
  openrouter_api_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- SECTION 9: ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.agent_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipe_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_spy_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_spy_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_spy_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_spy_board_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_spy_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_spy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_spy_research_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 10: CREATE RLS POLICIES (Allow all for single-tenant)
-- =====================================================

DO $$
BEGIN
  -- Agent Boards
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on agent_boards') THEN
    CREATE POLICY "Allow all operations on agent_boards" ON public.agent_boards FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Project Groups
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on project_groups') THEN
    CREATE POLICY "Allow all operations on project_groups" ON public.project_groups FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Creative Cards
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on creative_cards') THEN
    CREATE POLICY "Allow all operations on creative_cards" ON public.creative_cards FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Assets
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on assets') THEN
    CREATE POLICY "Allow all operations on assets" ON public.assets FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Prompt Templates
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on prompt_templates') THEN
    CREATE POLICY "Allow all operations on prompt_templates" ON public.prompt_templates FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Agent Chat Sessions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on agent_chat_sessions') THEN
    CREATE POLICY "Allow all operations on agent_chat_sessions" ON public.agent_chat_sessions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Agent Chat Messages
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on agent_chat_messages') THEN
    CREATE POLICY "Allow all operations on agent_chat_messages" ON public.agent_chat_messages FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Board Settings
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on board_settings') THEN
    CREATE POLICY "Allow all operations on board_settings" ON public.board_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Canvas Blocks
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on canvas_blocks') THEN
    CREATE POLICY "Allow all operations on canvas_blocks" ON public.canvas_blocks FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Canvas Groups
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on canvas_groups') THEN
    CREATE POLICY "Allow all operations on canvas_groups" ON public.canvas_groups FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Canvas Edges
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on canvas_edges') THEN
    CREATE POLICY "Allow all operations on canvas_edges" ON public.canvas_edges FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Content Groups
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on content_groups') THEN
    CREATE POLICY "Allow all operations on content_groups" ON public.content_groups FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Knowledge Entries
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on knowledge_entries') THEN
    CREATE POLICY "Allow all operations on knowledge_entries" ON public.knowledge_entries FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Swipe Files
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on swipe_files') THEN
    CREATE POLICY "Allow all operations on swipe_files" ON public.swipe_files FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Project Strategies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on project_strategies') THEN
    CREATE POLICY "Allow all operations on project_strategies" ON public.project_strategies FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Project Tools
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on project_tools') THEN
    CREATE POLICY "Allow all operations on project_tools" ON public.project_tools FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- AI Roles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on ai_roles') THEN
    CREATE POLICY "Allow all operations on ai_roles" ON public.ai_roles FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Board Tools
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on board_tools') THEN
    CREATE POLICY "Allow all operations on board_tools" ON public.board_tools FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Market Research
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on market_research') THEN
    CREATE POLICY "Allow all operations on market_research" ON public.market_research FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Integrations
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on integrations') THEN
    CREATE POLICY "Allow all operations on integrations" ON public.integrations FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Funnels
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on funnels') THEN
    CREATE POLICY "Allow all operations on funnels" ON public.funnels FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Offers
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on offers') THEN
    CREATE POLICY "Allow all operations on offers" ON public.offers FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Offer Assets
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on offer_assets') THEN
    CREATE POLICY "Allow all operations on offer_assets" ON public.offer_assets FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Ad Spy Competitors
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on ad_spy_competitors') THEN
    CREATE POLICY "Allow all operations on ad_spy_competitors" ON public.ad_spy_competitors FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Ad Spy Ads
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on ad_spy_ads') THEN
    CREATE POLICY "Allow all operations on ad_spy_ads" ON public.ad_spy_ads FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Ad Spy Boards
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on ad_spy_boards') THEN
    CREATE POLICY "Allow all operations on ad_spy_boards" ON public.ad_spy_boards FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Ad Spy Board Items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on ad_spy_board_items') THEN
    CREATE POLICY "Allow all operations on ad_spy_board_items" ON public.ad_spy_board_items FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Ad Spy Search History
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on ad_spy_search_history') THEN
    CREATE POLICY "Allow all operations on ad_spy_search_history" ON public.ad_spy_search_history FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Ad Spy Settings
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on ad_spy_settings') THEN
    CREATE POLICY "Allow all operations on ad_spy_settings" ON public.ad_spy_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- Ad Spy Research Agents
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on ad_spy_research_agents') THEN
    CREATE POLICY "Allow all operations on ad_spy_research_agents" ON public.ad_spy_research_agents FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  -- App Settings
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on app_settings') THEN
    CREATE POLICY "Allow all operations on app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- =====================================================
-- SECTION 11: CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_creative_cards_board ON public.creative_cards(agent_board_id);
CREATE INDEX IF NOT EXISTS idx_creative_cards_status ON public.creative_cards(status);
CREATE INDEX IF NOT EXISTS idx_assets_board ON public.assets(agent_board_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON public.assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_group_id ON public.assets(group_id);
CREATE INDEX IF NOT EXISTS idx_agent_chat_sessions_board ON public.agent_chat_sessions(agent_board_id);
CREATE INDEX IF NOT EXISTS idx_agent_chat_sessions_canvas_block_id ON public.agent_chat_sessions(canvas_block_id);
CREATE INDEX IF NOT EXISTS idx_agent_chat_sessions_director ON public.agent_chat_sessions(agent_board_id) WHERE canvas_block_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_agent_chat_messages_session ON public.agent_chat_messages(agent_chat_session_id);
CREATE INDEX IF NOT EXISTS idx_canvas_blocks_board ON public.canvas_blocks(agent_board_id);
CREATE INDEX IF NOT EXISTS idx_canvas_edges_board_id ON public.canvas_edges(agent_board_id);
CREATE INDEX IF NOT EXISTS idx_canvas_edges_source ON public.canvas_edges(source_block_id);
CREATE INDEX IF NOT EXISTS idx_canvas_edges_target ON public.canvas_edges(target_block_id);
CREATE INDEX IF NOT EXISTS idx_content_groups_project_id ON public.content_groups(project_id);
CREATE INDEX IF NOT EXISTS idx_content_groups_content_type ON public.content_groups(content_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_group_id ON public.knowledge_entries(group_id);
CREATE INDEX IF NOT EXISTS idx_swipe_files_group_id ON public.swipe_files(group_id);
CREATE INDEX IF NOT EXISTS idx_swipe_files_type ON public.swipe_files(type);
CREATE INDEX IF NOT EXISTS idx_swipe_files_project_type ON public.swipe_files(project_id, type);
CREATE INDEX IF NOT EXISTS idx_market_research_group_id ON public.market_research(group_id);
CREATE INDEX IF NOT EXISTS idx_project_strategies_group_id ON public.project_strategies(group_id);
CREATE INDEX IF NOT EXISTS idx_project_tools_group_id ON public.project_tools(group_id);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_group_id ON public.prompt_templates(group_id);
CREATE INDEX IF NOT EXISTS idx_ai_roles_project_id ON public.ai_roles(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_roles_enabled ON public.ai_roles(enabled) WHERE enabled = true;
-- Only create channel index if column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_spy_ads' 
    AND column_name = 'channel'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_ad_spy_ads_channel ON public.ad_spy_ads(channel);
  END IF;
END $$;

-- =====================================================
-- SECTION 12: CREATE/UPDATE UPDATED_AT TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 13: CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

DROP TRIGGER IF EXISTS update_agent_boards_updated_at ON public.agent_boards;
CREATE TRIGGER update_agent_boards_updated_at
BEFORE UPDATE ON public.agent_boards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_groups_updated_at ON public.project_groups;
CREATE TRIGGER update_project_groups_updated_at
BEFORE UPDATE ON public.project_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_creative_cards_updated_at ON public.creative_cards;
CREATE TRIGGER update_creative_cards_updated_at
BEFORE UPDATE ON public.creative_cards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_assets_updated_at ON public.assets;
CREATE TRIGGER update_assets_updated_at
BEFORE UPDATE ON public.assets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_prompt_templates_updated_at ON public.prompt_templates;
CREATE TRIGGER update_prompt_templates_updated_at
BEFORE UPDATE ON public.prompt_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_board_settings_updated_at ON public.board_settings;
CREATE TRIGGER update_board_settings_updated_at
BEFORE UPDATE ON public.board_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_canvas_blocks_updated_at ON public.canvas_blocks;
CREATE TRIGGER update_canvas_blocks_updated_at
BEFORE UPDATE ON public.canvas_blocks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_canvas_groups_updated_at ON public.canvas_groups;
CREATE TRIGGER update_canvas_groups_updated_at
BEFORE UPDATE ON public.canvas_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_canvas_edges_updated_at ON public.canvas_edges;
CREATE TRIGGER update_canvas_edges_updated_at
BEFORE UPDATE ON public.canvas_edges
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_groups_updated_at ON public.content_groups;
CREATE TRIGGER update_content_groups_updated_at
BEFORE UPDATE ON public.content_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_entries_updated_at ON public.knowledge_entries;
CREATE TRIGGER update_knowledge_entries_updated_at
BEFORE UPDATE ON public.knowledge_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_swipe_files_updated_at ON public.swipe_files;
CREATE TRIGGER update_swipe_files_updated_at
BEFORE UPDATE ON public.swipe_files
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_strategies_updated_at ON public.project_strategies;
CREATE TRIGGER update_project_strategies_updated_at
BEFORE UPDATE ON public.project_strategies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_tools_updated_at ON public.project_tools;
CREATE TRIGGER update_project_tools_updated_at
BEFORE UPDATE ON public.project_tools
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_roles_updated_at ON public.ai_roles;
CREATE TRIGGER update_ai_roles_updated_at
BEFORE UPDATE ON public.ai_roles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_board_tools_updated_at ON public.board_tools;
CREATE TRIGGER update_board_tools_updated_at
BEFORE UPDATE ON public.board_tools
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_market_research_updated_at ON public.market_research;
CREATE TRIGGER update_market_research_updated_at
BEFORE UPDATE ON public.market_research
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_integrations_updated_at ON public.integrations;
CREATE TRIGGER update_integrations_updated_at
BEFORE UPDATE ON public.integrations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_funnels_updated_at ON public.funnels;
CREATE TRIGGER update_funnels_updated_at
BEFORE UPDATE ON public.funnels
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_offers_updated_at ON public.offers;
CREATE TRIGGER update_offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ad_spy_competitors_updated_at ON public.ad_spy_competitors;
CREATE TRIGGER update_ad_spy_competitors_updated_at
BEFORE UPDATE ON public.ad_spy_competitors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ad_spy_ads_updated_at ON public.ad_spy_ads;
CREATE TRIGGER update_ad_spy_ads_updated_at
BEFORE UPDATE ON public.ad_spy_ads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ad_spy_boards_updated_at ON public.ad_spy_boards;
CREATE TRIGGER update_ad_spy_boards_updated_at
BEFORE UPDATE ON public.ad_spy_boards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ad_spy_settings_updated_at ON public.ad_spy_settings;
CREATE TRIGGER update_ad_spy_settings_updated_at
BEFORE UPDATE ON public.ad_spy_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ad_spy_research_agents_updated_at ON public.ad_spy_research_agents;
CREATE TRIGGER update_ad_spy_research_agents_updated_at
BEFORE UPDATE ON public.ad_spy_research_agents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- SECTION 14: STORAGE BUCKET FOR CANVAS UPLOADS
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('canvas-uploads', 'canvas-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for canvas uploads
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Canvas uploads are publicly accessible') THEN
    CREATE POLICY "Canvas uploads are publicly accessible" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'canvas-uploads');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can upload to canvas') THEN
    CREATE POLICY "Anyone can upload to canvas" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'canvas-uploads');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can update canvas uploads') THEN
    CREATE POLICY "Anyone can update canvas uploads" 
    ON storage.objects FOR UPDATE 
    USING (bucket_id = 'canvas-uploads');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can delete canvas uploads') THEN
    CREATE POLICY "Anyone can delete canvas uploads" 
    ON storage.objects FOR DELETE 
    USING (bucket_id = 'canvas-uploads');
  END IF;
END $$;

-- =====================================================
-- SECTION 15: SEED DEFAULT PROJECT GROUPS
-- =====================================================

INSERT INTO public.project_groups (name, slug, position) VALUES 
  ('Top 5', 'top5', 0),
  ('Active', 'active', 1),
  ('Archive', 'archive', 2)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- SECTION 16: HELPER FUNCTIONS
-- =====================================================

-- Create function for atomic chat session branching
CREATE OR REPLACE FUNCTION public.branch_chat_session(
  p_board_id UUID,
  p_block_id UUID,
  p_title TEXT,
  p_messages JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_session_id UUID;
  v_message JSONB;
BEGIN
  INSERT INTO agent_chat_sessions (agent_board_id, canvas_block_id, title)
  VALUES (p_board_id, p_block_id, p_title)
  RETURNING id INTO v_new_session_id;
  
  FOR v_message IN SELECT * FROM jsonb_array_elements(p_messages)
  LOOP
    INSERT INTO agent_chat_messages (agent_chat_session_id, role, content, metadata)
    VALUES (
      v_new_session_id,
      v_message->>'role',
      v_message->>'content',
      CASE 
        WHEN v_message->'metadata' IS NOT NULL THEN v_message->'metadata'
        ELSE NULL
      END
    );
  END LOOP;
  
  RETURN v_new_session_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Create function to extract image URLs from agent session messages
CREATE OR REPLACE FUNCTION public.get_agent_session_image_urls(p_session_id UUID)
RETURNS TABLE (image_url TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT jsonb_array_elements_text(metadata->'images')
  FROM agent_chat_messages
  WHERE agent_chat_session_id = p_session_id
    AND metadata ? 'images'
    AND jsonb_typeof(metadata->'images') = 'array';
END;
$$;

-- Create cleanup function for orphaned data
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  orphaned_sessions_count INT := 0;
  orphaned_edges_count INT := 0;
  orphaned_blocks_count INT := 0;
BEGIN
  UPDATE agent_chat_sessions
  SET canvas_block_id = NULL
  WHERE canvas_block_id IS NOT NULL
    AND canvas_block_id NOT IN (SELECT id FROM canvas_blocks);
  GET DIAGNOSTICS orphaned_sessions_count = ROW_COUNT;

  DELETE FROM canvas_edges
  WHERE source_block_id NOT IN (SELECT id FROM canvas_blocks)
     OR target_block_id NOT IN (SELECT id FROM canvas_blocks);
  GET DIAGNOSTICS orphaned_edges_count = ROW_COUNT;

  UPDATE canvas_blocks
  SET group_id = NULL
  WHERE group_id IS NOT NULL
    AND group_id NOT IN (SELECT id FROM canvas_blocks WHERE type = 'group');
  GET DIAGNOSTICS orphaned_blocks_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'sessions_cleaned', orphaned_sessions_count,
    'edges_deleted', orphaned_edges_count,
    'blocks_cleaned', orphaned_blocks_count
  );
END;
$$;


