-- Update plan_features table to match user requirements:
-- MVP plan: 1 product
-- Basic plan: 2 products  
-- Pro plan: 5 products
-- Enterprise plan: 10 products

-- Update Basic Plan to allow 2 products instead of 1
UPDATE public.plan_features 
SET max_products = 2 
WHERE plan_key = 'basic';

-- Update Enterprise Plan to allow 10 products instead of unlimited (-1)
UPDATE public.plan_features 
SET max_products = 10 
WHERE plan_key = 'enterprise';

-- Update subscription_plans table features to reflect the correct product limits
UPDATE public.subscription_plans 
SET features = jsonb_set(features, '{2}', '"2 New Products"')
WHERE name = 'Basic Plan';

UPDATE public.subscription_plans 
SET features = jsonb_set(features, '{2}', '"Up to 10 New Products"')
WHERE name = 'Enterprise Plan';
