-- Update activity_templates table CHECK constraint to accept frontend activity types
ALTER TABLE activity_templates DROP CONSTRAINT IF EXISTS activity_templates_type_check;
ALTER TABLE activity_templates ADD CONSTRAINT activity_templates_type_check 
CHECK (type IN ('training_sessions', 'reviews_meetings', 'compliance_remediation', 'testing_validation', 'analysis_assessment', 'validation_qualification', 'production_monitoring', 'submission_reporting', 'surveillance_followup', 'other'));

-- Update activities table CHECK constraint to accept frontend activity types  
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;
ALTER TABLE activities ADD CONSTRAINT activities_type_check 
CHECK (type IN ('training_sessions', 'reviews_meetings', 'compliance_remediation', 'testing_validation', 'analysis_assessment', 'validation_qualification', 'production_monitoring', 'submission_reporting', 'surveillance_followup', 'other'));