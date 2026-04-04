-- Create table for detailed phase budget items
CREATE TABLE public.phase_budget_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id uuid NOT NULL REFERENCES public.lifecycle_phases(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('fixed', 'variable', 'other')),
  item_name text NOT NULL,
  cost numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.phase_budget_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for phase budget items
CREATE POLICY "Users can view budget items for accessible phases" 
ON public.phase_budget_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.lifecycle_phases lp
    JOIN public.products p ON p.id = lp.product_id
    JOIN public.user_company_access uca ON uca.company_id = p.company_id
    WHERE lp.id = phase_budget_items.phase_id 
    AND uca.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create budget items for accessible phases" 
ON public.phase_budget_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lifecycle_phases lp
    JOIN public.products p ON p.id = lp.product_id
    JOIN public.user_company_access uca ON uca.company_id = p.company_id
    WHERE lp.id = phase_budget_items.phase_id 
    AND uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can update budget items for accessible phases" 
ON public.phase_budget_items 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.lifecycle_phases lp
    JOIN public.products p ON p.id = lp.product_id
    JOIN public.user_company_access uca ON uca.company_id = p.company_id
    WHERE lp.id = phase_budget_items.phase_id 
    AND uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can delete budget items for accessible phases" 
ON public.phase_budget_items 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.lifecycle_phases lp
    JOIN public.products p ON p.id = lp.product_id
    JOIN public.user_company_access uca ON uca.company_id = p.company_id
    WHERE lp.id = phase_budget_items.phase_id 
    AND uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor')
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_phase_budget_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_phase_budget_items_updated_at
  BEFORE UPDATE ON public.phase_budget_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_phase_budget_items_updated_at();