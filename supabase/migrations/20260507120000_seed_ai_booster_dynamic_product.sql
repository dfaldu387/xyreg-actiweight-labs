-- Seed the AI Booster Pack as a dynamic product.
--
-- IMPORTANT: price ($20.00) is the default_price of the Stripe Product, not
-- stored in this row. Create the Stripe Product first, then paste its ID below.
--
-- One-time Stripe setup (run once in your Stripe account):
--   1. Stripe Dashboard → Products → "Add product"
--      - Name: "AI Booster Pack"
--      - Pricing: One-time
--      - Price: 20.00 USD
--   2. Copy the resulting Product ID (starts with "prod_…").
--
-- Or via Stripe CLI:
--   stripe products create \
--     --name "AI Booster Pack" \
--     --description "500 AI credits add-on"
--   stripe prices create \
--     --product prod_XXXXXXXX \
--     --unit-amount 2000 \
--     --currency usd
--   stripe products update prod_XXXXXXXX --default-price=price_YYYYYYYY
--
-- Then replace 'REPLACE_WITH_STRIPE_PRODUCT_ID' below and run this migration.
-- After it lands, super admins can edit name / description / price / credits
-- from /super-admin/app/ai-token-usage — price changes mint a new Stripe Price
-- and archive the old one.

insert into public.dynamic_products (product_key, stripe_product_id, metadata, sort_order)
values (
  'ai_booster',
  'REPLACE_WITH_STRIPE_PRODUCT_ID',  -- prod_… for the $20 Stripe Product
  '{"credits": 500}'::jsonb,
  1
)
on conflict (product_key) do nothing;
