-- Extend hazards table for comprehensive risk management
ALTER TABLE hazards ADD COLUMN IF NOT EXISTS foreseeable_sequence_events TEXT;
ALTER TABLE hazards ADD COLUMN IF NOT EXISTS hazardous_situation TEXT;
ALTER TABLE hazards ADD COLUMN IF NOT EXISTS potential_harm TEXT;
ALTER TABLE hazards ADD COLUMN IF NOT EXISTS initial_severity INTEGER CHECK (initial_severity >= 1 AND initial_severity <= 5);
ALTER TABLE hazards ADD COLUMN IF NOT EXISTS initial_probability INTEGER CHECK (initial_probability >= 1 AND initial_probability <= 5);
ALTER TABLE hazards ADD COLUMN IF NOT EXISTS initial_risk_level TEXT;
ALTER TABLE hazards ADD COLUMN IF NOT EXISTS risk_control_measure TEXT;
ALTER TABLE hazards ADD COLUMN IF NOT EXISTS risk_control_type TEXT CHECK (risk_control_type IN ('design', 'protective_measure', 'information_for_safety'));
ALTER TABLE hazards ADD COLUMN IF NOT EXISTS residual_severity INTEGER CHECK (residual_severity >= 1 AND residual_severity <= 5);
ALTER TABLE hazards ADD COLUMN IF NOT EXISTS residual_probability INTEGER CHECK (residual_probability >= 1 AND residual_probability <= 5);
ALTER TABLE hazards ADD COLUMN IF NOT EXISTS residual_risk_level TEXT;
ALTER TABLE hazards ADD COLUMN IF NOT EXISTS verification_implementation TEXT;
ALTER TABLE hazards ADD COLUMN IF NOT EXISTS verification_effectiveness TEXT;
ALTER TABLE hazards ADD COLUMN IF NOT EXISTS traceability_requirements TEXT;

-- Create risk calculation function
CREATE OR REPLACE FUNCTION calculate_risk_level(severity INTEGER, probability INTEGER)
RETURNS TEXT AS $$
DECLARE
    risk_score INTEGER;
BEGIN
    IF severity IS NULL OR probability IS NULL THEN
        RETURN NULL;
    END IF;
    
    risk_score := severity * probability;
    
    CASE 
        WHEN risk_score <= 4 THEN RETURN 'Low';
        WHEN risk_score <= 9 THEN RETURN 'Medium';
        WHEN risk_score <= 15 THEN RETURN 'High';
        ELSE RETURN 'Very High';
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update trigger to auto-calculate risk levels
CREATE OR REPLACE FUNCTION update_risk_levels()
RETURNS TRIGGER AS $$
BEGIN
    NEW.initial_risk_level := calculate_risk_level(NEW.initial_severity, NEW.initial_probability);
    NEW.residual_risk_level := calculate_risk_level(NEW.residual_severity, NEW.residual_probability);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS calculate_risk_levels_trigger ON hazards;
CREATE TRIGGER calculate_risk_levels_trigger
    BEFORE INSERT OR UPDATE ON hazards
    FOR EACH ROW
    EXECUTE FUNCTION update_risk_levels();