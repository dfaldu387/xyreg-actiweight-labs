
-- Add market-specific launch dates to products table
ALTER TABLE products 
ADD COLUMN market_launch_dates jsonb DEFAULT '{}';

-- Add start_date and end_date to lifecycle_phases table
ALTER TABLE lifecycle_phases 
ADD COLUMN start_date date,
ADD COLUMN end_date date,
ADD COLUMN is_overdue boolean DEFAULT false;

-- Create index for better performance on market launch dates
CREATE INDEX idx_products_market_launch_dates ON products USING gin (market_launch_dates);

-- Create indexes for phase dates
CREATE INDEX idx_lifecycle_phases_start_date ON lifecycle_phases (start_date);
CREATE INDEX idx_lifecycle_phases_end_date ON lifecycle_phases (end_date);

-- Add constraint to ensure start_date comes before end_date
ALTER TABLE lifecycle_phases 
ADD CONSTRAINT check_phase_date_order 
CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date);

-- Add trigger to automatically update is_overdue status based on end_date
CREATE OR REPLACE FUNCTION update_phase_overdue_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_overdue = (NEW.end_date IS NOT NULL AND NEW.end_date < CURRENT_DATE AND NEW.status != 'Completed');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_phase_overdue_status
  BEFORE INSERT OR UPDATE ON lifecycle_phases
  FOR EACH ROW
  EXECUTE FUNCTION update_phase_overdue_status();

-- Add constraint for market launch dates format validation
ALTER TABLE products 
ADD CONSTRAINT check_market_launch_dates_format 
CHECK (market_launch_dates IS NULL OR jsonb_typeof(market_launch_dates) = 'object');
