DELETE FROM test_cases 
WHERE product_id = '144ba0bc-4248-4601-aa14-3fc41353494c'
  AND id NOT IN (
    SELECT target_id FROM traceability_links 
    WHERE product_id = '144ba0bc-4248-4601-aa14-3fc41353494c'
    UNION
    SELECT source_id FROM traceability_links 
    WHERE product_id = '144ba0bc-4248-4601-aa14-3fc41353494c'
  );