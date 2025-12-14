-- Enhanced agent_configs for Phase 1 n8n Agent Integration
-- IMPORTANT: Run this migration manually in your Supabase project (production safety).
-- 
-- Adds:
--  - input_schema: Full JSON schema for UI rendering (supports textarea, select, placeholder)
--  - output_behavior: How to display results (chat_stream, modal_display, field_populate)
--  - execution_mode: Toggle between 'n8n' and 'internal' (Mastra) execution
--  - is_predefined: System-level agents that can't be deleted by users
--  - avatar_url: Custom avatar for agent display in tables

-- Add new columns to agent_configs (using TEXT with CHECK constraints instead of enums)
alter table if exists public.agent_configs
  add column if not exists input_schema jsonb null,
  add column if not exists output_behavior text null default 'modal_display',
  add column if not exists execution_mode text null default 'n8n',
  add column if not exists is_predefined boolean not null default false,
  add column if not exists avatar_url text null,
  add column if not exists description text null;

-- Add constraint for output_behavior values
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'agent_configs_output_behavior_check'
  ) then
    alter table public.agent_configs
      add constraint agent_configs_output_behavior_check
      check (output_behavior in ('chat_stream', 'modal_display', 'field_populate'));
  end if;
end
$$;

-- Add constraint for execution_mode values
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'agent_configs_execution_mode_check'
  ) then
    alter table public.agent_configs
      add constraint agent_configs_execution_mode_check
      check (execution_mode in ('n8n', 'internal'));
  end if;
end
$$;

-- Create index for predefined agents lookup
create index if not exists idx_agent_configs_predefined on public.agent_configs(is_predefined, area, agent_key);

-- Comment on new columns
comment on column public.agent_configs.input_schema is 
  'Full JSON schema for dynamic UI rendering. Supports fields with type, placeholder, options (for select), required flag.';

comment on column public.agent_configs.output_behavior is 
  'How the agent result is displayed: chat_stream (chat UI), modal_display (result modal), field_populate (fills form fields).';

comment on column public.agent_configs.execution_mode is 
  'Toggle between n8n webhook execution or internal Mastra agent execution.';

comment on column public.agent_configs.is_predefined is 
  'System-level agents that are seeded and cannot be deleted by users.';


