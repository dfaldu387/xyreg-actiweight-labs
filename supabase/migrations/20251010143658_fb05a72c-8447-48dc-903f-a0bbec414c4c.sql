-- Seed subscription_plans table with existing plans
INSERT INTO subscription_plans (
  name,
  description,
  stripe_product_id,
  stripe_price_id,
  price,
  currency,
  interval,
  is_active,
  is_featured,
  sort_order,
  features
) VALUES
  (
    'Starter',
    'Perfect for small teams getting started with compliance management',
    'prod_TCkYqOai1Z4KLZ',
    'price_1SGL3RPWQwH62VVmPh2OkbuL',
    29.00,
    'USD',
    'month',
    true,
    false,
    1,
    '["Up to 5 products", "Basic document management", "Email support", "30-day free trial"]'::jsonb
  ),
  (
    'Professional',
    'Advanced features for growing medical device companies',
    'prod_TCkYOHKTrItTzT',
    'price_1SGL3lPWQwH62VVmQwQosBaC',
    99.00,
    'USD',
    'month',
    true,
    true,
    2,
    '["Unlimited products", "Advanced compliance tools", "Priority support", "30-day free trial"]'::jsonb
  ),
  (
    'Enterprise',
    'Complete solution for large organizations with custom needs',
    'prod_TCkZxsavnrL4oH',
    'price_1SGL4NPWQwH62VVmT3oveGWQ',
    299.00,
    'USD',
    'month',
    true,
    false,
    3,
    '["Everything in Professional", "Dedicated support", "Custom integrations", "30-day free trial"]'::jsonb
  )
ON CONFLICT (stripe_product_id) DO NOTHING;