-- Enhanced V&V Methodology and Traceability Database Schema

-- V&V Plans table
CREATE TABLE public.vv_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  product_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  scope TEXT,
  methodology TEXT,
  acceptance_criteria TEXT,
  roles_responsibilities JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  version TEXT DEFAULT '1.0',
  created_by UUID NOT NULL,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Test Cases table for verification and validation
CREATE TABLE public.test_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  product_id UUID NOT NULL,
  test_case_id TEXT NOT NULL, -- TC-001, VTC-001, etc.
  name TEXT NOT NULL,
  description TEXT,
  test_type TEXT NOT NULL, -- 'verification' or 'validation'
  test_level TEXT NOT NULL, -- 'unit', 'integration', 'system', 'validation'
  category TEXT, -- 'hardware', 'software', 'interface', 'clinical'
  test_method TEXT, -- 'inspection', 'analysis', 'test', 'demonstration'
  preconditions TEXT,
  test_steps JSONB DEFAULT '[]'::jsonb,
  expected_results TEXT,
  acceptance_criteria TEXT,
  priority TEXT DEFAULT 'medium',
  estimated_duration INTEGER, -- in minutes
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL,
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, test_case_id)
);

-- Test Executions table for test run instances
CREATE TABLE public.test_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_case_id UUID NOT NULL REFERENCES public.test_cases(id) ON DELETE CASCADE,
  execution_id TEXT NOT NULL,
  executed_by UUID NOT NULL,
  execution_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  environment_info JSONB DEFAULT '{}'::jsonb,
  software_version TEXT,
  hardware_version TEXT,
  actual_results TEXT,
  status TEXT NOT NULL DEFAULT 'not_executed', -- 'pass', 'fail', 'blocked', 'not_executed'
  notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  execution_time_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Defects table for issue tracking
CREATE TABLE public.defects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  product_id UUID NOT NULL,
  defect_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  defect_type TEXT, -- 'software', 'hardware', 'interface', 'documentation'
  root_cause TEXT,
  resolution TEXT,
  discovered_in_phase TEXT,
  test_case_id UUID REFERENCES public.test_cases(id),
  test_execution_id UUID REFERENCES public.test_executions(id),
  reported_by UUID NOT NULL,
  assigned_to UUID,
  resolved_by UUID,
  verified_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  jira_issue_key TEXT, -- For integration with Jira
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, defect_id)
);

-- Enhanced Traceability Links table (normalized many-to-many)
CREATE TABLE public.traceability_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  source_type TEXT NOT NULL, -- 'user_need', 'system_requirement', 'software_requirement', 'hardware_requirement', 'test_case', 'hazard', 'risk_control'
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  link_type TEXT NOT NULL DEFAULT 'traces_to', -- 'traces_to', 'verified_by', 'validates', 'controls_risk'
  rationale TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, source_type, source_id, target_type, target_id, link_type)
);

-- V&V Coverage tracking
CREATE TABLE public.vv_requirement_coverage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_id UUID NOT NULL,
  verification_status TEXT DEFAULT 'not_verified', -- 'verified', 'not_verified', 'failed'
  validation_status TEXT DEFAULT 'not_validated', -- 'validated', 'not_validated', 'failed'
  verification_test_count INTEGER DEFAULT 0,
  validation_test_count INTEGER DEFAULT 0,
  last_verification_date TIMESTAMP WITH TIME ZONE,
  last_validation_date TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, requirement_type, requirement_id)
);

-- Enable RLS on all tables
ALTER TABLE public.vv_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traceability_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vv_requirement_coverage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for V&V Plans
CREATE POLICY "Users can view V&V plans for their companies" 
ON public.vv_plans FOR SELECT 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create V&V plans for their companies" 
ON public.vv_plans FOR INSERT 
WITH CHECK (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can update V&V plans for their companies" 
ON public.vv_plans FOR UPDATE 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can delete V&V plans for their companies" 
ON public.vv_plans FOR DELETE 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
));

-- RLS Policies for Test Cases
CREATE POLICY "Users can view test cases for their companies" 
ON public.test_cases FOR SELECT 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create test cases for their companies" 
ON public.test_cases FOR INSERT 
WITH CHECK (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can update test cases for their companies" 
ON public.test_cases FOR UPDATE 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can delete test cases for their companies" 
ON public.test_cases FOR DELETE 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
));

-- RLS Policies for Test Executions
CREATE POLICY "Users can view test executions for accessible test cases" 
ON public.test_executions FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.test_cases tc
  JOIN user_company_access uca ON uca.company_id = tc.company_id
  WHERE tc.id = test_executions.test_case_id AND uca.user_id = auth.uid()
));

CREATE POLICY "Users can create test executions for accessible test cases" 
ON public.test_executions FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.test_cases tc
  JOIN user_company_access uca ON uca.company_id = tc.company_id
  WHERE tc.id = test_executions.test_case_id AND uca.user_id = auth.uid()
));

CREATE POLICY "Users can update test executions for accessible test cases" 
ON public.test_executions FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.test_cases tc
  JOIN user_company_access uca ON uca.company_id = tc.company_id
  WHERE tc.id = test_executions.test_case_id AND uca.user_id = auth.uid()
));

-- RLS Policies for Defects
CREATE POLICY "Users can view defects for their companies" 
ON public.defects FOR SELECT 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create defects for their companies" 
ON public.defects FOR INSERT 
WITH CHECK (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update defects for their companies" 
ON public.defects FOR UPDATE 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid()
));

-- RLS Policies for Traceability Links
CREATE POLICY "Users can view traceability links for their companies" 
ON public.traceability_links FOR SELECT 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create traceability links for their companies" 
ON public.traceability_links FOR INSERT 
WITH CHECK (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can update traceability links for their companies" 
ON public.traceability_links FOR UPDATE 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can delete traceability links for their companies" 
ON public.traceability_links FOR DELETE 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
));

-- RLS Policies for V&V Coverage
CREATE POLICY "Users can view V&V coverage for their companies" 
ON public.vv_requirement_coverage FOR ALL 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid()
))
WITH CHECK (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid()
));

-- Indexes for performance
CREATE INDEX idx_vv_plans_company_product ON public.vv_plans(company_id, product_id);
CREATE INDEX idx_test_cases_company_product ON public.test_cases(company_id, product_id);
CREATE INDEX idx_test_cases_type_level ON public.test_cases(test_type, test_level);
CREATE INDEX idx_test_executions_test_case ON public.test_executions(test_case_id);
CREATE INDEX idx_defects_company_product ON public.defects(company_id, product_id);
CREATE INDEX idx_defects_status ON public.defects(status);
CREATE INDEX idx_traceability_source ON public.traceability_links(source_type, source_id);
CREATE INDEX idx_traceability_target ON public.traceability_links(target_type, target_id);
CREATE INDEX idx_traceability_company ON public.traceability_links(company_id);
CREATE INDEX idx_vv_coverage_requirement ON public.vv_requirement_coverage(requirement_type, requirement_id);

-- Triggers for automatic timestamps
CREATE TRIGGER update_vv_plans_updated_at
  BEFORE UPDATE ON public.vv_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_test_cases_updated_at
  BEFORE UPDATE ON public.test_cases
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_test_executions_updated_at
  BEFORE UPDATE ON public.test_executions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_defects_updated_at
  BEFORE UPDATE ON public.defects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_vv_coverage_updated_at
  BEFORE UPDATE ON public.vv_requirement_coverage
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();