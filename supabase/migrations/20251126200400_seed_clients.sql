-- Seed Clients Data
-- Migrates hardcoded client data from ClientSwitcher.tsx into clients table
-- Run this migration manually in your Supabase project.

create or replace function seed_clients()
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
    raise notice 'No users found, skipping client seed';
    return;
  end if;

  -- Only seed if no clients exist
  if exists (select 1 from public.clients limit 1) then
    raise notice 'Clients already exist, skipping seed';
    return;
  end if;

  -- Insert clients from ClientSwitcher.tsx
  insert into public.clients (user_id, slug, name, type, is_active)
  values
    (v_user_id, 'techstart-solutions', 'TechStart Solutions', 'B2B SaaS', true),
    (v_user_id, 'healthhub-medical', 'HealthHub Medical', 'Healthcare', true),
    (v_user_id, 'global-consulting', 'Global All-In-Consulting', 'Consulting', true),
    (v_user_id, 'imaginespace-ltd', 'ImagineSpace Ltd', 'Creative', true),
    (v_user_id, 'smartax-corp', 'SMARTAX Corp', 'Finance', true),
    (v_user_id, 'onward-marketing', 'Onward Marketing Inc', 'Marketing', true);

  raise notice 'Seeded % clients', 6;
end;
$$ language plpgsql;

select seed_clients();
drop function if exists seed_clients;

