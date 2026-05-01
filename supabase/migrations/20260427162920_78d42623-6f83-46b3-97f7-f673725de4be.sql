-- Backfill document_number for existing rows where the column is null
-- but the name carries the canonical ID prefix (e.g. "SOP-DE-012 ...").
update public.phase_assigned_document_template
set document_number = substring(name from '^[A-Z]{2,6}(?:-[A-Z]{1,4})?-[0-9]{3,}')
where document_number is null
  and name ~ '^[A-Z]{2,6}(-[A-Z]{1,4})?-[0-9]{3,}';