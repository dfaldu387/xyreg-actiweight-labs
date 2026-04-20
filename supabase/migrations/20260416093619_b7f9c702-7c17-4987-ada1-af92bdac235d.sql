
-- ============================================================
-- EHDS Data Vault — Phase 1 Migration
-- ============================================================

-- Helper: reuse the update_updated_at trigger function if it exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================
-- 1. ehds_datasets
-- ============================================================
CREATE TABLE public.ehds_datasets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  data_categories JSONB DEFAULT '[]'::jsonb,
  collection_method TEXT,
  data_format TEXT,
  volume_estimate TEXT,
  healthdcat_ap_metadata JSONB DEFAULT '{}'::jsonb,
  accuracy_check_due_at TIMESTAMPTZ,
  accuracy_last_checked_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ehds_datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access ehds_datasets via company" ON public.ehds_datasets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_company_access uca
      WHERE uca.company_id = ehds_datasets.company_id
        AND uca.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_company_access uca
      WHERE uca.company_id = ehds_datasets.company_id
        AND uca.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_ehds_datasets_updated_at
  BEFORE UPDATE ON public.ehds_datasets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ehds_datasets_company ON public.ehds_datasets(company_id);

-- ============================================================
-- 2. ehds_field_mappings
-- ============================================================
CREATE TABLE public.ehds_field_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  dataset_id UUID NOT NULL REFERENCES public.ehds_datasets(id) ON DELETE CASCADE,
  internal_field_name TEXT NOT NULL,
  internal_field_path TEXT,
  eehrxf_standard_field TEXT,
  fhir_resource_type TEXT,
  fhir_field_path TEXT,
  mapping_status TEXT NOT NULL DEFAULT 'unmapped',
  transformation_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ehds_field_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access ehds_field_mappings via company" ON public.ehds_field_mappings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_company_access uca
      WHERE uca.company_id = ehds_field_mappings.company_id
        AND uca.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_company_access uca
      WHERE uca.company_id = ehds_field_mappings.company_id
        AND uca.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_ehds_field_mappings_updated_at
  BEFORE UPDATE ON public.ehds_field_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ehds_field_mappings_dataset ON public.ehds_field_mappings(dataset_id);

-- ============================================================
-- 3. ehds_data_permits
-- ============================================================
CREATE TABLE public.ehds_data_permits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  permit_reference TEXT NOT NULL,
  hdab_name TEXT NOT NULL,
  hdab_country TEXT,
  researcher_organization TEXT,
  purpose TEXT,
  datasets_requested JSONB DEFAULT '[]'::jsonb,
  permit_status TEXT NOT NULL DEFAULT 'received',
  spe_details JSONB DEFAULT '{}'::jsonb,
  trade_secret_review JSONB DEFAULT '{}'::jsonb,
  prrc_reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ehds_data_permits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access ehds_data_permits via company" ON public.ehds_data_permits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_company_access uca
      WHERE uca.company_id = ehds_data_permits.company_id
        AND uca.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_company_access uca
      WHERE uca.company_id = ehds_data_permits.company_id
        AND uca.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_ehds_data_permits_updated_at
  BEFORE UPDATE ON public.ehds_data_permits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ehds_data_permits_company ON public.ehds_data_permits(company_id);

-- ============================================================
-- 4. ehds_anonymization_profiles
-- ============================================================
CREATE TABLE public.ehds_anonymization_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  dataset_id UUID NOT NULL REFERENCES public.ehds_datasets(id) ON DELETE CASCADE,
  profile_name TEXT NOT NULL,
  pii_fields_stripped JSONB DEFAULT '[]'::jsonb,
  method TEXT NOT NULL DEFAULT 'anonymized',
  template_used TEXT NOT NULL DEFAULT 'gdpr_standard',
  privacy_score INTEGER DEFAULT 0,
  last_applied_at TIMESTAMPTZ,
  applied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ehds_anonymization_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access ehds_anonymization_profiles via company" ON public.ehds_anonymization_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_company_access uca
      WHERE uca.company_id = ehds_anonymization_profiles.company_id
        AND uca.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_company_access uca
      WHERE uca.company_id = ehds_anonymization_profiles.company_id
        AND uca.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_ehds_anonymization_profiles_updated_at
  BEFORE UPDATE ON public.ehds_anonymization_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ehds_anon_profiles_dataset ON public.ehds_anonymization_profiles(dataset_id);

-- ============================================================
-- 5. ehds_self_declarations
-- ============================================================
CREATE TABLE public.ehds_self_declarations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  declaration_version TEXT NOT NULL DEFAULT '1.0',
  checklist_responses JSONB DEFAULT '{}'::jsonb,
  overall_status TEXT NOT NULL DEFAULT 'not_started',
  declaration_generated_at TIMESTAMPTZ,
  signed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ehds_self_declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access ehds_self_declarations via company" ON public.ehds_self_declarations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_company_access uca
      WHERE uca.company_id = ehds_self_declarations.company_id
        AND uca.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_company_access uca
      WHERE uca.company_id = ehds_self_declarations.company_id
        AND uca.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_ehds_self_declarations_updated_at
  BEFORE UPDATE ON public.ehds_self_declarations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ehds_self_declarations_company ON public.ehds_self_declarations(company_id);

-- ============================================================
-- 6. Insert EHDS compliance framework (if not exists)
-- ============================================================
INSERT INTO public.compliance_frameworks (
  framework_code, framework_name, jurisdiction, description, version, is_active, framework_config
)
SELECT
  'EHDS_2025_327',
  'European Health Data Space (EHDS)',
  'EU',
  'EU Regulation 2025/327 establishing the European Health Data Space — requires manufacturers to provide interoperable health data access for primary and secondary use.',
  '2025/327',
  true,
  '{"effective_date": "2025-03-26", "transition_periods": {"primary_use": "2027", "secondary_use": "2029"}, "key_articles": [33, 34, 35, 36, 37]}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.compliance_frameworks WHERE framework_code = 'EHDS_2025_327'
);
