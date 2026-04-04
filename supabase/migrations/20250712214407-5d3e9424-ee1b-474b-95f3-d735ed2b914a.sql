-- Create company gap templates table to track which templates each company has enabled
CREATE TABLE public.company_gap_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES gap_analysis_templates(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  company_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(company_id, template_id)
);

-- Enable RLS
ALTER TABLE public.company_gap_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view company gap templates for accessible companies"
ON public.company_gap_templates FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage company gap templates"
ON public.company_gap_templates FOR ALL
USING (
  company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() AND access_level = 'admin'
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() AND access_level = 'admin'
  )
);

-- Seed missing gap analysis templates
INSERT INTO public.gap_analysis_templates (
  name, framework, description, importance, scope, is_active, is_custom
) VALUES 
(
  'ISO 13485:2016 Quality Management Systems',
  'ISO_13485',
  'Quality management systems for medical devices. Comprehensive checklist covering all clauses of ISO 13485:2016 standard.',
  'high',
  'company',
  true,
  false
),
(
  'ISO 14971:2019 Risk Management',
  'ISO_14971', 
  'Risk management for medical devices. Complete framework for identifying, analyzing and controlling risks.',
  'high',
  'company',
  true,
  false
),
(
  'MDR Annex II Technical Documentation',
  'MDR_ANNEX_II',
  'Technical documentation requirements under EU MDR Annex II for comprehensive device documentation.',
  'high',
  'company', 
  true,
  false
),
(
  'MDR Annex III CE Marking',
  'MDR_ANNEX_III',
  'CE marking conformity assessment procedures under EU MDR Annex III for device certification.',
  'high',
  'company',
  true,
  false
);

-- Seed gap template items for ISO 13485
INSERT INTO public.gap_template_items (
  template_id, item_number, requirement_text, clause_reference, category, priority, sort_order
)
SELECT 
  t.id,
  '4.1.' || row_number() OVER (ORDER BY items.requirement_text),
  items.requirement_text,
  items.clause_reference,
  items.category,
  items.priority::text,
  row_number() OVER (ORDER BY items.requirement_text)
FROM gap_analysis_templates t,
(VALUES
  ('Quality Management System - General Requirements', '4.1', 'documentation', 'high'),
  ('Documentation Requirements', '4.2', 'documentation', 'high'),
  ('Management Responsibility', '5', 'compliance', 'high'),
  ('Resource Management', '6', 'compliance', 'medium'),
  ('Product Realization', '7', 'verification', 'high'),
  ('Measurement and Improvement', '8', 'verification', 'medium'),
  ('Design and Development Planning', '7.3.1', 'verification', 'high'),
  ('Design and Development Inputs', '7.3.2', 'verification', 'high'),
  ('Design and Development Outputs', '7.3.3', 'verification', 'high'),
  ('Design and Development Review', '7.3.4', 'verification', 'high'),
  ('Design and Development Verification', '7.3.5', 'verification', 'high'),
  ('Design and Development Validation', '7.3.6', 'verification', 'high'),
  ('Design and Development Transfer', '7.3.7', 'verification', 'high'),
  ('Design and Development Changes', '7.3.8', 'verification', 'medium'),
  ('Corrective Action', '8.5.2', 'compliance', 'high'),
  ('Preventive Action', '8.5.3', 'compliance', 'high')
) AS items(requirement_text, clause_reference, category, priority)
WHERE t.framework = 'ISO_13485';

-- Seed gap template items for ISO 14971  
INSERT INTO public.gap_template_items (
  template_id, item_number, requirement_text, clause_reference, category, priority, sort_order
)
SELECT 
  t.id,
  '4.' || row_number() OVER (ORDER BY items.requirement_text),
  items.requirement_text,
  items.clause_reference,
  items.category,
  items.priority::text,
  row_number() OVER (ORDER BY items.requirement_text)
FROM gap_analysis_templates t,
(VALUES
  ('Risk Management Plan', '4.1', 'documentation', 'high'),
  ('Risk Management File', '4.2', 'documentation', 'high'),
  ('Hazard Identification', '5.2', 'verification', 'high'),
  ('Risk Estimation', '5.3', 'verification', 'high'),
  ('Risk Evaluation', '5.4', 'verification', 'high'),
  ('Risk Control Option Analysis', '6.2', 'verification', 'high'),
  ('Implementation of Risk Control Measures', '6.3', 'verification', 'high'),
  ('Residual Risk Evaluation', '6.4', 'verification', 'high'),
  ('Risk/Benefit Analysis', '6.5', 'verification', 'medium'),
  ('Risks Arising from Risk Control Measures', '6.6', 'verification', 'medium'),
  ('Completeness of Risk Control', '6.7', 'verification', 'high'),
  ('Risk Management Report', '7', 'documentation', 'high'),
  ('Production and Post-Production Information', '8', 'compliance', 'medium'),
  ('Post-Production Information Review', '9', 'compliance', 'medium')
) AS items(requirement_text, clause_reference, category, priority)
WHERE t.framework = 'ISO_14971';

-- Seed gap template items for MDR Annex II
INSERT INTO public.gap_template_items (
  template_id, item_number, requirement_text, clause_reference, category, priority, sort_order  
)
SELECT 
  t.id,
  'II.' || row_number() OVER (ORDER BY items.requirement_text),
  items.requirement_text,
  items.clause_reference,
  items.category,
  items.priority::text,
  row_number() OVER (ORDER BY items.requirement_text)
FROM gap_analysis_templates t,
(VALUES
  ('Device Description and Specification', '1.1', 'documentation', 'high'),
  ('Information to be Supplied by the Manufacturer', '1.2', 'documentation', 'high'),
  ('Design and Manufacturing Information', '2', 'documentation', 'high'),
  ('General Safety and Performance Requirements', '3', 'compliance', 'high'),
  ('Benefit-Risk Analysis and Risk Management', '4', 'verification', 'high'),
  ('Product Verification and Validation', '5', 'verification', 'high'),
  ('Clinical Evaluation', '6', 'verification', 'high'),
  ('Post-Market Clinical Follow-up', '7', 'compliance', 'medium'),
  ('Other Clinical Evidence', '6.2', 'verification', 'medium'),
  ('Clinical Investigation', '6.1', 'verification', 'high')
) AS items(requirement_text, clause_reference, category, priority)
WHERE t.framework = 'MDR_ANNEX_II';

-- Seed gap template items for MDR Annex III
INSERT INTO public.gap_template_items (
  template_id, item_number, requirement_text, clause_reference, category, priority, sort_order
)
SELECT 
  t.id,
  'III.' || row_number() OVER (ORDER BY items.requirement_text),
  items.requirement_text,
  items.clause_reference, 
  items.category,
  items.priority::text,
  row_number() OVER (ORDER BY items.requirement_text)
FROM gap_analysis_templates t,
(VALUES
  ('Conformity Assessment Procedures', '1', 'compliance', 'high'),
  ('Quality Assurance System', '2', 'compliance', 'high'),
  ('EC Type Examination', '3', 'compliance', 'high'),
  ('Product Quality Assurance', '4', 'compliance', 'medium'),
  ('Product Verification', '5', 'verification', 'high'),
  ('Declaration of Conformity', '6', 'documentation', 'high'),
  ('CE Marking', '7', 'compliance', 'high'),
  ('Notified Body Assessment', '8', 'compliance', 'high')
) AS items(requirement_text, clause_reference, category, priority)
WHERE t.framework = 'MDR_ANNEX_III';

-- Create trigger for updated_at
CREATE TRIGGER update_company_gap_templates_updated_at
  BEFORE UPDATE ON public.company_gap_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();