-- Add attachment_rate and distribution_group_id columns to product_bundle_members
ALTER TABLE product_bundle_members
ADD COLUMN IF NOT EXISTS attachment_rate DECIMAL(5,2) CHECK (attachment_rate >= 0 AND attachment_rate <= 100),
ADD COLUMN IF NOT EXISTS distribution_group_id TEXT;