-- Create agent_boards table for advertising projects
CREATE TABLE public.agent_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  goal TEXT,
  default_platform TEXT DEFAULT 'facebook',
  creative_style_notes TEXT,
  budget_cap_note TEXT,
  group_id UUID,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_groups table for organizing projects
CREATE TABLE public.project_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent_chat_sessions for ChatNode persistence
CREATE TABLE public.agent_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_board_id UUID REFERENCES public.agent_boards(id) ON DELETE CASCADE,
  canvas_block_id UUID REFERENCES public.canvas_blocks(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Chat',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent_chat_messages for ChatNode message persistence
CREATE TABLE public.agent_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID NOT NULL REFERENCES public.agent_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key from agent_boards to project_groups
ALTER TABLE public.agent_boards 
ADD CONSTRAINT agent_boards_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES public.project_groups(id) ON DELETE SET NULL;

-- Enable RLS on all tables
ALTER TABLE public.agent_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for agent_boards
CREATE POLICY "agent_boards_select_own" ON public.agent_boards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "agent_boards_insert_own" ON public.agent_boards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "agent_boards_update_own" ON public.agent_boards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "agent_boards_delete_own" ON public.agent_boards FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for project_groups
CREATE POLICY "project_groups_select_own" ON public.project_groups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "project_groups_insert_own" ON public.project_groups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "project_groups_update_own" ON public.project_groups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "project_groups_delete_own" ON public.project_groups FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for agent_chat_sessions
CREATE POLICY "agent_chat_sessions_select_own" ON public.agent_chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "agent_chat_sessions_insert_own" ON public.agent_chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "agent_chat_sessions_update_own" ON public.agent_chat_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "agent_chat_sessions_delete_own" ON public.agent_chat_sessions FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for agent_chat_messages
CREATE POLICY "agent_chat_messages_select_own" ON public.agent_chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "agent_chat_messages_insert_own" ON public.agent_chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_agent_boards_updated_at BEFORE UPDATE ON public.agent_boards FOR EACH ROW EXECUTE FUNCTION public.update_projects_updated_at();
CREATE TRIGGER update_project_groups_updated_at BEFORE UPDATE ON public.project_groups FOR EACH ROW EXECUTE FUNCTION public.update_projects_updated_at();
CREATE TRIGGER update_agent_chat_sessions_updated_at BEFORE UPDATE ON public.agent_chat_sessions FOR EACH ROW EXECUTE FUNCTION public.update_projects_updated_at();