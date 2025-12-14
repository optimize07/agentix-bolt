-- Update Clients RLS Policy
-- Updates the select policy to allow all authenticated users to see active clients
-- This enables agency-level access so all users can see all clients
-- Run this migration manually in your Supabase project.

-- Drop existing select policies if they exist
drop policy if exists clients_select_own on public.clients;
drop policy if exists clients_select_all_active on public.clients;

-- Create new policy that allows all authenticated users to see active clients
-- Only create if it doesn't already exist
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and tablename = 'clients'
    and policyname = 'clients_select_all_active'
  ) then
    create policy clients_select_all_active on public.clients
      for select
      using (auth.uid() is not null and is_active = true);
  end if;
end
$$;

