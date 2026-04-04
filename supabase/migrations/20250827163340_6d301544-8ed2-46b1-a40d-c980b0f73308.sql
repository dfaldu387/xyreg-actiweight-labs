-- Create ISO 13485 template with complete 65 requirements
INSERT INTO gap_analysis_templates (
  id,
  name,
  framework,
  description,
  importance,
  scope,
  is_active,
  is_custom,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440065',
  'ISO 13485:2016 Quality Management System',
  'ISO 13485',
  'Complete set of 65 ISO 13485:2016 requirements for medical device quality management systems',
  'high',
  'company',
  true,
  false,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = now();

-- Insert all 65 ISO 13485 requirements
INSERT INTO gap_template_items (
  template_id,
  item_number,
  requirement_text,
  clause_reference,
  category,
  priority,
  sort_order
) VALUES
('550e8400-e29b-41d4-a716-446655440065', '4.1.1', 'Quality management system general requirements established', '4.1', 'documentation', 'high', 1),
('550e8400-e29b-41d4-a716-446655440065', '4.1.2', 'Quality management system maintained', '4.1', 'documentation', 'high', 2),
('550e8400-e29b-41d4-a716-446655440065', '4.1.3', 'Quality management system continually improved', '4.1', 'verification', 'medium', 3),
('550e8400-e29b-41d4-a716-446655440065', '4.2.1', 'Quality manual established and maintained', '4.2.1', 'documentation', 'high', 4),
('550e8400-e29b-41d4-a716-446655440065', '4.2.2', 'Control of documents procedure established', '4.2.2', 'documentation', 'high', 5),
('550e8400-e29b-41d4-a716-446655440065', '4.2.3', 'Control of records procedure established', '4.2.3', 'documentation', 'high', 6),
('550e8400-e29b-41d4-a716-446655440065', '5.1.1', 'Management commitment demonstrated', '5.1', 'verification', 'high', 7),
('550e8400-e29b-41d4-a716-446655440065', '5.1.2', 'Quality policy established', '5.1', 'documentation', 'high', 8),
('550e8400-e29b-41d4-a716-446655440065', '5.2.1', 'Customer requirements determined', '5.2', 'verification', 'high', 9),
('550e8400-e29b-41d4-a716-446655440065', '5.3.1', 'Quality objectives established', '5.3', 'documentation', 'medium', 10),
('550e8400-e29b-41d4-a716-446655440065', '5.4.1', 'Quality planning conducted', '5.4', 'verification', 'medium', 11),
('550e8400-e29b-41d4-a716-446655440065', '5.5.1', 'Responsibility and authority defined', '5.5', 'documentation', 'high', 12),
('550e8400-e29b-41d4-a716-446655440065', '5.5.2', 'Management representative appointed', '5.5', 'documentation', 'high', 13),
('550e8400-e29b-41d4-a716-446655440065', '5.6.1', 'Management review conducted', '5.6', 'verification', 'high', 14),
('550e8400-e29b-41d4-a716-446655440065', '6.1.1', 'Resource provision planned', '6.1', 'verification', 'medium', 15),
('550e8400-e29b-41d4-a716-446655440065', '6.2.1', 'Human resource competency determined', '6.2', 'verification', 'high', 16),
('550e8400-e29b-41d4-a716-446655440065', '6.2.2', 'Training provided and effectiveness evaluated', '6.2', 'verification', 'high', 17),
('550e8400-e29b-41d4-a716-446655440065', '6.3.1', 'Infrastructure requirements identified', '6.3', 'verification', 'medium', 18),
('550e8400-e29b-41d4-a716-446655440065', '6.4.1', 'Work environment requirements determined', '6.4', 'verification', 'medium', 19),
('550e8400-e29b-41d4-a716-446655440065', '7.1.1', 'Planning of product realization', '7.1', 'documentation', 'high', 20),
('550e8400-e29b-41d4-a716-446655440065', '7.2.1', 'Customer-related processes identified', '7.2', 'verification', 'high', 21),
('550e8400-e29b-41d4-a716-446655440065', '7.2.2', 'Review of requirements related to the product', '7.2', 'verification', 'high', 22),
('550e8400-e29b-41d4-a716-446655440065', '7.2.3', 'Customer communication established', '7.2', 'verification', 'medium', 23),
('550e8400-e29b-41d4-a716-446655440065', '7.3.1', 'Design and development planning', '7.3', 'documentation', 'high', 24),
('550e8400-e29b-41d4-a716-446655440065', '7.3.2', 'Design and development inputs', '7.3', 'documentation', 'high', 25),
('550e8400-e29b-41d4-a716-446655440065', '7.3.3', 'Design and development outputs', '7.3', 'documentation', 'high', 26),
('550e8400-e29b-41d4-a716-446655440065', '7.3.4', 'Design and development review', '7.3', 'verification', 'high', 27),
('550e8400-e29b-41d4-a716-446655440065', '7.3.5', 'Design and development verification', '7.3', 'verification', 'high', 28),
('550e8400-e29b-41d4-a716-446655440065', '7.3.6', 'Design and development validation', '7.3', 'verification', 'high', 29),
('550e8400-e29b-41d4-a716-446655440065', '7.3.7', 'Control of design and development changes', '7.3', 'verification', 'high', 30),
('550e8400-e29b-41d4-a716-446655440065', '7.3.8', 'Design and development files', '7.3', 'documentation', 'high', 31),
('550e8400-e29b-41d4-a716-446655440065', '7.4.1', 'Purchasing process', '7.4', 'verification', 'high', 32),
('550e8400-e29b-41d4-a716-446655440065', '7.4.2', 'Purchasing information', '7.4', 'documentation', 'high', 33),
('550e8400-e29b-41d4-a716-446655440065', '7.4.3', 'Verification of purchased product', '7.4', 'verification', 'high', 34),
('550e8400-e29b-41d4-a716-446655440065', '7.5.1', 'Control of production and service provision', '7.5', 'verification', 'high', 35),
('550e8400-e29b-41d4-a716-446655440065', '7.5.2', 'Cleanliness of product and contamination control', '7.5', 'verification', 'high', 36),
('550e8400-e29b-41d4-a716-446655440065', '7.5.3', 'Installation activities', '7.5', 'verification', 'medium', 37),
('550e8400-e29b-41d4-a716-446655440065', '7.5.4', 'Servicing activities', '7.5', 'verification', 'medium', 38),
('550e8400-e29b-41d4-a716-446655440065', '7.5.5', 'Particular requirements for sterile medical devices', '7.5', 'verification', 'high', 39),
('550e8400-e29b-41d4-a716-446655440065', '7.5.6', 'Validation of processes for production and service provision', '7.5', 'verification', 'high', 40),
('550e8400-e29b-41d4-a716-446655440065', '7.5.7', 'Identification and traceability', '7.5', 'verification', 'high', 41),
('550e8400-e29b-41d4-a716-446655440065', '7.5.8', 'Customer property', '7.5', 'verification', 'medium', 42),
('550e8400-e29b-41d4-a716-446655440065', '7.5.9', 'Preservation of product', '7.5', 'verification', 'medium', 43),
('550e8400-e29b-41d4-a716-446655440065', '7.6.1', 'Control of monitoring and measuring equipment', '7.6', 'verification', 'high', 44),
('550e8400-e29b-41d4-a716-446655440065', '8.1.1', 'General monitoring and measurement', '8.1', 'verification', 'medium', 45),
('550e8400-e29b-41d4-a716-446655440065', '8.2.1', 'Customer satisfaction monitoring', '8.2', 'verification', 'medium', 46),
('550e8400-e29b-41d4-a716-446655440065', '8.2.2', 'Internal audit', '8.2', 'verification', 'high', 47),
('550e8400-e29b-41d4-a716-446655440065', '8.2.3', 'Monitoring and measurement of processes', '8.2', 'verification', 'medium', 48),
('550e8400-e29b-41d4-a716-446655440065', '8.2.4', 'Monitoring and measurement of product', '8.2', 'verification', 'high', 49),
('550e8400-e29b-41d4-a716-446655440065', '8.2.5', 'Feedback', '8.2', 'verification', 'medium', 50),
('550e8400-e29b-41d4-a716-446655440065', '8.2.6', 'Complaint handling', '8.2', 'verification', 'high', 51),
('550e8400-e29b-41d4-a716-446655440065', '8.2.7', 'Reporting to regulatory authorities', '8.2', 'verification', 'high', 52),
('550e8400-e29b-41d4-a716-446655440065', '8.3.1', 'Control of nonconforming product', '8.3', 'verification', 'high', 53),
('550e8400-e29b-41d4-a716-446655440065', '8.4.1', 'Analysis of data', '8.4', 'verification', 'medium', 54),
('550e8400-e29b-41d4-a716-446655440065', '8.5.1', 'Improvement planning', '8.5', 'verification', 'medium', 55),
('550e8400-e29b-41d4-a716-446655440065', '8.5.2', 'Corrective action', '8.5', 'verification', 'high', 56),
('550e8400-e29b-41d4-a716-446655440065', '8.5.3', 'Preventive action', '8.5', 'verification', 'high', 57),
('550e8400-e29b-41d4-a716-446655440065', 'REG.1', 'Risk management file established', 'REG', 'documentation', 'high', 58),
('550e8400-e29b-41d4-a716-446655440065', 'REG.2', 'Clinical evaluation conducted', 'REG', 'verification', 'high', 59),
('550e8400-e29b-41d4-a716-446655440065', 'REG.3', 'Post-market surveillance system', 'REG', 'verification', 'high', 60),
('550e8400-e29b-41d4-a716-446655440065', 'REG.4', 'Advisory notices procedures', 'REG', 'documentation', 'medium', 61),
('550e8400-e29b-41d4-a716-446655440065', 'REG.5', 'Management representative for regulatory affairs', 'REG', 'documentation', 'high', 62),
('550e8400-e29b-41d4-a716-446655440065', 'REG.6', 'Regulatory documentation control', 'REG', 'documentation', 'high', 63),
('550e8400-e29b-41d4-a716-446655440065', 'REG.7', 'Medical device file maintenance', 'REG', 'documentation', 'high', 64),
('550e8400-e29b-41d4-a716-446655440065', 'REG.8', 'Unique device identification system', 'REG', 'verification', 'medium', 65)
ON CONFLICT (template_id, item_number) DO UPDATE SET
  requirement_text = EXCLUDED.requirement_text,
  clause_reference = EXCLUDED.clause_reference,
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  sort_order = EXCLUDED.sort_order;

-- Create a function to regenerate gap analysis items for a company
CREATE OR REPLACE FUNCTION regenerate_company_gap_analysis_items(target_company_id uuid, clear_existing boolean DEFAULT true)
RETURNS TABLE(
  action_taken text,
  items_cleared integer,
  items_created integer,
  templates_processed integer,
  success boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cleared_count integer := 0;
  created_count integer := 0;
  template_count integer := 0;
  template_record record;
  item_record record;
BEGIN
  -- Clear existing company-wide gap analysis items if requested
  IF clear_existing THEN
    DELETE FROM gap_analysis_items 
    WHERE product_id IS NULL 
    AND EXISTS (
      SELECT 1 FROM company_gap_templates cgt
      JOIN gap_analysis_templates gat ON gat.id = cgt.template_id
      WHERE cgt.company_id = target_company_id 
      AND cgt.is_enabled = true
      AND gat.framework = gap_analysis_items.framework
    );
    
    GET DIAGNOSTICS cleared_count = ROW_COUNT;
  END IF;
  
  -- Process each enabled template for the company
  FOR template_record IN 
    SELECT gat.*, cgt.company_id
    FROM company_gap_templates cgt
    JOIN gap_analysis_templates gat ON gat.id = cgt.template_id
    WHERE cgt.company_id = target_company_id 
    AND cgt.is_enabled = true
  LOOP
    template_count := template_count + 1;
    
    -- Create gap analysis items for this template
    FOR item_record IN
      SELECT gti.*
      FROM gap_template_items gti
      WHERE gti.template_id = template_record.id
      ORDER BY gti.sort_order
    LOOP
      INSERT INTO gap_analysis_items (
        product_id,
        requirement,
        framework,
        section,
        clause_id,
        clause_summary,
        category,
        status,
        priority,
        action_needed
      ) VALUES (
        NULL, -- Company-wide items
        item_record.requirement_text,
        template_record.framework,
        item_record.clause_reference,
        item_record.item_number,
        item_record.requirement_text,
        item_record.category,
        'non_compliant',
        item_record.priority,
        ''
      )
      ON CONFLICT (COALESCE(product_id::text, 'NULL'), clause_id, framework) DO NOTHING;
      
      -- Check if item was actually inserted
      IF FOUND THEN
        created_count := created_count + 1;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN QUERY SELECT
    'regenerate_gap_analysis'::text,
    cleared_count,
    created_count,
    template_count,
    true;
END;
$$;