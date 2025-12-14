-- Add visibility column to knowledge_base_items for Agency→Client push workflow
ALTER TABLE public.knowledge_base_items 
ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'internal_only' 
CHECK (visibility IN ('internal_only', 'client_ready', 'published'));

-- Create asset_client_assignments table to track pushed assets
CREATE TABLE public.asset_client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type TEXT NOT NULL CHECK (asset_type IN ('knowledge_base', 'template', 'offer', 'swipe')),
  asset_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  pushed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  pushed_by UUID NOT NULL,
  is_copy BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(asset_type, asset_id, client_id)
);

-- Enable RLS
ALTER TABLE public.asset_client_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for asset_client_assignments
CREATE POLICY "Users can view their own asset assignments"
ON public.asset_client_assignments
FOR SELECT
USING (auth.uid() = pushed_by);

CREATE POLICY "Users can create their own asset assignments"
ON public.asset_client_assignments
FOR INSERT
WITH CHECK (auth.uid() = pushed_by);

CREATE POLICY "Users can update their own asset assignments"
ON public.asset_client_assignments
FOR UPDATE
USING (auth.uid() = pushed_by);

CREATE POLICY "Users can delete their own asset assignments"
ON public.asset_client_assignments
FOR DELETE
USING (auth.uid() = pushed_by);

-- Add index for faster lookups
CREATE INDEX idx_asset_client_assignments_client ON public.asset_client_assignments(client_id);
CREATE INDEX idx_asset_client_assignments_asset ON public.asset_client_assignments(asset_type, asset_id);