-- Clean up test phases that are not being used properly
DELETE FROM phases 
WHERE name IN ('test 1', 'test 2', 'Test 3', 'Test 4') 
AND company_id = '215dde37-d42e-4afa-a21c-1750f9c16ec1';