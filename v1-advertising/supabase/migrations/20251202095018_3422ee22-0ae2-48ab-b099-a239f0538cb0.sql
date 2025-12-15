-- Add parsing status to swipe_files table
ALTER TABLE swipe_files 
ADD COLUMN IF NOT EXISTS parsing_status text DEFAULT 'none' 
CHECK (parsing_status IN ('none', 'pending', 'processing', 'completed', 'failed'));

-- Add parsing status to canvas_blocks table  
ALTER TABLE canvas_blocks 
ADD COLUMN IF NOT EXISTS parsing_status text DEFAULT 'none'
CHECK (parsing_status IN ('none', 'pending', 'processing', 'completed', 'failed'));