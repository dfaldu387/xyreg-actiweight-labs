
-- ============================================================
-- Design Review Module: 5 tables + RLS + auto-ID triggers
-- ============================================================

-- 1. design_reviews
CREATE TABLE public.design_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dr_id text NOT NULL UNIQUE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  review_type text NOT NULL DEFAULT 'ad_hoc',
  phase_name text,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft',
  baseline_label text,
  source_ccr_id uuid REFERENCES public.change_control_requests(id) ON DELETE SET NULL,
  owner_id uuid NOT NULL,
  due_date timestamptz,
  completed_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.design_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dr_select" ON public.design_reviews FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));
CREATE POLICY "dr_insert" ON public.design_reviews FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));
CREATE POLICY "dr_update" ON public.design_reviews FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));
CREATE POLICY "dr_delete" ON public.design_reviews FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

-- Auto-generate dr_id: DR-YYYY-NNNN
CREATE OR REPLACE FUNCTION public.generate_dr_id()
RETURNS TRIGGER AS $$
DECLARE
  next_num integer;
  yr text;
BEGIN
  yr := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(NULLIF(regexp_replace(dr_id, '^DR-' || yr || '-', ''), dr_id) AS integer)
  ), 0) + 1
  INTO next_num
  FROM public.design_reviews
  WHERE dr_id LIKE 'DR-' || yr || '-%';
  NEW.dr_id := 'DR-' || yr || '-' || lpad(next_num::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_generate_dr_id
  BEFORE INSERT ON public.design_reviews
  FOR EACH ROW WHEN (NEW.dr_id IS NULL OR NEW.dr_id = '')
  EXECUTE FUNCTION public.generate_dr_id();

CREATE TRIGGER update_design_reviews_updated_at
  BEFORE UPDATE ON public.design_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. design_review_manifest_items
CREATE TABLE public.design_review_manifest_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  design_review_id uuid NOT NULL REFERENCES public.design_reviews(id) ON DELETE CASCADE,
  object_type text NOT NULL,
  object_id uuid NOT NULL,
  object_display_id text,
  snapshot_data jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'included',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.design_review_manifest_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drmi_select" ON public.design_review_manifest_items FOR SELECT
  USING (design_review_id IN (SELECT id FROM public.design_reviews WHERE company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid())));
CREATE POLICY "drmi_insert" ON public.design_review_manifest_items FOR INSERT
  WITH CHECK (design_review_id IN (SELECT id FROM public.design_reviews WHERE company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid())));
CREATE POLICY "drmi_update" ON public.design_review_manifest_items FOR UPDATE
  USING (design_review_id IN (SELECT id FROM public.design_reviews WHERE company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid())));
CREATE POLICY "drmi_delete" ON public.design_review_manifest_items FOR DELETE
  USING (design_review_id IN (SELECT id FROM public.design_reviews WHERE company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid())));

-- 3. design_review_findings
CREATE TABLE public.design_review_findings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  design_review_id uuid NOT NULL REFERENCES public.design_reviews(id) ON DELETE CASCADE,
  finding_id text NOT NULL DEFAULT '',
  object_type text,
  object_id uuid,
  severity text NOT NULL DEFAULT 'minor',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid,
  due_date date,
  resolution_notes text,
  closed_at timestamptz,
  closed_by uuid,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.design_review_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drf_select" ON public.design_review_findings FOR SELECT
  USING (design_review_id IN (SELECT id FROM public.design_reviews WHERE company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid())));
CREATE POLICY "drf_insert" ON public.design_review_findings FOR INSERT
  WITH CHECK (design_review_id IN (SELECT id FROM public.design_reviews WHERE company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid())));
CREATE POLICY "drf_update" ON public.design_review_findings FOR UPDATE
  USING (design_review_id IN (SELECT id FROM public.design_reviews WHERE company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid())));
CREATE POLICY "drf_delete" ON public.design_review_findings FOR DELETE
  USING (design_review_id IN (SELECT id FROM public.design_reviews WHERE company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid())));

CREATE OR REPLACE FUNCTION public.generate_finding_id()
RETURNS TRIGGER AS $$
DECLARE next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(NULLIF(regexp_replace(finding_id, '^FND-', ''), finding_id) AS integer)), 0) + 1
  INTO next_num FROM public.design_review_findings WHERE design_review_id = NEW.design_review_id;
  NEW.finding_id := 'FND-' || lpad(next_num::text, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_generate_finding_id
  BEFORE INSERT ON public.design_review_findings
  FOR EACH ROW WHEN (NEW.finding_id IS NULL OR NEW.finding_id = '')
  EXECUTE FUNCTION public.generate_finding_id();

CREATE TRIGGER update_design_review_findings_updated_at
  BEFORE UPDATE ON public.design_review_findings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. design_review_signatures
CREATE TABLE public.design_review_signatures (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  design_review_id uuid NOT NULL REFERENCES public.design_reviews(id) ON DELETE CASCADE,
  signer_id uuid NOT NULL,
  signer_role text NOT NULL,
  signature_meaning text NOT NULL DEFAULT 'review',
  is_independent boolean NOT NULL DEFAULT false,
  signed_at timestamptz NOT NULL DEFAULT now(),
  signature_hash text,
  comments text
);

ALTER TABLE public.design_review_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drs_select" ON public.design_review_signatures FOR SELECT
  USING (design_review_id IN (SELECT id FROM public.design_reviews WHERE company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid())));
CREATE POLICY "drs_insert" ON public.design_review_signatures FOR INSERT
  WITH CHECK (design_review_id IN (SELECT id FROM public.design_reviews WHERE company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid())));
CREATE POLICY "drs_delete" ON public.design_review_signatures FOR DELETE
  USING (design_review_id IN (SELECT id FROM public.design_reviews WHERE company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid())));

-- 5. design_review_participants
CREATE TABLE public.design_review_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  design_review_id uuid NOT NULL REFERENCES public.design_reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'reviewer',
  attended boolean NOT NULL DEFAULT false,
  invited_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.design_review_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drp_select" ON public.design_review_participants FOR SELECT
  USING (design_review_id IN (SELECT id FROM public.design_reviews WHERE company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid())));
CREATE POLICY "drp_insert" ON public.design_review_participants FOR INSERT
  WITH CHECK (design_review_id IN (SELECT id FROM public.design_reviews WHERE company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid())));
CREATE POLICY "drp_update" ON public.design_review_participants FOR UPDATE
  USING (design_review_id IN (SELECT id FROM public.design_reviews WHERE company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid())));
CREATE POLICY "drp_delete" ON public.design_review_participants FOR DELETE
  USING (design_review_id IN (SELECT id FROM public.design_reviews WHERE company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid())));

-- Indexes
CREATE INDEX idx_design_reviews_company_id ON public.design_reviews(company_id);
CREATE INDEX idx_design_reviews_product_id ON public.design_reviews(product_id);
CREATE INDEX idx_drmi_review_id ON public.design_review_manifest_items(design_review_id);
CREATE INDEX idx_drf_review_id ON public.design_review_findings(design_review_id);
CREATE INDEX idx_drs_review_id ON public.design_review_signatures(design_review_id);
CREATE INDEX idx_drp_review_id ON public.design_review_participants(design_review_id);
