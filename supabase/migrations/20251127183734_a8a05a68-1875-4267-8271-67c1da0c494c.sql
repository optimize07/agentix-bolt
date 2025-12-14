-- Add columns for Google Search indexing
ALTER TABLE public.knowledge_base_items 
ADD COLUMN IF NOT EXISTS google_search_indexed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS google_search_indexed_at timestamp with time zone;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_kb_items_google_search_indexed 
ON public.knowledge_base_items(google_search_indexed) 
WHERE google_search_indexed = true;