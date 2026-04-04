-- Extend product_accessory_relationships table with smart revenue modeling fields
ALTER TABLE product_accessory_relationships 
ADD COLUMN IF NOT EXISTS initial_multiplier DECIMAL(10,3) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS recurring_multiplier DECIMAL(10,3) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS recurring_period TEXT DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS lifecycle_duration_months INTEGER DEFAULT 12,
ADD COLUMN IF NOT EXISTS seasonality_factors JSONB DEFAULT '{}';

-- Create smart revenue calculations table for caching calculations
CREATE TABLE IF NOT EXISTS smart_revenue_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  main_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  accessory_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  calculation_month DATE NOT NULL,
  main_product_forecast_units INTEGER DEFAULT 0,
  initial_accessory_revenue DECIMAL(15,2) DEFAULT 0,
  recurring_accessory_revenue DECIMAL(15,2) DEFAULT 0,
  total_attributed_revenue DECIMAL(15,2) DEFAULT 0,
  calculation_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create multiplier history table for tracking changes
CREATE TABLE IF NOT EXISTS multiplier_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES product_accessory_relationships(id) ON DELETE CASCADE,
  old_initial_multiplier DECIMAL(10,3),
  new_initial_multiplier DECIMAL(10,3),
  old_recurring_multiplier DECIMAL(10,3),
  new_recurring_multiplier DECIMAL(10,3),
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_smart_revenue_calc_company_month 
  ON smart_revenue_calculations(company_id, calculation_month);
CREATE INDEX IF NOT EXISTS idx_smart_revenue_calc_main_product 
  ON smart_revenue_calculations(main_product_id);
CREATE INDEX IF NOT EXISTS idx_multiplier_history_relationship 
  ON multiplier_history(relationship_id);

-- Add RLS policies
ALTER TABLE smart_revenue_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplier_history ENABLE ROW LEVEL SECURITY;

-- Smart revenue calculations policies
CREATE POLICY "Users can view smart revenue calculations for their companies"
  ON smart_revenue_calculations FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create smart revenue calculations for their companies"
  ON smart_revenue_calculations FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() 
    AND access_level IN ('admin', 'editor')
  ));

CREATE POLICY "Users can update smart revenue calculations for their companies"
  ON smart_revenue_calculations FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() 
    AND access_level IN ('admin', 'editor')
  ));

-- Multiplier history policies
CREATE POLICY "Users can view multiplier history for their companies"
  ON multiplier_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM product_accessory_relationships par
    WHERE par.id = multiplier_history.relationship_id
    AND par.company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can create multiplier history for their companies"
  ON multiplier_history FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM product_accessory_relationships par
    WHERE par.id = multiplier_history.relationship_id
    AND par.company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level IN ('admin', 'editor')
    )
  ));

-- Add trigger to track multiplier changes
CREATE OR REPLACE FUNCTION track_multiplier_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if multipliers actually changed
  IF (OLD.initial_multiplier IS DISTINCT FROM NEW.initial_multiplier) OR
     (OLD.recurring_multiplier IS DISTINCT FROM NEW.recurring_multiplier) THEN
    
    INSERT INTO multiplier_history (
      relationship_id,
      old_initial_multiplier,
      new_initial_multiplier,
      old_recurring_multiplier,
      new_recurring_multiplier,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.initial_multiplier,
      NEW.initial_multiplier,
      OLD.recurring_multiplier,
      NEW.recurring_multiplier,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_multiplier_changes
  AFTER UPDATE ON product_accessory_relationships
  FOR EACH ROW
  EXECUTE FUNCTION track_multiplier_changes();