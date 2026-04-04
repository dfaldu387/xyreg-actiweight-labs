-- Fix image mismatch: Remove incorrect FDA document image from INNOTERE Paste-CPC
UPDATE products 
SET image = NULL 
WHERE id = 'ac87a674-7581-464b-8714-35aba8ed0cb0' 
  AND name = 'INNOTERE Paste-CPC' 
  AND image LIKE '%FDA%regulation%';