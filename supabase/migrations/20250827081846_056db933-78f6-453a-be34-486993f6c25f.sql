-- Create function to log reviewer assignment activities
CREATE OR REPLACE FUNCTION log_reviewer_assignment_activity()
RETURNS TRIGGER AS $$
DECLARE
  workflow_data RECORD;
  reviewer_group_data RECORD;
  document_name TEXT;
  company_id_val UUID;
BEGIN
  -- Get workflow and document information
  SELECT w.*, d.name as doc_name, d.company_id as doc_company_id
  INTO workflow_data
  FROM document_workflows w
  JOIN documents d ON d.id = w.document_id
  WHERE w.id = COALESCE(NEW.workflow_id, OLD.workflow_id);
  
  -- Get reviewer group information
  SELECT rg.name, rg.company_id
  INTO reviewer_group_data
  FROM reviewer_groups rg
  WHERE rg.id = COALESCE(NEW.reviewer_group_id, OLD.reviewer_group_id);
  
  -- Use company from reviewer group or workflow
  company_id_val := COALESCE(reviewer_group_data.company_id, workflow_data.doc_company_id);
  document_name := COALESCE(workflow_data.doc_name, 'Unknown Document');
  
  -- Handle INSERT (new assignment)
  IF TG_OP = 'INSERT' THEN
    -- Log to document_audit_logs
    INSERT INTO document_audit_logs (
      document_id,
      user_id,
      company_id,
      action,
      action_details,
      ip_address,
      user_agent,
      metadata
    ) VALUES (
      workflow_data.document_id,
      NEW.assigned_by,
      company_id_val,
      'reviewer_assigned',
      jsonb_build_object(
        'assignment_type', NEW.assignment_type,
        'reviewer_group_name', reviewer_group_data.name,
        'stage_number', NEW.stage_number,
        'due_date', NEW.due_date
      ),
      'System',
      'Reviewer Assignment System',
      jsonb_build_object(
        'workflow_id', NEW.workflow_id,
        'assignment_id', NEW.id,
        'event_type', 'reviewer_assignment_created'
      )
    );
    
    -- Log to product_audit_logs if document has a product
    IF workflow_data.document_id IS NOT NULL THEN
      INSERT INTO product_audit_logs (
        user_id,
        company_id,
        action,
        entity_type,
        entity_id,
        entity_name,
        description,
        ip_address,
        user_agent,
        metadata
      ) VALUES (
        NEW.assigned_by,
        company_id_val,
        'reviewer_assigned',
        'Reviewer',
        NEW.id::text,
        'Reviewer Assignment for ' || document_name,
        'Document "' || document_name || '" was assigned to reviewer group "' || reviewer_group_data.name || '"',
        'System',
        'Reviewer Assignment System',
        jsonb_build_object(
          'workflow_id', NEW.workflow_id,
          'assignment_id', NEW.id,
          'reviewer_group_name', reviewer_group_data.name,
          'document_name', document_name,
          'stage_number', NEW.stage_number,
          'assignment_type', NEW.assignment_type
        )
      );
    END IF;
  END IF;
  
  -- Handle UPDATE (assignment status change)
  IF TG_OP = 'UPDATE' THEN
    -- Only log if status changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      -- Log to document_audit_logs
      INSERT INTO document_audit_logs (
        document_id,
        user_id,
        company_id,
        action,
        action_details,
        ip_address,
        user_agent,
        metadata
      ) VALUES (
        workflow_data.document_id,
        auth.uid(),
        company_id_val,
        'reviewer_status_changed',
        jsonb_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status,
          'reviewer_group_name', reviewer_group_data.name,
          'stage_number', NEW.stage_number,
          'completed_at', NEW.completed_at
        ),
        'System',
        'Reviewer Assignment System',
        jsonb_build_object(
          'workflow_id', NEW.workflow_id,
          'assignment_id', NEW.id,
          'event_type', 'reviewer_status_changed'
        )
      );
      
      -- Log to product_audit_logs
      INSERT INTO product_audit_logs (
        user_id,
        company_id,
        action,
        entity_type,
        entity_id,
        entity_name,
        description,
        ip_address,
        user_agent,
        metadata
      ) VALUES (
        auth.uid(),
        company_id_val,
        'reviewer_status_changed',
        'Reviewer',
        NEW.id::text,
        'Reviewer Status Update for ' || document_name,
        'Review assignment for "' || document_name || '" status changed from "' || OLD.status || '" to "' || NEW.status || '"',
        'System',
        'Reviewer Assignment System',
        jsonb_build_object(
          'workflow_id', NEW.workflow_id,
          'assignment_id', NEW.id,
          'reviewer_group_name', reviewer_group_data.name,
          'document_name', document_name,
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for review assignments
DROP TRIGGER IF EXISTS trigger_log_reviewer_assignment_activity ON review_assignments;
CREATE TRIGGER trigger_log_reviewer_assignment_activity
  AFTER INSERT OR UPDATE ON review_assignments
  FOR EACH ROW
  EXECUTE FUNCTION log_reviewer_assignment_activity();

-- Create function to log review decision activities
CREATE OR REPLACE FUNCTION log_review_decision_activity()
RETURNS TRIGGER AS $$
DECLARE
  assignment_data RECORD;
  workflow_data RECORD;
  reviewer_data RECORD;
  document_name TEXT;
  company_id_val UUID;
BEGIN
  -- Get assignment and workflow information
  SELECT ra.*, w.document_id, d.name as doc_name, d.company_id as doc_company_id
  INTO assignment_data
  FROM review_assignments ra
  JOIN document_workflows w ON w.id = ra.workflow_id
  JOIN documents d ON d.id = w.document_id
  WHERE ra.id = COALESCE(NEW.assignment_id, OLD.assignment_id);
  
  -- Get reviewer information
  SELECT up.first_name, up.last_name, up.email
  INTO reviewer_data
  FROM user_profiles up
  WHERE up.id = COALESCE(NEW.reviewer_id, OLD.reviewer_id);
  
  company_id_val := assignment_data.doc_company_id;
  document_name := COALESCE(assignment_data.doc_name, 'Unknown Document');
  
  -- Handle INSERT (new decision)
  IF TG_OP = 'INSERT' THEN
    -- Log to document_audit_logs
    INSERT INTO document_audit_logs (
      document_id,
      user_id,
      company_id,
      action,
      action_details,
      ip_address,
      user_agent,
      metadata
    ) VALUES (
      assignment_data.document_id,
      NEW.reviewer_id,
      company_id_val,
      'review_decision_made',
      jsonb_build_object(
        'decision', NEW.decision,
        'is_final', NEW.is_final,
        'reviewer_name', COALESCE(reviewer_data.first_name || ' ' || reviewer_data.last_name, reviewer_data.email),
        'comments', NEW.comments
      ),
      'System',
      'Review Decision System',
      jsonb_build_object(
        'assignment_id', NEW.assignment_id,
        'decision_id', NEW.id,
        'event_type', 'review_decision_made'
      )
    );
    
    -- Log to product_audit_logs
    INSERT INTO product_audit_logs (
      user_id,
      company_id,
      action,
      entity_type,
      entity_id,
      entity_name,
      description,
      ip_address,
      user_agent,
      metadata
    ) VALUES (
      NEW.reviewer_id,
      company_id_val,
      'review_decision_made',
      'Reviewer',
      NEW.id::text,
      'Review Decision for ' || document_name,
      'Review decision "' || NEW.decision || '" made for document "' || document_name || '"' || 
      CASE WHEN NEW.is_final THEN ' (Final Decision)' ELSE '' END,
      'System',
      'Review Decision System',
      jsonb_build_object(
        'assignment_id', NEW.assignment_id,
        'decision_id', NEW.id,
        'decision', NEW.decision,
        'is_final', NEW.is_final,
        'document_name', document_name,
        'reviewer_name', COALESCE(reviewer_data.first_name || ' ' || reviewer_data.last_name, reviewer_data.email)
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for review decisions
DROP TRIGGER IF EXISTS trigger_log_review_decision_activity ON review_decisions;
CREATE TRIGGER trigger_log_review_decision_activity
  AFTER INSERT ON review_decisions
  FOR EACH ROW
  EXECUTE FUNCTION log_review_decision_activity();