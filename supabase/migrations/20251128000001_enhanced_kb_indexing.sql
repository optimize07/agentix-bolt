-- Enhanced Knowledge Base Indexing with Google Search Integration
-- This migration adds support for Google Search API indexing and enhanced metadata

-- Add new columns to knowledge_base_items for Google Search indexing
ALTER TABLE knowledge_base_items
ADD COLUMN IF NOT EXISTS google_search_indexed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS google_search_indexed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS google_search_error TEXT,
ADD COLUMN IF NOT EXISTS last_queried_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS query_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS relevance_score FLOAT,
ADD COLUMN IF NOT EXISTS content_hash TEXT,
ADD COLUMN IF NOT EXISTS indexed_content_length INTEGER;

-- Create index on Google Search indexed status
CREATE INDEX IF NOT EXISTS idx_kb_google_search_indexed
ON knowledge_base_items(google_search_indexed)
WHERE google_search_indexed = TRUE;

-- Create index on last queried for analytics
CREATE INDEX IF NOT EXISTS idx_kb_last_queried
ON knowledge_base_items(last_queried_at DESC);

-- Create index on query count for popularity tracking
CREATE INDEX IF NOT EXISTS idx_kb_query_count
ON knowledge_base_items(query_count DESC);

-- Create a view for knowledge base analytics
CREATE OR REPLACE VIEW knowledge_base_analytics AS
SELECT
  scope,
  client_id,
  category,
  COUNT(*) as total_items,
  COUNT(*) FILTER (WHERE indexing_status = 'indexed') as indexed_items,
  COUNT(*) FILTER (WHERE google_search_indexed = TRUE) as google_indexed_items,
  COUNT(*) FILTER (WHERE indexing_status = 'processing') as processing_items,
  COUNT(*) FILTER (WHERE indexing_status = 'failed') as failed_items,
  SUM(query_count) as total_queries,
  AVG(relevance_score) as avg_relevance,
  MAX(last_queried_at) as last_query_time,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM knowledge_base_items
WHERE is_archived = FALSE
GROUP BY scope, client_id, category;

-- Create a function to update query statistics
CREATE OR REPLACE FUNCTION update_kb_query_stats(
  item_id UUID,
  new_relevance_score FLOAT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE knowledge_base_items
  SET
    last_queried_at = NOW(),
    query_count = query_count + 1,
    relevance_score = CASE
      WHEN new_relevance_score IS NOT NULL THEN new_relevance_score
      ELSE relevance_score
    END
  WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to calculate content hash for change detection
CREATE OR REPLACE FUNCTION calculate_content_hash(item_id UUID)
RETURNS TEXT AS $$
DECLARE
  item_record RECORD;
  content_to_hash TEXT;
BEGIN
  SELECT title, description, metadata INTO item_record
  FROM knowledge_base_items
  WHERE id = item_id;

  content_to_hash := COALESCE(item_record.title, '') ||
                     COALESCE(item_record.description, '') ||
                     COALESCE(item_record.metadata::TEXT, '');

  RETURN md5(content_to_hash);
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update content hash on changes
CREATE OR REPLACE FUNCTION auto_update_content_hash()
RETURNS TRIGGER AS $$
BEGIN
  NEW.content_hash := md5(
    COALESCE(NEW.title, '') ||
    COALESCE(NEW.description, '') ||
    COALESCE(NEW.metadata::TEXT, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_update_content_hash
BEFORE INSERT OR UPDATE OF title, description, metadata ON knowledge_base_items
FOR EACH ROW
EXECUTE FUNCTION auto_update_content_hash();

-- Create a function to get related knowledge base items based on tags and category
CREATE OR REPLACE FUNCTION get_related_kb_items(
  item_id UUID,
  max_results INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category kb_category,
  relevance_score FLOAT,
  shared_tags INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH source_item AS (
    SELECT tags, category, scope, client_id
    FROM knowledge_base_items
    WHERE knowledge_base_items.id = item_id
  )
  SELECT
    kb.id,
    kb.title,
    kb.category,
    kb.relevance_score,
    (
      SELECT COUNT(*)
      FROM unnest(kb.tags) tag
      WHERE tag = ANY((SELECT tags FROM source_item))
    )::INTEGER as shared_tags
  FROM knowledge_base_items kb, source_item s
  WHERE kb.id != item_id
    AND kb.is_archived = FALSE
    AND kb.indexing_status = 'indexed'
    AND (
      -- Same category
      kb.category = s.category
      OR
      -- Shared tags
      kb.tags && s.tags
      OR
      -- Same scope and client
      (kb.scope = s.scope AND kb.client_id = s.client_id)
    )
  ORDER BY
    shared_tags DESC,
    kb.relevance_score DESC NULLS LAST,
    kb.query_count DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Create a function to search knowledge base with full-text search
CREATE OR REPLACE FUNCTION search_knowledge_base(
  search_query TEXT,
  filter_scope TEXT DEFAULT NULL,
  filter_client_id UUID DEFAULT NULL,
  filter_category kb_category DEFAULT NULL,
  max_results INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category kb_category,
  scope TEXT,
  tags TEXT[],
  relevance FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.description,
    kb.category,
    kb.scope::TEXT,
    kb.tags,
    ts_rank(
      to_tsvector('english',
        COALESCE(kb.title, '') || ' ' ||
        COALESCE(kb.description, '') || ' ' ||
        COALESCE(array_to_string(kb.tags, ' '), '')
      ),
      plainto_tsquery('english', search_query)
    ) as relevance
  FROM knowledge_base_items kb
  WHERE kb.is_archived = FALSE
    AND kb.indexing_status = 'indexed'
    AND (filter_scope IS NULL OR kb.scope = filter_scope)
    AND (filter_client_id IS NULL OR kb.client_id = filter_client_id)
    AND (filter_category IS NULL OR kb.category = filter_category)
    AND (
      to_tsvector('english',
        COALESCE(kb.title, '') || ' ' ||
        COALESCE(kb.description, '') || ' ' ||
        COALESCE(array_to_string(kb.tags, ' '), '')
      ) @@ plainto_tsquery('english', search_query)
    )
  ORDER BY relevance DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Create an immutable wrapper function for the full-text search index
-- This is needed because to_tsvector with a config parameter is not marked as IMMUTABLE
CREATE OR REPLACE FUNCTION kb_search_vector(title TEXT, description TEXT, tags TEXT[])
RETURNS tsvector
LANGUAGE SQL
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT to_tsvector('english',
    COALESCE(title, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(array_to_string(tags, ' '), '')
  );
$$;

-- Create full-text search index on knowledge base items using the immutable function
DROP INDEX IF EXISTS idx_kb_fulltext_search;
CREATE INDEX idx_kb_fulltext_search
ON knowledge_base_items
USING gin(kb_search_vector(title, description, tags));

-- Add comments for documentation
COMMENT ON COLUMN knowledge_base_items.google_search_indexed IS 'Whether the item has been indexed in Google Search API';
COMMENT ON COLUMN knowledge_base_items.google_search_indexed_at IS 'When the item was last indexed in Google Search';
COMMENT ON COLUMN knowledge_base_items.google_search_error IS 'Error message if Google Search indexing failed';
COMMENT ON COLUMN knowledge_base_items.last_queried_at IS 'Last time this item was included in a query';
COMMENT ON COLUMN knowledge_base_items.query_count IS 'Number of times this item has been queried';
COMMENT ON COLUMN knowledge_base_items.relevance_score IS 'Calculated relevance score based on usage and content';
COMMENT ON COLUMN knowledge_base_items.content_hash IS 'MD5 hash of content for change detection';
COMMENT ON COLUMN knowledge_base_items.indexed_content_length IS 'Length of indexed content in characters';

COMMENT ON FUNCTION update_kb_query_stats IS 'Updates query statistics when an item is accessed';
COMMENT ON FUNCTION get_related_kb_items IS 'Returns related knowledge base items based on tags and category';
COMMENT ON FUNCTION search_knowledge_base IS 'Full-text search across knowledge base with filters';
COMMENT ON VIEW knowledge_base_analytics IS 'Aggregated analytics for knowledge base items';
