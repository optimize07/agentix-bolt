-- Create tables for Ad Spy functionality

-- Table for Ad Spy runs
CREATE TABLE public.ad_spy_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'scheduled')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'completed', 'failed')),
  time_window_days INTEGER NOT NULL DEFAULT 7,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for top performing ads
CREATE TABLE public.ad_spy_top_performers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.ad_spy_runs(id) ON DELETE CASCADE,
  ad_id TEXT NOT NULL,
  ad_name TEXT NOT NULL,
  ad_account_id TEXT NOT NULL,
  video_url TEXT,
  thumbnail_url TEXT,
  performance_metrics JSONB NOT NULL,
  rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 3),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for AI-generated script iterations
CREATE TABLE public.ad_spy_script_iterations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  top_performer_id UUID NOT NULL REFERENCES public.ad_spy_top_performers(id) ON DELETE CASCADE,
  original_script TEXT NOT NULL,
  original_hooks JSONB NOT NULL,
  original_cta TEXT NOT NULL,
  new_script TEXT NOT NULL,
  new_hooks JSONB NOT NULL,
  new_cta TEXT NOT NULL,
  iteration_rationale TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for scheduled runs
CREATE TABLE public.ad_spy_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  time_of_day TIME NOT NULL,
  time_window_days INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for Facebook ad accounts
CREATE TABLE public.facebook_ad_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, account_id)
);

-- Table for Google Sheets connections
CREATE TABLE public.google_sheets_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spreadsheet_id TEXT NOT NULL,
  spreadsheet_name TEXT NOT NULL,
  service_account_email TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, spreadsheet_id)
);

-- Enable Row Level Security
ALTER TABLE public.ad_spy_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_spy_top_performers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_spy_script_iterations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_spy_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_sheets_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ad_spy_runs
CREATE POLICY "Users can view their own runs"
  ON public.ad_spy_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own runs"
  ON public.ad_spy_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own runs"
  ON public.ad_spy_runs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own runs"
  ON public.ad_spy_runs FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for ad_spy_top_performers
CREATE POLICY "Users can view their own top performers"
  ON public.ad_spy_top_performers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ad_spy_runs
    WHERE ad_spy_runs.id = ad_spy_top_performers.run_id
    AND ad_spy_runs.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own top performers"
  ON public.ad_spy_top_performers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ad_spy_runs
    WHERE ad_spy_runs.id = ad_spy_top_performers.run_id
    AND ad_spy_runs.user_id = auth.uid()
  ));

-- RLS Policies for ad_spy_script_iterations
CREATE POLICY "Users can view their own script iterations"
  ON public.ad_spy_script_iterations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ad_spy_top_performers
    JOIN public.ad_spy_runs ON ad_spy_runs.id = ad_spy_top_performers.run_id
    WHERE ad_spy_top_performers.id = ad_spy_script_iterations.top_performer_id
    AND ad_spy_runs.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own script iterations"
  ON public.ad_spy_script_iterations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ad_spy_top_performers
    JOIN public.ad_spy_runs ON ad_spy_runs.id = ad_spy_top_performers.run_id
    WHERE ad_spy_top_performers.id = ad_spy_script_iterations.top_performer_id
    AND ad_spy_runs.user_id = auth.uid()
  ));

-- RLS Policies for ad_spy_schedules
CREATE POLICY "Users can view their own schedules"
  ON public.ad_spy_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own schedules"
  ON public.ad_spy_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules"
  ON public.ad_spy_schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules"
  ON public.ad_spy_schedules FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for facebook_ad_accounts
CREATE POLICY "Users can view their own Facebook accounts"
  ON public.facebook_ad_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Facebook accounts"
  ON public.facebook_ad_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Facebook accounts"
  ON public.facebook_ad_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Facebook accounts"
  ON public.facebook_ad_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for google_sheets_connections
CREATE POLICY "Users can view their own Google Sheets connections"
  ON public.google_sheets_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Google Sheets connections"
  ON public.google_sheets_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google Sheets connections"
  ON public.google_sheets_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Google Sheets connections"
  ON public.google_sheets_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_ad_spy_runs_user_status ON public.ad_spy_runs(user_id, status);
CREATE INDEX idx_ad_spy_runs_created ON public.ad_spy_runs(created_at DESC);
CREATE INDEX idx_top_performers_run ON public.ad_spy_top_performers(run_id);
CREATE INDEX idx_script_iterations_performer ON public.ad_spy_script_iterations(top_performer_id);
CREATE INDEX idx_schedules_user_active ON public.ad_spy_schedules(user_id, is_active);
CREATE INDEX idx_facebook_accounts_user ON public.facebook_ad_accounts(user_id, is_active);
CREATE INDEX idx_sheets_connections_user ON public.google_sheets_connections(user_id, is_active);

-- Create triggers for updated_at
CREATE TRIGGER update_ad_spy_runs_updated_at
  BEFORE UPDATE ON public.ad_spy_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_market_research_updated_at();

CREATE TRIGGER update_ad_spy_schedules_updated_at
  BEFORE UPDATE ON public.ad_spy_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_market_research_updated_at();

CREATE TRIGGER update_facebook_accounts_updated_at
  BEFORE UPDATE ON public.facebook_ad_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_market_research_updated_at();

CREATE TRIGGER update_sheets_connections_updated_at
  BEFORE UPDATE ON public.google_sheets_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_market_research_updated_at();

-- Enable realtime for status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_spy_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_spy_top_performers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_spy_script_iterations;