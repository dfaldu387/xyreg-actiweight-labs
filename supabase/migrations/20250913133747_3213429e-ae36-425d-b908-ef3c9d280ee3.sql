-- Add missing category fields to pending_company_users table
ALTER TABLE pending_company_users 
ADD COLUMN functional_area text,
ADD COLUMN external_role text;