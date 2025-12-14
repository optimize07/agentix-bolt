-- Allow NULL values for user_id and connection_id for predefined (system) agents
-- Predefined agents are system-level and not owned by any specific user

-- Make user_id nullable (required for predefined agents)
alter table if exists public.agent_configs
  alter column user_id drop not null;

-- Make connection_id nullable (predefined agents use webhooks, not connections)
alter table if exists public.agent_configs
  alter column connection_id drop not null;

-- Add a check constraint: either is_predefined=true OR user_id is not null
-- This ensures user-created agents always have a user_id
alter table if exists public.agent_configs
  drop constraint if exists agent_configs_user_id_check;

alter table if exists public.agent_configs
  add constraint agent_configs_user_id_check
  check (
    (is_predefined = true and user_id is null)
    or (is_predefined = false and user_id is not null)
  );
