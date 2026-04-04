-- Create phase_dependencies table for the new dependency system
CREATE TABLE public.phase_dependencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_phase_id UUID NOT NULL,
  target_phase_id UUID NOT NULL,
  dependency_type TEXT NOT NULL CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
  lag_days INTEGER NOT NULL DEFAULT 0,
  company_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure we don't create circular dependencies
  CONSTRAINT no_self_dependency CHECK (source_phase_id != target_phase_id),
  -- Ensure unique dependencies between phases
  CONSTRAINT unique_phase_dependency UNIQUE (source_phase_id, target_phase_id, dependency_type)
);

-- Enable RLS on phase_dependencies
ALTER TABLE public.phase_dependencies ENABLE ROW LEVEL SECURITY;

-- RLS policies for phase_dependencies
CREATE POLICY "Users can view dependencies for accessible companies"
ON public.phase_dependencies
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create dependencies for their companies"
ON public.phase_dependencies
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() 
    AND access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can update dependencies for their companies"
ON public.phase_dependencies
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() 
    AND access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can delete dependencies for their companies"
ON public.phase_dependencies
FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() 
    AND access_level IN ('admin', 'editor')
  )
);

-- Add indexes for performance
CREATE INDEX idx_phase_dependencies_source ON public.phase_dependencies (source_phase_id);
CREATE INDEX idx_phase_dependencies_target ON public.phase_dependencies (target_phase_id);
CREATE INDEX idx_phase_dependencies_company ON public.phase_dependencies (company_id);

-- Add updated_at trigger
CREATE TRIGGER update_phase_dependencies_updated_at
  BEFORE UPDATE ON public.phase_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add new columns to company_phases for the simplified model
ALTER TABLE public.company_phases 
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS default_duration_days INTEGER DEFAULT 30;

-- Rename typical_duration_days to default_duration_days if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'company_phases' 
             AND column_name = 'typical_duration_days') THEN
    ALTER TABLE public.company_phases 
    RENAME COLUMN typical_duration_days TO default_duration_days;
  END IF;
END $$;

-- Function to detect circular dependencies
CREATE OR REPLACE FUNCTION public.has_circular_dependency(
  p_source_phase_id UUID,
  p_target_phase_id UUID,
  p_company_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  visited_phases UUID[] := ARRAY[]::UUID[];
  current_phase UUID;
  stack UUID[] := ARRAY[p_target_phase_id];
BEGIN
  -- Simple cycle detection using DFS
  WHILE array_length(stack, 1) > 0 LOOP
    current_phase := stack[1];
    stack := stack[2:array_length(stack, 1)];
    
    -- If we've reached the source phase, we have a cycle
    IF current_phase = p_source_phase_id THEN
      RETURN TRUE;
    END IF;
    
    -- If we've already visited this phase, skip it
    IF current_phase = ANY(visited_phases) THEN
      CONTINUE;
    END IF;
    
    -- Mark as visited
    visited_phases := visited_phases || current_phase;
    
    -- Add all dependent phases to the stack
    stack := stack || ARRAY(
      SELECT target_phase_id 
      FROM public.phase_dependencies 
      WHERE source_phase_id = current_phase 
      AND company_id = p_company_id
    );
  END LOOP;
  
  RETURN FALSE;
END;
$$;

-- Function to calculate phase dates based on dependencies
CREATE OR REPLACE FUNCTION public.calculate_phase_dates(p_company_id UUID)
RETURNS TABLE(phase_id UUID, calculated_start_date DATE, calculated_end_date DATE)
LANGUAGE plpgsql
AS $$
DECLARE
  phase_record RECORD;
  dependency_record RECORD;
  calculated_start DATE;
  calculated_end DATE;
  max_iterations INTEGER := 100;
  iteration_count INTEGER := 0;
BEGIN
  -- Create temporary table for calculations
  CREATE TEMP TABLE IF NOT EXISTS temp_phase_dates (
    phase_id UUID PRIMARY KEY,
    start_date DATE,
    end_date DATE,
    is_calculated BOOLEAN DEFAULT FALSE
  );
  
  -- Initialize with existing dates or defaults
  INSERT INTO temp_phase_dates (phase_id, start_date, end_date, is_calculated)
  SELECT 
    cp.id,
    COALESCE(cp.start_date, CURRENT_DATE) as start_date,
    COALESCE(cp.end_date, CURRENT_DATE + INTERVAL '1 day' * COALESCE(cp.default_duration_days, 30)) as end_date,
    CASE 
      WHEN cp.start_date IS NOT NULL AND cp.end_date IS NOT NULL THEN TRUE
      ELSE FALSE
    END as is_calculated
  FROM public.company_phases cp
  WHERE cp.company_id = p_company_id
  ON CONFLICT (phase_id) DO NOTHING;
  
  -- Iteratively calculate dates based on dependencies
  WHILE iteration_count < max_iterations LOOP
    iteration_count := iteration_count + 1;
    
    -- Check if we've calculated all phases
    IF NOT EXISTS (SELECT 1 FROM temp_phase_dates WHERE is_calculated = FALSE) THEN
      EXIT;
    END IF;
    
    -- Process phases that have all their dependencies calculated
    FOR phase_record IN 
      SELECT tpd.phase_id, cp.default_duration_days
      FROM temp_phase_dates tpd
      JOIN public.company_phases cp ON cp.id = tpd.phase_id
      WHERE tpd.is_calculated = FALSE
      AND NOT EXISTS (
        SELECT 1 FROM public.phase_dependencies pd
        JOIN temp_phase_dates source_tpd ON source_tpd.phase_id = pd.source_phase_id
        WHERE pd.target_phase_id = tpd.phase_id
        AND pd.company_id = p_company_id
        AND source_tpd.is_calculated = FALSE
      )
    LOOP
      calculated_start := NULL;
      calculated_end := NULL;
      
      -- Calculate start date based on dependencies
      FOR dependency_record IN
        SELECT pd.*, source_tpd.start_date as source_start, source_tpd.end_date as source_end
        FROM public.phase_dependencies pd
        JOIN temp_phase_dates source_tpd ON source_tpd.phase_id = pd.source_phase_id
        WHERE pd.target_phase_id = phase_record.phase_id
        AND pd.company_id = p_company_id
      LOOP
        CASE dependency_record.dependency_type
          WHEN 'finish_to_start' THEN
            calculated_start := GREATEST(
              COALESCE(calculated_start, dependency_record.source_end + dependency_record.lag_days),
              dependency_record.source_end + dependency_record.lag_days
            );
          WHEN 'start_to_start' THEN
            calculated_start := GREATEST(
              COALESCE(calculated_start, dependency_record.source_start + dependency_record.lag_days),
              dependency_record.source_start + dependency_record.lag_days
            );
          WHEN 'finish_to_finish' THEN
            calculated_end := GREATEST(
              COALESCE(calculated_end, dependency_record.source_end + dependency_record.lag_days),
              dependency_record.source_end + dependency_record.lag_days
            );
          WHEN 'start_to_finish' THEN
            calculated_end := GREATEST(
              COALESCE(calculated_end, dependency_record.source_start + dependency_record.lag_days),
              dependency_record.source_start + dependency_record.lag_days
            );
        END CASE;
      END LOOP;
      
      -- If no start date calculated from dependencies, use current start date
      IF calculated_start IS NULL THEN
        SELECT start_date INTO calculated_start FROM temp_phase_dates WHERE phase_id = phase_record.phase_id;
      END IF;
      
      -- If no end date calculated from dependencies, calculate from start + duration
      IF calculated_end IS NULL THEN
        calculated_end := calculated_start + INTERVAL '1 day' * COALESCE(phase_record.default_duration_days, 30);
      END IF;
      
      -- Update the temporary table
      UPDATE temp_phase_dates 
      SET 
        start_date = calculated_start,
        end_date = calculated_end,
        is_calculated = TRUE
      WHERE phase_id = phase_record.phase_id;
    END LOOP;
  END LOOP;
  
  -- Return the calculated dates
  RETURN QUERY
  SELECT tpd.phase_id, tpd.start_date, tpd.end_date
  FROM temp_phase_dates tpd;
  
  -- Clean up
  DROP TABLE IF EXISTS temp_phase_dates;
END;
$$;

-- Function to validate dependency creation (prevent cycles)
CREATE OR REPLACE FUNCTION public.validate_phase_dependency()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check for circular dependencies
  IF public.has_circular_dependency(NEW.source_phase_id, NEW.target_phase_id, NEW.company_id) THEN
    RAISE EXCEPTION 'Creating this dependency would create a circular dependency loop';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger to validate dependencies
CREATE TRIGGER validate_phase_dependency_trigger
  BEFORE INSERT OR UPDATE ON public.phase_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_phase_dependency();

-- Safe reorder function for company phases with dependency awareness
CREATE OR REPLACE FUNCTION public.safe_reorder_company_phases(
  target_company_id UUID,
  phase_ids UUID[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  phase_id UUID;
  position_counter INTEGER := 1;
BEGIN
  -- Validate that all phase_ids belong to the company
  IF EXISTS (
    SELECT 1 FROM unnest(phase_ids) AS pid
    WHERE pid NOT IN (
      SELECT id FROM public.company_phases 
      WHERE company_id = target_company_id
    )
  ) THEN
    RAISE EXCEPTION 'Some phases do not belong to the specified company';
  END IF;
  
  -- Update positions
  FOREACH phase_id IN ARRAY phase_ids LOOP
    UPDATE public.company_chosen_phases 
    SET position = position_counter
    WHERE company_id = target_company_id 
    AND phase_id = phase_id;
    
    position_counter := position_counter + 1;
  END LOOP;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;