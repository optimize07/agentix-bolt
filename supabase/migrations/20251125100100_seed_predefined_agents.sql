-- Seed predefined agent configurations for Phase 1 n8n Integration
-- IMPORTANT: Run this migration manually in your Supabase project (production safety).
--
-- These are the 5 core agents from the N8N-Upgraded_integration-plan.md document.
-- They are agency-scoped (shared across all clients) and marked as predefined.

-- Helper function to insert predefined agents (idempotent)
create or replace function seed_predefined_agent(
  p_area text,
  p_agent_key text,
  p_display_name text,
  p_display_role text,
  p_description text,
  p_webhook_url text,
  p_input_schema jsonb,
  p_output_behavior text,
  p_avatar_url text default null
) returns void as $$
begin
  -- Only insert if not exists (by area + agent_key for predefined)
  if not exists (
    select 1 from public.agent_configs
    where area = p_area
      and agent_key = p_agent_key
      and is_predefined = true
  ) then
    insert into public.agent_configs (
      user_id,
      scope,
      client_id,
      area,
      agent_key,
      display_name,
      display_role,
      description,
      connection_id,
      workflow_id,
      webhook_url,
      input_schema,
      input_mapping,
      output_behavior,
      execution_mode,
      is_predefined,
      avatar_url
    ) values (
      null, -- Predefined agents have no user_id (system-level)
      'agency',
      null,
      p_area,
      p_agent_key,
      p_display_name,
      p_display_role,
      p_description,
      null, -- Predefined agents use webhooks, not connections
      'webhook', -- Indicates webhook-based execution
      p_webhook_url,
      p_input_schema,
      p_input_schema, -- Copy to input_mapping for backward compat
      p_output_behavior,
      'n8n',
      true,
      p_avatar_url
    );
  end if;
end;
$$ language plpgsql;

-- ============================================================================
-- AGENT 1: Meeting Agent (Operations)
-- Goal: Query Airtable/Fathom records for specific meeting details.
-- ============================================================================
select seed_predefined_agent(
  'operations',
  'meeting-agent',
  'Meeting Agent',
  'Meeting Intelligence',
  'Query your meeting records from Airtable/Fathom. Find calls, attendees, action items, and summaries.',
  'https://togetherinc.app.n8n.cloud/webhook/d1007cb5-fe82-4e98-9905-31c9197c2597',
  '{
    "fields": [
      {
        "key": "query",
        "label": "Ask about a meeting",
        "type": "textarea",
        "placeholder": "Find calls with Client X last week...",
        "required": true
      }
    ]
  }'::jsonb,
  'chat_stream',
  '/placeholder.svg'
);

-- ============================================================================
-- AGENT 2: Personal Assistant (Operations)
-- Goal: Manage Calendar and Email drafts via instruction.
-- ============================================================================
select seed_predefined_agent(
  'operations',
  'personal-assistant',
  'Personal Assistant',
  'Calendar & Email Concierge',
  'Manage your calendar and draft emails. Book meetings, reschedule events, and compose email drafts.',
  'https://togetherinc.app.n8n.cloud/webhook/e101258b-7388-4da6-a427-82191acef0c3',
  '{
    "fields": [
      {
        "key": "instruction",
        "label": "Instruction",
        "type": "textarea",
        "placeholder": "Book a meeting with Nick for Tuesday at 2pm...",
        "required": true
      }
    ]
  }'::jsonb,
  'chat_stream',
  '/placeholder.svg'
);

-- ============================================================================
-- AGENT 3: Prompt Engineer (Marketing)
-- Goal: Refine crude ideas into high-quality LLM prompts.
-- ============================================================================
select seed_predefined_agent(
  'marketing',
  'prompt-engineer',
  'Prompt Engineer',
  'LLM Prompt Optimizer',
  'Transform your rough ideas into well-structured, effective LLM prompts. Get better results from AI tools.',
  'https://togetherinc.app.n8n.cloud/webhook/a35caabc-5dd3-4f07-b36e-927b7647d691',
  '{
    "fields": [
      {
        "key": "topic",
        "label": "Topic/Task",
        "type": "text",
        "placeholder": "Blog post about...",
        "required": true
      },
      {
        "key": "rough_draft",
        "label": "Rough Idea",
        "type": "textarea",
        "placeholder": "I need a blog post about...",
        "required": true
      }
    ]
  }'::jsonb,
  'modal_display',
  '/placeholder.svg'
);

-- ============================================================================
-- AGENT 4: RAG Agent (Strategy)
-- Goal: Query the "Company Brain" (Vectorized SOPs, Videos, Docs).
-- ============================================================================
select seed_predefined_agent(
  'strategy',
  'rag-agent',
  'Company Brain',
  'Knowledge Base RAG',
  'Query your vectorized company knowledge - SOPs, training videos, documentation, and more.',
  'https://togetherinc.app.n8n.cloud/webhook/7ddce9e5-57bf-4bf4-b496-87204f235f62',
  '{
    "fields": [
      {
        "key": "query",
        "label": "Question",
        "type": "textarea",
        "placeholder": "What is our SOP for refund requests?",
        "required": true
      }
    ]
  }'::jsonb,
  'chat_stream',
  '/placeholder.svg'
);

-- ============================================================================
-- AGENT 5: Copywriter Agent (Marketing)
-- Goal: Generate copy for Ads/Emails based on VSL/Offer context.
-- ============================================================================
select seed_predefined_agent(
  'marketing',
  'copywriter',
  'Copywriter',
  'AI Copy Generator',
  'Generate high-converting copy for ads, emails, and landing pages based on your offer and target avatar.',
  'https://togetherinc.app.n8n.cloud/webhook/86d7a192-cc8e-4966-aa43-33d61a0d2f9f',
  '{
    "fields": [
      {
        "key": "content_type",
        "label": "Content Type",
        "type": "select",
        "options": ["Email", "Facebook Ad", "Landing Page"],
        "required": true
      },
      {
        "key": "offer_details",
        "label": "Offer Description",
        "type": "textarea",
        "placeholder": "Describe your offer, pricing, and key benefits...",
        "required": true
      },
      {
        "key": "vsl_context",
        "label": "VSL/Context",
        "type": "textarea",
        "placeholder": "Paste transcript or key points from your VSL..."
      },
      {
        "key": "avatar",
        "label": "Target Avatar",
        "type": "text",
        "placeholder": "e.g., Small business owner, 35-55, struggling with..."
      }
    ]
  }'::jsonb,
  'modal_display',
  '/placeholder.svg'
);

-- Cleanup helper function
drop function if exists seed_predefined_agent;


