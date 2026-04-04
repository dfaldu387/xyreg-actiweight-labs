-- Update gap analysis items to fix chapter assignments for GSPRs 17-23
-- These should be assigned to Chapter III, not Chapter II

UPDATE gap_analysis_items 
SET section = 'Chapter III: Requirements regarding the information supplied with the device'
WHERE clause_id IN ('MDR_Annex_I_17', 'MDR_Annex_I_18', 'MDR_Annex_I_19', 'MDR_Annex_I_20', 'MDR_Annex_I_21', 'MDR_Annex_I_22', 'MDR_Annex_I_23')
AND framework = 'MDR';

-- Add some example due dates to gap analysis items (30 days from now for high priority, 60 days for medium, 90 days for low)
UPDATE gap_analysis_items 
SET due_date = CASE 
    WHEN priority = 'high' THEN CURRENT_DATE + INTERVAL '30 days'
    WHEN priority = 'medium' THEN CURRENT_DATE + INTERVAL '60 days'
    WHEN priority = 'low' THEN CURRENT_DATE + INTERVAL '90 days'
    ELSE CURRENT_DATE + INTERVAL '60 days'
END
WHERE due_date IS NULL;