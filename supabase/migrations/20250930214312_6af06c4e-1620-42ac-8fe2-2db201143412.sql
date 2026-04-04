-- Create product_sibling_assignments table to track percentages and positions
CREATE TABLE IF NOT EXISTS public.product_sibling_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sibling_group_id UUID NOT NULL REFERENCES public.product_sibling_groups(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sibling_group_id, product_id)
);

-- Enable RLS
ALTER TABLE public.product_sibling_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view sibling assignments for their companies"
  ON public.product_sibling_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.product_sibling_groups psg
      JOIN public.user_company_access uca ON uca.company_id = psg.company_id
      WHERE psg.id = product_sibling_assignments.sibling_group_id
        AND uca.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sibling assignments for their companies"
  ON public.product_sibling_assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.product_sibling_groups psg
      JOIN public.user_company_access uca ON uca.company_id = psg.company_id
      WHERE psg.id = product_sibling_assignments.sibling_group_id
        AND uca.user_id = auth.uid()
        AND uca.access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can update sibling assignments for their companies"
  ON public.product_sibling_assignments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.product_sibling_groups psg
      JOIN public.user_company_access uca ON uca.company_id = psg.company_id
      WHERE psg.id = product_sibling_assignments.sibling_group_id
        AND uca.user_id = auth.uid()
        AND uca.access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can delete sibling assignments for their companies"
  ON public.product_sibling_assignments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.product_sibling_groups psg
      JOIN public.user_company_access uca ON uca.company_id = psg.company_id
      WHERE psg.id = product_sibling_assignments.sibling_group_id
        AND uca.user_id = auth.uid()
        AND uca.access_level IN ('admin', 'editor')
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER set_product_sibling_assignments_updated_at
  BEFORE UPDATE ON public.product_sibling_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for performance
CREATE INDEX idx_product_sibling_assignments_group ON public.product_sibling_assignments(sibling_group_id);
CREATE INDEX idx_product_sibling_assignments_product ON public.product_sibling_assignments(product_id);