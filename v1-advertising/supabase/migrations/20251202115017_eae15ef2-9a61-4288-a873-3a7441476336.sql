-- Fix search_path security warning for cleanup function
DROP FUNCTION IF EXISTS cleanup_orphaned_data();

CREATE OR REPLACE FUNCTION cleanup_orphaned_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  orphaned_sessions_count INT := 0;
  orphaned_edges_count INT := 0;
  orphaned_blocks_count INT := 0;
BEGIN
  -- 1. Clean orphaned chat sessions (set canvas_block_id to NULL)
  UPDATE chat_sessions
  SET canvas_block_id = NULL
  WHERE canvas_block_id IS NOT NULL
    AND canvas_block_id NOT IN (SELECT id FROM canvas_blocks);
  GET DIAGNOSTICS orphaned_sessions_count = ROW_COUNT;

  -- 2. Delete orphaned edges
  DELETE FROM canvas_edges
  WHERE source_block_id NOT IN (SELECT id FROM canvas_blocks)
     OR target_block_id NOT IN (SELECT id FROM canvas_blocks);
  GET DIAGNOSTICS orphaned_edges_count = ROW_COUNT;

  -- 3. Clean orphaned group references
  UPDATE canvas_blocks
  SET group_id = NULL
  WHERE group_id IS NOT NULL
    AND group_id NOT IN (SELECT id FROM canvas_blocks WHERE type = 'group');
  GET DIAGNOSTICS orphaned_blocks_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'sessions_cleaned', orphaned_sessions_count,
    'edges_deleted', orphaned_edges_count,
    'blocks_cleaned', orphaned_blocks_count
  );
END;
$$;