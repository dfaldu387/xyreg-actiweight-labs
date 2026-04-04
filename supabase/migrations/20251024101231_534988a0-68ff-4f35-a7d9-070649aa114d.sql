-- Drop the redundant feasibility_target_markets table
-- This table duplicates data already available in product markets

DROP TABLE IF EXISTS public.feasibility_target_markets CASCADE;