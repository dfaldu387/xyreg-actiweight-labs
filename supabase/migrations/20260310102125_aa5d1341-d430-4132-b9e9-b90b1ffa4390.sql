-- Update existing ISO_14971 row: change scope to company, update name
UPDATE gap_analysis_templates 
SET scope = 'company', 
    name = 'ISO 14971 - Risk Management Process',
    description = 'Enterprise-level risk management process: organizational process definition, management responsibilities, and personnel qualification.'
WHERE id = 'df8ad462-41f8-42fd-9603-44bb7346ebb2';

-- Insert device-scoped ISO 14971 template
INSERT INTO gap_analysis_templates (
  id, framework, scope, name, description, importance, is_active, is_custom, template_type, version
) VALUES (
  gen_random_uuid(),
  'ISO_14971_DEVICE',
  'product',
  'ISO 14971 - Risk Management (Device)',
  'Device-specific risk management: risk management plan, hazard identification, risk analysis & evaluation, risk control measures, residual risk assessment, review, and post-production monitoring.',
  'high',
  true,
  false,
  'checklist',
  '1.0'
);