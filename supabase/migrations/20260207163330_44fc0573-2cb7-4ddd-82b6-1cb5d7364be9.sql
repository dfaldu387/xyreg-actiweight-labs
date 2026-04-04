-- Create product_high_level_risks table for business-level risk assessment
CREATE TABLE public.product_high_level_risks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('Clinical', 'Technical', 'Regulatory', 'Commercial')),
  risk_type text NOT NULL,
  is_custom boolean NOT NULL DEFAULT false,
  description text NOT NULL,
  likelihood integer NOT NULL CHECK (likelihood BETWEEN 1 AND 5),
  impact integer NOT NULL CHECK (impact BETWEEN 1 AND 5),
  risk_score integer GENERATED ALWAYS AS (likelihood * impact) STORED,
  risk_level text GENERATED ALWAYS AS (
    CASE 
      WHEN likelihood * impact <= 4 THEN 'Low'
      WHEN likelihood * impact <= 9 THEN 'Medium'
      WHEN likelihood * impact <= 15 THEN 'High'
      ELSE 'Critical'
    END
  ) STORED,
  mitigation text,
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Mitigated')),
  owner text,
  due_date date,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_high_level_risks_product ON public.product_high_level_risks(product_id);
CREATE INDEX idx_high_level_risks_company ON public.product_high_level_risks(company_id);
CREATE INDEX idx_high_level_risks_category ON public.product_high_level_risks(category);
CREATE INDEX idx_high_level_risks_status ON public.product_high_level_risks(status);

-- Enable RLS
ALTER TABLE public.product_high_level_risks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can manage risks for their company's products
CREATE POLICY "Users can view high level risks for their company"
  ON public.product_high_level_risks
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create high level risks for their company"
  ON public.product_high_level_risks
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update high level risks for their company"
  ON public.product_high_level_risks
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete high level risks for their company"
  ON public.product_high_level_risks
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_high_level_risks_updated_at
  BEFORE UPDATE ON public.product_high_level_risks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();