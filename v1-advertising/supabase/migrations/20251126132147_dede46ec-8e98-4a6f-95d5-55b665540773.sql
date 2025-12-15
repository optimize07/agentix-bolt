-- Add Facebook Ad Account and RedTrack Workspace columns to agent_boards
ALTER TABLE agent_boards 
ADD COLUMN facebook_ad_account_id TEXT,
ADD COLUMN redtrack_workspace_id TEXT;

-- Add associated_prompt_id column to canvas_blocks for prompt association
ALTER TABLE canvas_blocks 
ADD COLUMN associated_prompt_id UUID REFERENCES prompt_templates(id) ON DELETE SET NULL;