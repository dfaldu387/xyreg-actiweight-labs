
-- Create document_stars table for users to favorite CI documents
CREATE TABLE public.document_stars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.phase_assigned_document_template(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, document_id)
);

-- Enable RLS
ALTER TABLE public.document_stars ENABLE ROW LEVEL SECURITY;

-- Users can only see their own stars
CREATE POLICY "Users can view own stars"
  ON public.document_stars FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can star documents
CREATE POLICY "Users can insert own stars"
  ON public.document_stars FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can unstar documents
CREATE POLICY "Users can delete own stars"
  ON public.document_stars FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
