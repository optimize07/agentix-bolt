-- Create function for atomic chat session branching
CREATE OR REPLACE FUNCTION public.branch_chat_session(
  p_board_id UUID,
  p_block_id UUID,
  p_title TEXT,
  p_messages JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_session_id UUID;
  v_message JSONB;
BEGIN
  -- Create new session
  INSERT INTO chat_sessions (agent_board_id, canvas_block_id, title)
  VALUES (p_board_id, p_block_id, p_title)
  RETURNING id INTO v_new_session_id;
  
  -- Insert messages in a single atomic operation
  FOR v_message IN SELECT * FROM jsonb_array_elements(p_messages)
  LOOP
    INSERT INTO chat_messages (chat_session_id, role, content, metadata)
    VALUES (
      v_new_session_id,
      v_message->>'role',
      v_message->>'content',
      CASE 
        WHEN v_message->'metadata' IS NOT NULL THEN v_message->'metadata'
        ELSE NULL
      END
    );
  END LOOP;
  
  RETURN v_new_session_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback is automatic on exception
    RAISE;
END;
$$;

-- Create function to extract image URLs from session messages
CREATE OR REPLACE FUNCTION public.get_session_image_urls(p_session_id UUID)
RETURNS TABLE (image_url TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT jsonb_array_elements_text(metadata->'images')
  FROM chat_messages
  WHERE chat_session_id = p_session_id
    AND metadata ? 'images'
    AND jsonb_typeof(metadata->'images') = 'array';
END;
$$;