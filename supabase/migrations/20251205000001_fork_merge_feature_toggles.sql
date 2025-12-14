-- Feature Toggle Definitions for Fork Merge Features
-- Adds feature toggles for Agent Projects, Central Brain, and Enhanced Ad Spy

-- =============================================================================
-- NEW FEATURE DEFINITIONS
-- =============================================================================

INSERT INTO public.feature_definitions (key, name, description, category, parent_key, default_enabled, sort_order, icon)
VALUES
  -- Agent Projects - Top level feature
  ('feature.agent-projects', 'Agent Projects', 'AI-powered advertising campaign workspaces with creative generation and chat', 'feature', NULL, true, 35, 'FolderKanban'),
  
  -- Central Brain - Enhanced knowledge management (standalone feature)
  ('feature.central-brain', 'Central Brain', 'Unified AI knowledge hub combining knowledge base, strategy, assets, and tools', 'feature', NULL, true, 15, 'Brain'),
  
  -- Enhanced Ad Spy - Multi-tab version with boards, research agents, breakout rules
  ('feature.ad-spy-enhanced', 'Enhanced Ad Spy', 'Advanced competitor ad research with boards, research agents, and breakout tracking', 'feature', 'department.advertising', true, 215, 'Telescope')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  icon = EXCLUDED.icon;

-- =============================================================================
-- AGENT PROJECTS SUB-FEATURES (Modules under Agent Projects)
-- =============================================================================

INSERT INTO public.feature_definitions (key, name, description, category, parent_key, default_enabled, sort_order, icon)
VALUES
  -- Agent Projects modules
  ('module.agent-projects.canvas', 'Project Canvas', 'Visual canvas for organizing creative assets and references', 'module', 'feature.agent-projects', true, 351, 'Layout'),
  ('module.agent-projects.chat', 'Project Chat', 'AI chat for creative generation within projects', 'module', 'feature.agent-projects', true, 352, 'MessageSquare'),
  ('module.agent-projects.creatives', 'Creative Cards', 'Kanban-style creative card management', 'module', 'feature.agent-projects', true, 353, 'Image'),
  ('module.agent-projects.settings', 'Project Settings', 'Project configuration and API integrations', 'module', 'feature.agent-projects', true, 354, 'Settings')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  icon = EXCLUDED.icon;

-- =============================================================================
-- CENTRAL BRAIN SUB-FEATURES (Modules under Central Brain)
-- =============================================================================

INSERT INTO public.feature_definitions (key, name, description, category, parent_key, default_enabled, sort_order, icon)
VALUES
  -- Central Brain modules
  ('module.central-brain.knowledge', 'Knowledge Bases', 'Document and content knowledge management', 'module', 'feature.central-brain', true, 151, 'BookOpen'),
  ('module.central-brain.strategy', 'Strategy Hub', 'Brand strategy, research, funnels, and offers', 'module', 'feature.central-brain', true, 152, 'Target'),
  ('module.central-brain.assets', 'Asset Library', 'Media and file asset management', 'module', 'feature.central-brain', true, 153, 'Image'),
  ('module.central-brain.tools', 'Tools & Specialists', 'AI roles, prompts, and specialist configurations', 'module', 'feature.central-brain', true, 154, 'Wrench'),
  ('module.central-brain.swipe-files', 'Swipe Files', 'Saved ad inspirations and references', 'module', 'feature.central-brain', true, 155, 'Star'),
  ('module.central-brain.integrations', 'Integrations', 'Platform connections and API configurations', 'module', 'feature.central-brain', true, 156, 'Plug')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  icon = EXCLUDED.icon;

-- =============================================================================
-- ENHANCED AD SPY SUB-FEATURES (Modules under Enhanced Ad Spy)
-- =============================================================================

INSERT INTO public.feature_definitions (key, name, description, category, parent_key, default_enabled, sort_order, icon)
VALUES
  -- Enhanced Ad Spy modules
  ('module.ad-spy.boards', 'Ad Boards', 'Organize saved ads into themed boards', 'module', 'feature.ad-spy-enhanced', true, 2151, 'LayoutGrid'),
  ('module.ad-spy.research-agents', 'Research Agents', 'Automated competitor research agents', 'module', 'feature.ad-spy-enhanced', true, 2152, 'Bot'),
  ('module.ad-spy.breakout-rules', 'Breakout Rules', 'Define and track breakout ad criteria', 'module', 'feature.ad-spy-enhanced', true, 2153, 'TrendingUp'),
  ('module.ad-spy.push-to-canvas', 'Push to Canvas', 'Push ads directly to project canvas', 'module', 'feature.ad-spy-enhanced', true, 2154, 'ArrowRight')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  icon = EXCLUDED.icon;

-- =============================================================================
-- Initialize platform defaults for new features (all enabled by default)
-- =============================================================================

INSERT INTO public.platform_feature_toggles (feature_key, enabled)
SELECT key, default_enabled FROM public.feature_definitions
WHERE key LIKE 'feature.agent-projects%'
   OR key LIKE 'module.agent-projects%'
   OR key LIKE 'feature.central-brain%'
   OR key LIKE 'module.central-brain%'
   OR key LIKE 'feature.ad-spy-enhanced%'
   OR key LIKE 'module.ad-spy%'
ON CONFLICT (feature_key) DO NOTHING;

-- Comment
COMMENT ON TABLE public.feature_definitions IS 'Updated with fork merge features (Agent Projects, Central Brain, Enhanced Ad Spy) on 2025-12-05';



