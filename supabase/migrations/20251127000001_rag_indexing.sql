-- Add Google File Search columns to knowledge_base_items

-- Enum for indexing status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kb_indexing_status') THEN
    CREATE TYPE kb_indexing_status AS ENUM ('pending', 'processing', 'indexed', 'failed');
  END IF;
END
$$;

ALTER TABLE public.knowledge_base_items
ADD COLUMN IF NOT EXISTS google_file_name TEXT,
ADD COLUMN IF NOT EXISTS google_store_id TEXT,
ADD COLUMN IF NOT EXISTS indexing_status kb_indexing_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS google_error TEXT;

-- Index for faster lookup of pending items
CREATE INDEX IF NOT EXISTS idx_kb_items_indexing_status ON public.knowledge_base_items(indexing_status);
CREATE INDEX IF NOT EXISTS idx_kb_items_google_store ON public.knowledge_base_items(google_store_id);

-- Add trigger to reset indexing status when file is updated
CREATE OR REPLACE FUNCTION public.reset_kb_indexing_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If file_path or content fields changed, reset indexing
  IF (OLD.file_path IS DISTINCT FROM NEW.file_path) OR 
     (OLD.title IS DISTINCT FROM NEW.title) OR 
     (OLD.description IS DISTINCT FROM NEW.description) THEN
     NEW.indexing_status := 'pending';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_kb_items_reset_indexing
  BEFORE UPDATE ON public.knowledge_base_items
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_kb_indexing_status();

-- Comment on columns
COMMENT ON COLUMN public.knowledge_base_items.google_file_name IS 'Resource name returned by Google File Search (files/...)';
COMMENT ON COLUMN public.knowledge_base_items.google_store_id IS 'ID of the Google File Store this item belongs to';
COMMENT ON COLUMN public.knowledge_base_items.indexing_status IS 'Current status of RAG indexing';

