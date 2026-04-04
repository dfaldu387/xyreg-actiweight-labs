-- Create product_exit_strategy table for Genesis Step 23
CREATE TABLE public.product_exit_strategy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  potential_acquirers JSONB DEFAULT '[]'::jsonb,
  comparable_transactions JSONB DEFAULT '[]'::jsonb,
  strategic_rationale TEXT,
  exit_timeline_years INTEGER,
  preferred_exit_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id)
);

-- Enable Row Level Security
ALTER TABLE public.product_exit_strategy ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view exit strategy for their company products" 
ON public.product_exit_strategy 
FOR SELECT 
USING (
  company_id IN (
    SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can create exit strategy for their company products" 
ON public.product_exit_strategy 
FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update exit strategy for their company products" 
ON public.product_exit_strategy 
FOR UPDATE 
USING (
  company_id IN (
    SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete exit strategy for their company products" 
ON public.product_exit_strategy 
FOR DELETE 
USING (
  company_id IN (
    SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_product_exit_strategy_updated_at
BEFORE UPDATE ON public.product_exit_strategy
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();