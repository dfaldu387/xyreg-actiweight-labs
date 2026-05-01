-- 1. Create the FPD catalog table
CREATE TABLE public.fpd_sop_catalog (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_key         text NOT NULL UNIQUE,
  tier            text NOT NULL CHECK (tier IN ('foundation','pathway','device_specific')),
  title           text NOT NULL,
  description     text,
  rationale       text,
  trigger         text,
  default_content jsonb,
  is_active       boolean NOT NULL DEFAULT true,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fpd_sop_catalog_tier   ON public.fpd_sop_catalog(tier);
CREATE INDEX idx_fpd_sop_catalog_active ON public.fpd_sop_catalog(is_active);

ALTER TABLE public.fpd_sop_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FPD catalog readable by authenticated users"
  ON public.fpd_sop_catalog FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can insert FPD catalog"
  ON public.fpd_sop_catalog FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update FPD catalog"
  ON public.fpd_sop_catalog FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  );

CREATE POLICY "Super admins can delete FPD catalog"
  ON public.fpd_sop_catalog FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  );

CREATE TRIGGER update_fpd_sop_catalog_updated_at
  BEFORE UPDATE ON public.fpd_sop_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Bridge columns on default_document_templates
ALTER TABLE public.default_document_templates
  ADD COLUMN IF NOT EXISTS fpd_sop_key text,
  ADD COLUMN IF NOT EXISTS fpd_tier    text;

CREATE INDEX IF NOT EXISTS idx_default_document_templates_fpd_sop_key
  ON public.default_document_templates(fpd_sop_key)
  WHERE fpd_sop_key IS NOT NULL;

-- 3. Seed the 51 FPD entries (28 Foundation + 15 Pathway + 8 Device-specific)
INSERT INTO public.fpd_sop_catalog (sop_key, tier, title, description, rationale, trigger, sort_order) VALUES
  ('SOP-001','foundation','Quality Management System',NULL,'QMS skeleton — ISO 13485 §4 framework, identical for every company','always',1),
  ('SOP-002','foundation','Document Control',NULL,'Pure document control process — no device specifics','always',2),
  ('SOP-003','foundation','Management Review',NULL,'Standard ISO 13485 §5.6 management review process','always',3),
  ('SOP-004','foundation','Human Resources & Training',NULL,'Generic HR/training framework (§6.2)','always',4),
  ('SOP-005','foundation','Design & Development Planning',NULL,'Generic design & development planning framework (§7.3.2)','always',5),
  ('SOP-006','foundation','Design Inputs',NULL,'Process-only — defines how design inputs are captured, not what they are','always',6),
  ('SOP-007','foundation','Design Outputs',NULL,'Process-only — defines how design outputs are captured','always',7),
  ('SOP-008','foundation','Design Review',NULL,'Process-only — generic design review procedure','always',8),
  ('SOP-009','foundation','Design Verification & Validation',NULL,'Generic design V&V framework (§7.3.6–7.3.7) — applies to all medical devices','always',9),
  ('SOP-011','foundation','Design Change Control',NULL,'Process-only — generic design change control','always',11),
  ('SOP-012','foundation','Design History File / Technical Documentation',NULL,'Structure-only — DHF/Technical Documentation index template','always',12),
  ('SOP-016','foundation','Supplier Evaluation & Control',NULL,'Generic supplier evaluation & control workflow (§7.4)','always',16),
  ('SOP-021','foundation','Complaint Handling',NULL,'Standard complaint handling workflow (§8.2.2)','always',21),
  ('SOP-022','foundation','Post-Market Surveillance',NULL,'Standard PMS framework, identical across QMS','always',22),
  ('SOP-023','foundation','Infrastructure & Work Environment',NULL,'Generic infrastructure & work environment procedure (§6.3–6.4)','always',23),
  ('SOP-024','foundation','Equipment Maintenance & Calibration',NULL,'Generic equipment maintenance & calibration process','always',24),
  ('SOP-025','foundation','Monitoring & Measuring Equipment',NULL,'Generic monitoring & measurement equipment control (§7.6)','always',25),
  ('SOP-028','foundation','CAPA',NULL,'Standard CAPA framework, identical across QMS','always',28),
  ('SOP-030','foundation','Purchasing Controls',NULL,'Generic purchasing controls (§7.4.1)','always',30),
  ('SOP-031','foundation','Configuration Management',NULL,'Generic configuration management procedure','always',31),
  ('SOP-032','foundation','Nonconforming Product Control',NULL,'Standard nonconforming product control (§8.3)','always',32),
  ('SOP-033','foundation','Product Preservation & Storage',NULL,'Generic product preservation & storage process','always',33),
  ('SOP-034','foundation','Regulatory Submissions Management',NULL,'Process framework — how submissions are managed, not their content','always',34),
  ('SOP-035','foundation','Technical File / Design Dossier Management',NULL,'Process framework — Technical File / Design Dossier management','always',35),
  ('SOP-037','foundation','Field Safety Corrective Action',NULL,'Standard Field Safety Corrective Action process','always',37),
  ('SOP-038','foundation','Vigilance Reporting',NULL,'Standard vigilance reporting workflow','always',38),
  ('SOP-042','foundation','Trend Analysis & Signal Detection',NULL,'Generic trend analysis & signal detection process','always',42),
  ('SOP-050','foundation','Internal Audit',NULL,'Standard ISO 13485 §8.2.4 internal audit process','always',50),

  ('SOP-010','pathway','Design Transfer',NULL,'Design Transfer requires manufacturing scope','manufacturing',10),
  ('SOP-013','pathway','GSPR Compliance',NULL,'GSPR — EU MDR Annex I','eu_mdr',13),
  ('SOP-014','pathway','Clinical Evaluation',NULL,'Clinical Evaluation — EU MDR clinical pathway','eu_clinical',14),
  ('SOP-015','pathway','Risk Management (ISO 14971)',NULL,'Risk Management ISO 14971 applies to all devices','always',15),
  ('SOP-017','pathway','Production & Service Provision',NULL,'Production & Service Provision — manufacturing in scope','manufacturing',17),
  ('SOP-018','pathway','Process Validation',NULL,'Process Validation — manufacturing in scope','manufacturing',18),
  ('SOP-019','pathway','Identification, Traceability, UDI',NULL,'Identification, Traceability, UDI','always',19),
  ('SOP-020','pathway','Labeling & Packaging',NULL,'Labeling & Packaging — physical product','physical_product',20),
  ('SOP-036','pathway','Classification & Conformity Assessment',NULL,'Classification & Conformity Assessment — EU/UK/CH pathway','eu_mdr',36),
  ('SOP-043','pathway','Incoming Inspection',NULL,'Incoming Inspection — manufacturing in scope','manufacturing',43),
  ('SOP-044','pathway','PSUR',NULL,'PSUR — EU MDR Class IIa+','eu_mdr_class_iia_plus',44),
  ('SOP-045','pathway','UDI Management',NULL,'UDI Management','always',45),
  ('SOP-046','pathway','Notified Body Interactions',NULL,'Notified Body Interactions — EU MDR Class IIa+ / IVDR','eu_mdr_class_iia_plus',46),
  ('SOP-048','pathway','PMCF',NULL,'PMCF — EU MDR clinical pathway','eu_clinical',48),
  ('SOP-051','pathway','Batch Record / DHR',NULL,'Batch Record / DHR — manufacturing in scope','manufacturing',51),

  ('SOP-026','device_specific','Usability Engineering',NULL,'IEC 62366-1 — product-specific usability engineering',NULL,26),
  ('SOP-027','device_specific','Software Development Lifecycle',NULL,'IEC 62304 tailoring per software architecture',NULL,27),
  ('SOP-029','device_specific','Software Validation',NULL,'Tools/systems must be listed per device',NULL,29),
  ('SOP-039','device_specific','Sterilization Process Control',NULL,'Method-specific (EtO, gamma, steam, etc.)',NULL,39),
  ('SOP-040','device_specific','Biocompatibility Assessment',NULL,'Materials-specific per ISO 10993',NULL,40),
  ('SOP-041','device_specific','Cleanroom Operations',NULL,'Facility-specific cleanroom controls',NULL,41),
  ('SOP-047','device_specific','Clinical Investigation',NULL,'Study-specific clinical investigation protocol',NULL,47),
  ('SOP-049','device_specific','Software as Medical Device',NULL,'SaMD — architecture-specific',NULL,49);