-- Enhance schema to match source repository (agentix-marketing) features
-- This adds columns that exist in the source but were missing in the destination

-- =============================================================================
-- ASSETS TABLE ENHANCEMENTS
-- Add columns for better asset management and metadata
-- =============================================================================

-- Add description column for asset descriptions
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add category column for organizing assets
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Add file metadata columns
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS file_size BIGINT;

ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS mime_type TEXT;

ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add scraped content for URL-based assets
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS scraped_content TEXT;

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_assets_category ON public.assets(category);

-- =============================================================================
-- CHAT_SESSIONS TABLE ENHANCEMENTS  
-- Add columns to link chat sessions to agent projects and canvas
-- =============================================================================

-- Add agent_board_id to link chats to specific agent projects
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS agent_board_id UUID REFERENCES public.agent_boards(id) ON DELETE SET NULL;

-- Add canvas_block_id to link chats to specific canvas blocks
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS canvas_block_id UUID REFERENCES public.canvas_blocks(id) ON DELETE SET NULL;

-- Create indexes for the new foreign keys
CREATE INDEX IF NOT EXISTS idx_chat_sessions_agent_board_id ON public.chat_sessions(agent_board_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_canvas_block_id ON public.chat_sessions(canvas_block_id);

-- =============================================================================
-- SCHEDULED_POSTS TABLE ENHANCEMENTS
-- Add columns to link to agent projects and creative cards
-- =============================================================================

-- Add agent_board_id to link scheduled posts to agent projects
ALTER TABLE public.scheduled_posts 
ADD COLUMN IF NOT EXISTS agent_board_id UUID REFERENCES public.agent_boards(id) ON DELETE SET NULL;

-- Add creative_card_id to link scheduled posts to creative cards
ALTER TABLE public.scheduled_posts 
ADD COLUMN IF NOT EXISTS creative_card_id UUID REFERENCES public.creative_cards(id) ON DELETE SET NULL;

-- Create indexes for the new foreign keys
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_agent_board_id ON public.scheduled_posts(agent_board_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_creative_card_id ON public.scheduled_posts(creative_card_id);

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON COLUMN public.assets.description IS 'Human-readable description of the asset';
COMMENT ON COLUMN public.assets.category IS 'Category for organizing assets (e.g., general, branding, templates)';
COMMENT ON COLUMN public.assets.file_size IS 'File size in bytes for uploaded assets';
COMMENT ON COLUMN public.assets.mime_type IS 'MIME type of the asset file';
COMMENT ON COLUMN public.assets.thumbnail_url IS 'URL to a thumbnail preview of the asset';
COMMENT ON COLUMN public.assets.scraped_content IS 'Scraped/extracted content for URL-based assets';

COMMENT ON COLUMN public.chat_sessions.agent_board_id IS 'Links chat session to a specific agent project board';
COMMENT ON COLUMN public.chat_sessions.canvas_block_id IS 'Links chat session to a specific canvas block';

COMMENT ON COLUMN public.scheduled_posts.agent_board_id IS 'Links scheduled post to a specific agent project board';
COMMENT ON COLUMN public.scheduled_posts.creative_card_id IS 'Links scheduled post to a specific creative card';







