-- Enhance company_product_models table for Model-Product hierarchy
ALTER TABLE company_product_models 
ADD COLUMN IF NOT EXISTS model_code TEXT,
ADD COLUMN IF NOT EXISTS basic_udi_di TEXT,
ADD COLUMN IF NOT EXISTS primary_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS variant_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS regulatory_class TEXT,
ADD COLUMN IF NOT EXISTS risk_class TEXT,
ADD COLUMN IF NOT EXISTS model_price NUMERIC(10,2);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_product_models_basic_udi_di ON company_product_models(basic_udi_di);
CREATE INDEX IF NOT EXISTS idx_company_product_models_is_active ON company_product_models(is_active);
CREATE INDEX IF NOT EXISTS idx_company_product_models_company_id ON company_product_models(company_id);

-- Enhance products table for variant support
ALTER TABLE products
ADD COLUMN IF NOT EXISTS model_id UUID REFERENCES company_product_models(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_variant BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS variant_sequence INTEGER,
ADD COLUMN IF NOT EXISTS variant_display_name TEXT,
ADD COLUMN IF NOT EXISTS inherit_pricing_from_model BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS regulatory_override_reason TEXT,
ADD COLUMN IF NOT EXISTS regulatory_override_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS regulatory_override_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for products
CREATE INDEX IF NOT EXISTS idx_products_model_id ON products(model_id);
CREATE INDEX IF NOT EXISTS idx_products_is_variant ON products(is_variant);

-- Function to update variant_count on company_product_models
CREATE OR REPLACE FUNCTION update_model_variant_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update variant count for the affected model
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.model_id IS NOT NULL THEN
      UPDATE company_product_models
      SET variant_count = (
        SELECT COUNT(*)
        FROM products
        WHERE model_id = NEW.model_id
        AND is_archived = false
      )
      WHERE id = NEW.model_id;
    END IF;
  END IF;
  
  -- Handle old model_id on UPDATE
  IF TG_OP = 'UPDATE' AND OLD.model_id IS NOT NULL AND OLD.model_id != NEW.model_id THEN
    UPDATE company_product_models
    SET variant_count = (
      SELECT COUNT(*)
      FROM products
      WHERE model_id = OLD.model_id
      AND is_archived = false
    )
    WHERE id = OLD.model_id;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' AND OLD.model_id IS NOT NULL THEN
    UPDATE company_product_models
    SET variant_count = (
      SELECT COUNT(*)
      FROM products
      WHERE model_id = OLD.model_id
      AND is_archived = false
    )
    WHERE id = OLD.model_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic variant_count updates
DROP TRIGGER IF EXISTS trigger_update_model_variant_count ON products;
CREATE TRIGGER trigger_update_model_variant_count
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW
EXECUTE FUNCTION update_model_variant_count();

-- Function to generate full product name
CREATE OR REPLACE FUNCTION get_product_full_name(product_id UUID)
RETURNS TEXT AS $$
DECLARE
  product_record RECORD;
  model_name TEXT;
  full_name TEXT;
BEGIN
  SELECT p.name, p.variant_display_name, p.model_id, p.is_variant
  INTO product_record
  FROM products p
  WHERE p.id = product_id;
  
  -- If not a variant or no variant_display_name, return regular name
  IF NOT product_record.is_variant OR product_record.variant_display_name IS NULL THEN
    RETURN product_record.name;
  END IF;
  
  -- Get model name
  IF product_record.model_id IS NOT NULL THEN
    SELECT m.name INTO model_name
    FROM company_product_models m
    WHERE m.id = product_record.model_id;
    
    -- Generate full name: "Model Name - Variant Display Name"
    IF model_name IS NOT NULL THEN
      full_name := model_name || ' - ' || product_record.variant_display_name;
      RETURN full_name;
    END IF;
  END IF;
  
  -- Fallback to regular name
  RETURN product_record.name;
END;
$$ LANGUAGE plpgsql;