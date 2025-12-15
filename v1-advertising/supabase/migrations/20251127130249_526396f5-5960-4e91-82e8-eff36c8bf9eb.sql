-- Add status column to knowledge_entries table
ALTER TABLE knowledge_entries 
ADD COLUMN status text NOT NULL DEFAULT 'in_review';

-- Add check constraint for valid status values
ALTER TABLE knowledge_entries
ADD CONSTRAINT knowledge_entries_status_check 
CHECK (status IN ('in_review', 'active', 'archived'));

-- Update existing entries to 'active' status (assuming they were already approved)
UPDATE knowledge_entries 
SET status = 'active' 
WHERE status = 'in_review';