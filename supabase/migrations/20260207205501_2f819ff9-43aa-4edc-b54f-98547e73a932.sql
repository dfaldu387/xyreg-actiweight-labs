-- Add no_literature_found column to product_clinical_evidence_plan table
ALTER TABLE public.product_clinical_evidence_plan
ADD COLUMN IF NOT EXISTS no_literature_found BOOLEAN DEFAULT false;