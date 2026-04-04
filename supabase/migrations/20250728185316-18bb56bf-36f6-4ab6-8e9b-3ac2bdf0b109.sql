-- Correct phase classification for pre-revenue vs post-revenue
-- Only phases "8" (Launch & Post-Launch) and "C4" (Post-Market Surveillance) are post-revenue
-- All others including "(08) Design Change Control" are pre-revenue

-- First set all phases to pre-revenue (is_pre_launch = true)
UPDATE phases SET is_pre_launch = true;

-- Then set only the specific post-revenue phases to false
UPDATE phases 
SET is_pre_launch = false 
WHERE name IN (
  '(08) Launch & Post-Launch',
  '(C4) Post-Market Surveillance (PMS)'
);