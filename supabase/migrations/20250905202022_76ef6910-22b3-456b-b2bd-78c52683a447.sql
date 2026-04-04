-- Add Post Market Surveillance phase for Genis company
INSERT INTO company_phases (
  id,
  company_id, 
  name, 
  description, 
  position, 
  is_active,
  is_predefined_core_phase,
  is_custom,
  is_deletable,
  duration_days
) VALUES (
  gen_random_uuid(),
  '1305f937-bc29-42d3-8100-02addd837a12',
  'Post Market Surveillance',
  'Ongoing monitoring of device performance and safety in the market',
  9,
  true,
  true,
  false,
  true,
  365
);