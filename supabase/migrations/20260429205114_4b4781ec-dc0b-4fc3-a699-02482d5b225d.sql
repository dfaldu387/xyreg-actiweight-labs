UPDATE document_studio_templates AS target
SET sections = source.sections,
    name = 'SOP-002 Document Control',
    updated_at = now()
FROM document_studio_templates AS source
WHERE target.id = '83456c9f-806e-4a2b-883f-4a3dd328db59'
  AND source.id = '591e3e32-d026-4cbc-ad12-73fee40c3924';