-- Add channel column to ad_spy_ads table
ALTER TABLE ad_spy_ads ADD COLUMN IF NOT EXISTS channel text DEFAULT 'facebook';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_ad_spy_ads_channel ON ad_spy_ads(channel);