-- Agent message log for n8n webhook + internal agents
-- Tracks per-agent chat history so we can mirror into ChatSidebar + Knowledge Base

create table if not exists public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  agent_config_id uuid not null references public.agent_configs(id) on delete cascade,
  client_id text,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  source text not null default 'agent',
  mirrored_to_chat boolean not null default false,
  mirrored_to_kb boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.agent_messages enable row level security;

create index if not exists idx_agent_messages_agent on public.agent_messages(agent_config_id, created_at desc);
create index if not exists idx_agent_messages_client on public.agent_messages(client_id);
create index if not exists idx_agent_messages_user on public.agent_messages(user_id);

do $policies$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'agent_messages' and policyname = 'agent_messages_select_own'
  ) then
    create policy agent_messages_select_own
      on public.agent_messages
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'agent_messages' and policyname = 'agent_messages_insert_own'
  ) then
    create policy agent_messages_insert_own
      on public.agent_messages
      for insert
      with check (auth.uid() = user_id);
  end if;
end
$policies$;

comment on table public.agent_messages is 'Conversation history for AI/n8n agents; mirrored to chat + knowledge base.';
comment on column public.agent_messages.metadata is 'Optional structured payload (citations, doc_ids, outputs).';


