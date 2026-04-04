-- One-time sync: update actual_launch_date and projected_launch_date from markets JSON for all products
-- This ensures existing products are in sync before the trigger handles future updates
UPDATE public.products
SET
  actual_launch_date = sub.actual_date,
  projected_launch_date = sub.projected_date
FROM (
  SELECT
    p.id,
    (
      SELECT MIN(m->>'actualLaunchDate')
      FROM jsonb_array_elements(p.markets::jsonb) AS m
      WHERE (m->>'selected')::boolean = true
        AND m->>'marketLaunchStatus' = 'launched'
        AND m->>'actualLaunchDate' IS NOT NULL
        AND m->>'actualLaunchDate' != ''
    )::date AS actual_date,
    (
      SELECT MIN(m->>'launchDate')
      FROM jsonb_array_elements(p.markets::jsonb) AS m
      WHERE (m->>'selected')::boolean = true
        AND m->>'launchDate' IS NOT NULL
        AND m->>'launchDate' != ''
    )::date AS projected_date
  FROM public.products p
  WHERE p.markets IS NOT NULL
    AND jsonb_typeof(p.markets::jsonb) = 'array'
) sub
WHERE products.id = sub.id
  AND (sub.actual_date IS NOT NULL OR sub.projected_date IS NOT NULL);