-- Optional: Update Copywriter to Chat Stream Mode
-- This migration updates the Copywriter agent from modal_display to chat_stream
-- enabling it to be used in the project chat sidebar.
-- 
-- Run this migration only if you want the Copywriter to appear in the Chat Agents list.

-- Update Copywriter to chat_stream and simplify input schema for chat use
update public.agent_configs
set 
  output_behavior = 'chat_stream',
  input_schema = '{
    "fields": [
      {
        "key": "request",
        "label": "Copy Request",
        "type": "textarea",
        "placeholder": "Write a Facebook ad for my course about [topic]. The target audience is [avatar]. Include a hook, body, and CTA.",
        "required": true
      }
    ]
  }'::jsonb,
  description = 'Generate high-converting copy for ads, emails, and landing pages. Just describe what you need in natural language.'
where agent_key = 'copywriter'
  and is_predefined = true;

-- Log the update
do $$
declare
  v_count integer;
begin
  select count(*) into v_count 
  from public.agent_configs 
  where agent_key = 'copywriter' 
    and output_behavior = 'chat_stream';
  raise notice 'Updated % Copywriter agent(s) to chat_stream', v_count;
end $$;