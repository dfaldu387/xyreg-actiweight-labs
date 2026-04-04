-- Update duration values for continuous processes across all companies
UPDATE company_phases 
SET typical_duration_days = CASE 
  WHEN name LIKE '%Risk Management%' OR name LIKE '%(C1)%' THEN 795
  WHEN name LIKE '%Technical Documentation%' OR name LIKE '%(C2)%' THEN 555
  WHEN name LIKE '%Supplier Management%' OR name LIKE '%(C3)%' THEN 675
  WHEN name LIKE '%Post-Market Surveillance%' OR name LIKE '%(C4)%' THEN NULL -- Keep as ongoing
  ELSE typical_duration_days
END
WHERE is_continuous_process = true 
  AND typical_duration_days = -1;