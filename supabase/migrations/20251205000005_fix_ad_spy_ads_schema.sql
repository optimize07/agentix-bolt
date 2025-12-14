-- =====================================================
-- Fix ad_spy_ads Schema
-- The original migration created ad_spy_ads with a different schema.
-- This migration adds the missing columns needed for the fork merge.
-- =====================================================

-- Add missing columns to ad_spy_ads
DO $$
BEGIN
  -- Add competitor_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_spy_ads' 
    AND column_name = 'competitor_id'
  ) THEN
    ALTER TABLE public.ad_spy_ads ADD COLUMN competitor_id UUID REFERENCES public.ad_spy_competitors(id) ON DELETE CASCADE;
  END IF;

  -- Add title if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_spy_ads' 
    AND column_name = 'title'
  ) THEN
    ALTER TABLE public.ad_spy_ads ADD COLUMN title TEXT;
    -- Set default title from ad_copy if it exists
    UPDATE public.ad_spy_ads SET title = COALESCE(LEFT(ad_copy, 100), 'Untitled Ad') WHERE title IS NULL;
    ALTER TABLE public.ad_spy_ads ALTER COLUMN title SET NOT NULL;
    ALTER TABLE public.ad_spy_ads ALTER COLUMN title SET DEFAULT 'Untitled Ad';
  END IF;

  -- Add hook if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_spy_ads' 
    AND column_name = 'hook'
  ) THEN
    ALTER TABLE public.ad_spy_ads ADD COLUMN hook TEXT;
  END IF;

  -- Add media_type if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_spy_ads' 
    AND column_name = 'media_type'
  ) THEN
    ALTER TABLE public.ad_spy_ads ADD COLUMN media_type TEXT NOT NULL DEFAULT 'image';
  END IF;

  -- Add media_url if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_spy_ads' 
    AND column_name = 'media_url'
  ) THEN
    ALTER TABLE public.ad_spy_ads ADD COLUMN media_url TEXT;
    -- Copy from image_url or video_url if they exist
    UPDATE public.ad_spy_ads SET media_url = COALESCE(image_url, video_url) WHERE media_url IS NULL;
  END IF;

  -- Add thumbnail_url if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_spy_ads' 
    AND column_name = 'thumbnail_url'
  ) THEN
    ALTER TABLE public.ad_spy_ads ADD COLUMN thumbnail_url TEXT;
  END IF;

  -- Add landing_page_url if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_spy_ads' 
    AND column_name = 'landing_page_url'
  ) THEN
    ALTER TABLE public.ad_spy_ads ADD COLUMN landing_page_url TEXT;
  END IF;

  -- Add duration_days if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_spy_ads' 
    AND column_name = 'duration_days'
  ) THEN
    ALTER TABLE public.ad_spy_ads ADD COLUMN duration_days INTEGER;
  END IF;

  -- Add first_seen_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_spy_ads' 
    AND column_name = 'first_seen_at'
  ) THEN
    ALTER TABLE public.ad_spy_ads ADD COLUMN first_seen_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add last_seen_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_spy_ads' 
    AND column_name = 'last_seen_at'
  ) THEN
    ALTER TABLE public.ad_spy_ads ADD COLUMN last_seen_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add status if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_spy_ads' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.ad_spy_ads ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
  END IF;

  -- Add metrics if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_spy_ads' 
    AND column_name = 'metrics'
  ) THEN
    ALTER TABLE public.ad_spy_ads ADD COLUMN metrics JSONB DEFAULT '{}';
  END IF;

  -- Add is_breakout if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_spy_ads' 
    AND column_name = 'is_breakout'
  ) THEN
    ALTER TABLE public.ad_spy_ads ADD COLUMN is_breakout BOOLEAN DEFAULT false;
  END IF;

  -- Add channel if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_spy_ads' 
    AND column_name = 'channel'
  ) THEN
    ALTER TABLE public.ad_spy_ads ADD COLUMN channel TEXT DEFAULT 'facebook';
    -- Copy from platform if it exists
    UPDATE public.ad_spy_ads SET channel = platform WHERE channel IS NULL AND platform IS NOT NULL;
  END IF;

  -- Add updated_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_spy_ads' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.ad_spy_ads ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
  END IF;

END $$;

-- Create index on channel if column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_spy_ads' 
    AND column_name = 'channel'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_ad_spy_ads_channel ON public.ad_spy_ads(channel);
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_spy_ads' 
    AND column_name = 'competitor_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_ad_spy_ads_competitor ON public.ad_spy_ads(competitor_id);
  END IF;
END $$;

-- Create/update updated_at trigger
DROP TRIGGER IF EXISTS update_ad_spy_ads_updated_at ON public.ad_spy_ads;
CREATE TRIGGER update_ad_spy_ads_updated_at
BEFORE UPDATE ON public.ad_spy_ads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fix project_groups unique constraint on slug (make it non-unique or per-user)
-- Drop the old unique constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'project_groups_slug_key' 
    AND conrelid = 'public.project_groups'::regclass
  ) THEN
    ALTER TABLE public.project_groups DROP CONSTRAINT project_groups_slug_key;
  END IF;
END $$;

-- Add a composite unique constraint (slug + user_id) if user_id column exists
-- Otherwise just make slug non-unique (which is the default after dropping the constraint)

