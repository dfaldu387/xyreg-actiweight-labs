-- Create function to log reviewer decisions (using correct table name and fixing IP address issue)
CREATE OR REPLACE FUNCTION log_review_decision()
RETURNS TRIGGER AS $$
DECLARE
    assignment_record RECORD;
    workflow_record RECORD;
    reviewer_data TEXT;
    document_name_val TEXT;
    company_id_val UUID;
BEGIN
    -- Get assignment details
    SELECT ra.*, w.record_id, w.record_type 
    INTO assignment_record 
    FROM review_assignments ra
    JOIN review_workflows w ON w.id = ra.workflow_id
    WHERE ra.id = NEW.assignment_id;
    
    IF assignment_record.record_type = 'document' THEN
        -- Get document details
        SELECT d.company_id, d.name INTO company_id_val, document_name_val
        FROM documents d
        WHERE d.id = assignment_record.record_id::uuid;
        
        -- Get reviewer name
        SELECT COALESCE(first_name || ' ' || last_name, email) INTO reviewer_data
        FROM user_profiles
        WHERE id = NEW.reviewer_id;
        
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
            assignment_record.record_id::uuid,
            NEW.reviewer_id,
            'review_decision_made',
            jsonb_build_object(
                'workflow_id', assignment_record.workflow_id,
                'assignment_id', NEW.assignment_id,
                'decision', NEW.decision,
                'comments', NEW.comments,
                'is_final', NEW.is_final
            ),
            NULL,
            NULL,
            'Review Decision System',
            NEW.decision_at,
            jsonb_build_object(
                'entity_type', 'Reviewer',
                'entity_name', reviewer_data,
                'document_name', document_name_val,
                'decision', NEW.decision
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for reviewer decisions
DROP TRIGGER IF EXISTS trigger_log_review_decision ON review_decisions;
CREATE TRIGGER trigger_log_review_decision
    AFTER INSERT ON review_decisions
    FOR EACH ROW
    EXECUTE FUNCTION log_review_decision();

-- Now let's create audit logs for existing review assignments
-- This will backfill the audit log with historical reviewer assignments
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
)
SELECT 
    d.company_id,
    rw.record_id::uuid,
    ra.assigned_by,
    'reviewer_assigned',
    jsonb_build_object(
        'workflow_id', rw.id,
        'reviewer_group_id', ra.reviewer_group_id,
        'reviewer_group_name', rg.name,
        'assignment_type', ra.assignment_type,
        'stage_number', ra.stage_number,
        'assignment_id', ra.id
    ),
    NULL,
    NULL,
    'Audit Log Backfill',
    ra.assigned_at,
    jsonb_build_object(
        'entity_type', 'Reviewer',
        'entity_name', rg.name,
        'document_name', d.name,
        'backfilled', true
    )
FROM review_assignments ra
JOIN review_workflows rw ON rw.id = ra.workflow_id
JOIN documents d ON d.id = rw.record_id::uuid
JOIN reviewer_groups rg ON rg.id = ra.reviewer_group_id
WHERE rw.record_type = 'document'
  AND NOT EXISTS (
    SELECT 1 FROM document_audit_logs dal 
    WHERE dal.action = 'reviewer_assigned' 
    AND dal.document_id = rw.record_id::uuid
    AND dal.action_details->>'assignment_id' = ra.id::text
  );