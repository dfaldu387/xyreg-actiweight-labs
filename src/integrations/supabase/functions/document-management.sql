
-- Function to create product document instances from phase templates
CREATE OR REPLACE FUNCTION public.create_product_document_instances(
  target_product_id UUID,
  target_phase_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  template_record RECORD;
  instances_created INTEGER := 0;
  existing_count INTEGER;
  phase_end_date DATE;
BEGIN
  -- Get the phase end date for due date assignment
  SELECT end_date INTO phase_end_date
  FROM lifecycle_phases
  WHERE id = target_phase_id;

  -- Loop through all templates for the target phase
  FOR template_record IN 
    SELECT pad.name, pad.document_type, pad.status
    FROM phase_assigned_documents pad
    WHERE pad.phase_id = target_phase_id
    AND pad.document_scope = 'company_template'
  LOOP
    -- Check if document instance already exists for this product
    SELECT COUNT(*) INTO existing_count
    FROM documents d
    WHERE d.product_id = target_product_id
    AND d.name = template_record.name
    AND d.document_scope = 'product_document';
    
    -- Only create if it doesn't already exist
    IF existing_count = 0 THEN
      INSERT INTO documents (
        name,
        document_type,
        status,
        product_id,
        company_id,
        phase_id,
        document_scope,
        due_date,
        milestone_due_date
      )
      SELECT 
        template_record.name,
        template_record.document_type,
        'Not Started',
        target_product_id,
        p.company_id,
        target_phase_id,
        'product_document',
        phase_end_date,
        phase_end_date
      FROM products p
      WHERE p.id = target_product_id;
      
      instances_created := instances_created + 1;
    END IF;
  END LOOP;
  
  RETURN instances_created;
END;
$$;
