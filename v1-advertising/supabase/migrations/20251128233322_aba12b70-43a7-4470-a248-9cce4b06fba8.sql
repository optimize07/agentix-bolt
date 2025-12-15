-- Drop the existing constraint
ALTER TABLE canvas_blocks DROP CONSTRAINT IF EXISTS canvas_blocks_type_check;

-- Add new constraint with creative and brain types included
ALTER TABLE canvas_blocks ADD CONSTRAINT canvas_blocks_type_check 
CHECK (type = ANY (ARRAY[
  'image'::text, 
  'text'::text, 
  'url'::text, 
  'doc'::text, 
  'document'::text, 
  'video'::text, 
  'group'::text, 
  'chat'::text,
  'creative'::text,
  'brain'::text
]));