-- Add sample_size/repetitions column to test_cases table
ALTER TABLE public.test_cases 
ADD COLUMN IF NOT EXISTS sample_size integer DEFAULT 1;

-- Add comment explaining the field
COMMENT ON COLUMN public.test_cases.sample_size IS 'Number of test repetitions or sample size for statistical significance';