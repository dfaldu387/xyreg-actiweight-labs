
UPDATE public.gap_template_items gti
SET clause_reference = 'DiGA-' || gti.item_number
FROM public.gap_analysis_templates t
WHERE gti.template_id = t.id
  AND t.framework = 'DIGA_FAST_TRACK';

UPDATE public.gap_analysis_items
SET section = 'DiGA-' || clause_id
WHERE framework = 'DIGA_FAST_TRACK';
