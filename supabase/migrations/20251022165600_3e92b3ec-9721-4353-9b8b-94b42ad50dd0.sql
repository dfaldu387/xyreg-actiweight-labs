-- Add metadata column to product_accessory_relationships for storing variant group info
ALTER TABLE product_accessory_relationships 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;