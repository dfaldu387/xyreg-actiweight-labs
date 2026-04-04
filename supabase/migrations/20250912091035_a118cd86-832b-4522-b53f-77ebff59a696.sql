-- Add new AI-generated images to AESCULAP AICON product
UPDATE products 
SET images = COALESCE(images, '[]'::jsonb) || '["src/assets/aesculap-aicon-1.jpg", "src/assets/aesculap-aicon-2.jpg", "src/assets/aesculap-aicon-3.jpg"]'::jsonb 
WHERE id = '6022752a-3a2e-4ba9-92aa-b29955bd8de2' AND name = 'AESCULAP AICON';