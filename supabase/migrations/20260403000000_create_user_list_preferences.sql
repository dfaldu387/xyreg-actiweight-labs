-- User list column preferences
-- Stores which columns each user has hidden per list view
-- Supports: device documents, company documents, CAPA, NC, calibration, etc.

CREATE TABLE public.list_column_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  product_id uuid,
  module text NOT NULL,
  view_key text NOT NULL DEFAULT 'list',
  hidden_columns text[] DEFAULT '{}',
  column_order text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, product_id, module, view_key)
);



-- Index for fast lookup
CREATE INDEX idx_list_col_prefs_company
  ON public.list_column_preferences(company_id, module, view_key);

CREATE INDEX idx_list_col_prefs_product
  ON public.list_column_preferences(company_id, product_id, module);

ALTER TABLE public.list_column_preferences ENABLE ROW LEVEL SECURITY;

-- Select: all authenticated users can read
CREATE POLICY "Users can select column preferences"
  ON public.list_column_preferences FOR SELECT
  TO authenticated
  USING (true);

-- Insert: all authenticated users can create
CREATE POLICY "Users can insert column preferences"
  ON public.list_column_preferences FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update: all authenticated users can update
CREATE POLICY "Users can update column preferences"
  ON public.list_column_preferences FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Delete: all authenticated users can delete
CREATE POLICY "Users can delete column preferences"
  ON public.list_column_preferences FOR DELETE
  TO authenticated
  USING (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_list_column_preferences_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_list_column_preferences_updated
  BEFORE UPDATE ON public.list_column_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_list_column_preferences_timestamp();
