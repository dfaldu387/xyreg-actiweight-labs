-- Add foreign key constraint between phase_assigned_documents and phases
ALTER TABLE public.phase_assigned_documents 
ADD CONSTRAINT phase_assigned_documents_phase_id_fkey 
FOREIGN KEY (phase_id) REFERENCES public.phases(id) ON DELETE CASCADE;