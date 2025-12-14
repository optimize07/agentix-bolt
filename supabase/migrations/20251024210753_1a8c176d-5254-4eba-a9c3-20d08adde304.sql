-- Enable required extensions for cron jobs and HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Add execution tracking columns to ad_spy_schedules
ALTER TABLE ad_spy_schedules 
ADD COLUMN IF NOT EXISTS last_executed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS next_execution_at timestamp with time zone;

-- Function to check and trigger scheduled runs
CREATE OR REPLACE FUNCTION check_and_trigger_scheduled_runs()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  schedule_record RECORD;
  current_day INTEGER;
  schedule_time TIME;
  project_url TEXT;
  anon_key TEXT;
  request_id BIGINT;
BEGIN
  -- Get current day (0 = Sunday, 6 = Saturday)
  current_day := EXTRACT(DOW FROM NOW());
  schedule_time := NOW()::TIME;
  
  -- Supabase project details
  project_url := 'https://pooeaxqkysmngpnpnswn.supabase.co';
  anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvb2VheHFreXNtbmdwbnBuc3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNTk3ODgsImV4cCI6MjA3NjgzNTc4OH0.Tx38u656P8LUvpQCH5rp6d5flDtV_f9_vsMEn8cr4FI';
  
  -- Loop through active schedules matching current day and time
  FOR schedule_record IN 
    SELECT * FROM ad_spy_schedules 
    WHERE is_active = true 
      AND day_of_week = current_day
      AND time_of_day >= schedule_time - INTERVAL '1 hour'
      AND time_of_day <= schedule_time + INTERVAL '1 hour'
      AND (last_executed_at IS NULL OR last_executed_at < CURRENT_DATE)
  LOOP
    -- Trigger the edge function via HTTP POST
    SELECT INTO request_id net.http_post(
      url := project_url || '/functions/v1/sentiment-analysis-run',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key
      ),
      body := jsonb_build_object(
        'timeWindowDays', schedule_record.time_window_days,
        'triggerType', 'scheduled',
        'userId', schedule_record.user_id::text
      )
    );
    
    -- Update execution tracking
    UPDATE ad_spy_schedules 
    SET 
      last_executed_at = NOW(),
      next_execution_at = CASE 
        WHEN schedule_record.day_of_week = current_day THEN
          (CURRENT_DATE + INTERVAL '7 days' + schedule_record.time_of_day)::timestamp with time zone
        ELSE
          (CURRENT_DATE + ((schedule_record.day_of_week - current_day + 7) % 7) * INTERVAL '1 day' + schedule_record.time_of_day)::timestamp with time zone
      END,
      updated_at = NOW()
    WHERE id = schedule_record.id;
    
  END LOOP;
END;
$$;

-- Schedule the cron job to run every hour at minute 0
SELECT cron.schedule(
  'check-ad-optimizer-schedules',
  '0 * * * *',
  $$SELECT check_and_trigger_scheduled_runs();$$
);