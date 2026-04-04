
-- Create table for shared product family field values
CREATE TABLE public.family_field_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  basic_udi_di TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  field_key TEXT NOT NULL,
  field_value JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE (basic_udi_di, field_key)
);

-- Indexes
CREATE INDEX idx_family_field_values_basic_udi ON public.family_field_values(basic_udi_di);
CREATE INDEX idx_family_field_values_company ON public.family_field_values(company_id);

-- Enable RLS
ALTER TABLE public.family_field_values ENABLE ROW LEVEL SECURITY;

-- RLS policies using company_id membership
CREATE POLICY "Users can view family field values for their company"
  ON public.family_field_values FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert family field values for their company"
  ON public.family_field_values FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update family field values for their company"
  ON public.family_field_values FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete family field values for their company"
  ON public.family_field_values FOR DELETE
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Auto-update timestamp trigger
CREATE TRIGGER update_family_field_values_updated_at
  BEFORE UPDATE ON public.family_field_values
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
