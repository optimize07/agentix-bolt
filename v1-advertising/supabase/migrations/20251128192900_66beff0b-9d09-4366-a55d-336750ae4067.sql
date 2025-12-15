-- Drop the existing constraint that's missing 'offer' and 'role'
ALTER TABLE content_groups DROP CONSTRAINT IF EXISTS content_groups_content_type_check;

-- Add new constraint with all content types including 'offer' and 'role'
ALTER TABLE content_groups ADD CONSTRAINT content_groups_content_type_check 
CHECK (content_type = ANY (ARRAY[
  'knowledge', 'swipe', 'asset', 'research', 'strategy', 'tool', 'prompt', 'offer', 'role'
]));