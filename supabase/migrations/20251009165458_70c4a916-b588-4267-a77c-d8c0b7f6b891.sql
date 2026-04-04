-- Create document_review_notes table
CREATE TABLE public.document_review_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.review_assignments(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_document_review_notes_document_id ON public.document_review_notes(document_id);
CREATE INDEX idx_document_review_notes_assignment_id ON public.document_review_notes(assignment_id);
CREATE INDEX idx_document_review_notes_reviewer_id ON public.document_review_notes(reviewer_id);

-- Enable RLS
ALTER TABLE public.document_review_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can view notes for documents in their companies
CREATE POLICY "Users can view notes for accessible documents"
ON public.document_review_notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    JOIN public.user_company_access uca ON uca.company_id = d.company_id
    WHERE d.id = document_review_notes.document_id
    AND uca.user_id = auth.uid()
  )
);

-- RLS Policies: Reviewers can create their own notes
CREATE POLICY "Reviewers can create their own notes"
ON public.document_review_notes
FOR INSERT
WITH CHECK (
  reviewer_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.documents d
    JOIN public.user_company_access uca ON uca.company_id = d.company_id
    WHERE d.id = document_review_notes.document_id
    AND uca.user_id = auth.uid()
  )
);

-- RLS Policies: Reviewers can update their own notes
CREATE POLICY "Reviewers can update their own notes"
ON public.document_review_notes
FOR UPDATE
USING (reviewer_id = auth.uid());

-- RLS Policies: Reviewers can delete their own notes
CREATE POLICY "Reviewers can delete their own notes"
ON public.document_review_notes
FOR DELETE
USING (reviewer_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER set_document_review_notes_updated_at
  BEFORE UPDATE ON public.document_review_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();