-- Create usability_studies table for structured study data per IEC 62366-1
CREATE TABLE public.usability_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uef_id uuid REFERENCES public.usability_engineering_files(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  study_type text NOT NULL CHECK (study_type IN ('formative', 'summative')),
  name text NOT NULL DEFAULT '',
  study_subtype text DEFAULT 'other',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'planned', 'in_progress', 'completed')),
  
  -- Basic info
  objective text DEFAULT '',
  method text DEFAULT '',
  acceptance_criteria text DEFAULT '',
  
  -- New structured fields from IEC 62366-1 formative evaluation plans
  study_dates text DEFAULT '',
  conductors text DEFAULT '',
  test_location text DEFAULT '',
  test_conditions text DEFAULT '',
  prototype_id text DEFAULT '',
  software_version text DEFAULT '',
  ui_under_evaluation text DEFAULT '',
  training_description text DEFAULT '',
  training_to_test_interval text DEFAULT '',
  methods_used jsonb DEFAULT '[]'::jsonb,
  accompanying_docs text DEFAULT '',
  interview_questions text DEFAULT '',
  other_equipment text DEFAULT '',
  
  -- Structured JSON arrays
  participants_structured jsonb DEFAULT '[]'::jsonb,
  tasks_structured jsonb DEFAULT '[]'::jsonb,
  
  -- Report / observation data
  observations jsonb DEFAULT '[]'::jsonb,
  positive_learnings text DEFAULT '',
  negative_learnings text DEFAULT '',
  recommendations text DEFAULT '',
  overall_conclusion text DEFAULT '',
  
  -- Legacy free-text (backward compat)
  participants_text text DEFAULT '',
  tasks_text text DEFAULT '',
  
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Index for fast lookups
CREATE INDEX idx_usability_studies_product ON public.usability_studies(product_id);
CREATE INDEX idx_usability_studies_uef ON public.usability_studies(uef_id);

-- RLS
ALTER TABLE public.usability_studies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view usability studies for their company products"
  ON public.usability_studies FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert usability studies for their company"
  ON public.usability_studies FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update usability studies for their company"
  ON public.usability_studies FOR UPDATE TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete usability studies for their company"
  ON public.usability_studies FOR DELETE TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE TRIGGER set_usability_studies_updated_at
  BEFORE UPDATE ON public.usability_studies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();