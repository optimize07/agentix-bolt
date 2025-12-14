-- Patch agent_configs to support display labels for UI
-- IMPORTANT: Run this migration manually on Supabase (production safety).

alter table if exists public.agent_configs
  add column if not exists display_name text,
  add column if not exists display_role text;

-- Backfill display_name with agent_key for existing rows
update public.agent_configs
set display_name = coalesce(display_name, agent_key)
where display_name is null;


