-- Create market research reports table
CREATE TABLE public.market_research_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  company_website TEXT NOT NULL,
  competitor_links JSONB NOT NULL,
  product_description TEXT NOT NULL,
  client_avatar_description TEXT NOT NULL,
  report_content TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE public.market_research_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own reports"
  ON public.market_research_reports
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reports"
  ON public.market_research_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports"
  ON public.market_research_reports
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
  ON public.market_research_reports
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_market_research_user_id ON public.market_research_reports(user_id);
CREATE INDEX idx_market_research_status ON public.market_research_reports(status);
CREATE INDEX idx_market_research_created_at ON public.market_research_reports(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_market_research_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_market_research_reports_updated_at
  BEFORE UPDATE ON public.market_research_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_market_research_updated_at();

-- Enable realtime for status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.market_research_reports;