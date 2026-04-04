-- Update only the active subscription plans with real Stripe IDs
-- First, delete the old inactive plans to avoid conflicts
DELETE FROM subscription_plans WHERE is_active = false;

-- Update MVP plan
UPDATE subscription_plans 
SET 
  stripe_price_id = 'price_1SGL3RPWQwH62VVmPh2OkbuL',
  stripe_product_id = 'prod_TCkYqOai1Z4KLZ',
  price = 29.00
WHERE name = 'MVP (Core Build)' AND is_active = true;

-- Update Basic Plan
UPDATE subscription_plans 
SET 
  stripe_price_id = 'price_1SGhjdPWQwH62VVmtPUVrnIz',
  stripe_product_id = 'prod_TD7zwn4dtDsSXv',
  price = 99.99
WHERE name = 'Basic Plan' AND is_active = true;

-- Update Pro Plan
UPDATE subscription_plans 
SET 
  stripe_price_id = 'price_1SGL3lPWQwH62VVmQwQosBaC',
  stripe_product_id = 'prod_TCkYOHKTrItTzT',
  price = 99.00
WHERE name = 'Pro Plan' AND is_active = true;

-- Update Enterprise Plan
UPDATE subscription_plans 
SET 
  stripe_price_id = 'price_1SGL4NPWQwH62VVmT3oveGWQ',
  stripe_product_id = 'prod_TCkZxsavnrL4oH',
  price = 299.00
WHERE name = 'Enterprise Plan' AND is_active = true;