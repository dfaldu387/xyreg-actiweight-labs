-- Add reviewer-related actions to the product_audit_logs action check constraint
ALTER TABLE product_audit_logs 
DROP CONSTRAINT product_audit_logs_action_check;

ALTER TABLE product_audit_logs 
ADD CONSTRAINT product_audit_logs_action_check 
CHECK (action = ANY (ARRAY[
  'CREATE'::text, 
  'UPDATE'::text, 
  'DELETE'::text, 
  'VIEW'::text, 
  'DOWNLOAD'::text, 
  'SHARE'::text, 
  'EXPORT'::text,
  'reviewer_assigned'::text,
  'reviewer_status_changed'::text,
  'review_decision_made'::text
]));