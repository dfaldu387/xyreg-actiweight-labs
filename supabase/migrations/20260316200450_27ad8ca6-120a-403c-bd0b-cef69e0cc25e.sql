
-- Assign template_category to all 51 SOP templates

-- Quality Core
UPDATE default_document_templates SET template_category = 'quality-system-procedures'
WHERE name LIKE 'SOP-001%' OR name LIKE 'SOP-002%' OR name LIKE 'SOP-003%' OR name LIKE 'SOP-004%' OR name LIKE 'SOP-005%' OR name LIKE 'SOP-006%' OR name LIKE 'SOP-011%' OR name LIKE 'SOP-012%' OR name LIKE 'SOP-017%' OR name LIKE 'SOP-050%';

-- Design & Development
UPDATE default_document_templates SET template_category = 'design-development'
WHERE name LIKE 'SOP-008%' OR name LIKE 'SOP-019%' OR name LIKE 'SOP-027%' OR name LIKE 'SOP-028%' OR name LIKE 'SOP-029%' OR name LIKE 'SOP-031%' OR name LIKE 'SOP-049%';

-- Production & Supply + Facilities & Equipment → operations-production
UPDATE default_document_templates SET template_category = 'operations-production'
WHERE name LIKE 'SOP-009%' OR name LIKE 'SOP-010%' OR name LIKE 'SOP-016%' OR name LIKE 'SOP-020%' OR name LIKE 'SOP-021%' OR name LIKE 'SOP-030%' OR name LIKE 'SOP-032%' OR name LIKE 'SOP-033%' OR name LIKE 'SOP-039%' OR name LIKE 'SOP-043%' OR name LIKE 'SOP-051%'
OR name LIKE 'SOP-018%' OR name LIKE 'SOP-023%' OR name LIKE 'SOP-024%' OR name LIKE 'SOP-025%' OR name LIKE 'SOP-041%';

-- Post-Market & Vigilance + Regulatory & Compliance → regulatory-clinical
UPDATE default_document_templates SET template_category = 'regulatory-clinical'
WHERE name LIKE 'SOP-013%' OR name LIKE 'SOP-014%' OR name LIKE 'SOP-022%' OR name LIKE 'SOP-037%' OR name LIKE 'SOP-038%' OR name LIKE 'SOP-042%' OR name LIKE 'SOP-044%'
OR name LIKE 'SOP-034%' OR name LIKE 'SOP-035%' OR name LIKE 'SOP-036%' OR name LIKE 'SOP-045%' OR name LIKE 'SOP-046%' OR name LIKE 'SOP-048%';

-- Risk & Clinical → safety-risk-management
UPDATE default_document_templates SET template_category = 'safety-risk-management'
WHERE name LIKE 'SOP-007%' OR name LIKE 'SOP-015%' OR name LIKE 'SOP-026%' OR name LIKE 'SOP-040%' OR name LIKE 'SOP-047%';
