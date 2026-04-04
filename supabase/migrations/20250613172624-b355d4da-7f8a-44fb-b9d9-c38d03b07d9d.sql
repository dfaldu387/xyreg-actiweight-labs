
-- Fix RLS policies and create document synchronization system

-- First, drop existing policies to ensure clean setup
DROP POLICY IF EXISTS "Users can manage phase assigned documents" ON phase_assigned_documents;
DROP POLICY IF EXISTS "Users can view phase assigned documents" ON phase_assigned_documents;

-- Create proper RLS policies for phase_assigned_documents
CREATE POLICY "Users can view phase assigned documents"
ON phase_assigned_documents FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM phases p
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE p.id = phase_assigned_documents.phase_id
    AND uca.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage phase assigned documents"
ON phase_assigned_documents FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM phases p
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE p.id = phase_assigned_documents.phase_id
    AND uca.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM phases p
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE p.id = phase_assigned_documents.phase_id
    AND uca.user_id = auth.uid()
  )
);

-- Create document synchronization function
CREATE OR REPLACE FUNCTION sync_document_to_company_templates(
  p_phase_id uuid,
  p_document_name text,
  p_document_type text DEFAULT 'Standard',
  p_tech_applicability text DEFAULT 'All device types',
  p_markets jsonb DEFAULT '[]'::jsonb,
  p_classes_by_market jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_company_id uuid;
  v_template_id uuid;
BEGIN
  -- Get company_id from phase
  SELECT p.company_id INTO v_company_id
  FROM phases p
  WHERE p.id = p_phase_id;
  
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Phase not found or no company associated';
  END IF;
  
  -- Insert or update in company_document_templates
  INSERT INTO company_document_templates (
    company_id,
    name,
    document_type,
    tech_applicability,
    markets,
    classes_by_market,
    is_user_removed
  ) VALUES (
    v_company_id,
    p_document_name,
    p_document_type,
    p_tech_applicability,
    p_markets,
    p_classes_by_market,
    false
  )
  ON CONFLICT (company_id, name) DO UPDATE SET
    document_type = EXCLUDED.document_type,
    tech_applicability = EXCLUDED.tech_applicability,
    markets = EXCLUDED.markets,
    classes_by_market = EXCLUDED.classes_by_market,
    is_user_removed = false,
    updated_at = now()
  RETURNING id INTO v_template_id;
  
  RETURN v_template_id;
END;
$function$;

-- Create trigger function for automatic synchronization
CREATE OR REPLACE FUNCTION trigger_sync_phase_document_to_template()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only sync company_template documents
  IF NEW.document_scope = 'company_template' THEN
    PERFORM sync_document_to_company_templates(
      NEW.phase_id,
      NEW.name,
      NEW.document_type,
      NEW.tech_applicability,
      NEW.markets,
      NEW.classes_by_market
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for automatic sync on insert/update
DROP TRIGGER IF EXISTS sync_phase_document_trigger ON phase_assigned_documents;
CREATE TRIGGER sync_phase_document_trigger
  AFTER INSERT OR UPDATE ON phase_assigned_documents
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_phase_document_to_template();

-- Create function to migrate existing documents
CREATE OR REPLACE FUNCTION migrate_existing_phase_documents_to_templates()
RETURNS TABLE(
  company_name text,
  documents_migrated integer,
  success boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  company_rec RECORD;
  doc_count integer;
BEGIN
  FOR company_rec IN 
    SELECT c.id, c.name
    FROM companies c
    WHERE c.is_archived = false
  LOOP
    -- Migrate documents for this company
    INSERT INTO company_document_templates (
      company_id,
      name,
      document_type,
      tech_applicability,
      markets,
      classes_by_market,
      is_user_removed
    )
    SELECT DISTINCT
      company_rec.id,
      pad.name,
      pad.document_type,
      pad.tech_applicability,
      pad.markets,
      pad.classes_by_market,
      false
    FROM phase_assigned_documents pad
    JOIN phases p ON p.id = pad.phase_id
    WHERE p.company_id = company_rec.id
    AND pad.document_scope = 'company_template'
    AND NOT EXISTS (
      SELECT 1 FROM company_document_templates cdt
      WHERE cdt.company_id = company_rec.id
      AND cdt.name = pad.name
    );
    
    GET DIAGNOSTICS doc_count = ROW_COUNT;
    
    RETURN QUERY SELECT 
      company_rec.name,
      doc_count,
      true;
  END LOOP;
END;
$function$;

-- Create enhanced document creation function with better error handling
CREATE OR REPLACE FUNCTION create_phase_document_with_sync(
  p_phase_id uuid,
  p_name text,
  p_document_type text DEFAULT 'Standard',
  p_status text DEFAULT 'Not Started',
  p_tech_applicability text DEFAULT 'All device types',
  p_markets jsonb DEFAULT '[]'::jsonb,
  p_classes_by_market jsonb DEFAULT '{}'::jsonb,
  p_document_scope text DEFAULT 'company_template'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_document_id uuid;
  v_template_id uuid;
  v_result jsonb;
BEGIN
  -- Create the phase assigned document
  INSERT INTO phase_assigned_documents (
    phase_id,
    name,
    document_type,
    status,
    tech_applicability,
    markets,
    classes_by_market,
    document_scope
  ) VALUES (
    p_phase_id,
    p_name,
    p_document_type,
    p_status,
    p_tech_applicability,
    p_markets,
    p_classes_by_market,
    p_document_scope::document_scope
  )
  RETURNING id INTO v_document_id;
  
  -- Sync to company templates if it's a company template
  IF p_document_scope = 'company_template' THEN
    SELECT sync_document_to_company_templates(
      p_phase_id,
      p_name,
      p_document_type,
      p_tech_applicability,
      p_markets,
      p_classes_by_market
    ) INTO v_template_id;
  END IF;
  
  -- Return success result
  SELECT jsonb_build_object(
    'success', true,
    'document_id', v_document_id,
    'template_id', v_template_id,
    'message', 'Document created and synced successfully'
  ) INTO v_result;
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  -- Return error details
  SELECT jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_detail', SQLSTATE,
    'message', 'Failed to create document: ' || SQLERRM
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$;
