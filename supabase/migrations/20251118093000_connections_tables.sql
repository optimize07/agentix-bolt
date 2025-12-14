-- Connections tables for Ads + Google integrations
-- NOTE: Run this migration manually in your Supabase project.
-- Creates storage for user-scoped connections used by edge functions:
-- - public.facebook_ad_accounts
-- - public.google_sheets_connections

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Facebook Ad Accounts
create table if not exists public.facebook_ad_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  account_id text not null,
  account_name text,
  access_token_encrypted text,
  is_active boolean not null default true,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, account_id)
);

alter table public.facebook_ad_accounts enable row level security;

create index if not exists idx_facebook_ad_accounts_user on public.facebook_ad_accounts(user_id);
create index if not exists idx_facebook_ad_accounts_account on public.facebook_ad_accounts(account_id);

-- Google Sheets Connections
create table if not exists public.google_sheets_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  spreadsheet_id text not null,
  spreadsheet_name text,
  service_account_email text,
  is_active boolean not null default true,
  last_accessed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, spreadsheet_id)
);

alter table public.google_sheets_connections enable row level security;

create index if not exists idx_google_sheets_connections_user on public.google_sheets_connections(user_id);
create index if not exists idx_google_sheets_connections_sheet on public.google_sheets_connections(spreadsheet_id);

-- Policies: Ownership by user_id
do $$
begin
  -- facebook_ad_accounts policies
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='facebook_ad_accounts' and policyname='facebook_ad_accounts_select_own'
  ) then
    create policy facebook_ad_accounts_select_own on public.facebook_ad_accounts
      for select using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='facebook_ad_accounts' and policyname='facebook_ad_accounts_insert_own'
  ) then
    create policy facebook_ad_accounts_insert_own on public.facebook_ad_accounts
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='facebook_ad_accounts' and policyname='facebook_ad_accounts_update_own'
  ) then
    create policy facebook_ad_accounts_update_own on public.facebook_ad_accounts
      for update using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='facebook_ad_accounts' and policyname='facebook_ad_accounts_delete_own'
  ) then
    create policy facebook_ad_accounts_delete_own on public.facebook_ad_accounts
      for delete using (auth.uid() = user_id);
  end if;

  -- google_sheets_connections policies
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='google_sheets_connections' and policyname='google_sheets_connections_select_own'
  ) then
    create policy google_sheets_connections_select_own on public.google_sheets_connections
      for select using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='google_sheets_connections' and policyname='google_sheets_connections_insert_own'
  ) then
    create policy google_sheets_connections_insert_own on public.google_sheets_connections
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='google_sheets_connections' and policyname='google_sheets_connections_update_own'
  ) then
    create policy google_sheets_connections_update_own on public.google_sheets_connections
      for update using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='google_sheets_connections' and policyname='google_sheets_connections_delete_own'
  ) then
    create policy google_sheets_connections_delete_own on public.google_sheets_connections
      for delete using (auth.uid() = user_id);
  end if;
end
$$;


