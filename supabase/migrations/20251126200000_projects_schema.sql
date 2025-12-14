-- Projects Schema
-- Core tables for project management with asset kanban, task tracking, and agent assignments
-- Run this migration manually in your Supabase project.

-- =============================================================================
-- PROJECTS: Main project records
-- =============================================================================
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  
  -- Core fields
  title text not null,
  description text,
  department_id text not null, -- e.g., 'marketing', 'advertising', 'operations'
  owner text,
  
  -- Status & Progress
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'blocked', 'complete')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  
  -- Dates
  due_date date,
  started_at timestamptz,
  completed_at timestamptz,
  
  -- Metadata
  cover_image_url text,
  tags text[] default '{}',
  metadata jsonb default '{}'::jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create index if not exists idx_projects_user on public.projects(user_id);
create index if not exists idx_projects_client on public.projects(client_id);
create index if not exists idx_projects_department on public.projects(department_id);
create index if not exists idx_projects_status on public.projects(status);

-- RLS Policies
do $policies$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_select_own') then
    create policy projects_select_own on public.projects for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_insert_own') then
    create policy projects_insert_own on public.projects for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_update_own') then
    create policy projects_update_own on public.projects for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_delete_own') then
    create policy projects_delete_own on public.projects for delete using (auth.uid() = user_id);
  end if;
end
$policies$;

-- =============================================================================
-- PROJECT_ASSET_STATUSES: Configurable kanban columns per client
-- =============================================================================
create table if not exists public.project_asset_statuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text, -- null = agency default
  
  name text not null,
  color text default '#6366f1', -- hex color for column header
  sort_order integer not null default 0,
  is_default boolean not null default false, -- marks the initial column for new assets
  is_final boolean not null default false, -- marks "approved/delivered" state
  
  created_at timestamptz not null default now()
);

alter table public.project_asset_statuses enable row level security;

create index if not exists idx_project_asset_statuses_user on public.project_asset_statuses(user_id);
create index if not exists idx_project_asset_statuses_client on public.project_asset_statuses(client_id);

do $policies$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_asset_statuses' and policyname = 'project_asset_statuses_select_own') then
    create policy project_asset_statuses_select_own on public.project_asset_statuses for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_asset_statuses' and policyname = 'project_asset_statuses_insert_own') then
    create policy project_asset_statuses_insert_own on public.project_asset_statuses for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_asset_statuses' and policyname = 'project_asset_statuses_update_own') then
    create policy project_asset_statuses_update_own on public.project_asset_statuses for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_asset_statuses' and policyname = 'project_asset_statuses_delete_own') then
    create policy project_asset_statuses_delete_own on public.project_asset_statuses for delete using (auth.uid() = user_id);
  end if;
end
$policies$;

-- =============================================================================
-- PROJECT_ASSETS: Files, content, agent outputs attached to projects
-- =============================================================================
create table if not exists public.project_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  
  -- Asset details
  title text not null,
  asset_type text not null check (asset_type in ('image', 'video', 'document', 'text', 'link', 'audio', 'other')),
  content text, -- For text assets or generated copy
  file_path text, -- Storage path for uploaded files
  file_url text, -- External URL or signed URL
  thumbnail_url text,
  
  -- Status (kanban column)
  status_id uuid references public.project_asset_statuses(id) on delete set null,
  status_name text default 'Draft', -- denormalized for quick display
  
  -- Ownership & Review
  owner_id text, -- user or agent who created it
  reviewer_id text,
  approved_by text,
  approved_at timestamptz,
  
  -- Source tracking
  source_agent_config_id uuid references public.agent_configs(id) on delete set null,
  source_kb_item_id uuid, -- If pulled from knowledge base
  
  -- Metadata
  metadata jsonb default '{}'::jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_assets enable row level security;

create index if not exists idx_project_assets_user on public.project_assets(user_id);
create index if not exists idx_project_assets_project on public.project_assets(project_id);
create index if not exists idx_project_assets_status on public.project_assets(status_id);
create index if not exists idx_project_assets_type on public.project_assets(asset_type);

do $policies$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_assets' and policyname = 'project_assets_select_own') then
    create policy project_assets_select_own on public.project_assets for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_assets' and policyname = 'project_assets_insert_own') then
    create policy project_assets_insert_own on public.project_assets for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_assets' and policyname = 'project_assets_update_own') then
    create policy project_assets_update_own on public.project_assets for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_assets' and policyname = 'project_assets_delete_own') then
    create policy project_assets_delete_own on public.project_assets for delete using (auth.uid() = user_id);
  end if;
end
$policies$;

-- =============================================================================
-- PROJECT_TASKS: Action items within a project
-- =============================================================================
create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  
  title text not null,
  description text,
  assignee text,
  
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'review', 'complete', 'blocked')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  
  due_date date,
  completed_at timestamptz,
  
  -- Link to asset if this task is about reviewing/approving something
  related_asset_id uuid references public.project_assets(id) on delete set null,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_tasks enable row level security;

create index if not exists idx_project_tasks_user on public.project_tasks(user_id);
create index if not exists idx_project_tasks_project on public.project_tasks(project_id);
create index if not exists idx_project_tasks_status on public.project_tasks(status);
create index if not exists idx_project_tasks_assignee on public.project_tasks(assignee);

do $policies$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_tasks' and policyname = 'project_tasks_select_own') then
    create policy project_tasks_select_own on public.project_tasks for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_tasks' and policyname = 'project_tasks_insert_own') then
    create policy project_tasks_insert_own on public.project_tasks for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_tasks' and policyname = 'project_tasks_update_own') then
    create policy project_tasks_update_own on public.project_tasks for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_tasks' and policyname = 'project_tasks_delete_own') then
    create policy project_tasks_delete_own on public.project_tasks for delete using (auth.uid() = user_id);
  end if;
end
$policies$;

-- =============================================================================
-- PROJECT_AGENTS: Assign human staff or automation agents to projects
-- =============================================================================
create table if not exists public.project_agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  
  -- Either a human (name/email) or an agent config
  agent_type text not null check (agent_type in ('human', 'automation')),
  agent_name text not null,
  agent_role text,
  agent_config_id uuid references public.agent_configs(id) on delete cascade,
  
  -- Permissions
  can_edit boolean default true,
  can_approve boolean default false,
  
  created_at timestamptz not null default now(),
  
  unique(project_id, agent_name)
);

alter table public.project_agents enable row level security;

create index if not exists idx_project_agents_user on public.project_agents(user_id);
create index if not exists idx_project_agents_project on public.project_agents(project_id);

do $policies$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_agents' and policyname = 'project_agents_select_own') then
    create policy project_agents_select_own on public.project_agents for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_agents' and policyname = 'project_agents_insert_own') then
    create policy project_agents_insert_own on public.project_agents for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_agents' and policyname = 'project_agents_update_own') then
    create policy project_agents_update_own on public.project_agents for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_agents' and policyname = 'project_agents_delete_own') then
    create policy project_agents_delete_own on public.project_agents for delete using (auth.uid() = user_id);
  end if;
end
$policies$;

-- =============================================================================
-- PROJECT_COMMENTS: Discussion/activity feed on projects
-- =============================================================================
create table if not exists public.project_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  
  content text not null,
  author_name text,
  
  -- Optional link to asset or task
  related_asset_id uuid references public.project_assets(id) on delete cascade,
  related_task_id uuid references public.project_tasks(id) on delete cascade,
  
  created_at timestamptz not null default now()
);

alter table public.project_comments enable row level security;

create index if not exists idx_project_comments_project on public.project_comments(project_id);
create index if not exists idx_project_comments_created on public.project_comments(created_at desc);

do $policies$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_comments' and policyname = 'project_comments_select_own') then
    create policy project_comments_select_own on public.project_comments for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_comments' and policyname = 'project_comments_insert_own') then
    create policy project_comments_insert_own on public.project_comments for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_comments' and policyname = 'project_comments_delete_own') then
    create policy project_comments_delete_own on public.project_comments for delete using (auth.uid() = user_id);
  end if;
end
$policies$;

-- =============================================================================
-- Updated at triggers
-- =============================================================================
create or replace function public.update_projects_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trigger_projects_updated_at on public.projects;
create trigger trigger_projects_updated_at
  before update on public.projects
  for each row execute function public.update_projects_updated_at();

drop trigger if exists trigger_project_assets_updated_at on public.project_assets;
create trigger trigger_project_assets_updated_at
  before update on public.project_assets
  for each row execute function public.update_projects_updated_at();

drop trigger if exists trigger_project_tasks_updated_at on public.project_tasks;
create trigger trigger_project_tasks_updated_at
  before update on public.project_tasks
  for each row execute function public.update_projects_updated_at();

-- Enable realtime
alter publication supabase_realtime add table public.projects;
alter publication supabase_realtime add table public.project_assets;
alter publication supabase_realtime add table public.project_tasks;
alter publication supabase_realtime add table public.project_comments;

-- Comments
comment on table public.projects is 'Main project records with status, progress, and department assignment';
comment on table public.project_asset_statuses is 'Configurable kanban columns for asset workflow (Draft → Review → Approved)';
comment on table public.project_assets is 'Files, content, and agent outputs attached to projects';
comment on table public.project_tasks is 'Action items and tasks within a project';
comment on table public.project_agents is 'Human staff and automation agents assigned to projects';
comment on table public.project_comments is 'Discussion and activity feed on projects';

