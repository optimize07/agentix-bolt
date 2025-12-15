CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: integration_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.integration_category AS ENUM (
    'network',
    'crm',
    'video_creation',
    'data_storage',
    'llm'
);


--
-- Name: market_research_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.market_research_type AS ENUM (
    'customer_avatar',
    'competitor',
    'market_trend',
    'other'
);


--
-- Name: branch_chat_session(uuid, uuid, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.branch_chat_session(p_board_id uuid, p_block_id uuid, p_title text, p_messages jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_new_session_id UUID;
  v_message JSONB;
BEGIN
  -- Create new session
  INSERT INTO chat_sessions (agent_board_id, canvas_block_id, title)
  VALUES (p_board_id, p_block_id, p_title)
  RETURNING id INTO v_new_session_id;
  
  -- Insert messages in a single atomic operation
  FOR v_message IN SELECT * FROM jsonb_array_elements(p_messages)
  LOOP
    INSERT INTO chat_messages (chat_session_id, role, content, metadata)
    VALUES (
      v_new_session_id,
      v_message->>'role',
      v_message->>'content',
      CASE 
        WHEN v_message->'metadata' IS NOT NULL THEN v_message->'metadata'
        ELSE NULL
      END
    );
  END LOOP;
  
  RETURN v_new_session_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback is automatic on exception
    RAISE;
END;
$$;


--
-- Name: cleanup_orphaned_data(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_orphaned_data() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  orphaned_sessions_count INT := 0;
  orphaned_edges_count INT := 0;
  orphaned_blocks_count INT := 0;
BEGIN
  -- 1. Clean orphaned chat sessions (set canvas_block_id to NULL)
  UPDATE chat_sessions
  SET canvas_block_id = NULL
  WHERE canvas_block_id IS NOT NULL
    AND canvas_block_id NOT IN (SELECT id FROM canvas_blocks);
  GET DIAGNOSTICS orphaned_sessions_count = ROW_COUNT;

  -- 2. Delete orphaned edges
  DELETE FROM canvas_edges
  WHERE source_block_id NOT IN (SELECT id FROM canvas_blocks)
     OR target_block_id NOT IN (SELECT id FROM canvas_blocks);
  GET DIAGNOSTICS orphaned_edges_count = ROW_COUNT;

  -- 3. Clean orphaned group references
  UPDATE canvas_blocks
  SET group_id = NULL
  WHERE group_id IS NOT NULL
    AND group_id NOT IN (SELECT id FROM canvas_blocks WHERE type = 'group');
  GET DIAGNOSTICS orphaned_blocks_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'sessions_cleaned', orphaned_sessions_count,
    'edges_deleted', orphaned_edges_count,
    'blocks_cleaned', orphaned_blocks_count
  );
END;
$$;


--
-- Name: get_session_image_urls(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_session_image_urls(p_session_id uuid) RETURNS TABLE(image_url text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT jsonb_array_elements_text(metadata->'images')
  FROM chat_messages
  WHERE chat_session_id = p_session_id
    AND metadata ? 'images'
    AND jsonb_typeof(metadata->'images') = 'array';
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: ad_spy_ads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_spy_ads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    competitor_id uuid,
    title text NOT NULL,
    hook text,
    media_type text DEFAULT 'image'::text NOT NULL,
    media_url text,
    thumbnail_url text,
    landing_page_url text,
    duration_days integer,
    first_seen_at timestamp with time zone,
    last_seen_at timestamp with time zone,
    status text DEFAULT 'active'::text NOT NULL,
    metrics jsonb DEFAULT '{}'::jsonb,
    is_breakout boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    channel text DEFAULT 'facebook'::text
);


--
-- Name: ad_spy_board_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_spy_board_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    board_id uuid NOT NULL,
    ad_id uuid NOT NULL,
    notes text,
    "position" integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ad_spy_boards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_spy_boards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    color text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ad_spy_competitors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_spy_competitors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    logo_url text,
    industry text,
    tags text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ad_spy_research_agents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_spy_research_agents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    query text NOT NULL,
    description text,
    status text DEFAULT 'active'::text,
    last_run_at timestamp with time zone,
    schedule text DEFAULT 'daily'::text,
    filters jsonb DEFAULT '{}'::jsonb,
    results_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: ad_spy_search_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_spy_search_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    query text,
    filters jsonb DEFAULT '{}'::jsonb,
    results_count integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ad_spy_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_spy_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    google_sheets_url text,
    auto_push_enabled boolean DEFAULT false,
    breakout_rules jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_assessment_at timestamp with time zone
);


--
-- Name: agent_boards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_boards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    goal text,
    default_platform text DEFAULT 'Meta/Facebook'::text,
    budget_cap_note text,
    creative_style_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    facebook_ad_account_id text,
    redtrack_workspace_id text,
    "position" integer DEFAULT 0,
    group_name text
);


--
-- Name: ai_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    name text NOT NULL,
    description text,
    system_prompt text NOT NULL,
    icon text DEFAULT 'user'::text,
    color text,
    tags text[] DEFAULT '{}'::text[],
    enabled boolean DEFAULT true,
    group_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nanobanan_api_key text,
    redtrack_api_key text,
    composio_config_json jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    openrouter_api_key text
);


--
-- Name: assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    url_or_path text,
    text_content text,
    tags text[] DEFAULT '{}'::text[],
    niche_tag text,
    agent_board_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    enabled boolean DEFAULT true,
    description text,
    category text DEFAULT 'general'::text,
    file_size bigint,
    mime_type text,
    thumbnail_url text,
    scraped_content jsonb,
    status text DEFAULT 'active'::text NOT NULL,
    group_id uuid,
    CONSTRAINT assets_category_check CHECK ((category = ANY (ARRAY['brand'::text, 'campaign'::text, 'general'::text]))),
    CONSTRAINT assets_type_check CHECK ((type = ANY (ARRAY['image'::text, 'text'::text, 'url'::text, 'doc'::text])))
);


--
-- Name: board_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.board_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_board_id uuid NOT NULL,
    nanobanan_api_key text,
    redtrack_api_key text,
    composio_config_json jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: board_tools; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.board_tools (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_board_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    type text DEFAULT 'custom'::text NOT NULL,
    config jsonb DEFAULT '{}'::jsonb,
    enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: canvas_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.canvas_blocks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_board_id uuid NOT NULL,
    type text NOT NULL,
    content text,
    asset_id uuid,
    position_x integer DEFAULT 0,
    position_y integer DEFAULT 0,
    width integer DEFAULT 200,
    height integer DEFAULT 200,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    group_id uuid,
    title text,
    url text,
    file_path text,
    color text,
    metadata jsonb,
    associated_prompt_id uuid,
    instruction_prompt text,
    parsing_status text DEFAULT 'none'::text,
    CONSTRAINT canvas_blocks_parsing_status_check CHECK ((parsing_status = ANY (ARRAY['none'::text, 'pending'::text, 'processing'::text, 'completed'::text, 'failed'::text]))),
    CONSTRAINT canvas_blocks_type_check CHECK ((type = ANY (ARRAY['image'::text, 'text'::text, 'url'::text, 'doc'::text, 'document'::text, 'video'::text, 'group'::text, 'chat'::text, 'creative'::text, 'brain'::text])))
);


--
-- Name: canvas_edges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.canvas_edges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_board_id uuid NOT NULL,
    source_block_id uuid NOT NULL,
    target_block_id uuid NOT NULL,
    edge_type text DEFAULT 'bezier'::text NOT NULL,
    color text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: canvas_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.canvas_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_board_id uuid NOT NULL,
    name text NOT NULL,
    position_x integer DEFAULT 0,
    position_y integer DEFAULT 0,
    width integer DEFAULT 400,
    height integer DEFAULT 300,
    color text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chat_session_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chat_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);


--
-- Name: chat_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_board_id uuid NOT NULL,
    title text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    canvas_block_id uuid
);


--
-- Name: content_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    name text NOT NULL,
    content_type text NOT NULL,
    color text,
    "position" integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT content_groups_content_type_check CHECK ((content_type = ANY (ARRAY['knowledge'::text, 'swipe'::text, 'asset'::text, 'research'::text, 'strategy'::text, 'tool'::text, 'prompt'::text, 'offer'::text, 'role'::text])))
);


--
-- Name: creative_cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.creative_cards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_board_id uuid NOT NULL,
    title text NOT NULL,
    image_url text,
    headline text,
    primary_text text,
    description_text text,
    tags text[] DEFAULT '{}'::text[],
    status text DEFAULT 'AI_DRAFT'::text NOT NULL,
    is_winner boolean DEFAULT false,
    notes text,
    redtrack_metrics jsonb,
    compliance_status text DEFAULT 'unchecked'::text,
    compliance_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT creative_cards_compliance_status_check CHECK ((compliance_status = ANY (ARRAY['unchecked'::text, 'passed'::text, 'flagged'::text]))),
    CONSTRAINT creative_cards_status_check CHECK ((status = ANY (ARRAY['AI_DRAFT'::text, 'REVIEWED'::text, 'READY_TO_LAUNCH'::text, 'LAUNCHED'::text, 'ARCHIVED'::text])))
);


--
-- Name: funnels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.funnels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    name text NOT NULL,
    description text,
    stages jsonb DEFAULT '[]'::jsonb,
    enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    category public.integration_category NOT NULL,
    platform text NOT NULL,
    name text NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_connected boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: knowledge_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knowledge_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    title text NOT NULL,
    content text,
    source_url text,
    tags text[] DEFAULT '{}'::text[],
    enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'in_review'::text NOT NULL,
    group_id uuid,
    CONSTRAINT knowledge_entries_status_check CHECK ((status = ANY (ARRAY['in_review'::text, 'active'::text, 'archived'::text])))
);


--
-- Name: market_research; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_research (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    type public.market_research_type NOT NULL,
    name text NOT NULL,
    content text DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    file_url text,
    prompt text,
    enabled boolean DEFAULT true,
    group_id uuid
);


--
-- Name: offer_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offer_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    offer_id uuid NOT NULL,
    type text NOT NULL,
    url text NOT NULL,
    name text NOT NULL,
    file_size bigint,
    mime_type text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT offer_assets_type_check CHECK ((type = ANY (ARRAY['image'::text, 'video'::text, 'document'::text])))
);


--
-- Name: offers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    name text NOT NULL,
    description text,
    price text,
    discount text,
    guarantee text,
    usp text,
    cta text,
    tags text[] DEFAULT '{}'::text[],
    enabled boolean DEFAULT true,
    group_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: project_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    "position" integer DEFAULT 0,
    color text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: project_strategies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_strategies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    title text NOT NULL,
    content text NOT NULL,
    category text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    group_id uuid
);


--
-- Name: project_tools; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_tools (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    name text NOT NULL,
    description text,
    type text DEFAULT 'custom'::text NOT NULL,
    config jsonb DEFAULT '{}'::jsonb,
    enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    group_id uuid
);


--
-- Name: prompt_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prompt_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    content text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    default_variables jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    enabled boolean DEFAULT true,
    group_id uuid
);


--
-- Name: swipe_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.swipe_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    title text NOT NULL,
    description text,
    image_url text,
    source_url text,
    tags text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    group_id uuid,
    type text DEFAULT 'image'::text NOT NULL,
    text_content text,
    file_url text,
    video_url text,
    parsing_status text DEFAULT 'none'::text,
    CONSTRAINT swipe_files_parsing_status_check CHECK ((parsing_status = ANY (ARRAY['none'::text, 'pending'::text, 'processing'::text, 'completed'::text, 'failed'::text]))),
    CONSTRAINT swipe_files_type_check CHECK ((type = ANY (ARRAY['image'::text, 'text'::text, 'pdf'::text, 'video'::text, 'link'::text, 'document'::text])))
);


--
-- Name: ad_spy_ads ad_spy_ads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_spy_ads
    ADD CONSTRAINT ad_spy_ads_pkey PRIMARY KEY (id);


--
-- Name: ad_spy_board_items ad_spy_board_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_spy_board_items
    ADD CONSTRAINT ad_spy_board_items_pkey PRIMARY KEY (id);


--
-- Name: ad_spy_boards ad_spy_boards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_spy_boards
    ADD CONSTRAINT ad_spy_boards_pkey PRIMARY KEY (id);


--
-- Name: ad_spy_competitors ad_spy_competitors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_spy_competitors
    ADD CONSTRAINT ad_spy_competitors_pkey PRIMARY KEY (id);


--
-- Name: ad_spy_research_agents ad_spy_research_agents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_spy_research_agents
    ADD CONSTRAINT ad_spy_research_agents_pkey PRIMARY KEY (id);


--
-- Name: ad_spy_search_history ad_spy_search_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_spy_search_history
    ADD CONSTRAINT ad_spy_search_history_pkey PRIMARY KEY (id);


--
-- Name: ad_spy_settings ad_spy_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_spy_settings
    ADD CONSTRAINT ad_spy_settings_pkey PRIMARY KEY (id);


--
-- Name: agent_boards agent_boards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_boards
    ADD CONSTRAINT agent_boards_pkey PRIMARY KEY (id);


--
-- Name: ai_roles ai_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_roles
    ADD CONSTRAINT ai_roles_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: board_settings board_settings_agent_board_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_settings
    ADD CONSTRAINT board_settings_agent_board_id_key UNIQUE (agent_board_id);


--
-- Name: board_settings board_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_settings
    ADD CONSTRAINT board_settings_pkey PRIMARY KEY (id);


--
-- Name: board_tools board_tools_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_tools
    ADD CONSTRAINT board_tools_pkey PRIMARY KEY (id);


--
-- Name: canvas_blocks canvas_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canvas_blocks
    ADD CONSTRAINT canvas_blocks_pkey PRIMARY KEY (id);


--
-- Name: canvas_edges canvas_edges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canvas_edges
    ADD CONSTRAINT canvas_edges_pkey PRIMARY KEY (id);


--
-- Name: canvas_groups canvas_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canvas_groups
    ADD CONSTRAINT canvas_groups_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_sessions chat_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_pkey PRIMARY KEY (id);


--
-- Name: content_groups content_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_groups
    ADD CONSTRAINT content_groups_pkey PRIMARY KEY (id);


--
-- Name: creative_cards creative_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creative_cards
    ADD CONSTRAINT creative_cards_pkey PRIMARY KEY (id);


--
-- Name: funnels funnels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funnels
    ADD CONSTRAINT funnels_pkey PRIMARY KEY (id);


--
-- Name: integrations integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT integrations_pkey PRIMARY KEY (id);


--
-- Name: knowledge_entries knowledge_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_entries
    ADD CONSTRAINT knowledge_entries_pkey PRIMARY KEY (id);


--
-- Name: market_research market_research_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_research
    ADD CONSTRAINT market_research_pkey PRIMARY KEY (id);


--
-- Name: offer_assets offer_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_assets
    ADD CONSTRAINT offer_assets_pkey PRIMARY KEY (id);


--
-- Name: offers offers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_pkey PRIMARY KEY (id);


--
-- Name: project_groups project_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_groups
    ADD CONSTRAINT project_groups_pkey PRIMARY KEY (id);


--
-- Name: project_groups project_groups_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_groups
    ADD CONSTRAINT project_groups_slug_key UNIQUE (slug);


--
-- Name: project_strategies project_strategies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_strategies
    ADD CONSTRAINT project_strategies_pkey PRIMARY KEY (id);


--
-- Name: project_tools project_tools_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_tools
    ADD CONSTRAINT project_tools_pkey PRIMARY KEY (id);


--
-- Name: prompt_templates prompt_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prompt_templates
    ADD CONSTRAINT prompt_templates_pkey PRIMARY KEY (id);


--
-- Name: swipe_files swipe_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swipe_files
    ADD CONSTRAINT swipe_files_pkey PRIMARY KEY (id);


--
-- Name: idx_ad_spy_ads_channel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ad_spy_ads_channel ON public.ad_spy_ads USING btree (channel);


--
-- Name: idx_ai_roles_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_roles_enabled ON public.ai_roles USING btree (enabled) WHERE (enabled = true);


--
-- Name: idx_ai_roles_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_roles_project_id ON public.ai_roles USING btree (project_id);


--
-- Name: idx_assets_agent_board_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assets_agent_board_id ON public.assets USING btree (agent_board_id);


--
-- Name: idx_assets_board; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assets_board ON public.assets USING btree (agent_board_id);


--
-- Name: idx_assets_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assets_category ON public.assets USING btree (category);


--
-- Name: idx_assets_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assets_group_id ON public.assets USING btree (group_id);


--
-- Name: idx_assets_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assets_type ON public.assets USING btree (type);


--
-- Name: idx_canvas_blocks_board; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_canvas_blocks_board ON public.canvas_blocks USING btree (agent_board_id);


--
-- Name: idx_canvas_edges_board_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_canvas_edges_board_id ON public.canvas_edges USING btree (agent_board_id);


--
-- Name: idx_canvas_edges_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_canvas_edges_source ON public.canvas_edges USING btree (source_block_id);


--
-- Name: idx_canvas_edges_target; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_canvas_edges_target ON public.canvas_edges USING btree (target_block_id);


--
-- Name: idx_chat_messages_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_session ON public.chat_messages USING btree (chat_session_id);


--
-- Name: idx_chat_sessions_board; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_sessions_board ON public.chat_sessions USING btree (agent_board_id);


--
-- Name: idx_chat_sessions_canvas_block_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_sessions_canvas_block_id ON public.chat_sessions USING btree (canvas_block_id);


--
-- Name: idx_chat_sessions_director; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_sessions_director ON public.chat_sessions USING btree (agent_board_id) WHERE (canvas_block_id IS NULL);


--
-- Name: idx_content_groups_content_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_groups_content_type ON public.content_groups USING btree (content_type);


--
-- Name: idx_content_groups_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_groups_project_id ON public.content_groups USING btree (project_id);


--
-- Name: idx_creative_cards_board; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_creative_cards_board ON public.creative_cards USING btree (agent_board_id);


--
-- Name: idx_creative_cards_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_creative_cards_status ON public.creative_cards USING btree (status);


--
-- Name: idx_knowledge_entries_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_knowledge_entries_group_id ON public.knowledge_entries USING btree (group_id);


--
-- Name: idx_market_research_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_market_research_group_id ON public.market_research USING btree (group_id);


--
-- Name: idx_project_strategies_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_strategies_group_id ON public.project_strategies USING btree (group_id);


--
-- Name: idx_project_tools_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_tools_group_id ON public.project_tools USING btree (group_id);


--
-- Name: idx_prompt_templates_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prompt_templates_group_id ON public.prompt_templates USING btree (group_id);


--
-- Name: idx_swipe_files_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_swipe_files_group_id ON public.swipe_files USING btree (group_id);


--
-- Name: idx_swipe_files_project_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_swipe_files_project_type ON public.swipe_files USING btree (project_id, type);


--
-- Name: idx_swipe_files_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_swipe_files_type ON public.swipe_files USING btree (type);


--
-- Name: ad_spy_ads update_ad_spy_ads_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ad_spy_ads_updated_at BEFORE UPDATE ON public.ad_spy_ads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ad_spy_boards update_ad_spy_boards_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ad_spy_boards_updated_at BEFORE UPDATE ON public.ad_spy_boards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ad_spy_competitors update_ad_spy_competitors_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ad_spy_competitors_updated_at BEFORE UPDATE ON public.ad_spy_competitors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ad_spy_research_agents update_ad_spy_research_agents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ad_spy_research_agents_updated_at BEFORE UPDATE ON public.ad_spy_research_agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ad_spy_settings update_ad_spy_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ad_spy_settings_updated_at BEFORE UPDATE ON public.ad_spy_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: agent_boards update_agent_boards_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_agent_boards_updated_at BEFORE UPDATE ON public.agent_boards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_roles update_ai_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ai_roles_updated_at BEFORE UPDATE ON public.ai_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: app_settings update_app_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: assets update_assets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: board_settings update_board_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_board_settings_updated_at BEFORE UPDATE ON public.board_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: board_tools update_board_tools_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_board_tools_updated_at BEFORE UPDATE ON public.board_tools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: canvas_blocks update_canvas_blocks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_canvas_blocks_updated_at BEFORE UPDATE ON public.canvas_blocks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: canvas_edges update_canvas_edges_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_canvas_edges_updated_at BEFORE UPDATE ON public.canvas_edges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: canvas_groups update_canvas_groups_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_canvas_groups_updated_at BEFORE UPDATE ON public.canvas_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: content_groups update_content_groups_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_content_groups_updated_at BEFORE UPDATE ON public.content_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: creative_cards update_creative_cards_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_creative_cards_updated_at BEFORE UPDATE ON public.creative_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: funnels update_funnels_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_funnels_updated_at BEFORE UPDATE ON public.funnels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: integrations update_integrations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: knowledge_entries update_knowledge_entries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_knowledge_entries_updated_at BEFORE UPDATE ON public.knowledge_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: market_research update_market_research_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_market_research_updated_at BEFORE UPDATE ON public.market_research FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: offers update_offers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: project_groups update_project_groups_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_project_groups_updated_at BEFORE UPDATE ON public.project_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: project_strategies update_project_strategies_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_project_strategies_updated_at BEFORE UPDATE ON public.project_strategies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: project_tools update_project_tools_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_project_tools_updated_at BEFORE UPDATE ON public.project_tools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: prompt_templates update_prompt_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_prompt_templates_updated_at BEFORE UPDATE ON public.prompt_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: swipe_files update_swipe_files_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_swipe_files_updated_at BEFORE UPDATE ON public.swipe_files FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ad_spy_ads ad_spy_ads_competitor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_spy_ads
    ADD CONSTRAINT ad_spy_ads_competitor_id_fkey FOREIGN KEY (competitor_id) REFERENCES public.ad_spy_competitors(id) ON DELETE CASCADE;


--
-- Name: ad_spy_board_items ad_spy_board_items_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_spy_board_items
    ADD CONSTRAINT ad_spy_board_items_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ad_spy_ads(id) ON DELETE CASCADE;


--
-- Name: ad_spy_board_items ad_spy_board_items_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_spy_board_items
    ADD CONSTRAINT ad_spy_board_items_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.ad_spy_boards(id) ON DELETE CASCADE;


--
-- Name: ai_roles ai_roles_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_roles
    ADD CONSTRAINT ai_roles_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.content_groups(id) ON DELETE SET NULL;


--
-- Name: ai_roles ai_roles_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_roles
    ADD CONSTRAINT ai_roles_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.agent_boards(id) ON DELETE CASCADE;


--
-- Name: assets assets_agent_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_agent_board_id_fkey FOREIGN KEY (agent_board_id) REFERENCES public.agent_boards(id) ON DELETE SET NULL;


--
-- Name: assets assets_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.content_groups(id) ON DELETE SET NULL;


--
-- Name: board_settings board_settings_agent_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_settings
    ADD CONSTRAINT board_settings_agent_board_id_fkey FOREIGN KEY (agent_board_id) REFERENCES public.agent_boards(id) ON DELETE CASCADE;


--
-- Name: board_tools board_tools_agent_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_tools
    ADD CONSTRAINT board_tools_agent_board_id_fkey FOREIGN KEY (agent_board_id) REFERENCES public.agent_boards(id) ON DELETE CASCADE;


--
-- Name: canvas_blocks canvas_blocks_agent_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canvas_blocks
    ADD CONSTRAINT canvas_blocks_agent_board_id_fkey FOREIGN KEY (agent_board_id) REFERENCES public.agent_boards(id) ON DELETE CASCADE;


--
-- Name: canvas_blocks canvas_blocks_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canvas_blocks
    ADD CONSTRAINT canvas_blocks_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE SET NULL;


--
-- Name: canvas_blocks canvas_blocks_associated_prompt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canvas_blocks
    ADD CONSTRAINT canvas_blocks_associated_prompt_id_fkey FOREIGN KEY (associated_prompt_id) REFERENCES public.prompt_templates(id) ON DELETE SET NULL;


--
-- Name: canvas_edges canvas_edges_source_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canvas_edges
    ADD CONSTRAINT canvas_edges_source_block_id_fkey FOREIGN KEY (source_block_id) REFERENCES public.canvas_blocks(id) ON DELETE CASCADE;


--
-- Name: canvas_edges canvas_edges_target_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canvas_edges
    ADD CONSTRAINT canvas_edges_target_block_id_fkey FOREIGN KEY (target_block_id) REFERENCES public.canvas_blocks(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_chat_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_chat_session_id_fkey FOREIGN KEY (chat_session_id) REFERENCES public.chat_sessions(id) ON DELETE CASCADE;


--
-- Name: chat_sessions chat_sessions_agent_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_agent_board_id_fkey FOREIGN KEY (agent_board_id) REFERENCES public.agent_boards(id) ON DELETE CASCADE;


--
-- Name: chat_sessions chat_sessions_canvas_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_canvas_block_id_fkey FOREIGN KEY (canvas_block_id) REFERENCES public.canvas_blocks(id) ON DELETE CASCADE;


--
-- Name: content_groups content_groups_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_groups
    ADD CONSTRAINT content_groups_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.agent_boards(id) ON DELETE CASCADE;


--
-- Name: creative_cards creative_cards_agent_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creative_cards
    ADD CONSTRAINT creative_cards_agent_board_id_fkey FOREIGN KEY (agent_board_id) REFERENCES public.agent_boards(id) ON DELETE CASCADE;


--
-- Name: integrations integrations_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT integrations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.agent_boards(id) ON DELETE CASCADE;


--
-- Name: knowledge_entries knowledge_entries_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_entries
    ADD CONSTRAINT knowledge_entries_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.content_groups(id) ON DELETE SET NULL;


--
-- Name: knowledge_entries knowledge_entries_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_entries
    ADD CONSTRAINT knowledge_entries_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.agent_boards(id) ON DELETE CASCADE;


--
-- Name: market_research market_research_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_research
    ADD CONSTRAINT market_research_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.content_groups(id) ON DELETE SET NULL;


--
-- Name: market_research market_research_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_research
    ADD CONSTRAINT market_research_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.agent_boards(id) ON DELETE CASCADE;


--
-- Name: offer_assets offer_assets_offer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_assets
    ADD CONSTRAINT offer_assets_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.offers(id) ON DELETE CASCADE;


--
-- Name: offers offers_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.content_groups(id) ON DELETE SET NULL;


--
-- Name: project_strategies project_strategies_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_strategies
    ADD CONSTRAINT project_strategies_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.content_groups(id) ON DELETE SET NULL;


--
-- Name: project_tools project_tools_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_tools
    ADD CONSTRAINT project_tools_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.content_groups(id) ON DELETE SET NULL;


--
-- Name: prompt_templates prompt_templates_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prompt_templates
    ADD CONSTRAINT prompt_templates_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.content_groups(id) ON DELETE SET NULL;


--
-- Name: swipe_files swipe_files_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swipe_files
    ADD CONSTRAINT swipe_files_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.content_groups(id) ON DELETE SET NULL;


--
-- Name: ad_spy_ads Allow all operations on ad_spy_ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on ad_spy_ads" ON public.ad_spy_ads USING (true) WITH CHECK (true);


--
-- Name: ad_spy_board_items Allow all operations on ad_spy_board_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on ad_spy_board_items" ON public.ad_spy_board_items USING (true) WITH CHECK (true);


--
-- Name: ad_spy_boards Allow all operations on ad_spy_boards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on ad_spy_boards" ON public.ad_spy_boards USING (true) WITH CHECK (true);


--
-- Name: ad_spy_competitors Allow all operations on ad_spy_competitors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on ad_spy_competitors" ON public.ad_spy_competitors USING (true) WITH CHECK (true);


--
-- Name: ad_spy_research_agents Allow all operations on ad_spy_research_agents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on ad_spy_research_agents" ON public.ad_spy_research_agents USING (true) WITH CHECK (true);


--
-- Name: ad_spy_search_history Allow all operations on ad_spy_search_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on ad_spy_search_history" ON public.ad_spy_search_history USING (true) WITH CHECK (true);


--
-- Name: ad_spy_settings Allow all operations on ad_spy_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on ad_spy_settings" ON public.ad_spy_settings USING (true) WITH CHECK (true);


--
-- Name: agent_boards Allow all operations on agent_boards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on agent_boards" ON public.agent_boards USING (true) WITH CHECK (true);


--
-- Name: ai_roles Allow all operations on ai_roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on ai_roles" ON public.ai_roles USING (true) WITH CHECK (true);


--
-- Name: app_settings Allow all operations on app_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on app_settings" ON public.app_settings USING (true) WITH CHECK (true);


--
-- Name: assets Allow all operations on assets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on assets" ON public.assets USING (true) WITH CHECK (true);


--
-- Name: board_settings Allow all operations on board_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on board_settings" ON public.board_settings USING (true) WITH CHECK (true);


--
-- Name: board_tools Allow all operations on board_tools; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on board_tools" ON public.board_tools USING (true) WITH CHECK (true);


--
-- Name: canvas_blocks Allow all operations on canvas_blocks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on canvas_blocks" ON public.canvas_blocks USING (true) WITH CHECK (true);


--
-- Name: canvas_edges Allow all operations on canvas_edges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on canvas_edges" ON public.canvas_edges USING (true) WITH CHECK (true);


--
-- Name: canvas_groups Allow all operations on canvas_groups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on canvas_groups" ON public.canvas_groups USING (true) WITH CHECK (true);


--
-- Name: chat_messages Allow all operations on chat_messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on chat_messages" ON public.chat_messages USING (true) WITH CHECK (true);


--
-- Name: chat_sessions Allow all operations on chat_sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on chat_sessions" ON public.chat_sessions USING (true) WITH CHECK (true);


--
-- Name: content_groups Allow all operations on content_groups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on content_groups" ON public.content_groups USING (true) WITH CHECK (true);


--
-- Name: creative_cards Allow all operations on creative_cards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on creative_cards" ON public.creative_cards USING (true) WITH CHECK (true);


--
-- Name: funnels Allow all operations on funnels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on funnels" ON public.funnels USING (true) WITH CHECK (true);


--
-- Name: integrations Allow all operations on integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on integrations" ON public.integrations USING (true) WITH CHECK (true);


--
-- Name: knowledge_entries Allow all operations on knowledge_entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on knowledge_entries" ON public.knowledge_entries USING (true) WITH CHECK (true);


--
-- Name: market_research Allow all operations on market_research; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on market_research" ON public.market_research USING (true) WITH CHECK (true);


--
-- Name: offer_assets Allow all operations on offer_assets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on offer_assets" ON public.offer_assets USING (true) WITH CHECK (true);


--
-- Name: offers Allow all operations on offers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on offers" ON public.offers USING (true) WITH CHECK (true);


--
-- Name: project_groups Allow all operations on project_groups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on project_groups" ON public.project_groups USING (true) WITH CHECK (true);


--
-- Name: project_strategies Allow all operations on project_strategies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on project_strategies" ON public.project_strategies USING (true) WITH CHECK (true);


--
-- Name: project_tools Allow all operations on project_tools; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on project_tools" ON public.project_tools USING (true) WITH CHECK (true);


--
-- Name: prompt_templates Allow all operations on prompt_templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on prompt_templates" ON public.prompt_templates USING (true) WITH CHECK (true);


--
-- Name: swipe_files Allow all operations on swipe_files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on swipe_files" ON public.swipe_files USING (true) WITH CHECK (true);


--
-- Name: ad_spy_ads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ad_spy_ads ENABLE ROW LEVEL SECURITY;

--
-- Name: ad_spy_board_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ad_spy_board_items ENABLE ROW LEVEL SECURITY;

--
-- Name: ad_spy_boards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ad_spy_boards ENABLE ROW LEVEL SECURITY;

--
-- Name: ad_spy_competitors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ad_spy_competitors ENABLE ROW LEVEL SECURITY;

--
-- Name: ad_spy_research_agents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ad_spy_research_agents ENABLE ROW LEVEL SECURITY;

--
-- Name: ad_spy_search_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ad_spy_search_history ENABLE ROW LEVEL SECURITY;

--
-- Name: ad_spy_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ad_spy_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: agent_boards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agent_boards ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: app_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: assets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

--
-- Name: board_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.board_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: board_tools; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.board_tools ENABLE ROW LEVEL SECURITY;

--
-- Name: canvas_blocks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.canvas_blocks ENABLE ROW LEVEL SECURITY;

--
-- Name: canvas_edges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.canvas_edges ENABLE ROW LEVEL SECURITY;

--
-- Name: canvas_groups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.canvas_groups ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: content_groups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_groups ENABLE ROW LEVEL SECURITY;

--
-- Name: creative_cards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.creative_cards ENABLE ROW LEVEL SECURITY;

--
-- Name: funnels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;

--
-- Name: integrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

--
-- Name: knowledge_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.knowledge_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: market_research; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.market_research ENABLE ROW LEVEL SECURITY;

--
-- Name: offer_assets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.offer_assets ENABLE ROW LEVEL SECURITY;

--
-- Name: offers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

--
-- Name: project_groups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.project_groups ENABLE ROW LEVEL SECURITY;

--
-- Name: project_strategies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.project_strategies ENABLE ROW LEVEL SECURITY;

--
-- Name: project_tools; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.project_tools ENABLE ROW LEVEL SECURITY;

--
-- Name: prompt_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: swipe_files; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.swipe_files ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


