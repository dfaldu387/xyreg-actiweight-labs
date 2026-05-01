-- Convert <h2>X.Y...</h2> (subsections with at least one decimal) to <h3>...</h3>
-- only within SOP document_studio_templates. Top-level <h2>X.0 ...</h2> stays as H2.
UPDATE public.document_studio_templates
SET sections = regexp_replace(
  regexp_replace(
    sections::text,
    '<h2>(\s*\d+\.\d+[^<]*)</h2>',
    '<h3>\1</h3>',
    'g'
  ),
  '<h2>(\s*\d+\.\d+\.\d+[^<]*)</h2>',
  '<h3>\1</h3>',
  'g'
)::jsonb
WHERE name ILIKE 'SOP-%'
  AND sections::text ~ '<h2>\s*\d+\.\d+';