# Fix for "Unknown" Plan Name Issue

## Problem
The plan name shows as "Unknown" in the Billing tab because the `stripe_product_id` values in the database don't match the actual Stripe product IDs from your manually created products.

## Solution
Update the `subscription_plans` table with the correct Stripe product and price IDs.

## Steps

### 1. Get your Stripe Product and Price IDs
Go to your Stripe Dashboard and copy the Product ID and Price ID for each plan you created:
- MVP (Core Build) - $0/month
- Basic Plan - $49/month
- Pro Plan - $149/month
- Enterprise Plan - $499/month

### 2. Run the UPDATE queries

Once you have the IDs, run these SQL queries in your Supabase SQL Editor, replacing the placeholder values:

```sql
-- Update MVP Plan
UPDATE subscription_plans
SET 
  stripe_product_id = 'prod_YOUR_MVP_PRODUCT_ID',
  stripe_price_id = 'price_YOUR_MVP_PRICE_ID'
WHERE name = 'MVP (Core Build)';

-- Update Basic Plan
UPDATE subscription_plans
SET 
  stripe_product_id = 'prod_YOUR_BASIC_PRODUCT_ID',
  stripe_price_id = 'price_YOUR_BASIC_PRICE_ID'
WHERE name = 'Basic Plan';

-- Update Pro Plan
UPDATE subscription_plans
SET 
  stripe_product_id = 'prod_YOUR_PRO_PRODUCT_ID',
  stripe_price_id = 'price_YOUR_PRO_PRICE_ID'
WHERE name = 'Pro Plan';

-- Update Enterprise Plan
UPDATE subscription_plans
SET 
  stripe_product_id = 'prod_YOUR_ENTERPRISE_PRODUCT_ID',
  stripe_price_id = 'price_YOUR_ENTERPRISE_PRICE_ID'
WHERE name = 'Enterprise Plan';
```

### 3. Verify the update
Run this query to verify the changes:

```sql
SELECT name, stripe_product_id, stripe_price_id, price
FROM subscription_plans
ORDER BY sort_order;
```

## Why This Fixes the Issue

The app looks up the plan by matching:
- `subscription.product_id` (from Stripe) with
- `subscription_plans.stripe_product_id` (from database)

When these don't match, the plan lookup returns `null`, showing "Unknown".

After updating the database with the correct Stripe IDs, the lookup will work correctly and display the plan name and all billing information.
