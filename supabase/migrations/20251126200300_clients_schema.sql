-- Clients Schema
-- Creates clients table and migrates hardcoded client data from ClientSwitcher.tsx
-- Run this migration manually in your Supabase project.

-- =============================================================================
-- CLIENTS: Client/company records
-- =============================================================================
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- Core fields
  slug text not null unique, -- URL-friendly identifier (e.g., 'techstart-solutions')
  name text not null, -- Display name (e.g., 'TechStart Solutions')
  type text, -- Industry/type (e.g., 'B2B SaaS', 'Healthcare')
  description text,
  
  -- Contact & metadata
  contact_email text,
  contact_phone text,
  website_url text,
  logo_url text,
  
  -- Status
  is_active boolean not null default true,
  
  -- Metadata
  metadata jsonb default '{}'::jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clients enable row level security;

create index if not exists idx_clients_user on public.clients(user_id);
create index if not exists idx_clients_slug on public.clients(slug);
create index if not exists idx_clients_active on public.clients(is_active) where is_active = true;

-- RLS Policies
-- Agency-level access: all authenticated users can view active clients
-- Users can only create/update/delete their own clients
do $policies$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'clients' and policyname = 'clients_select_all_active') then
    create policy clients_select_all_active on public.clients 
      for select 
      using (auth.uid() is not null and is_active = true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'clients' and policyname = 'clients_insert_own') then
    create policy clients_insert_own on public.clients 
      for insert 
      with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'clients' and policyname = 'clients_update_own') then
    create policy clients_update_own on public.clients 
      for update 
      using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'clients' and policyname = 'clients_delete_own') then
    create policy clients_delete_own on public.clients 
      for delete 
      using (auth.uid() = user_id);
  end if;
end
$policies$;

-- Updated at trigger
create or replace function public.update_clients_updated_at()
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

drop trigger if exists trigger_clients_updated_at on public.clients;
create trigger trigger_clients_updated_at
  before update on public.clients
  for each row execute function public.update_clients_updated_at();

-- Enable realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
    and schemaname = 'public'
    and tablename = 'clients'
  ) then
    alter publication supabase_realtime add table public.clients;
  end if;
end
$$;

comment on table public.clients is 'Client/company records managed by the agency';

