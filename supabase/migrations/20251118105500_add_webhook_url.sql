-- Add webhook_url column to agent_configs
alter table public.agent_configs 
add column if not exists webhook_url text null;

-- Add comment explaining its usage
comment on column public.agent_configs.webhook_url is 'Optional: Production Webhook URL to trigger this workflow (required for n8n Cloud run-now)';

