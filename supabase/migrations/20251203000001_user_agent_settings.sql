-- User Agent Settings - per-user overrides for agency-defined agents
-- IMPORTANT: Run this migration manually in your Supabase project (production safety).
--
-- This table allows users to:
--  - Rename agents (custom_name) with ability to restore default
--  - Set personal schedules for automated runs
--  - Connect knowledge base items and other integrations
--  - Add personal notes/context for agents

create table if not exists public.user_agent_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text null, -- which client context this setting applies to (null = all clients)
  
  -- Agent identification (matches departments.ts structure)
  department_id text not null, -- e.g. 'advertising', 'marketing', 'sales'
  agent_name text not null, -- original agent name from departments data
  
  -- User overrides
  custom_name text null, -- user's custom display name (null = use default)
  personal_notes text null, -- user's notes about this agent
  
  -- Schedule settings
  schedule_enabled boolean not null default false,
  schedule_type text null check (schedule_type in ('daily', 'weekly', 'monthly', 'custom')),
  schedule_time time null, -- time of day to run (e.g., '09:00')
  schedule_day_of_week int null check (schedule_day_of_week between 0 and 6), -- 0 = Sunday, for weekly
  schedule_day_of_month int null check (schedule_day_of_month between 1 and 31), -- for monthly
  schedule_cron text null, -- for custom schedules
  schedule_timezone text null default 'UTC',
  last_scheduled_run timestamptz null,
  next_scheduled_run timestamptz null,
  
  -- Connections / Integrations
  knowledge_base_ids uuid[] null, -- linked knowledge base items
  input_integration_id uuid null, -- future: link to data source integration
  output_integration_id uuid null, -- future: link to output destination
  default_parameters jsonb null, -- default input parameters for runs
  
  -- Metadata
  is_favorite boolean not null default false,
  is_hidden boolean not null default false, -- hide from agent list
  run_count int not null default 0,
  last_run_at timestamptz null,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create unique index with coalesce for null client_id handling
-- (PostgreSQL doesn't allow functions in unique constraints, so we use a unique index instead)
create unique index if not exists idx_user_agent_settings_unique
  on public.user_agent_settings(user_id, coalesce(client_id, ''), department_id, agent_name);

-- Enable RLS
alter table public.user_agent_settings enable row level security;

-- Indexes for performance
create index if not exists idx_user_agent_settings_user on public.user_agent_settings(user_id);
create index if not exists idx_user_agent_settings_client on public.user_agent_settings(client_id);
create index if not exists idx_user_agent_settings_department on public.user_agent_settings(department_id);
create index if not exists idx_user_agent_settings_scheduled on public.user_agent_settings(schedule_enabled, next_scheduled_run) 
  where schedule_enabled = true;

-- RLS Policies - users can only manage their own settings
do $policies$
begin
  -- SELECT
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_agent_settings' and policyname = 'user_agent_settings_select_own'
  ) then
    create policy "user_agent_settings_select_own"
      on public.user_agent_settings
      for select
      using (auth.uid() = user_id);
  end if;

  -- INSERT
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_agent_settings' and policyname = 'user_agent_settings_insert_own'
  ) then
    create policy "user_agent_settings_insert_own"
      on public.user_agent_settings
      for insert
      with check (auth.uid() = user_id);
  end if;

  -- UPDATE
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_agent_settings' and policyname = 'user_agent_settings_update_own'
  ) then
    create policy "user_agent_settings_update_own"
      on public.user_agent_settings
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  -- DELETE
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_agent_settings' and policyname = 'user_agent_settings_delete_own'
  ) then
    create policy "user_agent_settings_delete_own"
      on public.user_agent_settings
      for delete
      using (auth.uid() = user_id);
  end if;
end
$policies$;

-- Function to update the updated_at timestamp
create or replace function public.update_user_agent_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for updated_at
drop trigger if exists user_agent_settings_updated_at on public.user_agent_settings;
create trigger user_agent_settings_updated_at
  before update on public.user_agent_settings
  for each row
  execute function public.update_user_agent_settings_updated_at();

-- Comments
comment on table public.user_agent_settings is 'User-specific overrides and settings for agency-defined agents';
comment on column public.user_agent_settings.custom_name is 'User''s custom display name for the agent (null uses default from departments.ts)';
comment on column public.user_agent_settings.schedule_enabled is 'Whether automatic scheduled runs are enabled';
comment on column public.user_agent_settings.knowledge_base_ids is 'Array of linked knowledge base item UUIDs for context';
comment on column public.user_agent_settings.default_parameters is 'Default input parameters to use when running this agent';

