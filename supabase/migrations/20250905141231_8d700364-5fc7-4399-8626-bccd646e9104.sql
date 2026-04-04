-- Clean up company_phases schema and remove redundant columns
-- Add duration_days column first
ALTER TABLE company_phases 
ADD COLUMN IF NOT EXISTS duration_days INTEGER;

-- Migrate data from typical_duration_days to duration_days
UPDATE company_phases 
SET duration_days = typical_duration_days 
WHERE typical_duration_days IS NOT NULL AND duration_days IS NULL;

-- Set default duration for phases without duration
UPDATE company_phases 
SET duration_days = 30 
WHERE duration_days IS NULL;

-- Make duration_days not null
ALTER TABLE company_phases 
ALTER COLUMN duration_days SET NOT NULL;

-- Drop the redundant typical columns
ALTER TABLE company_phases 
DROP COLUMN IF EXISTS typical_start_day;

ALTER TABLE company_phases 
DROP COLUMN IF EXISTS typical_duration_days;

-- Update the calculate_phase_dates function to use the correct columns
CREATE OR REPLACE FUNCTION calculate_phase_dates(p_company_id UUID)
RETURNS TABLE (
    phase_id UUID,
    calculated_start_date DATE,
    calculated_end_date DATE
) AS $$
DECLARE
    current_phase RECORD;
    dependency RECORD;
    calculated_start DATE;
    calculated_end DATE;
BEGIN
    -- For each phase in the company
    FOR current_phase IN 
        SELECT cp.id, cp.name, cp.duration_days, cp.start_date, cp.end_date
        FROM company_phases cp
        WHERE cp.company_id = p_company_id
        AND cp.is_active = true
        ORDER BY cp.position
    LOOP
        -- Initialize with current dates
        calculated_start := current_phase.start_date;
        calculated_end := current_phase.end_date;
        
        -- Check if this phase has any dependencies
        FOR dependency IN
            SELECT pd.source_phase_id, pd.dependency_type, pd.lag_days,
                   source_cp.end_date as source_end_date,
                   source_cp.start_date as source_start_date
            FROM phase_dependencies pd
            JOIN company_phases source_cp ON source_cp.id = pd.source_phase_id
            WHERE pd.target_phase_id = current_phase.id
            AND pd.company_id = p_company_id
        LOOP
            -- Calculate start date based on dependency type
            CASE dependency.dependency_type
                WHEN 'finish_to_start' THEN
                    IF dependency.source_end_date IS NOT NULL THEN
                        calculated_start := GREATEST(
                            COALESCE(calculated_start, dependency.source_end_date + dependency.lag_days),
                            dependency.source_end_date + dependency.lag_days
                        );
                    END IF;
                WHEN 'start_to_start' THEN
                    IF dependency.source_start_date IS NOT NULL THEN
                        calculated_start := GREATEST(
                            COALESCE(calculated_start, dependency.source_start_date + dependency.lag_days),
                            dependency.source_start_date + dependency.lag_days
                        );
                    END IF;
            END CASE;
        END LOOP;
        
        -- Calculate end date based on start date and duration
        IF calculated_start IS NOT NULL AND current_phase.duration_days IS NOT NULL THEN
            calculated_end := calculated_start + current_phase.duration_days;
        END IF;
        
        -- Return the calculated dates for this phase
        phase_id := current_phase.id;
        calculated_start_date := calculated_start;
        calculated_end_date := calculated_end;
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;