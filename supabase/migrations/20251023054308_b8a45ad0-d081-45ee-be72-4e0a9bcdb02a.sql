-- Update the log_reviewer_assignment_activity function to work with review_workflows table
CREATE OR REPLACE FUNCTION log_reviewer_assignment_activity()
RETURNS TRIGGER AS $$
DECLARE
  workflow_data RECORD;
  reviewer_group_data RECORD;
  document_name TEXT;
  company_id_val UUID;
  document_id_val UUID;
BEGIN
  -- Get workflow information
  SELECT w.*, w.record_id as document_id
  INTO workflow_data
  FROM review_workflows w
  WHERE w.id = COALESCE(NEW.workflow_id, OLD.workflow_id);
  
  -- Get reviewer group information
  SELECT rg.name, rg.company_id
  INTO reviewer_group_data
  FROM reviewer_groups rg
  WHERE rg.id = COALESCE(NEW.reviewer_group_id, OLD.reviewer_group_id);
  
  -- Use company from reviewer group or assignment
  company_id_val := COALESCE(reviewer_group_data.company_id, NEW.company_id, OLD.company_id);
  
  -- Get document details if this is a document workflow
  IF workflow_data.record_type = 'document' THEN
    SELECT d.name, d.company_id
    INTO document_name, document_id_val
    FROM documents d
    WHERE d.id = workflow_data.record_id;
    
    -- Use document company_id if available
    company_id_val := COALESCE(document_id_val, company_id_val);
    document_id_val := workflow_data.record_id;
  ELSE
    document_name := 'Non-document workflow';
    document_id_val := NULL;
  END IF;
  
  document_name := COALESCE(document_name, 'Unknown Document');
  
  -- Handle INSERT (new assignment)
  IF TG_OP = 'INSERT' THEN
    -- Log to document_audit_logs only if this is a document workflow
    IF document_id_val IS NOT NULL AND company_id_val IS NOT NULL THEN
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
        document_id_val,
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
    END IF;
    
    -- Log to product_audit_logs if we have a company
    IF company_id_val IS NOT NULL THEN
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
      -- Log to document_audit_logs only if this is a document workflow
      IF document_id_val IS NOT NULL AND company_id_val IS NOT NULL THEN
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
          document_id_val,
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
      END IF;
      
      -- Log to product_audit_logs if we have a company
      IF company_id_val IS NOT NULL THEN
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
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the log_review_decision_activity function to work with review_workflows table
CREATE OR REPLACE FUNCTION log_review_decision_activity()
RETURNS TRIGGER AS $$
DECLARE
  assignment_data RECORD;
  workflow_data RECORD;
  reviewer_data RECORD;
  document_name TEXT;
  company_id_val UUID;
  document_id_val UUID;
BEGIN
  -- Get assignment and workflow information
  SELECT ra.*, w.record_type, w.record_id
  INTO assignment_data
  FROM review_assignments ra
  JOIN review_workflows w ON w.id = ra.workflow_id
  WHERE ra.id = COALESCE(NEW.assignment_id, OLD.assignment_id);
  
  -- Get reviewer information
  SELECT up.first_name, up.last_name, up.email
  INTO reviewer_data
  FROM user_profiles up
  WHERE up.id = COALESCE(NEW.reviewer_id, OLD.reviewer_id);
  
  -- Get document details if this is a document workflow
  IF assignment_data.record_type = 'document' THEN
    SELECT d.name, d.company_id
    INTO document_name, company_id_val
    FROM documents d
    WHERE d.id = assignment_data.record_id;
    
    document_id_val := assignment_data.record_id;
  ELSE
    document_name := 'Non-document workflow';
    document_id_val := NULL;
    company_id_val := assignment_data.company_id;
  END IF;
  
  document_name := COALESCE(document_name, 'Unknown Document');
  
  -- Handle INSERT (new decision)
  IF TG_OP = 'INSERT' THEN
    -- Log to document_audit_logs only if this is a document workflow
    IF document_id_val IS NOT NULL AND company_id_val IS NOT NULL THEN
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
        document_id_val,
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
    END IF;
    
    -- Log to product_audit_logs if we have a company
    IF company_id_val IS NOT NULL THEN
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
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;