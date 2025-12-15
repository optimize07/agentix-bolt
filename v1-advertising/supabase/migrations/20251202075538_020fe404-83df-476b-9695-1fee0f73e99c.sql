-- Drop existing CHECK constraint on swipe_files type column
ALTER TABLE swipe_files DROP CONSTRAINT IF EXISTS swipe_files_type_check;

-- Add new CHECK constraint including 'document' type
ALTER TABLE swipe_files ADD CONSTRAINT swipe_files_type_check 
CHECK (type = ANY (ARRAY['image'::text, 'text'::text, 'pdf'::text, 'video'::text, 'link'::text, 'document'::text]));