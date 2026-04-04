-- Create PMS Reports table to track PSUR/PMSR submissions
CREATE TABLE IF NOT EXISTS public.pms_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('PSUR', 'PMSR', 'On-Demand', 'Other')),
  submission_date DATE NOT NULL,
  reporting_period_start DATE,
  reporting_period_end DATE,
  regulatory_body TEXT,
  market_code TEXT,
  submission_status TEXT NOT NULL DEFAULT 'submitted' CHECK (submission_status IN ('draft', 'submitted', 'accepted', 'rejected', 'under_review')),
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  notes TEXT,
  next_due_date DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create PMS Events table to track post-market events (complaints, adverse events, etc.)
CREATE TABLE IF NOT EXISTS public.pms_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('complaint', 'adverse_event', 'device_malfunction', 'near_miss', 'literature_finding', 'customer_feedback', 'other')),
  event_date DATE NOT NULL,
  severity TEXT CHECK (severity IN ('minor', 'moderate', 'serious', 'critical')),
  description TEXT NOT NULL,
  investigation_status TEXT NOT NULL DEFAULT 'open' CHECK (investigation_status IN ('open', 'investigating', 'closed', 'escalated')),
  corrective_actions TEXT,
  preventive_actions TEXT,
  root_cause TEXT,
  reporter_name TEXT,
  reporter_contact TEXT,
  market_code TEXT,
  is_reportable BOOLEAN DEFAULT false,
  reported_to_authority BOOLEAN DEFAULT false,
  authority_reference TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create PMS Milestones table for recurring PMS tasks
CREATE TABLE IF NOT EXISTS public.pms_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('PSUR', 'PMSR', 'review', 'data_collection', 'trend_analysis', 'other')),
  due_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  completed_date DATE,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_interval_months INTEGER,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pms_reports_product ON public.pms_reports(product_id);
CREATE INDEX IF NOT EXISTS idx_pms_reports_company ON public.pms_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_pms_reports_submission_date ON public.pms_reports(submission_date);
CREATE INDEX IF NOT EXISTS idx_pms_reports_next_due ON public.pms_reports(next_due_date);

CREATE INDEX IF NOT EXISTS idx_pms_events_product ON public.pms_events(product_id);
CREATE INDEX IF NOT EXISTS idx_pms_events_company ON public.pms_events(company_id);
CREATE INDEX IF NOT EXISTS idx_pms_events_date ON public.pms_events(event_date);
CREATE INDEX IF NOT EXISTS idx_pms_events_type ON public.pms_events(event_type);
CREATE INDEX IF NOT EXISTS idx_pms_events_severity ON public.pms_events(severity);

CREATE INDEX IF NOT EXISTS idx_pms_milestones_product ON public.pms_milestones(product_id);
CREATE INDEX IF NOT EXISTS idx_pms_milestones_company ON public.pms_milestones(company_id);
CREATE INDEX IF NOT EXISTS idx_pms_milestones_due_date ON public.pms_milestones(due_date);
CREATE INDEX IF NOT EXISTS idx_pms_milestones_status ON public.pms_milestones(status);

-- Enable Row Level Security
ALTER TABLE public.pms_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pms_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pms_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pms_reports
CREATE POLICY "Users can view PMS reports for their companies"
  ON public.pms_reports FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create PMS reports for their companies"
  ON public.pms_reports FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can update PMS reports for their companies"
  ON public.pms_reports FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can delete PMS reports for their companies"
  ON public.pms_reports FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
      AND access_level = 'admin'
    )
  );

-- RLS Policies for pms_events
CREATE POLICY "Users can view PMS events for their companies"
  ON public.pms_events FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create PMS events for their companies"
  ON public.pms_events FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can update PMS events for their companies"
  ON public.pms_events FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can delete PMS events for their companies"
  ON public.pms_events FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
      AND access_level = 'admin'
    )
  );

-- RLS Policies for pms_milestones
CREATE POLICY "Users can view PMS milestones for their companies"
  ON public.pms_milestones FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create PMS milestones for their companies"
  ON public.pms_milestones FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can update PMS milestones for their companies"
  ON public.pms_milestones FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can delete PMS milestones for their companies"
  ON public.pms_milestones FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
      AND access_level = 'admin'
    )
  );

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_pms_reports
  BEFORE UPDATE ON public.pms_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_pms_events
  BEFORE UPDATE ON public.pms_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_pms_milestones
  BEFORE UPDATE ON public.pms_milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Comment on tables
COMMENT ON TABLE public.pms_reports IS 'Post-Market Surveillance report submissions (PSUR, PMSR)';
COMMENT ON TABLE public.pms_events IS 'Post-Market Surveillance events (complaints, adverse events, etc.)';
COMMENT ON TABLE public.pms_milestones IS 'Recurring PMS milestones and tasks';