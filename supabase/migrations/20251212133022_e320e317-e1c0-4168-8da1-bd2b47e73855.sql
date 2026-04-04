-- Module 1: Market Sizing Analysis (TAM/SAM/SOM)
CREATE TABLE public.product_market_sizing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- TAM
  tam_value NUMERIC,
  tam_currency TEXT DEFAULT 'USD',
  tam_methodology TEXT,
  tam_sources TEXT,
  
  -- SAM
  sam_value NUMERIC,
  sam_methodology TEXT,
  sam_sources TEXT,
  
  -- SOM
  som_value NUMERIC,
  som_timeline_years INTEGER DEFAULT 5,
  som_methodology TEXT,
  
  -- Clinical Impact
  lives_impacted_annually INTEGER,
  procedures_enabled_annually INTEGER,
  cost_savings_per_procedure NUMERIC,
  clinical_impact_sources TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(product_id)
);

-- Module 2: Reimbursement Strategy
CREATE TABLE public.product_reimbursement_strategy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Target Codes
  target_codes JSONB DEFAULT '[]', -- [{market: 'US', code: 'CPT 12345', description: '...', status: 'existing|new_needed|bundled'}]
  
  -- Payer Analysis
  payer_mix JSONB DEFAULT '{}', -- {medicare: 40, medicaid: 20, private: 35, self_pay: 5}
  
  -- Coverage Status
  coverage_status TEXT, -- 'covered', 'pending', 'not_covered', 'variable'
  coverage_notes TEXT,
  
  -- Timeline
  reimbursement_timeline_months INTEGER,
  key_milestones JSONB DEFAULT '[]', -- [{date: '2025-06', milestone: 'CMS meeting', status: 'completed'}]
  
  -- Value Dossier
  value_dossier_status TEXT, -- 'not_started', 'in_progress', 'complete'
  health_economics_evidence TEXT,
  
  -- Payer Meetings
  payer_meetings JSONB DEFAULT '[]', -- [{payer: 'Aetna', date: '2025-03', outcome: 'positive'}]
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(product_id)
);

-- Module 3: Team Gap Analysis
CREATE TABLE public.product_team_gaps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Competency Matrix
  competencies JSONB DEFAULT '{}', -- {regulatory: 'strong', clinical: 'gap', commercial: 'developing', manufacturing: 'outsourced'}
  
  -- Gap Analysis
  critical_gaps JSONB DEFAULT '[]', -- [{role: 'VP Sales', priority: 'high', target_hire_date: '2025-Q2', budget: 150000}]
  
  -- Hiring Roadmap
  hiring_roadmap JSONB DEFAULT '[]', -- [{role: '...', phase: 'Phase 1', reason: '...'}]
  
  -- Advisory Board
  advisors JSONB DEFAULT '[]', -- [{name: '...', expertise: '...', affiliation: '...', linkedin_url: '...'}]
  
  -- Founder Time Allocation
  founder_allocation JSONB DEFAULT '{}', -- {product: 40, fundraising: 30, operations: 20, sales: 10}
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(product_id)
);

-- Module 4: Regulatory Timeline
CREATE TABLE public.product_regulatory_timeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Market Timelines
  market_timelines JSONB DEFAULT '[]', -- [{market: 'EU', submission_date: '2025-06', approval_date_best: '2025-12', approval_date_expected: '2026-03', approval_date_worst: '2026-09'}]
  
  -- Key Milestones
  milestones JSONB DEFAULT '[]', -- [{milestone: 'Classification confirmed', date: '2025-01', status: 'completed', market: 'EU'}]
  
  -- Dependencies & Risks
  dependencies JSONB DEFAULT '[]', -- [{dependency: 'Clinical trial completion', impact: 'high', mitigation: '...'}]
  
  -- Industry Benchmarks
  benchmark_notes TEXT,
  similar_device_timeline_months INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(product_id)
);

-- Module 5: Clinical Evidence Plan
CREATE TABLE public.product_clinical_evidence_plan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Evidence Requirements by Stakeholder
  regulator_requirements TEXT,
  payer_requirements TEXT,
  physician_requirements TEXT,
  
  -- Study Design
  study_design JSONB DEFAULT '{}', -- {type: 'RCT', endpoints: [...], sample_size: 100, duration_months: 12, control: 'SOC'}
  
  -- Timeline & Budget
  study_start_date DATE,
  study_end_date DATE,
  study_budget NUMERIC,
  study_budget_currency TEXT DEFAULT 'USD',
  
  -- KOL Engagement
  kol_strategy TEXT,
  kols JSONB DEFAULT '[]', -- [{name: '...', institution: '...', role: 'PI', engaged: true}]
  
  -- PMCF Requirements (auto-calculated based on device class)
  pmcf_required BOOLEAN DEFAULT false,
  pmcf_plan TEXT,
  
  -- Supporting Literature
  supporting_literature JSONB DEFAULT '[]', -- [{citation: '...', relevance: '...', url: '...'}]
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(product_id)
);

-- Module 6: Product Readiness Gates
CREATE TABLE public.product_readiness_gates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Gate Definitions
  gates JSONB DEFAULT '[
    {"id": "concept", "name": "Concept Review", "order": 1, "entry_criteria": [], "exit_criteria": [], "status": "not_started", "decision_date": null, "decision": null, "decision_makers": []},
    {"id": "feasibility", "name": "Feasibility Gate", "order": 2, "entry_criteria": [], "exit_criteria": [], "status": "not_started", "decision_date": null, "decision": null, "decision_makers": []},
    {"id": "design_freeze", "name": "Design Freeze", "order": 3, "entry_criteria": [], "exit_criteria": [], "status": "not_started", "decision_date": null, "decision": null, "decision_makers": []},
    {"id": "vv_complete", "name": "V&V Complete", "order": 4, "entry_criteria": [], "exit_criteria": [], "status": "not_started", "decision_date": null, "decision": null, "decision_makers": []},
    {"id": "submission_ready", "name": "Submission Ready", "order": 5, "entry_criteria": [], "exit_criteria": [], "status": "not_started", "decision_date": null, "decision": null, "decision_makers": []},
    {"id": "market_ready", "name": "Market Ready", "order": 6, "entry_criteria": [], "exit_criteria": [], "status": "not_started", "decision_date": null, "decision": null, "decision_makers": []}
  ]',
  
  -- Current Gate
  current_gate_id TEXT DEFAULT 'concept',
  
  -- Decision Log
  decision_log JSONB DEFAULT '[]', -- [{gate_id: '...', date: '...', decision: 'go|no_go|conditional', rationale: '...', attendees: [...]}]
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(product_id)
);

-- Enable RLS on all tables
ALTER TABLE public.product_market_sizing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reimbursement_strategy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_team_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_regulatory_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_clinical_evidence_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_readiness_gates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_market_sizing
CREATE POLICY "Users can view market sizing for their companies" ON public.product_market_sizing
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert market sizing for their companies" ON public.product_market_sizing
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

CREATE POLICY "Users can update market sizing for their companies" ON public.product_market_sizing
  FOR UPDATE USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete market sizing for their companies" ON public.product_market_sizing
  FOR DELETE USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

-- RLS Policies for product_reimbursement_strategy
CREATE POLICY "Users can view reimbursement strategy for their companies" ON public.product_reimbursement_strategy
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert reimbursement strategy for their companies" ON public.product_reimbursement_strategy
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

CREATE POLICY "Users can update reimbursement strategy for their companies" ON public.product_reimbursement_strategy
  FOR UPDATE USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete reimbursement strategy for their companies" ON public.product_reimbursement_strategy
  FOR DELETE USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

-- RLS Policies for product_team_gaps
CREATE POLICY "Users can view team gaps for their companies" ON public.product_team_gaps
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert team gaps for their companies" ON public.product_team_gaps
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

CREATE POLICY "Users can update team gaps for their companies" ON public.product_team_gaps
  FOR UPDATE USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete team gaps for their companies" ON public.product_team_gaps
  FOR DELETE USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

-- RLS Policies for product_regulatory_timeline
CREATE POLICY "Users can view regulatory timeline for their companies" ON public.product_regulatory_timeline
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert regulatory timeline for their companies" ON public.product_regulatory_timeline
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

CREATE POLICY "Users can update regulatory timeline for their companies" ON public.product_regulatory_timeline
  FOR UPDATE USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete regulatory timeline for their companies" ON public.product_regulatory_timeline
  FOR DELETE USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

-- RLS Policies for product_clinical_evidence_plan
CREATE POLICY "Users can view clinical evidence plan for their companies" ON public.product_clinical_evidence_plan
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert clinical evidence plan for their companies" ON public.product_clinical_evidence_plan
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

CREATE POLICY "Users can update clinical evidence plan for their companies" ON public.product_clinical_evidence_plan
  FOR UPDATE USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete clinical evidence plan for their companies" ON public.product_clinical_evidence_plan
  FOR DELETE USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

-- RLS Policies for product_readiness_gates
CREATE POLICY "Users can view readiness gates for their companies" ON public.product_readiness_gates
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert readiness gates for their companies" ON public.product_readiness_gates
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

CREATE POLICY "Users can update readiness gates for their companies" ON public.product_readiness_gates
  FOR UPDATE USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete readiness gates for their companies" ON public.product_readiness_gates
  FOR DELETE USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

-- Public read access for investor view (when share settings allow)
CREATE POLICY "Public can view market sizing via active share links" ON public.product_market_sizing
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.company_investor_share_settings ciss
      WHERE ciss.company_id = product_market_sizing.company_id
      AND ciss.is_active = true
    )
  );

CREATE POLICY "Public can view reimbursement strategy via active share links" ON public.product_reimbursement_strategy
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.company_investor_share_settings ciss
      WHERE ciss.company_id = product_reimbursement_strategy.company_id
      AND ciss.is_active = true
    )
  );

CREATE POLICY "Public can view team gaps via active share links" ON public.product_team_gaps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.company_investor_share_settings ciss
      WHERE ciss.company_id = product_team_gaps.company_id
      AND ciss.is_active = true
    )
  );

CREATE POLICY "Public can view regulatory timeline via active share links" ON public.product_regulatory_timeline
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.company_investor_share_settings ciss
      WHERE ciss.company_id = product_regulatory_timeline.company_id
      AND ciss.is_active = true
    )
  );

CREATE POLICY "Public can view clinical evidence plan via active share links" ON public.product_clinical_evidence_plan
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.company_investor_share_settings ciss
      WHERE ciss.company_id = product_clinical_evidence_plan.company_id
      AND ciss.is_active = true
    )
  );

CREATE POLICY "Public can view readiness gates via active share links" ON public.product_readiness_gates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.company_investor_share_settings ciss
      WHERE ciss.company_id = product_readiness_gates.company_id
      AND ciss.is_active = true
    )
  );

-- Add visibility columns to company_investor_share_settings
ALTER TABLE public.company_investor_share_settings 
ADD COLUMN IF NOT EXISTS show_market_sizing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_reimbursement_strategy BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_team_gaps BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_regulatory_timeline BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_clinical_evidence BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_readiness_gates BOOLEAN DEFAULT false;

-- Create updated_at triggers
CREATE TRIGGER update_product_market_sizing_updated_at
  BEFORE UPDATE ON public.product_market_sizing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_reimbursement_strategy_updated_at
  BEFORE UPDATE ON public.product_reimbursement_strategy
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_team_gaps_updated_at
  BEFORE UPDATE ON public.product_team_gaps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_regulatory_timeline_updated_at
  BEFORE UPDATE ON public.product_regulatory_timeline
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_clinical_evidence_plan_updated_at
  BEFORE UPDATE ON public.product_clinical_evidence_plan
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_readiness_gates_updated_at
  BEFORE UPDATE ON public.product_readiness_gates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();