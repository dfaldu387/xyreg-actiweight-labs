ALTER TABLE public.phase_assigned_document_template 
ADD COLUMN IF NOT EXISTS device_scope jsonb DEFAULT NULL;