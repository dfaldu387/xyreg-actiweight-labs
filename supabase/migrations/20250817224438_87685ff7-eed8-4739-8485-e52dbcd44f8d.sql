-- Add launch_status enum and field to products table
CREATE TYPE launch_status AS ENUM ('pre_launch', 'launched', 'discontinued');

-- Add launch_status column to products table
ALTER TABLE products 
ADD COLUMN launch_status launch_status DEFAULT 'pre_launch';

-- Add launch_date column to track actual launch dates
ALTER TABLE products 
ADD COLUMN actual_launch_date date;

-- Create index for better performance on launch_status queries
CREATE INDEX idx_products_launch_status ON products(launch_status);

-- Update existing products based on their current lifecycle phase
-- Products in commercial phases should be marked as launched
UPDATE products 
SET launch_status = 'launched'
WHERE current_lifecycle_phase IN ('Production', 'Post-Market Surveillance', 'End of Life')
  OR current_lifecycle_phase LIKE '%Production%'
  OR current_lifecycle_phase LIKE '%Commercial%'
  OR current_lifecycle_phase LIKE '%Market%';

-- Create trigger to automatically update launch_status when phase changes
CREATE OR REPLACE FUNCTION update_launch_status_on_phase_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-transition to launched when moving to commercial phases
  IF NEW.current_lifecycle_phase IN ('Production', 'Post-Market Surveillance') 
     AND OLD.current_lifecycle_phase IS DISTINCT FROM NEW.current_lifecycle_phase
     AND NEW.launch_status = 'pre_launch' THEN
    NEW.launch_status = 'launched';
    
    -- Set actual launch date if not already set
    IF NEW.actual_launch_date IS NULL THEN
      NEW.actual_launch_date = CURRENT_DATE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_launch_status_on_phase_change
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_launch_status_on_phase_change();