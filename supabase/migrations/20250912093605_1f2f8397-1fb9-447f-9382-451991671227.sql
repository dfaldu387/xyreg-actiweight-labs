-- Force update AESCULAP AICON product with AI-generated images
UPDATE products 
SET images = '["src/assets/aesculap-aicon-1.jpg", "src/assets/aesculap-aicon-2.jpg", "src/assets/aesculap-aicon-3.jpg"]'::jsonb,
    updated_at = now()
WHERE id = '6022752a-3a2e-4ba9-92aa-b29955bd8de2' AND name = 'AESCULAP AICON';