-- Enable pg_net extension if not enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to trigger the Edge Function
CREATE OR REPLACE FUNCTION public.trigger_rag_indexing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  edge_function_url TEXT;
  service_role_key TEXT;
  payload JSONB;
BEGIN
  -- Get the Edge Function URL and Key from a secure place or hardcode for now (User to configure)
  -- In a real setup, these might be in a secrets table or vault.
  -- We'll assume the user will replace these placeholders or we use a known pattern.
  -- For Supabase managed triggers, this is usually handled by the UI, but here is the SQL approach.
  
  -- REPLACE WITH YOUR PROJECT URL
  edge_function_url := current_setting('app.settings.edge_function_url', true);
  IF edge_function_url IS NULL THEN
    edge_function_url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/rag-indexing';
  END IF;
  
  service_role_key := current_setting('app.settings.service_role_key', true);
  IF service_role_key IS NULL THEN
     -- We can't easily access the service role key from SQL for security reasons usually.
     -- The user might need to set this up in the Dashboard Webhooks UI instead.
     -- HOWEVER, we can rely on the fact that the user asked for the SQL.
     NULL; 
  END IF;

  -- Construct payload
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', row_to_json(NEW),
    'old_record', row_to_json(OLD)
  );

  -- Call the function using pg_net
  -- Note: This requires the service role key to be passed if the function is protected.
  -- If the function is public (not recommended), no key needed.
  
  PERFORM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, 'YOUR_SERVICE_ROLE_KEY')
    ),
    body := payload
  );

  RETURN NEW;
END;
$$;

-- Create the trigger
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

COMMENT ON FUNCTION public.trigger_rag_indexing IS 'Triggers the rag-indexing Edge Function. Requires app.settings.edge_function_url and service_role_key to be set, or manual configuration.';

