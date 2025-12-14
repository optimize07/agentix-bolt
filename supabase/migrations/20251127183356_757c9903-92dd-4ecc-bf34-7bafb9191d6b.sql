-- Enable pg_net extension if not enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create a function to trigger the Edge Function
CREATE OR REPLACE FUNCTION public.trigger_rag_indexing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  edge_function_url TEXT;
  payload JSONB;
BEGIN
  -- Use the project's edge function URL
  edge_function_url := 'https://pooeaxqkysmngpnpnswn.supabase.co/functions/v1/rag-indexing';
  
  -- Construct payload
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END,
    'old_record', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD) END
  );

  -- Call the function using pg_net (function is public, no auth needed for internal calls)
  PERFORM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := payload
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create the triggers
DROP TRIGGER IF EXISTS trigger_rag_indexing_insert_update ON public.knowledge_base_items;

CREATE TRIGGER trigger_rag_indexing_insert_update
  AFTER INSERT OR UPDATE OF file_path
  ON public.knowledge_base_items
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_rag_indexing();

DROP TRIGGER IF EXISTS trigger_rag_indexing_delete ON public.knowledge_base_items;

CREATE TRIGGER trigger_rag_indexing_delete
  AFTER DELETE
  ON public.knowledge_base_items
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_rag_indexing();

COMMENT ON FUNCTION public.trigger_rag_indexing IS 'Triggers the rag-indexing Edge Function when knowledge base items are modified.';