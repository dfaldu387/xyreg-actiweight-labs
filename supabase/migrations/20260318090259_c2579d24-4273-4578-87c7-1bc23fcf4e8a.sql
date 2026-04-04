
-- Vendor validation releases (XYREG ships these per version)
CREATE TABLE public.vendor_validation_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  release_date timestamptz NOT NULL DEFAULT now(),
  release_notes text,
  module_groups_affected text[] NOT NULL DEFAULT '{}',
  core_services_affected text[] NOT NULL DEFAULT '{}',
  change_impact_matrix jsonb DEFAULT '{}',
  vendor_test_summary jsonb DEFAULT '{}',
  validation_kit_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_validation_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read releases"
  ON public.vendor_validation_releases FOR SELECT
  TO authenticated USING (true);

-- Customer validation records with JSONB rationale structures
CREATE TABLE public.customer_validation_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  release_id uuid NOT NULL REFERENCES public.vendor_validation_releases(id) ON DELETE CASCADE,
  module_group text NOT NULL,
  iq_rationale jsonb,
  oq_rationale jsonb,
  pq_rationale jsonb,
  overall_verdict text CHECK (overall_verdict IN ('validated', 'validated_with_conditions', 'not_validated', 'not_applicable')),
  overall_rationale text,
  conditions text,
  invalidated_by_core boolean NOT NULL DEFAULT false,
  invalidated_core_service text,
  validated_by uuid REFERENCES auth.users(id),
  validated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, release_id, module_group)
);

ALTER TABLE public.customer_validation_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own company validation records"
  ON public.customer_validation_records FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own company validation records"
  ON public.customer_validation_records FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own company validation records"
  ON public.customer_validation_records FOR UPDATE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));

-- Core module dependency matrix (seeded, read-only)
CREATE TABLE public.core_module_dependency_matrix (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  core_service_id text NOT NULL,
  core_service_name text NOT NULL,
  module_group_id text NOT NULL,
  validation_criticality text NOT NULL DEFAULT 'medium',
  propagation_type text NOT NULL DEFAULT 'inherited' CHECK (propagation_type IN ('inherited', 'overridable')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.core_module_dependency_matrix ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read dependency matrix"
  ON public.core_module_dependency_matrix FOR SELECT TO authenticated USING (true);

-- Auto-invalidation trigger
CREATE OR REPLACE FUNCTION public.auto_invalidate_validation_records()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.customer_validation_records cvr
  SET invalidated_by_core = true,
      invalidated_core_service = dep.core_service_name,
      updated_at = now()
  FROM public.core_module_dependency_matrix dep
  WHERE dep.module_group_id = cvr.module_group
    AND dep.core_service_id = ANY(NEW.core_services_affected)
    AND dep.propagation_type = 'inherited'
    AND cvr.invalidated_by_core = false;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_invalidate_on_release
  AFTER INSERT ON public.vendor_validation_releases
  FOR EACH ROW EXECUTE FUNCTION public.auto_invalidate_validation_records();

-- Seed dependency matrix
INSERT INTO public.core_module_dependency_matrix (core_service_id, core_service_name, module_group_id, validation_criticality, propagation_type) VALUES
  ('auth_rls', 'Authentication & RLS', 'document_control', 'high', 'inherited'),
  ('auth_rls', 'Authentication & RLS', 'design_controls', 'high', 'inherited'),
  ('auth_rls', 'Authentication & RLS', 'risk_management', 'high', 'inherited'),
  ('auth_rls', 'Authentication & RLS', 'production_supply', 'high', 'inherited'),
  ('auth_rls', 'Authentication & RLS', 'capa_complaints', 'high', 'inherited'),
  ('auth_rls', 'Authentication & RLS', 'training', 'high', 'inherited'),
  ('auth_rls', 'Authentication & RLS', 'regulatory', 'high', 'inherited'),
  ('auth_rls', 'Authentication & RLS', 'post_market', 'high', 'inherited'),
  ('auth_rls', 'Authentication & RLS', 'audit_review', 'high', 'inherited'),
  ('auth_rls', 'Authentication & RLS', 'infrastructure_csv', 'high', 'inherited'),
  ('global_schema', 'Global Data Schema', 'document_control', 'high', 'inherited'),
  ('global_schema', 'Global Data Schema', 'design_controls', 'high', 'inherited'),
  ('global_schema', 'Global Data Schema', 'risk_management', 'high', 'inherited'),
  ('global_schema', 'Global Data Schema', 'production_supply', 'high', 'inherited'),
  ('global_schema', 'Global Data Schema', 'capa_complaints', 'high', 'inherited'),
  ('global_schema', 'Global Data Schema', 'training', 'medium', 'inherited'),
  ('global_schema', 'Global Data Schema', 'regulatory', 'medium', 'inherited'),
  ('global_schema', 'Global Data Schema', 'post_market', 'high', 'inherited'),
  ('shared_ui', 'Shared UI Components', 'document_control', 'medium', 'overridable'),
  ('shared_ui', 'Shared UI Components', 'design_controls', 'medium', 'overridable'),
  ('shared_ui', 'Shared UI Components', 'risk_management', 'medium', 'overridable'),
  ('shared_ui', 'Shared UI Components', 'production_supply', 'medium', 'overridable'),
  ('shared_ui', 'Shared UI Components', 'capa_complaints', 'medium', 'overridable'),
  ('shared_ui', 'Shared UI Components', 'training', 'medium', 'overridable'),
  ('shared_ui', 'Shared UI Components', 'regulatory', 'medium', 'overridable'),
  ('shared_ui', 'Shared UI Components', 'post_market', 'medium', 'overridable'),
  ('shared_ui', 'Shared UI Components', 'audit_review', 'medium', 'overridable'),
  ('shared_ui', 'Shared UI Components', 'infrastructure_csv', 'low', 'overridable'),
  ('audit_ledger', 'Audit Ledger Service', 'document_control', 'high', 'inherited'),
  ('audit_ledger', 'Audit Ledger Service', 'capa_complaints', 'high', 'inherited'),
  ('audit_ledger', 'Audit Ledger Service', 'audit_review', 'high', 'inherited'),
  ('audit_ledger', 'Audit Ledger Service', 'regulatory', 'high', 'inherited'),
  ('variant_inheritance', 'Variant Inheritance Engine', 'design_controls', 'high', 'inherited'),
  ('variant_inheritance', 'Variant Inheritance Engine', 'risk_management', 'high', 'inherited'),
  ('variant_inheritance', 'Variant Inheritance Engine', 'post_market', 'high', 'inherited'),
  ('traceability_engine', 'Traceability Engine', 'design_controls', 'high', 'inherited'),
  ('traceability_engine', 'Traceability Engine', 'risk_management', 'high', 'inherited'),
  ('traceability_engine', 'Traceability Engine', 'capa_complaints', 'high', 'inherited');
