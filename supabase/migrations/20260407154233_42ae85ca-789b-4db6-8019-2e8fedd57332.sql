
DELETE FROM default_company_document_template WHERE document_type = 'SOP' OR name LIKE 'SOP-%';

DELETE FROM phase_assigned_document_template WHERE name LIKE 'SOP-%' AND is_predefined_core_template = true;
