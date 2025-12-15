-- Add canvas_block_id column to chat_sessions to separate Director chat from Canvas Node chats
-- canvas_block_id = NULL means it's a Director (Main Chat) session
-- canvas_block_id = {block_id} means it's a Canvas Node chat session tied to that specific block

ALTER TABLE chat_sessions 
ADD COLUMN canvas_block_id uuid REFERENCES canvas_blocks(id) ON DELETE CASCADE;

-- Add index for performance when filtering by canvas_block_id
CREATE INDEX idx_chat_sessions_canvas_block_id ON chat_sessions(canvas_block_id);

-- Add index for filtering director sessions (where canvas_block_id IS NULL)
CREATE INDEX idx_chat_sessions_director ON chat_sessions(agent_board_id) WHERE canvas_block_id IS NULL;