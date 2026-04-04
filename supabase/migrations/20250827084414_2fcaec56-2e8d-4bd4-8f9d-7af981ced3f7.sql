-- Now let's create audit logs for existing review assignments with proper null handling
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
    COALESCE(ra.assigned_by, (SELECT id FROM user_profiles WHERE email = 'system@lovable.dev' LIMIT 1)),
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
  )
  AND (ra.assigned_by IS NOT NULL OR (SELECT id FROM user_profiles WHERE email = 'system@lovable.dev' LIMIT 1) IS NOT NULL);