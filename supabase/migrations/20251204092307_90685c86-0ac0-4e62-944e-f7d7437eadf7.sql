-- IP Management Module - Phase 1: Core Database Tables

-- Create enum types for IP management
CREATE TYPE ip_asset_type AS ENUM ('patent', 'trademark', 'copyright', 'trade_secret', 'design_right');
CREATE TYPE ip_asset_status AS ENUM ('idea', 'disclosure', 'filing_prep', 'pending', 'granted', 'abandoned', 'expired');
CREATE TYPE deadline_status AS ENUM ('upcoming', 'completed', 'missed', 'cancelled');
CREATE TYPE disclosure_status AS ENUM ('submitted', 'under_review', 'approved_for_filing', 'rejected', 'converted_to_asset');

-- 1. IP Assets - Core IP asset record
CREATE TABLE public.ip_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ip_type ip_asset_type NOT NULL,
  internal_reference TEXT,
  title TEXT NOT NULL,
  description TEXT,
  abstract TEXT,
  status ip_asset_status NOT NULL DEFAULT 'idea',
  patent_family_id UUID,
  priority_date DATE,
  inventors JSONB DEFAULT '[]'::jsonb,
  owner_assignee TEXT,
  responsible_user_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. IP Asset Products - Junction table linking IP to products
CREATE TABLE public.ip_asset_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_asset_id UUID NOT NULL REFERENCES public.ip_assets(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  protection_type TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ip_asset_id, product_id)
);

-- 3. IP Filings - Per-country filing details
CREATE TABLE public.ip_filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_asset_id UUID NOT NULL REFERENCES public.ip_assets(id) ON DELETE CASCADE,
  country_region TEXT NOT NULL,
  application_number TEXT,
  filing_date DATE,
  publication_number TEXT,
  publication_date DATE,
  grant_number TEXT,
  grant_date DATE,
  expiration_date DATE,
  status TEXT DEFAULT 'pending',
  epo_data JSONB,
  uspto_data JSONB,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. IP Deadlines - Deadline tracking
CREATE TABLE public.ip_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_asset_id UUID NOT NULL REFERENCES public.ip_assets(id) ON DELETE CASCADE,
  filing_id UUID REFERENCES public.ip_filings(id) ON DELETE SET NULL,
  deadline_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  responsible_user_id UUID REFERENCES auth.users(id),
  status deadline_status NOT NULL DEFAULT 'upcoming',
  reminder_days INTEGER[] DEFAULT ARRAY[90, 60, 30, 14, 7],
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. IP Costs - Financial tracking
CREATE TABLE public.ip_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_asset_id UUID NOT NULL REFERENCES public.ip_assets(id) ON DELETE CASCADE,
  filing_id UUID REFERENCES public.ip_filings(id) ON DELETE SET NULL,
  cost_type TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  date DATE NOT NULL,
  is_projected BOOLEAN DEFAULT false,
  paid_status TEXT DEFAULT 'unpaid',
  paid_date DATE,
  vendor TEXT,
  invoice_reference TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Invention Disclosures - Invention submission workflow
CREATE TABLE public.invention_disclosures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  submitter_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  novelty_statement TEXT,
  prior_art_known TEXT,
  commercial_potential TEXT,
  technical_field TEXT,
  co_inventors JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  status disclosure_status NOT NULL DEFAULT 'submitted',
  review_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  converted_ip_asset_id UUID REFERENCES public.ip_assets(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_ip_assets_company_id ON public.ip_assets(company_id);
CREATE INDEX idx_ip_assets_status ON public.ip_assets(status);
CREATE INDEX idx_ip_assets_ip_type ON public.ip_assets(ip_type);
CREATE INDEX idx_ip_assets_patent_family_id ON public.ip_assets(patent_family_id);
CREATE INDEX idx_ip_asset_products_ip_asset_id ON public.ip_asset_products(ip_asset_id);
CREATE INDEX idx_ip_asset_products_product_id ON public.ip_asset_products(product_id);
CREATE INDEX idx_ip_filings_ip_asset_id ON public.ip_filings(ip_asset_id);
CREATE INDEX idx_ip_filings_country_region ON public.ip_filings(country_region);
CREATE INDEX idx_ip_filings_application_number ON public.ip_filings(application_number);
CREATE INDEX idx_ip_deadlines_ip_asset_id ON public.ip_deadlines(ip_asset_id);
CREATE INDEX idx_ip_deadlines_due_date ON public.ip_deadlines(due_date);
CREATE INDEX idx_ip_deadlines_status ON public.ip_deadlines(status);
CREATE INDEX idx_ip_costs_ip_asset_id ON public.ip_costs(ip_asset_id);
CREATE INDEX idx_invention_disclosures_company_id ON public.invention_disclosures(company_id);
CREATE INDEX idx_invention_disclosures_submitter_id ON public.invention_disclosures(submitter_id);
CREATE INDEX idx_invention_disclosures_status ON public.invention_disclosures(status);

-- Create updated_at triggers
CREATE TRIGGER set_ip_assets_updated_at
  BEFORE UPDATE ON public.ip_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_ip_filings_updated_at
  BEFORE UPDATE ON public.ip_filings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_ip_deadlines_updated_at
  BEFORE UPDATE ON public.ip_deadlines
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_ip_costs_updated_at
  BEFORE UPDATE ON public.ip_costs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_invention_disclosures_updated_at
  BEFORE UPDATE ON public.invention_disclosures
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.ip_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_asset_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invention_disclosures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ip_assets (using user_company_access)
CREATE POLICY "Users can view IP assets of their companies"
  ON public.ip_assets FOR SELECT
  USING (company_id IN (
    SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
  ));

CREATE POLICY "Users can create IP assets for their companies"
  ON public.ip_assets FOR INSERT
  WITH CHECK (company_id IN (
    SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
  ));

CREATE POLICY "Users can update IP assets of their companies"
  ON public.ip_assets FOR UPDATE
  USING (company_id IN (
    SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete IP assets of their companies"
  ON public.ip_assets FOR DELETE
  USING (company_id IN (
    SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
  ));

-- RLS Policies for ip_asset_products
CREATE POLICY "Users can view IP asset products of their companies"
  ON public.ip_asset_products FOR SELECT
  USING (ip_asset_id IN (
    SELECT id FROM public.ip_assets WHERE company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage IP asset products of their companies"
  ON public.ip_asset_products FOR ALL
  USING (ip_asset_id IN (
    SELECT id FROM public.ip_assets WHERE company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
    )
  ));

-- RLS Policies for ip_filings
CREATE POLICY "Users can view filings of their companies"
  ON public.ip_filings FOR SELECT
  USING (ip_asset_id IN (
    SELECT id FROM public.ip_assets WHERE company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage filings of their companies"
  ON public.ip_filings FOR ALL
  USING (ip_asset_id IN (
    SELECT id FROM public.ip_assets WHERE company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
    )
  ));

-- RLS Policies for ip_deadlines
CREATE POLICY "Users can view deadlines of their companies"
  ON public.ip_deadlines FOR SELECT
  USING (ip_asset_id IN (
    SELECT id FROM public.ip_assets WHERE company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage deadlines of their companies"
  ON public.ip_deadlines FOR ALL
  USING (ip_asset_id IN (
    SELECT id FROM public.ip_assets WHERE company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
    )
  ));

-- RLS Policies for ip_costs
CREATE POLICY "Users can view costs of their companies"
  ON public.ip_costs FOR SELECT
  USING (ip_asset_id IN (
    SELECT id FROM public.ip_assets WHERE company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage costs of their companies"
  ON public.ip_costs FOR ALL
  USING (ip_asset_id IN (
    SELECT id FROM public.ip_assets WHERE company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
    )
  ));

-- RLS Policies for invention_disclosures
CREATE POLICY "Users can view disclosures of their companies"
  ON public.invention_disclosures FOR SELECT
  USING (company_id IN (
    SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
  ));

CREATE POLICY "Users can create disclosures for their companies"
  ON public.invention_disclosures FOR INSERT
  WITH CHECK (company_id IN (
    SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
  ));

CREATE POLICY "Users can update disclosures of their companies"
  ON public.invention_disclosures FOR UPDATE
  USING (company_id IN (
    SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own disclosures"
  ON public.invention_disclosures FOR DELETE
  USING (submitter_id = auth.uid());