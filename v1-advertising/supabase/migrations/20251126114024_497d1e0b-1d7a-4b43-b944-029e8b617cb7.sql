-- Enable RLS on all tables
ALTER TABLE public.agent_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_blocks ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for single-tenant access (no auth required)
-- AgentBoards policies
CREATE POLICY "Allow all operations on agent_boards" ON public.agent_boards FOR ALL USING (true) WITH CHECK (true);

-- CreativeCards policies
CREATE POLICY "Allow all operations on creative_cards" ON public.creative_cards FOR ALL USING (true) WITH CHECK (true);

-- Assets policies
CREATE POLICY "Allow all operations on assets" ON public.assets FOR ALL USING (true) WITH CHECK (true);

-- PromptTemplates policies
CREATE POLICY "Allow all operations on prompt_templates" ON public.prompt_templates FOR ALL USING (true) WITH CHECK (true);

-- ChatSessions policies
CREATE POLICY "Allow all operations on chat_sessions" ON public.chat_sessions FOR ALL USING (true) WITH CHECK (true);

-- ChatMessages policies
CREATE POLICY "Allow all operations on chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);

-- BoardSettings policies
CREATE POLICY "Allow all operations on board_settings" ON public.board_settings FOR ALL USING (true) WITH CHECK (true);

-- CanvasBlocks policies
CREATE POLICY "Allow all operations on canvas_blocks" ON public.canvas_blocks FOR ALL USING (true) WITH CHECK (true);