
ALTER TABLE public.mc_tasks
ADD COLUMN linked_document_id uuid,
ADD COLUMN attachment_path text;
