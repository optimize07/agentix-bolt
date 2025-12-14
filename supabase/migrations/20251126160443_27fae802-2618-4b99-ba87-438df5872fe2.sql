-- =============================================================================
-- RLS POLICIES UPDATE
-- =============================================================================
-- Only drop policy if the clients table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'clients'
  ) THEN
    DROP POLICY IF EXISTS clients_select_own ON public.clients;
  END IF;
END
$$;

-- =============================================================================
-- SEED CLIENTS DATA
-- =============================================================================
create or replace function seed_clients()
returns void as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users limit 1;
  
  if v_user_id is null then
    raise notice 'No users found, skipping client seed';
    return;
  end if;

  if exists (select 1 from public.clients limit 1) then
    raise notice 'Clients already exist, skipping seed';
    return;
  end if;

  insert into public.clients (user_id, slug, name, type, is_active)
  values
    (v_user_id, 'techstart-solutions', 'TechStart Solutions', 'B2B SaaS', true),
    (v_user_id, 'healthhub-medical', 'HealthHub Medical', 'Healthcare', true),
    (v_user_id, 'global-consulting', 'Global All-In-Consulting', 'Consulting', true),
    (v_user_id, 'imaginespace-ltd', 'ImagineSpace Ltd', 'Creative', true),
    (v_user_id, 'smartax-corp', 'SMARTAX Corp', 'Finance', true),
    (v_user_id, 'onward-marketing', 'Onward Marketing Inc', 'Marketing', true);

  raise notice 'Seeded 6 clients';
end;
$$ language plpgsql;

select seed_clients();
drop function if exists seed_clients;

-- =============================================================================
-- SEED PROJECTS DATA
-- =============================================================================
create or replace function seed_default_asset_statuses()
returns void as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users limit 1;
  
  if v_user_id is null then
    raise notice 'No users found, skipping asset status seed';
    return;
  end if;

  if not exists (select 1 from public.project_asset_statuses where client_id is null) then
    insert into public.project_asset_statuses (user_id, client_id, name, color, sort_order, is_default, is_final)
    values
      (v_user_id, null, 'Draft', '#6366f1', 0, true, false),
      (v_user_id, null, 'Client Review', '#f59e0b', 1, false, false),
      (v_user_id, null, 'Approved', '#10b981', 2, false, true);
  end if;
end;
$$ language plpgsql;

select seed_default_asset_statuses();
drop function if exists seed_default_asset_statuses;

create or replace function seed_demo_projects()
returns void as $$
declare
  v_user_id uuid;
  v_project_id uuid;
  v_client_exists boolean;
begin
  select id into v_user_id from auth.users limit 1;
  
  if v_user_id is null then
    raise notice 'No users found, skipping project seed';
    return;
  end if;

  select exists(select 1 from public.clients where slug = 'techstart-solutions') into v_client_exists;
  if not v_client_exists then
    raise warning 'Client techstart-solutions does not exist. Please run clients seed migration first.';
    return;
  end if;

  if exists (select 1 from public.projects limit 1) then
    raise notice 'Projects already exist, skipping seed';
    return;
  end if;

  -- Strategy: Market Positioning Plan
  insert into public.projects (user_id, client_id, title, description, department_id, owner, status, progress, due_date)
  values (v_user_id, 'techstart-solutions', 'Market Positioning Plan', 'Define ICP, messaging pillars, and differentiation for Q1 campaigns.', 'strategy', 'Strategy Team', 'in_progress', 65, '2025-12-01')
  returning id into v_project_id;
  
  insert into public.project_tasks (user_id, project_id, title, description, assignee, status, priority, due_date)
  values 
    (v_user_id, v_project_id, 'Complete ICP research', 'Interview 5 customers and analyze competitor positioning', 'Strategy Team', 'complete', 'high', '2025-11-20'),
    (v_user_id, v_project_id, 'Draft messaging pillars', 'Create 3 core messaging themes', 'Strategy Team', 'in_progress', 'high', '2025-11-28'),
    (v_user_id, v_project_id, 'Review with stakeholders', 'Present findings to leadership', 'Strategy Team', 'pending', 'medium', '2025-12-01');

  -- Strategy: Knowledge Base Rollout
  insert into public.projects (user_id, client_id, title, description, department_id, owner, status, progress, due_date)
  values (v_user_id, 'techstart-solutions', 'Knowledge Base Rollout', 'Centralize FAQs and offer pages; align with company brain indexing.', 'strategy', 'Strategy Ops', 'in_progress', 40, '2025-12-15');

  -- Advertising: Ad Creative Strategist
  insert into public.projects (user_id, client_id, title, description, department_id, owner, status, progress, due_date)
  values (v_user_id, 'techstart-solutions', 'Ad Creative Strategist', 'Stand up creative strategy workflow for evergreen offers.', 'advertising', 'Advertising', 'not_started', 0, '2025-12-20')
  returning id into v_project_id;

  insert into public.project_agents (user_id, project_id, agent_type, agent_name, agent_role, can_edit, can_approve)
  values (v_user_id, v_project_id, 'automation', 'Copywriter', 'AI Copy Generator', true, false);

  -- Advertising: Facebook Ads Library Scraper
  insert into public.projects (user_id, client_id, title, description, department_id, owner, status, progress, due_date)
  values (v_user_id, 'techstart-solutions', 'Facebook Ads Library Scraper', 'Competitor scans and creative board generation.', 'advertising', 'Advertising', 'in_progress', 30, '2025-11-28')
  returning id into v_project_id;

  insert into public.project_tasks (user_id, project_id, title, description, assignee, status, priority, due_date)
  values 
    (v_user_id, v_project_id, 'Configure scraper settings', 'Set up competitor list and scan frequency', 'Advertising', 'complete', 'high', '2025-11-22'),
    (v_user_id, v_project_id, 'Review initial results', 'Analyze first batch of competitor ads', 'Advertising', 'in_progress', 'medium', '2025-11-26');

  -- Marketing: VSL Generator
  insert into public.projects (user_id, client_id, title, description, department_id, owner, status, progress, due_date)
  values (v_user_id, 'techstart-solutions', 'VSL Generator', 'Produce and iterate long-form VSL variants from briefs.', 'marketing', 'Content', 'in_progress', 55, '2025-12-05')
  returning id into v_project_id;

  insert into public.project_agents (user_id, project_id, agent_type, agent_name, agent_role, can_edit, can_approve)
  values (v_user_id, v_project_id, 'automation', 'Prompt Engineer', 'LLM Prompt Optimizer', true, false);

  -- Operations: Automation Rollout
  insert into public.projects (user_id, client_id, title, description, department_id, owner, status, progress, due_date)
  values (v_user_id, 'techstart-solutions', 'Automation Rollout', 'Automate recurring workflows and approvals.', 'operations', 'Ops', 'in_progress', 45, '2025-12-08')
  returning id into v_project_id;

  insert into public.project_agents (user_id, project_id, agent_type, agent_name, agent_role, can_edit, can_approve)
  values 
    (v_user_id, v_project_id, 'automation', 'Meeting Agent', 'Meeting Intelligence', true, false),
    (v_user_id, v_project_id, 'automation', 'Personal Assistant', 'Calendar & Email Concierge', true, false);

  -- Financials: Budget Forecasting Implementation
  insert into public.projects (user_id, client_id, title, description, department_id, owner, status, progress, due_date)
  values (v_user_id, 'techstart-solutions', 'Budget Forecasting Implementation', 'Monthly rolling forecast and revenue analytics integration.', 'financials', 'FP&A', 'in_progress', 20, '2025-12-12');

  -- Sales: CRM Cleanup & Pipeline Hygiene
  insert into public.projects (user_id, client_id, title, description, department_id, owner, status, progress, due_date)
  values (v_user_id, 'techstart-solutions', 'CRM Cleanup & Pipeline Hygiene', 'Normalize stages, dedupe leads, and enforce SLAs.', 'sales', 'Sales Ops', 'blocked', 15, '2025-12-03')
  returning id into v_project_id;

  insert into public.project_tasks (user_id, project_id, title, description, assignee, status, priority, due_date)
  values 
    (v_user_id, v_project_id, 'Export current CRM data', 'Pull all leads and deals for analysis', 'Sales Ops', 'complete', 'high', '2025-11-18'),
    (v_user_id, v_project_id, 'Identify duplicate records', 'Run deduplication analysis', 'Sales Ops', 'blocked', 'urgent', '2025-11-25'),
    (v_user_id, v_project_id, 'Define new stage definitions', 'Align on pipeline stages with sales team', 'Sales Ops', 'pending', 'high', '2025-11-30');

  raise notice 'Seeded 8 demo projects';
end;
$$ language plpgsql;

select seed_demo_projects();
drop function if exists seed_demo_projects;