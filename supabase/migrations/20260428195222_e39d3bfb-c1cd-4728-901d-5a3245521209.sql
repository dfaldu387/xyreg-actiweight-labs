-- Auto-number SOP template sections: prefix titles like "Purpose" -> "1.0 Purpose"
-- based on (order+1) when the title doesn't already start with a number.
WITH exploded AS (
  SELECT
    t.id,
    s.ord  AS arr_idx,                       -- 0-based array index
    s.elem AS section
  FROM document_studio_templates t
  CROSS JOIN LATERAL jsonb_array_elements(t.sections) WITH ORDINALITY AS s(elem, ord)
  WHERE t.name ILIKE 'SOP-%'
),
fixed AS (
  SELECT
    id,
    arr_idx,
    CASE
      WHEN section ? 'title'
       AND (section->>'title') !~ '^\s*\d+(\.\d+)*\s'
      THEN jsonb_set(
             section,
             '{title}',
             to_jsonb(
               concat(
                 COALESCE((section->>'order')::int, (arr_idx - 1)::int) + 1,
                 '.0 ',
                 section->>'title'
               )
             )
           )
      ELSE section
    END AS section
  FROM exploded
),
recomposed AS (
  SELECT id, jsonb_agg(section ORDER BY arr_idx) AS new_sections
  FROM fixed
  GROUP BY id
)
UPDATE document_studio_templates t
SET sections = r.new_sections
FROM recomposed r
WHERE t.id = r.id
  AND t.sections IS DISTINCT FROM r.new_sections;