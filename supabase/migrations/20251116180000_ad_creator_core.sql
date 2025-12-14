-- Ad Creator core tables and RLS
-- NOTE: You will need to run this migration manually in your Supabase project.
-- This creates the foundational tables used by the Ad Creator agent.

-- Enable required extensions (safe-guard: exists checks)
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Projects
create table if not exists public.ad_projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid,
  user_id uuid not null,
  name text not null,
  platform text not null check (platform in ('meta')),
  inputs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Candidates (copy-focused for v1)
create table if not exists public.ad_candidates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.ad_projects(id) on delete cascade,
  created_by uuid not null,
  type text not null default 'copy' check (type in ('copy')),
  headline text,
  message text,
  cta text,
  website_url text,
  meta jsonb not null default '{}'::jsonb,
  status text not null default 'review'
    check (status in ('review','needs_edits','approved','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_ad_candidates_project_id on public.ad_candidates(project_id);

-- Candidate assets (supplementary media)
create table if not exists public.ad_candidate_assets (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.ad_candidates(id) on delete cascade,
  source text not null check (source in ('drive','upload')),
  drive_file_id text,
  url text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_ad_candidate_assets_candidate_id on public.ad_candidate_assets(candidate_id);

-- Publish runs (observability)
create table if not exists public.ad_publish_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.ad_projects(id) on delete cascade,
  created_by uuid not null,
  status text not null default 'pending'
    check (status in ('pending','running','success','failed')),
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_ad_publish_runs_project_id on public.ad_publish_runs(project_id);

-- RLS
alter table public.ad_projects enable row level security;
alter table public.ad_candidates enable row level security;
alter table public.ad_candidate_assets enable row level security;
alter table public.ad_publish_runs enable row level security;

-- Policies: user ownership via user_id on project and join checks
do $$
begin
  -- Projects
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='ad_projects' and policyname='ad_projects_select_own'
  ) then
    create policy ad_projects_select_own on public.ad_projects
      for select using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='ad_projects' and policyname='ad_projects_insert_own'
  ) then
    create policy ad_projects_insert_own on public.ad_projects
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='ad_projects' and policyname='ad_projects_update_own'
  ) then
    create policy ad_projects_update_own on public.ad_projects
      for update using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='ad_projects' and policyname='ad_projects_delete_own'
  ) then
    create policy ad_projects_delete_own on public.ad_projects
      for delete using (auth.uid() = user_id);
  end if;

  -- Candidates
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='ad_candidates' and policyname='ad_candidates_project_own_select'
  ) then
    create policy ad_candidates_project_own_select on public.ad_candidates
      for select using (
        exists (
          select 1 from public.ad_projects p
          where p.id = ad_candidates.project_id
            and p.user_id = auth.uid()
        )
      );
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='ad_candidates' and policyname='ad_candidates_project_own_insert'
  ) then
    create policy ad_candidates_project_own_insert on public.ad_candidates
      for insert with check (
        exists (
          select 1 from public.ad_projects p
          where p.id = ad_candidates.project_id
            and p.user_id = auth.uid()
        )
      );
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='ad_candidates' and policyname='ad_candidates_project_own_update'
  ) then
    create policy ad_candidates_project_own_update on public.ad_candidates
      for update using (
        exists (
          select 1 from public.ad_projects p
          where p.id = ad_candidates.project_id
            and p.user_id = auth.uid()
        )
      );
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='ad_candidates' and policyname='ad_candidates_project_own_delete'
  ) then
    create policy ad_candidates_project_own_delete on public.ad_candidates
      for delete using (
        exists (
          select 1 from public.ad_projects p
          where p.id = ad_candidates.project_id
            and p.user_id = auth.uid()
        )
      );
  end if;

  -- Candidate assets
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='ad_candidate_assets' and policyname='ad_candidate_assets_own_select'
  ) then
    create policy ad_candidate_assets_own_select on public.ad_candidate_assets
      for select using (
        exists (
          select 1 from public.ad_candidates c
          join public.ad_projects p on p.id = c.project_id
          where c.id = ad_candidate_assets.candidate_id
            and p.user_id = auth.uid()
        )
      );
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='ad_candidate_assets' and policyname='ad_candidate_assets_own_insert'
  ) then
    create policy ad_candidate_assets_own_insert on public.ad_candidate_assets
      for insert with check (
        exists (
          select 1 from public.ad_candidates c
          join public.ad_projects p on p.id = c.project_id
          where c.id = ad_candidate_assets.candidate_id
            and p.user_id = auth.uid()
        )
      );
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='ad_candidate_assets' and policyname='ad_candidate_assets_own_delete'
  ) then
    create policy ad_candidate_assets_own_delete on public.ad_candidate_assets
      for delete using (
        exists (
          select 1 from public.ad_candidates c
          join public.ad_projects p on p.id = c.project_id
          where c.id = ad_candidate_assets.candidate_id
            and p.user_id = auth.uid()
        )
      );
  end if;

  -- Publish runs
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='ad_publish_runs' and policyname='ad_publish_runs_own_select'
  ) then
    create policy ad_publish_runs_own_select on public.ad_publish_runs
      for select using (
        exists (
          select 1 from public.ad_projects p
          where p.id = ad_publish_runs.project_id
            and p.user_id = auth.uid()
        )
      );
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='ad_publish_runs' and policyname='ad_publish_runs_own_insert'
  ) then
    create policy ad_publish_runs_own_insert on public.ad_publish_runs
      for insert with check (
        exists (
          select 1 from public.ad_projects p
          where p.id = ad_publish_runs.project_id
            and p.user_id = auth.uid()
        )
      );
  end if;
end $$;


