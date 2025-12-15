-- Add instruction_prompt column to canvas_blocks table
ALTER TABLE canvas_blocks 
ADD COLUMN instruction_prompt TEXT;