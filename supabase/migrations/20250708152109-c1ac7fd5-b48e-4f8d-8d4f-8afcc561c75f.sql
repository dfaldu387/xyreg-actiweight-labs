
-- Add likelihood_of_approval column to lifecycle_phases table
ALTER TABLE public.lifecycle_phases 
ADD COLUMN likelihood_of_approval DECIMAL(5,2) NOT NULL DEFAULT 100.00;

-- Add a check constraint to ensure the value is between 0 and 100
ALTER TABLE public.lifecycle_phases 
ADD CONSTRAINT check_likelihood_of_approval_range 
CHECK (likelihood_of_approval >= 0.00 AND likelihood_of_approval <= 100.00);

-- Add a comment to document the column
COMMENT ON COLUMN public.lifecycle_phases.likelihood_of_approval IS 'Likelihood of approval percentage (0.00 to 100.00)';
