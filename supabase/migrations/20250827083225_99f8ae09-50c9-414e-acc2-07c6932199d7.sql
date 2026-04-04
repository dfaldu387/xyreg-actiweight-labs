-- Create function to log reviewer assignments (fixed for existing tables)
CREATE OR REPLACE FUNCTION log_reviewer_assignment()
RETURNS TRIGGER AS $$
DECLARE
    workflow_record RECORD;
    company_id_val UUID;
    document_name_val TEXT;
    reviewer_group_name_val TEXT;
BEGIN
    -- Get workflow details
    SELECT * INTO workflow_record 
    FROM review_workflows 
    WHERE id = NEW.workflow_id;
    
    IF workflow_record.record_type = 'document' THEN
        -- Get document details
        SELECT d.company_id, d.name INTO company_id_val, document_name_val
        FROM documents d
        WHERE d.id = workflow_record.record_id::uuid;
        
        -- Get reviewer group name
        SELECT name INTO reviewer_group_name_val
        FROM reviewer_groups
        WHERE id = NEW.reviewer_group_id;
        
        -- Insert audit log for document
        INSERT INTO document_audit_logs (
            company_id,
            document_id,
            user_id,
            action,
            action_details,
            session_id,
            ip_address,
            user_agent,
            created_at,
            metadata
        ) VALUES (
            company_id_val,
            workflow_record.record_id::uuid,
            auth.uid(),
            'reviewer_assigned',
            jsonb_build_object(
                'workflow_id', workflow_record.id,
                'reviewer_group_id', NEW.reviewer_group_id,
                'reviewer_group_name', reviewer_group_name_val,
                'assignment_type', NEW.assignment_type,
                'stage_number', NEW.stage_number
            ),
            NULL,
            NULL,
            NULL,
            NEW.assigned_at,
            jsonb_build_object(
                'entity_type', 'Reviewer',
                'entity_name', reviewer_group_name_val,
                'document_name', document_name_val
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for reviewer assignments
DROP TRIGGER IF EXISTS trigger_log_reviewer_assignment ON review_assignments;
CREATE TRIGGER trigger_log_reviewer_assignment
    AFTER INSERT ON review_assignments
    FOR EACH ROW
    EXECUTE FUNCTION log_reviewer_assignment();