-- Create AgentBoard table
CREATE TABLE public.agent_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  goal TEXT,
  default_platform TEXT DEFAULT 'Meta/Facebook',
  budget_cap_note TEXT,
  creative_style_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create CreativeCard table
CREATE TABLE public.creative_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_board_id UUID NOT NULL REFERENCES public.agent_boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  image_url TEXT,
  headline TEXT,
  primary_text TEXT,
  description_text TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'AI_DRAFT' CHECK (status IN ('AI_DRAFT', 'REVIEWED', 'READY_TO_LAUNCH', 'LAUNCHED', 'ARCHIVED')),
  is_winner BOOLEAN DEFAULT false,
  notes TEXT,
  redtrack_metrics JSONB,
  compliance_status TEXT DEFAULT 'unchecked' CHECK (compliance_status IN ('unchecked', 'passed', 'flagged')),
  compliance_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Asset table
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'text', 'url', 'doc')),
  url_or_path TEXT,
  text_content TEXT,
  tags TEXT[] DEFAULT '{}',
  niche_tag TEXT,
  agent_board_id UUID REFERENCES public.agent_boards(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create PromptTemplate table
CREATE TABLE public.prompt_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  default_variables JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ChatSession table
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_board_id UUID NOT NULL REFERENCES public.agent_boards(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ChatMessage table for storing chat history
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create BoardSettings table
CREATE TABLE public.board_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_board_id UUID NOT NULL UNIQUE REFERENCES public.agent_boards(id) ON DELETE CASCADE,
  nanobanan_api_key TEXT,
  redtrack_api_key TEXT,
  composio_config_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create CanvasBlock table for Canvas functionality
CREATE TABLE public.canvas_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_board_id UUID NOT NULL REFERENCES public.agent_boards(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'text', 'url', 'doc')),
  content TEXT,
  asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  width INTEGER DEFAULT 200,
  height INTEGER DEFAULT 200,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_creative_cards_board ON public.creative_cards(agent_board_id);
CREATE INDEX idx_creative_cards_status ON public.creative_cards(status);
CREATE INDEX idx_assets_board ON public.assets(agent_board_id);
CREATE INDEX idx_assets_type ON public.assets(type);
CREATE INDEX idx_chat_sessions_board ON public.chat_sessions(agent_board_id);
CREATE INDEX idx_chat_messages_session ON public.chat_messages(chat_session_id);
CREATE INDEX idx_canvas_blocks_board ON public.canvas_blocks(agent_board_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_agent_boards_updated_at
BEFORE UPDATE ON public.agent_boards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creative_cards_updated_at
BEFORE UPDATE ON public.creative_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
BEFORE UPDATE ON public.assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prompt_templates_updated_at
BEFORE UPDATE ON public.prompt_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_board_settings_updated_at
BEFORE UPDATE ON public.board_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_canvas_blocks_updated_at
BEFORE UPDATE ON public.canvas_blocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();