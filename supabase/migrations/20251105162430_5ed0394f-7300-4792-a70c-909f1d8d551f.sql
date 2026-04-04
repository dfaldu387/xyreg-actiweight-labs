-- Create table for company venture blueprints
CREATE TABLE IF NOT EXISTS public.company_venture_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  activity_notes JSONB DEFAULT '{}'::jsonb,
  activity_files JSONB DEFAULT '{}'::jsonb,
  completed_activities INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_company_blueprint UNIQUE (company_id)
);

-- Create table for blueprint comments
CREATE TABLE IF NOT EXISTS public.blueprint_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  activity_id INTEGER NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_venture_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprint_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_venture_blueprints
CREATE POLICY "Users can view blueprints for their company"
  ON public.company_venture_blueprints
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert blueprints for their company"
  ON public.company_venture_blueprints
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update blueprints for their company"
  ON public.company_venture_blueprints
  FOR UPDATE
  USING (true);

-- RLS Policies for blueprint_comments
CREATE POLICY "Users can view all comments"
  ON public.blueprint_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own comments"
  ON public.blueprint_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.blueprint_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.blueprint_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_venture_blueprints_company_id 
  ON public.company_venture_blueprints(company_id);

CREATE INDEX IF NOT EXISTS idx_blueprint_comments_company_id 
  ON public.blueprint_comments(company_id);

CREATE INDEX IF NOT EXISTS idx_blueprint_comments_activity_id 
  ON public.blueprint_comments(activity_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_company_venture_blueprints
  BEFORE UPDATE ON public.company_venture_blueprints
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_blueprint_comments
  BEFORE UPDATE ON public.blueprint_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_venture_blueprints;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blueprint_comments;