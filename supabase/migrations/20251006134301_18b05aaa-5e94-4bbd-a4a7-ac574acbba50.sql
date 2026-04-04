-- Create clinical_trials table for Clinical CI
CREATE TABLE IF NOT EXISTS public.clinical_trials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES public.phases(id) ON DELETE SET NULL,
  
  -- Basic Information
  study_name TEXT NOT NULL,
  protocol_id TEXT NOT NULL,
  study_type TEXT NOT NULL CHECK (study_type IN ('feasibility', 'pivotal', 'pmcf', 'registry', 'other')),
  study_phase TEXT NOT NULL CHECK (study_phase IN ('protocol', 'ethics_review', 'enrollment', 'data_collection', 'analysis', 'reporting', 'completed')),
  
  -- Status and Priority
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  
  -- Enrollment
  target_enrollment INTEGER NOT NULL DEFAULT 0,
  actual_enrollment INTEGER NOT NULL DEFAULT 0,
  
  -- Timeline
  start_date DATE,
  estimated_completion_date DATE,
  actual_completion_date DATE,
  ethics_approval_date DATE,
  
  -- Study Details
  primary_endpoint TEXT,
  secondary_endpoints TEXT[],
  study_sites JSONB DEFAULT '[]'::jsonb, -- Array of {name, location, pi_name}
  cro_name TEXT,
  principal_investigator TEXT,
  
  -- Progress tracking
  completion_percentage INTEGER NOT NULL DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Metadata
  description TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_clinical_trials_company ON public.clinical_trials(company_id);
CREATE INDEX IF NOT EXISTS idx_clinical_trials_product ON public.clinical_trials(product_id);
CREATE INDEX IF NOT EXISTS idx_clinical_trials_status ON public.clinical_trials(status);
CREATE INDEX IF NOT EXISTS idx_clinical_trials_study_phase ON public.clinical_trials(study_phase);

-- Enable RLS
ALTER TABLE public.clinical_trials ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view clinical trials for their companies"
  ON public.clinical_trials
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create clinical trials for their companies"
  ON public.clinical_trials
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can update clinical trials for their companies"
  ON public.clinical_trials
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can delete clinical trials for their companies"
  ON public.clinical_trials
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level IN ('admin', 'editor')
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER set_clinical_trials_updated_at
  BEFORE UPDATE ON public.clinical_trials
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();