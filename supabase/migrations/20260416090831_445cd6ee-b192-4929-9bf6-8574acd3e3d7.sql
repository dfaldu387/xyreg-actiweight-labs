
-- 1. Insert PPWR compliance framework
INSERT INTO public.compliance_frameworks (id, framework_code, framework_name, jurisdiction, description, version, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'PPWR',
  'Packaging and Packaging Waste Regulation',
  'EU',
  'EU Regulation 2025/40 — applies to all packaging placed on the EU market. Phases in from August 2026 (material restrictions, roles), 2028 (labelling), and 2030 (ecodesign/recyclability).',
  'EU 2025/40',
  true,
  now(),
  now()
);

-- 2. Insert PPWR gap analysis template
INSERT INTO public.gap_analysis_templates (id, company_id, name, framework, description, importance, scope, is_active, is_custom, is_core, auto_enable_condition, created_at, updated_at)
VALUES (
  'b7e2f1a3-4c5d-6e7f-8a9b-0c1d2e3f4a5b',
  NULL,
  'PPWR Compliance Checklist',
  'PPWR',
  'Packaging and Packaging Waste Regulation (EU 2025/40) compliance checklist covering material restrictions, labelling, and ecodesign requirements for medical device packaging.',
  'high',
  'product',
  true,
  false,
  true,
  'market_eu',
  now(),
  now()
);

-- 3. Phase 1 items
INSERT INTO public.gap_template_items (id, template_id, item_number, subsection, clause_reference, requirement_text, guidance_text, category, chapter, priority, sort_order) VALUES
(gen_random_uuid(), 'b7e2f1a3-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'PPWR-1.1', 'Phase 1 — Material Restrictions & Roles (2026)', 'Art. 15', 'Producer Role Definition', 'Define and document the economic operator role (producer, manufacturer, importer, distributor) under PPWR for each packaging type placed on the EU market.', 'compliance', 'Chapter III', 'high', 1),
(gen_random_uuid(), 'b7e2f1a3-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'PPWR-1.2', 'Phase 1 — Material Restrictions & Roles (2026)', 'Art. 5(1)', 'PFAS Restrictions Compliance', 'Verify that no packaging or packaging component contains intentionally added per- and polyfluoroalkyl substances (PFAS) above threshold concentrations.', 'verification', 'Chapter II', 'high', 2),
(gen_random_uuid(), 'b7e2f1a3-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'PPWR-1.3', 'Phase 1 — Material Restrictions & Roles (2026)', 'Art. 5(2)', 'Heavy Metals Compliance', 'Confirm lead, cadmium, mercury, and hexavalent chromium concentrations in packaging materials do not exceed 100 ppm (sum of four metals).', 'verification', 'Chapter II', 'high', 3),
(gen_random_uuid(), 'b7e2f1a3-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'PPWR-1.4', 'Phase 1 — Material Restrictions & Roles (2026)', 'Art. 5(3)', 'Substances of Concern Assessment', 'Assess all packaging components for substances of concern (SVHC under REACH, CMR substances) and document findings.', 'documentation', 'Chapter II', 'high', 4),
(gen_random_uuid(), 'b7e2f1a3-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'PPWR-1.5', 'Phase 1 — Material Restrictions & Roles (2026)', 'Art. 11(1)', 'Manufacturer Identification on Packaging', 'Ensure manufacturer name, trade name or trademark, and contact address are displayed on the packaging.', 'compliance', 'Chapter III', 'medium', 5),
(gen_random_uuid(), 'b7e2f1a3-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'PPWR-1.6', 'Phase 1 — Material Restrictions & Roles (2026)', 'Art. 9', 'Packaging Minimisation', 'Document justification that packaging weight, volume, and empty space are minimised to the minimum adequate amount.', 'documentation', 'Chapter II', 'medium', 6),
(gen_random_uuid(), 'b7e2f1a3-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'PPWR-1.7', 'Phase 1 — Material Restrictions & Roles (2026)', 'Art. 11(4)', 'Technical Documentation for Packaging', 'Prepare and maintain technical documentation demonstrating conformity with PPWR requirements for 10 years.', 'documentation', 'Chapter III', 'high', 7),
(gen_random_uuid(), 'b7e2f1a3-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'PPWR-1.8', 'Phase 1 — Material Restrictions & Roles (2026)', 'Art. 38', 'Conformity Assessment Procedure', 'Complete the conformity assessment procedure (Module A) and draw up the EU declaration of conformity for packaging.', 'compliance', 'Chapter VII', 'high', 8),
(gen_random_uuid(), 'b7e2f1a3-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'PPWR-1.9', 'Phase 1 — Material Restrictions & Roles (2026)', 'Art. 14-18', 'Economic Operator Obligations', 'Ensure all economic operators in the supply chain comply with their respective PPWR obligations.', 'compliance', 'Chapter III', 'medium', 9),
(gen_random_uuid(), 'b7e2f1a3-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'PPWR-1.10', 'Phase 1 — Material Restrictions & Roles (2026)', 'Art. 43', 'Packaging Waste Prevention Plan', 'Establish a waste prevention plan covering packaging reduction targets.', 'documentation', 'Chapter VIII', 'medium', 10);

-- Phase 2 items
INSERT INTO public.gap_template_items (id, template_id, item_number, subsection, clause_reference, requirement_text, guidance_text, category, chapter, priority, sort_order) VALUES
(gen_random_uuid(), 'b7e2f1a3-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'PPWR-2.1', 'Phase 2 — Labelling (2028)', 'Art. 12(1)', 'Harmonised Sorting Labels', 'Apply harmonised sorting labels on all packaging units using delegated act symbols.', 'compliance', 'Chapter III', 'high', 11),
(gen_random_uuid(), 'b7e2f1a3-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'PPWR-2.2', 'Phase 2 — Labelling (2028)', 'Art. 12(2)', 'Recycling Symbols', 'Display material-specific recycling symbols per harmonised EU standards.', 'compliance', 'Chapter III', 'high', 12),
(gen_random_uuid(), 'b7e2f1a3-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'PPWR-2.3', 'Phase 2 — Labelling (2028)', 'Art. 12(3)', 'Material Identification Marking', 'Mark each packaging component with the applicable material identification code.', 'compliance', 'Chapter III', 'medium', 13),
(gen_random_uuid(), 'b7e2f1a3-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'PPWR-2.4', 'Phase 2 — Labelling (2028)', 'Art. 12(6)', 'Digital Labelling (QR Code)', 'Provide a QR code linking to material composition, recyclability, and reuse information.', 'compliance', 'Chapter III', 'high', 14),
(gen_random_uuid(), 'b7e2f1a3-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'PPWR-2.5', 'Phase 2 — Labelling (2028)', 'Art. 12(4)', 'Consumer Information Requirements', 'Communicate disposal, sorting, and deposit-return scheme information to end-consumers.', 'documentation', 'Chapter III', 'medium', 15),
(gen_random_uuid(), 'b7e2f1a3-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'PPWR-2.6', 'Phase 2 — Labelling (2028)', 'Art. 12(5)', 'Collection Instructions', 'Provide clear separate collection instructions for each packaging component.', 'documentation', 'Chapter III', 'medium', 16),
(gen_random_uuid(), 'b7e2f1a3-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'PPWR-2.7', 'Phase 2 — Labelling (2028)', 'Art. 12(7)', 'Reuse Labelling', 'Apply harmonised reuse label for reusable packaging.', 'compliance', 'Chapter III', 'low', 17),
(gen_random_uuid(), 'b7e2f1a3-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'PPWR-2.8', 'Phase 2 — Labelling (2028)', 'Art. 12(8)', 'Composite Packaging Marking', 'Identify each separable material layer in composite packaging.', 'documentation', 'Chapter III', 'medium', 18);

-- Phase 3 items
INSERT INTO public.gap_template_items (id, template_id, item_number, subsection, clause_reference, requirement_text, guidance_text, category, chapter, priority, sort_order) VALUES
(gen_random_uuid(), 'b7e2f1a3-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'PPWR-3.1', 'Phase 3 — Ecodesign & Recyclability (2030)', 'Art. 6', 'Recyclability Assessment (Design for Recycling)', 'Assess packaging against DfR criteria and assign a recyclability grade (A/B/C).', 'verification', 'Chapter II', 'high', 19),
(gen_random_uuid(), 'b7e2f1a3-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'PPWR-3.2', 'Phase 3 — Ecodesign & Recyclability (2030)', 'Art. 7(1)', 'Minimum Recycled Content — General', 'Verify packaging meets minimum recycled content targets by material type.', 'verification', 'Chapter II', 'high', 20),
(gen_random_uuid(), 'b7e2f1a3-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'PPWR-3.3', 'Phase 3 — Ecodesign & Recyclability (2030)', 'Art. 7(2)', 'Recycled Plastic Content Targets', 'For plastic packaging: minimum 30% recycled content by 2030, increasing to 65% by 2040.', 'verification', 'Chapter II', 'high', 21),
(gen_random_uuid(), 'b7e2f1a3-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'PPWR-3.4', 'Phase 3 — Ecodesign & Recyclability (2030)', 'Art. 9(2)', 'Packaging-to-Product Volume Ratio', 'Demonstrate packaging void space does not exceed 40% for transport packaging.', 'verification', 'Chapter II', 'medium', 22),
(gen_random_uuid(), 'b7e2f1a3-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'PPWR-3.5', 'Phase 3 — Ecodesign & Recyclability (2030)', 'Art. 27', 'Reuse System Evaluation', 'Evaluate mandatory reuse targets and establish or join a compliant reuse system.', 'compliance', 'Chapter VI', 'medium', 23),
(gen_random_uuid(), 'b7e2f1a3-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'PPWR-3.6', 'Phase 3 — Ecodesign & Recyclability (2030)', 'Art. 8', 'Compostability Assessment', 'Verify conformity with EN 13432 composting standards for mandated packaging formats.', 'verification', 'Chapter II', 'low', 24);

-- 4. Create product_packaging table
CREATE TABLE public.product_packaging (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  packaging_type TEXT NOT NULL CHECK (packaging_type IN ('sales', 'grouped', 'transport')),
  material_composition JSONB NOT NULL DEFAULT '[]'::jsonb,
  volume_ratio NUMERIC,
  recyclability_class TEXT CHECK (recyclability_class IN ('A', 'B', 'C')),
  substances_of_concern JSONB DEFAULT '[]'::jsonb,
  labelling_compliant BOOLEAN DEFAULT false,
  ppwr_role TEXT CHECK (ppwr_role IN ('producer', 'manufacturer', 'importer', 'distributor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_packaging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company packaging"
  ON public.product_packaging FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.user_company_access uca ON uca.company_id = p.company_id
      WHERE p.id = product_packaging.product_id
        AND uca.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own company packaging"
  ON public.product_packaging FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.user_company_access uca ON uca.company_id = p.company_id
      WHERE p.id = product_packaging.product_id
        AND uca.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own company packaging"
  ON public.product_packaging FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.user_company_access uca ON uca.company_id = p.company_id
      WHERE p.id = product_packaging.product_id
        AND uca.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own company packaging"
  ON public.product_packaging FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.user_company_access uca ON uca.company_id = p.company_id
      WHERE p.id = product_packaging.product_id
        AND uca.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_product_packaging_updated_at
  BEFORE UPDATE ON public.product_packaging
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
