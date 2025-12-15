-- Add assessment configuration columns to ad_spy_settings
ALTER TABLE ad_spy_settings
ADD COLUMN IF NOT EXISTS last_assessment_at TIMESTAMP WITH TIME ZONE;

-- Update breakout_rules structure comment
COMMENT ON COLUMN ad_spy_settings.breakout_rules IS 'Stores assessment configuration including assessment_interval_days and min_likes_threshold';