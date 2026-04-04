UPDATE audit_types_metadata SET applies_to = CASE
  WHEN audit_type = 'ISO 13485 Certification Audit' THEN 'QMS / Management'
  WHEN audit_type = 'Design Validation Audit' THEN 'Product / Design'
  WHEN audit_type = 'PMS Audit' THEN 'Post-Market'
  WHEN audit_type = 'Risk File Audit' THEN 'Product / Design'
  WHEN audit_type = 'Technical File Audit' THEN 'Product / Design'
  ELSE applies_to
END;