-- Fix calculate_phase_dates to respect dependency order instead of position
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
    processed_phases UUID[] := ARRAY[]::UUID[];
    remaining_phases UUID[];
    current_phase_id UUID;
    has_unmet_dependencies BOOLEAN;
    max_iterations INTEGER := 100;
    iteration_count INTEGER := 0;
BEGIN
    -- Get all active phases for the company
    SELECT ARRAY(
        SELECT cp.id 
        FROM company_phases cp 
        WHERE cp.company_id = p_company_id 
        AND cp.is_active = true
    ) INTO remaining_phases;
    
    -- Process phases until all are done or max iterations reached
    WHILE array_length(remaining_phases, 1) > 0 AND iteration_count < max_iterations LOOP
        iteration_count := iteration_count + 1;
        
        -- Find a phase that has all its dependencies already processed
        current_phase_id := NULL;
        
        FOREACH current_phase_id IN ARRAY remaining_phases LOOP
            -- Check if this phase has any unmet dependencies
            has_unmet_dependencies := FALSE;
            
            FOR dependency IN
                SELECT pd.source_phase_id
                FROM phase_dependencies pd
                WHERE pd.target_phase_id = current_phase_id
                AND pd.company_id = p_company_id
            LOOP
                -- If any dependency is not yet processed, skip this phase
                IF NOT (dependency.source_phase_id = ANY(processed_phases)) THEN
                    has_unmet_dependencies := TRUE;
                    EXIT;
                END IF;
            END LOOP;
            
            -- If no unmet dependencies, process this phase
            IF NOT has_unmet_dependencies THEN
                EXIT;
            END IF;
            
            current_phase_id := NULL;
        END LOOP;
        
        -- If no phase can be processed, break to avoid infinite loop
        IF current_phase_id IS NULL THEN
            EXIT;
        END IF;
        
        -- Get phase details
        SELECT cp.id, cp.name, cp.duration_days, cp.start_date, cp.end_date
        INTO current_phase
        FROM company_phases cp
        WHERE cp.id = current_phase_id;
        
        -- Initialize with current dates or today
        calculated_start := COALESCE(current_phase.start_date, CURRENT_DATE);
        calculated_end := current_phase.end_date;
        
        -- Check dependencies and adjust start date
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
                            calculated_start,
                            dependency.source_end_date + dependency.lag_days + 1
                        );
                    END IF;
                WHEN 'start_to_start' THEN
                    IF dependency.source_start_date IS NOT NULL THEN
                        calculated_start := GREATEST(
                            calculated_start,
                            dependency.source_start_date + dependency.lag_days
                        );
                    END IF;
            END CASE;
        END LOOP;
        
        -- Calculate end date based on start date and duration
        IF calculated_start IS NOT NULL AND current_phase.duration_days IS NOT NULL THEN
            calculated_end := calculated_start + current_phase.duration_days - 1;
        END IF;
        
        -- Return the calculated dates for this phase
        phase_id := current_phase.id;
        calculated_start_date := calculated_start;
        calculated_end_date := calculated_end;
        RETURN NEXT;
        
        -- Mark this phase as processed
        processed_phases := processed_phases || current_phase.id;
        remaining_phases := array_remove(remaining_phases, current_phase.id);
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;