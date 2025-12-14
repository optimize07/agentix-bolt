-- n8n integration core tables
-- IMPORTANT: Run this migration manually in your Supabase project (production safety).
-- This adds secure storage for:
--  - public.n8n_connections: per-user connection configs, scoped to agency or client
--  - public.agent_configs: per-user agent-to-workflow mappings (example usage starts with Advertising)
-- Notes:
--  - api_key_encrypted should use Vault/pgcrypto in production; stored as plain text here for initial testing
--  - Future: tighten policies to restrict who can add agency-scoped connections (admins/owners)

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Connections to n8n instances (agency or client scoped)
create table if not exists public.n8n_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null default 'agency' check (scope in ('agency', 'client')),
  client_id text null, -- when scope = 'client', store the client slug/id; null for agency level
  label text,
  base_url text not null, -- e.g. https://your-workspace.n8n.cloud (no trailing slash preferred)
  api_key_encrypted text not null, -- TODO: switch to Vault or KMS-backed encryption
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.n8n_connections enable row level security;

create index if not exists idx_n8n_connections_user on public.n8n_connections(user_id);
create index if not exists idx_n8n_connections_scope_client on public.n8n_connections(scope, client_id);

-- Ownership-based policies
do $policies$
begin
  -- SELECT
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'n8n_connections' and policyname = 'n8n_connections_select_own'
  ) then
    create policy "n8n_connections_select_own"
      on public.n8n_connections
      for select
      using (auth.uid() = user_id);
  end if;

  -- INSERT
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'n8n_connections' and policyname = 'n8n_connections_insert_own'
  ) then
    create policy "n8n_connections_insert_own"
      on public.n8n_connections
      for insert
      with check (auth.uid() = user_id);
  end if;

  -- UPDATE
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'n8n_connections' and policyname = 'n8n_connections_update_own'
  ) then
    create policy "n8n_connections_update_own"
      on public.n8n_connections
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  -- DELETE
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'n8n_connections' and policyname = 'n8n_connections_delete_own'
  ) then
    create policy "n8n_connections_delete_own"
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
  scope text not null default 'client' check (scope in ('agency', 'client')),
  client_id text null,
  area text not null,       -- e.g. 'advertising', 'operations', 'sales'
  agent_key text not null,  -- e.g. 'ad-creator', 'ad-optimizer'; future: could be a foreign key if agents are modeled
  connection_id uuid not null references public.n8n_connections(id) on delete cascade,
  workflow_id text not null,
  input_mapping jsonb null,     -- user-defined mapping for inputs to workflow
  output_mapping jsonb null,    -- user-defined mapping for outputs storage
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agent_configs enable row level security;

create index if not exists idx_agent_configs_user on public.agent_configs(user_id);
create index if not exists idx_agent_configs_client on public.agent_configs(client_id);
create index if not exists idx_agent_configs_area_agent on public.agent_configs(area, agent_key);

-- Create unique index with coalesce for null client_id handling
create unique index if not exists idx_agent_configs_unique
  on public.agent_configs(user_id, scope, coalesce(client_id, ''), area, agent_key);

do $policies$
begin
  -- SELECT
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'agent_configs' and policyname = 'agent_configs_select_own'
  ) then
    create policy "agent_configs_select_own"
      on public.agent_configs
      for select
      using (auth.uid() = user_id);
  end if;

  -- INSERT
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'agent_configs' and policyname = 'agent_configs_insert_own'
  ) then
    create policy "agent_configs_insert_own"
      on public.agent_configs
      for insert
      with check (auth.uid() = user_id);
  end if;

  -- UPDATE
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'agent_configs' and policyname = 'agent_configs_update_own'
  ) then
    create policy "agent_configs_update_own"
      on public.agent_configs
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  -- DELETE
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

-- COMMENTARY (for future maintainers):
-- Only admin/agency owners should be able to create agency-scoped connections.
-- Implementation note: enforce role-based checks in edge functions and/or add an `is_admin` claim to JWT and reference in policies when available.


