-- Create product-specific phase dependencies table
CREATE TABLE product_phase_dependencies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL,
  source_phase_id uuid NOT NULL,
  target_phase_id uuid NOT NULL,
  dependency_type text NOT NULL DEFAULT 'finish_to_start',
  lag_days integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_phase_dependencies_dependency_type_check 
    CHECK (dependency_type = ANY (ARRAY['finish_to_start'::text, 'start_to_start'::text, 'finish_to_finish'::text, 'start_to_finish'::text]))
);

-- Enable Row Level Security
ALTER TABLE product_phase_dependencies ENABLE ROW LEVEL SECURITY;

-- Create policies for product phase dependencies
CREATE POLICY "Users can view product dependencies for accessible products" 
ON product_phase_dependencies 
FOR SELECT 
USING (
  product_id IN (
    SELECT p.id FROM products p
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE uca.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create product dependencies for their products" 
ON product_phase_dependencies 
FOR INSERT 
WITH CHECK (
  product_id IN (
    SELECT p.id FROM products p
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE uca.user_id = auth.uid() 
    AND uca.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
  )
);

CREATE POLICY "Users can update product dependencies for their products" 
ON product_phase_dependencies 
FOR UPDATE 
USING (
  product_id IN (
    SELECT p.id FROM products p
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE uca.user_id = auth.uid() 
    AND uca.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
  )
);

CREATE POLICY "Users can delete product dependencies for their products" 
ON product_phase_dependencies 
FOR DELETE 
USING (
  product_id IN (
    SELECT p.id FROM products p
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE uca.user_id = auth.uid() 
    AND uca.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
  )
);

-- Create indexes for performance
CREATE INDEX idx_product_phase_dependencies_product_id ON product_phase_dependencies(product_id);
CREATE INDEX idx_product_phase_dependencies_source_phase ON product_phase_dependencies(source_phase_id);
CREATE INDEX idx_product_phase_dependencies_target_phase ON product_phase_dependencies(target_phase_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_product_phase_dependencies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_product_phase_dependencies_updated_at
  BEFORE UPDATE ON product_phase_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION update_product_phase_dependencies_updated_at();