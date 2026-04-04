
ALTER TABLE public.documents ADD COLUMN reference_document_ids UUID[] DEFAULT '{}';
ALTER TABLE public.phase_assigned_document_template ADD COLUMN reference_document_ids UUID[] DEFAULT '{}';
