-- Drop the old restrictive constraint
ALTER TABLE canvas_blocks DROP CONSTRAINT IF EXISTS canvas_blocks_type_check;

-- Add new constraint with all frontend block types including chat
ALTER TABLE canvas_blocks ADD CONSTRAINT canvas_blocks_type_check 
  CHECK (type = ANY (ARRAY['image', 'text', 'url', 'doc', 'document', 'video', 'group', 'chat']));