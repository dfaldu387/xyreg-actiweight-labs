-- Move all 36 products from the old company record to the active one
UPDATE products 
SET company_id = '4bb3c63f-2a91-4be3-8aad-11360917a964'
WHERE company_id = 'd19201a5-671c-4f89-994b-d05c2e6900c0';
