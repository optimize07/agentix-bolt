-- Seed Feature Definitions
-- Populates the feature_definitions table with all system features

-- =============================================================================
-- DEPARTMENTS (Top-level toggles)
-- =============================================================================
INSERT INTO public.feature_definitions (key, name, description, category, parent_key, default_enabled, sort_order, icon)
VALUES
  ('department.strategy', 'Strategy', 'Strategic planning & analysis department', 'department', NULL, true, 100, 'Target'),
  ('department.advertising', 'Advertising', 'Campaign management & optimization department', 'department', NULL, true, 200, 'Megaphone'),
  ('department.marketing', 'Marketing', 'Content & campaign creation department', 'department', NULL, true, 300, 'TrendingUp'),
  ('department.sales', 'Sales', 'Performance tracking & optimization department', 'department', NULL, true, 400, 'Users'),
  ('department.operations', 'Operations', 'Workflow automation & efficiency department', 'department', NULL, true, 500, 'Settings'),
  ('department.financials', 'Financials', 'Financial planning & analysis department', 'department', NULL, true, 600, 'DollarSign')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  icon = EXCLUDED.icon;

-- =============================================================================
-- CORE FEATURES (Cross-department)
-- =============================================================================
INSERT INTO public.feature_definitions (key, name, description, category, parent_key, default_enabled, sort_order, icon)
VALUES
  ('feature.knowledge-base', 'Knowledge Base', 'Client-specific knowledge management and RAG', 'feature', NULL, true, 10, 'BookOpen'),
  ('feature.analytics', 'Analytics', 'Reporting and performance analytics', 'feature', NULL, true, 20, 'BarChart'),
  ('feature.projects', 'Projects', 'Project management and tracking', 'feature', NULL, true, 30, 'FolderKanban'),
  ('feature.integrations', 'Integrations', 'Third-party integrations (N8N, Composio)', 'feature', NULL, true, 40, 'Plug'),
  ('feature.team-management', 'Team Management', 'Invite and manage team members', 'feature', NULL, true, 50, 'UserPlus')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  icon = EXCLUDED.icon;

-- =============================================================================
-- STRATEGY AGENTS
-- =============================================================================
INSERT INTO public.feature_definitions (key, name, description, category, parent_key, default_enabled, sort_order, icon)
VALUES
  ('agent.strategy.market-positioning', 'Market Positioning Plan', 'Strategic market positioning analysis agent', 'agent', 'department.strategy', true, 110, 'Target'),
  ('agent.strategy.knowledge-bases', 'Knowledge Bases (FAQ, Offers)', 'FAQ and offers knowledge management', 'agent', 'department.strategy', true, 120, 'FileQuestion'),
  ('agent.strategy.company-brain', 'Company Brain (RAG)', 'RAG-powered company knowledge system', 'agent', 'department.strategy', true, 130, 'Brain'),
  ('agent.strategy.rag-agent', 'RAG Agent', 'Retrieval-augmented generation agent', 'agent', 'department.strategy', true, 140, 'Search')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  icon = EXCLUDED.icon;

-- =============================================================================
-- ADVERTISING AGENTS
-- =============================================================================
INSERT INTO public.feature_definitions (key, name, description, category, parent_key, default_enabled, sort_order, icon)
VALUES
  ('agent.advertising.market-research', 'Deep Research Market Assessment', 'Comprehensive market research analysis', 'agent', 'department.advertising', true, 210, 'Search'),
  ('agent.advertising.ad-spy', 'Facebook Ads Library Scraper', 'Competitor ad intelligence gathering', 'agent', 'department.advertising', true, 220, 'Eye'),
  ('agent.advertising.ad-creative-strategist', 'Ad Creative Strategist', 'Strategic ad creative planning', 'agent', 'department.advertising', true, 230, 'Palette'),
  ('agent.advertising.creative-iteration', 'Ad Account Creative Iteration', 'Iterative ad creative optimization', 'agent', 'department.advertising', true, 240, 'RefreshCw'),
  ('agent.advertising.ad-creator', 'Ad Creator', 'AI-powered ad creation tool', 'agent', 'department.advertising', true, 250, 'ImagePlus'),
  ('agent.advertising.ad-optimizer', 'Ad Optimizer', 'Campaign performance optimization', 'agent', 'department.advertising', true, 260, 'Gauge')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  icon = EXCLUDED.icon;

-- =============================================================================
-- MARKETING AGENTS
-- =============================================================================
INSERT INTO public.feature_definitions (key, name, description, category, parent_key, default_enabled, sort_order, icon)
VALUES
  ('agent.marketing.vsl-generator', 'VSL Generator', 'Video sales letter script generation', 'agent', 'department.marketing', true, 310, 'Video'),
  ('agent.marketing.webinar-script', 'Perfect Webinar Script', 'Webinar script creation', 'agent', 'department.marketing', true, 320, 'Presentation'),
  ('agent.marketing.webinar-creator', 'Perfect Webinar Creator', 'Full webinar content creation', 'agent', 'department.marketing', true, 330, 'MonitorPlay'),
  ('agent.marketing.asset-creator', 'Asset Creator', 'Marketing asset generation', 'agent', 'department.marketing', true, 340, 'Image'),
  ('agent.marketing.deep-research', 'Deep Research Scraping Tool', 'Research data extraction', 'agent', 'department.marketing', true, 350, 'Database'),
  ('agent.marketing.landing-page-copywriter', 'Landing Page Copywriter', 'Landing page copy generation', 'agent', 'department.marketing', true, 360, 'FileText'),
  ('agent.marketing.email-copywriter', 'Email Copywriter', 'Email copy generation', 'agent', 'department.marketing', true, 370, 'Mail')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  icon = EXCLUDED.icon;

-- =============================================================================
-- SALES AGENTS
-- =============================================================================
INSERT INTO public.feature_definitions (key, name, description, category, parent_key, default_enabled, sort_order, icon)
VALUES
  ('agent.sales.setter-performance', 'Setter Performance Closer', 'Sales setter performance tracking', 'agent', 'department.sales', true, 410, 'Target'),
  ('agent.sales.data-entry', 'Sales/Finance Data Entry', 'Automated data entry', 'agent', 'department.sales', true, 420, 'ClipboardList'),
  ('agent.sales.setter-grader', 'Setter Transcript Grader', 'Sales call transcript grading', 'agent', 'department.sales', true, 430, 'CheckSquare'),
  ('agent.sales.setter-eod', 'Setter EOD Report Generator', 'End of day setter reports', 'agent', 'department.sales', true, 440, 'FileSpreadsheet'),
  ('agent.sales.closer-grader', 'Sales Rep Transcript Grader', 'Closer call transcript grading', 'agent', 'department.sales', true, 450, 'Award'),
  ('agent.sales.closer-eod', 'Closer EOD Report Generator', 'End of day closer reports', 'agent', 'department.sales', true, 460, 'FileBarChart'),
  ('agent.sales.team-reporter', 'Sales Team Reporter', 'Team performance reporting', 'agent', 'department.sales', true, 470, 'Users'),
  ('agent.sales.setter-reporter', 'Setter Team Reporter', 'Setter team reporting', 'agent', 'department.sales', true, 480, 'UserCheck'),
  ('agent.sales.case-studies', 'Case Studies GPT', 'Case study generation', 'agent', 'department.sales', true, 490, 'BookOpen'),
  ('agent.sales.follow-up', 'Follow-up Agent', 'Automated follow-up management', 'agent', 'department.sales', true, 500, 'MessageCircle')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  icon = EXCLUDED.icon;

-- =============================================================================
-- OPERATIONS AGENTS
-- =============================================================================
INSERT INTO public.feature_definitions (key, name, description, category, parent_key, default_enabled, sort_order, icon)
VALUES
  ('agent.operations.process-automation', 'Process Automation Agent', 'Workflow process automation', 'agent', 'department.operations', true, 510, 'Workflow'),
  ('agent.operations.resource-optimization', 'Resource Optimization Agent', 'Resource allocation optimization', 'agent', 'department.operations', true, 520, 'Cpu'),
  ('agent.operations.quality-control', 'Quality Control Monitor', 'Quality assurance monitoring', 'agent', 'department.operations', true, 530, 'Shield'),
  ('agent.operations.meeting-notes', 'Meeting Notes Bot', 'Automated meeting transcription', 'agent', 'department.operations', true, 540, 'FileAudio'),
  ('agent.operations.email-agent', 'Email Agent', 'Email automation', 'agent', 'department.operations', true, 550, 'Mail'),
  ('agent.operations.calendar-agent', 'Calendar Agent', 'Calendar management', 'agent', 'department.operations', true, 560, 'Calendar'),
  ('agent.operations.llm-swap', 'LLM Swap', 'Model switching utility', 'agent', 'department.operations', true, 570, 'RefreshCcw'),
  ('agent.operations.project-management', 'Project Management Agent', 'Project tracking and management', 'agent', 'department.operations', true, 580, 'Kanban')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  icon = EXCLUDED.icon;

-- =============================================================================
-- FINANCIALS AGENTS
-- =============================================================================
INSERT INTO public.feature_definitions (key, name, description, category, parent_key, default_enabled, sort_order, icon)
VALUES
  ('agent.financials.budget-forecasting', 'Budget Forecasting Agent', 'Financial forecasting and budgeting', 'agent', 'department.financials', true, 610, 'TrendingUp'),
  ('agent.financials.expense-tracker', 'Expense Tracker', 'Expense monitoring and tracking', 'agent', 'department.financials', true, 620, 'Receipt'),
  ('agent.financials.revenue-analytics', 'Revenue Analytics Agent', 'Revenue analysis and reporting', 'agent', 'department.financials', true, 630, 'PieChart')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  icon = EXCLUDED.icon;

-- =============================================================================
-- MODULE FEATURES (Sub-features within departments)
-- =============================================================================
INSERT INTO public.feature_definitions (key, name, description, category, parent_key, default_enabled, sort_order, icon)
VALUES
  -- Strategy modules
  ('module.strategy.market-positioning', 'Market Positioning Module', 'Market positioning analysis tools', 'module', 'department.strategy', true, 111, 'Target'),
  ('module.strategy.company-brain', 'Company Brain Module', 'RAG knowledge system access', 'module', 'department.strategy', true, 112, 'Brain'),
  
  -- Advertising modules  
  ('module.advertising.ad-spy', 'Ad Spy Module', 'Competitor ad research tools', 'module', 'department.advertising', true, 211, 'Eye'),
  ('module.advertising.ad-creator', 'Ad Creator Module', 'Ad creation workspace', 'module', 'department.advertising', true, 212, 'ImagePlus'),
  ('module.advertising.ad-optimizer', 'Ad Optimizer Module', 'Campaign optimization tools', 'module', 'department.advertising', true, 213, 'Gauge'),
  
  -- Sales modules
  ('module.sales.pipeline', 'Sales Pipeline', 'Pipeline management view', 'module', 'department.sales', true, 411, 'GitBranch'),
  ('module.sales.call-scripts', 'Call Scripts', 'Sales call script library', 'module', 'department.sales', true, 412, 'FileText'),
  ('module.sales.crm-integration', 'CRM Integration', 'CRM connection and sync', 'module', 'department.sales', true, 413, 'Link'),
  
  -- Operations modules
  ('module.operations.automation', 'Automation Module', 'Workflow automation tools', 'module', 'department.operations', true, 511, 'Zap'),
  ('module.operations.resource-optimization', 'Resource Optimization Module', 'Resource management tools', 'module', 'department.operations', true, 512, 'Sliders'),
  ('module.operations.quality-control', 'Quality Control Module', 'QA monitoring dashboard', 'module', 'department.operations', true, 513, 'Shield'),
  
  -- Financials modules
  ('module.financials.reports', 'Financial Reports', 'Financial reporting tools', 'module', 'department.financials', true, 611, 'FileBarChart')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  icon = EXCLUDED.icon;

-- =============================================================================
-- INTEGRATION FEATURES
-- =============================================================================
INSERT INTO public.feature_definitions (key, name, description, category, parent_key, default_enabled, sort_order, icon)
VALUES
  ('integration.n8n', 'N8N Integration', 'N8N workflow automation connection', 'feature', 'feature.integrations', true, 41, 'Workflow'),
  ('integration.composio', 'Composio Integration', 'Composio API connections', 'feature', 'feature.integrations', true, 42, 'Plug2'),
  ('integration.google-drive', 'Google Drive Integration', 'Google Drive file access', 'feature', 'feature.integrations', true, 43, 'HardDrive'),
  ('integration.google-sheets', 'Google Sheets Integration', 'Google Sheets data sync', 'feature', 'feature.integrations', true, 44, 'Table'),
  ('integration.facebook-ads', 'Facebook Ads Integration', 'Meta Ads API connection', 'feature', 'feature.integrations', true, 45, 'Facebook')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  icon = EXCLUDED.icon;

-- =============================================================================
-- Initialize platform defaults (all enabled by default)
-- =============================================================================
INSERT INTO public.platform_feature_toggles (feature_key, enabled)
SELECT key, default_enabled FROM public.feature_definitions
ON CONFLICT (feature_key) DO NOTHING;

-- Comment
COMMENT ON TABLE public.feature_definitions IS 'Seeded with all system features on 2025-12-02';

