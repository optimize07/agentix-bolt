-- n8n integration core tables
-- This adds secure storage for:
--  - public.n8n_connections: per-user connection configs, scoped to agency or client
--  - public.agent_configs: per-user agent-to-workflow mappings

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Scope constraint: only allow 'agency' or 'client'
-- n8n_scope type already created in earlier migration, skip if exists
-- This migration uses TEXT instead of the enum type to avoid dependency issues

-- Connections to n8n instances (agency or client scoped)
create table if not exists public.n8n_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null default 'agency',
  client_id text null,
  label text,
  base_url text not null,
  api_key_encrypted text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.n8n_connections enable row level security;

create index if not exists idx_n8n_connections_user on public.n8n_connections(user_id);
create index if not exists idx_n8n_connections_scope_client on public.n8n_connections(scope, client_id);

-- Ownership-based policies for n8n_connections
do $policies$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'n8n_connections' and policyname = 'Users can view their own n8n connections'
  ) then
    create policy "Users can view their own n8n connections"
      on public.n8n_connections
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'n8n_connections' and policyname = 'Users can create their own n8n connections'
  ) then
    create policy "Users can create their own n8n connections"
      on public.n8n_connections
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'n8n_connections' and policyname = 'Users can update their own n8n connections'
  ) then
    create policy "Users can update their own n8n connections"
      on public.n8n_connections
      for update
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'n8n_connections' and policyname = 'Users can delete their own n8n connections'
  ) then
    create policy "Users can delete their own n8n connections"
      on public.n8n_connections
      for delete
      using (auth.uid() = user_id);
  end if;
end
$policies$;

-- Agent to n8n workflow mapping
create table if not exists public.agent_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null default 'client',
  client_id text null,
  area text not null,
  agent_key text not null,
  connection_id uuid not null references public.n8n_connections(id) on delete cascade,
  workflow_id text not null,
  input_mapping jsonb null,
  output_mapping jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agent_configs enable row level security;

create index if not exists idx_agent_configs_user on public.agent_configs(user_id);
create index if not exists idx_agent_configs_client on public.agent_configs(client_id);
create index if not exists idx_agent_configs_area_agent on public.agent_configs(area, agent_key);

-- Create unique index with coalesce for agent_configs
create unique index if not exists idx_agent_configs_unique 
  on public.agent_configs(user_id, scope, coalesce(client_id, ''), area, agent_key);

-- Ownership-based policies for agent_configs
do $policies$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'agent_configs' and policyname = 'agent_configs_select_own'
  ) then
    create policy "agent_configs_select_own"
      on public.agent_configs
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'agent_configs' and policyname = 'agent_configs_insert_own'
  ) then
    create policy "agent_configs_insert_own"
      on public.agent_configs
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'agent_configs' and policyname = 'agent_configs_update_own'
  ) then
    create policy "agent_configs_update_own"
      on public.agent_configs
      for update
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'agent_configs' and policyname = 'agent_configs_delete_own'
  ) then
    create policy "agent_configs_delete_own"
      on public.agent_configs
      for delete
      using (auth.uid() = user_id);
  end if;
end
$policies$;