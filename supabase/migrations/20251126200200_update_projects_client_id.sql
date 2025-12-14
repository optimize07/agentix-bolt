-- Update Projects Client ID
-- Updates seeded projects from 'demo-client' to 'techstart-solutions'
-- Ensures the client exists in clients table first
-- Run this migration manually in your Supabase project after seeding clients and projects.

-- First, ensure techstart-solutions exists in clients table (should be seeded already)
-- If not, this will fail gracefully
do $$
declare
  v_client_exists boolean;
begin
  select exists(select 1 from public.clients where slug = 'techstart-solutions') into v_client_exists;
  
  if not v_client_exists then
    raise warning 'Client techstart-solutions does not exist in clients table. Please run clients seed migration first.';
    return;
  end if;
end $$;

-- Update all projects with demo-client to techstart-solutions
update public.projects
set client_id = 'techstart-solutions'
where client_id = 'demo-client';

-- Also update any related records that might reference the old client_id
update public.project_asset_statuses
set client_id = 'techstart-solutions'
where client_id = 'demo-client';

-- Log the update
do $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.projects where client_id = 'techstart-solutions';
  raise notice 'Updated % projects to techstart-solutions', v_count;
end $$;
