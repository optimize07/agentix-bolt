-- Seed Projects Data
-- Copies dummy data from ClientProjects.tsx and sets up default asset statuses
-- Run this migration manually in your Supabase project.

-- =============================================================================
-- DEFAULT ASSET STATUSES (Agency-level defaults)
-- =============================================================================
-- These are the default kanban columns: Draft → Client Review → Approved

create or replace function seed_default_asset_statuses()
returns void as $$
declare
  v_user_id uuid;
begin
  -- Try to find admin user by email first, fallback to first user
  select id into v_user_id 
  from auth.users 
  where email = 'admin@admin.com' 
  limit 1;
  
  -- Fallback to first user if admin not found
  if v_user_id is null then
    select id into v_user_id from auth.users limit 1;
  end if;
  
  if v_user_id is null then
    raise notice 'No users found, skipping asset status seed';
    return;
  end if;

  -- Only insert if no default statuses exist
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

-- =============================================================================
-- SEED PROJECTS (from ClientProjects.tsx dummy data)
-- =============================================================================

create or replace function seed_demo_projects()
returns void as $$
declare
  v_user_id uuid;
  v_project_id uuid;
  v_client_exists boolean;
begin
  -- Try to find admin user by email first, fallback to first user
  select id into v_user_id 
  from auth.users 
  where email = 'admin@admin.com' 
  limit 1;
  
  -- Fallback to first user if admin not found
  if v_user_id is null then
    select id into v_user_id from auth.users limit 1;
  end if;
  
  if v_user_id is null then
    raise notice 'No users found, skipping project seed';
    return;
  end if;

  -- Check if techstart-solutions client exists
  select exists(select 1 from public.clients where slug = 'techstart-solutions') into v_client_exists;
  if not v_client_exists then
    raise warning 'Client techstart-solutions does not exist. Please run clients seed migration first.';
    return;
  end if;

  -- Only seed if no projects exist
  if exists (select 1 from public.projects limit 1) then
    raise notice 'Projects already exist, skipping seed';
    return;
  end if;

  -- Strategy: Market Positioning Plan
  insert into public.projects (user_id, client_id, title, description, department_id, owner, status, progress, due_date)
  values (v_user_id, 'techstart-solutions', 'Market Positioning Plan', 'Define ICP, messaging pillars, and differentiation for Q1 campaigns.', 'strategy', 'Strategy Team', 'in_progress', 65, '2025-12-01')
  returning id into v_project_id;
  
  -- Add some tasks
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

  -- Assign Copywriter agent
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

  -- Assign Prompt Engineer agent
  insert into public.project_agents (user_id, project_id, agent_type, agent_name, agent_role, can_edit, can_approve)
  values (v_user_id, v_project_id, 'automation', 'Prompt Engineer', 'LLM Prompt Optimizer', true, false);

  -- Operations: Automation Rollout
  insert into public.projects (user_id, client_id, title, description, department_id, owner, status, progress, due_date)
  values (v_user_id, 'techstart-solutions', 'Automation Rollout', 'Automate recurring workflows and approvals.', 'operations', 'Ops', 'in_progress', 45, '2025-12-08')
  returning id into v_project_id;

  -- Assign Meeting Agent and Personal Assistant
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

  raise notice 'Seeded % demo projects', 8;
end;
$$ language plpgsql;

select seed_demo_projects();
drop function if exists seed_demo_projects;

