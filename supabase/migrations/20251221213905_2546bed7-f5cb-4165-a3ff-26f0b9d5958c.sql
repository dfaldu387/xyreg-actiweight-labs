-- Add new columns to product_reimbursement_strategy for Global Stakeholder Profiler
ALTER TABLE product_reimbursement_strategy 
  ADD COLUMN IF NOT EXISTS primary_launch_market TEXT,
  ADD COLUMN IF NOT EXISTS buyer_type TEXT,
  ADD COLUMN IF NOT EXISTS procurement_path TEXT,
  ADD COLUMN IF NOT EXISTS mhlw_category TEXT,
  ADD COLUMN IF NOT EXISTS vbp_status TEXT,
  ADD COLUMN IF NOT EXISTS prostheses_list_targeting BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS prostheses_list_grouping TEXT,
  ADD COLUMN IF NOT EXISTS primary_payer TEXT,
  ADD COLUMN IF NOT EXISTS budget_type TEXT,
  ADD COLUMN IF NOT EXISTS coding_strategy TEXT,
  ADD COLUMN IF NOT EXISTS user_profile JSONB;

-- Add comment for documentation
COMMENT ON COLUMN product_reimbursement_strategy.primary_launch_market IS 'Primary launch market: USA, UK, EU, Japan, China, Australia, Canada, India, Brazil, South_Korea';
COMMENT ON COLUMN product_reimbursement_strategy.buyer_type IS 'Economic buyer type (varies by market): IDN/ASC/GPO (USA), NHS Trust (UK), etc.';
COMMENT ON COLUMN product_reimbursement_strategy.procurement_path IS 'Procurement path for UK/Canada/EU: National_Tender, Local_Trust, Innovation_Fund';
COMMENT ON COLUMN product_reimbursement_strategy.mhlw_category IS 'Japan MHLW reimbursement category: A1_A2, B_STM, C1_C2';
COMMENT ON COLUMN product_reimbursement_strategy.vbp_status IS 'China VBP status: Yes_Provincial, Yes_National, No_Niche';
COMMENT ON COLUMN product_reimbursement_strategy.prostheses_list_targeting IS 'Australia: targeting private market via Prostheses List';
COMMENT ON COLUMN product_reimbursement_strategy.prostheses_list_grouping IS 'Australia Prostheses List grouping code';
COMMENT ON COLUMN product_reimbursement_strategy.primary_payer IS 'India/Brazil payer: Self_Pay, Private_Insurance, Public_System';
COMMENT ON COLUMN product_reimbursement_strategy.budget_type IS 'CapEx (Capital) or OpEx (Consumable)';
COMMENT ON COLUMN product_reimbursement_strategy.coding_strategy IS 'USA coding strategy: Existing_CPT, New_CPT, DRG_Bundle';
COMMENT ON COLUMN product_reimbursement_strategy.user_profile IS 'JSON object with primary_operator, use_environment, pain_points';