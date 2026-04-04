-- Add next_scheduled_audit and audit_interval fields to suppliers table
ALTER TABLE suppliers 
ADD COLUMN next_scheduled_audit DATE,
ADD COLUMN audit_interval TEXT; -- e.g., "1 year", "2 years", "6 months"