-- Create n8n_connections table
CREATE TABLE IF NOT EXISTS public.n8n_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('agency', 'client')),
  client_id TEXT,
  label TEXT,
  base_url TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.n8n_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own n8n connections"
  ON public.n8n_connections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own n8n connections"
  ON public.n8n_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own n8n connections"
  ON public.n8n_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own n8n connections"
  ON public.n8n_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_n8n_connections_user_id ON public.n8n_connections(user_id);
CREATE INDEX idx_n8n_connections_scope ON public.n8n_connections(scope);
CREATE INDEX idx_n8n_connections_client_id ON public.n8n_connections(client_id) WHERE client_id IS NOT NULL;