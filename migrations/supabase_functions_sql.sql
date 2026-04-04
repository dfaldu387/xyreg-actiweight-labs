-- 1. Create Checkout Session Function
-- Run this in your Supabase SQL Editor

-- Enable the pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";

-- Create the function
CREATE OR REPLACE FUNCTION create_checkout_session(
  plan_id TEXT,
  plan_name TEXT,
  price TEXT,
  company_id TEXT DEFAULT NULL,
  user_id TEXT,
  success_url TEXT,
  cancel_url TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stripe_secret_key TEXT := 'sk_test_51RmECBPWQwH62VVmhYMKf8EicZZ8g9FbXmildKivZkW53D0HgZbhbc2JjF8NhadwS8Q8d9G5ZOf52lG0o5ASIoJw00mPRclpFv';
  price_amount INTEGER;
  session_response JSON;
  customer_email TEXT;
BEGIN
  -- Parse price to get amount in cents (now expects just numeric value)
  price_amount := CASE 
    WHEN price ~ '^\d+(?:\.\d{2})?$' THEN 
      (price::numeric * 100)::integer
    ELSE NULL
  END;

  IF price_amount IS NULL THEN
    RAISE EXCEPTION 'Invalid price format: %. Expected numeric value (e.g., 29)', price;
  END IF;

  -- Get customer email
  SELECT email INTO customer_email
  FROM auth.users
  WHERE id = user_id::uuid;

  -- Create Stripe checkout session using pg_net
  SELECT net.http_post(
    url := 'https://api.stripe.com/v1/checkout/sessions',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || stripe_secret_key,
      'Content-Type', 'application/x-www-form-urlencoded'
    ),
    body := 'payment_method_types[]=card' ||
      '&line_items[0][price_data][currency]=usd' ||
      '&line_items[0][price_data][product_data][name]=' || plan_name || ' Plan' ||
      '&line_items[0][price_data][product_data][description]=Subscription to ' || plan_name || ' plan' ||
      '&line_items[0][price_data][unit_amount]=' || price_amount ||
      '&line_items[0][price_data][recurring][interval]=month' ||
      '&line_items[0][quantity]=1' ||
      '&mode=subscription' ||
      '&success_url=' || success_url || '&session_id={CHECKOUT_SESSION_ID}' ||
      '&cancel_url=' || cancel_url ||
      '&metadata[planId]=' || plan_id ||
      '&metadata[planName]=' || plan_name ||
      '&metadata[companyId]=' || COALESCE(company_id, '') ||
      '&metadata[userId]=' || user_id ||
      CASE WHEN customer_email IS NOT NULL THEN '&customer_email=' || customer_email ELSE '' END
  ) INTO session_response;

  -- Return session ID
  RETURN json_build_object('sessionId', (session_response->>'id'));
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create checkout session: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_checkout_session TO authenticated;

-- 2. Verify Payment Function
CREATE OR REPLACE FUNCTION verify_payment(session_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stripe_secret_key TEXT := 'sk_test_51RmECBPWQwH62VVmhYMKf8EicZZ8g9FbXmildKivZkW53D0HgZbhbc2JjF8NhadwS8Q8d9G5ZOf52lG0o5ASIoJw00mPRclpFv';
  session_response JSON;
  plan_name TEXT;
  company_id TEXT;
  user_id TEXT;
  payment_status TEXT;
  update_success BOOLEAN := FALSE;
BEGIN
  -- Retrieve the checkout session from Stripe using pg_net
  SELECT net.http_get(
    url := 'https://api.stripe.com/v1/checkout/sessions/' || session_id,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || stripe_secret_key
    )
  ) INTO session_response;

  -- Check if session exists
  IF session_response IS NULL OR session_response->>'id' IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  -- Extract data from session
  payment_status := session_response->>'payment_status';
  plan_name := session_response->'metadata'->>'planName';
  company_id := session_response->'metadata'->>'companyId';
  user_id := session_response->'metadata'->>'userId';

  -- Check if payment was successful
  IF payment_status != 'paid' THEN
    RAISE EXCEPTION 'Payment not completed';
  END IF;

  -- Check required fields
  IF plan_name IS NULL OR user_id IS NULL THEN
    RAISE EXCEPTION 'Missing plan information';
  END IF;

  -- Update the plan in the database
  IF company_id IS NOT NULL AND company_id != '' THEN
    -- Update company plan
    UPDATE companies 
    SET subscription_plan = plan_name 
    WHERE id = company_id;
    
    IF FOUND THEN
      update_success := TRUE;
    END IF;
  ELSE
    -- Update user plan in metadata
    UPDATE auth.users 
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{selectedPlan}',
      to_jsonb(plan_name)
    )
    WHERE id = user_id::uuid;
    
    IF FOUND THEN
      update_success := TRUE;
    END IF;
  END IF;

  IF NOT update_success THEN
    RAISE EXCEPTION 'Failed to update plan';
  END IF;

  -- Return success response
  RETURN json_build_object(
    'success', TRUE,
    'planName', plan_name,
    'companyId', company_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Payment verification failed: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION verify_payment TO authenticated;

-- 3. Create a function to handle webhook events (optional)
CREATE OR REPLACE FUNCTION handle_stripe_webhook(
  event_type TEXT,
  event_data JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscription_id TEXT;
  customer_id TEXT;
  plan_name TEXT;
  company_id TEXT;
  user_id TEXT;
BEGIN
  -- Handle different event types
  CASE event_type
    WHEN 'checkout.session.completed' THEN
      -- Already handled by verify_payment function
      RETURN json_build_object('status', 'processed');
      
    WHEN 'customer.subscription.deleted' THEN
      -- Handle subscription cancellation
      subscription_id := event_data->>'id';
      
      -- Get metadata from subscription
      plan_name := event_data->'metadata'->>'planName';
      company_id := event_data->'metadata'->>'companyId';
      user_id := event_data->'metadata'->>'userId';
      
      -- Downgrade to Starter plan
      IF company_id IS NOT NULL AND company_id != '' THEN
        UPDATE companies 
        SET subscription_plan = 'Starter' 
        WHERE id = company_id;
      ELSIF user_id IS NOT NULL THEN
        UPDATE auth.users 
        SET raw_user_meta_data = jsonb_set(
          COALESCE(raw_user_meta_data, '{}'::jsonb),
          '{selectedPlan}',
          '"Starter"'
        )
        WHERE id = user_id::uuid;
      END IF;
      
      RETURN json_build_object('status', 'downgraded');
      
    WHEN 'invoice.payment_failed' THEN
      -- Handle failed payments
      RETURN json_build_object('status', 'payment_failed');
      
    ELSE
      -- Unhandled event type
      RETURN json_build_object('status', 'unhandled');
  END CASE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Webhook processing failed: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION handle_stripe_webhook TO authenticated;

-- 4. Create a function to get current plan
CREATE OR REPLACE FUNCTION get_current_plan(user_id UUID, company_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan TEXT;
  company_plan TEXT;
BEGIN
  -- Get user's plan from metadata
  SELECT raw_user_meta_data->>'selectedPlan' INTO user_plan
  FROM auth.users
  WHERE id = user_id;

  -- Get company's plan if company_id is provided
  IF company_id IS NOT NULL THEN
    SELECT subscription_plan INTO company_plan
    FROM companies
    WHERE id = company_id;
  END IF;

  -- Return company plan if available, otherwise user plan, otherwise 'Starter'
  RETURN COALESCE(company_plan, user_plan, 'Starter');
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_current_plan TO authenticated;

-- 5. Create a function to update plan
CREATE OR REPLACE FUNCTION update_plan(
  plan_name TEXT,
  user_id UUID,
  company_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF company_id IS NOT NULL THEN
    -- Update company plan
    UPDATE companies 
    SET subscription_plan = plan_name 
    WHERE id = company_id;
    
    IF FOUND THEN
      -- Also update user metadata to reflect company plan
      UPDATE auth.users 
      SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{selectedPlan}',
        to_jsonb(plan_name)
      )
      WHERE id = user_id;
      
      RETURN TRUE;
    END IF;
  ELSE
    -- Update user plan only
    UPDATE auth.users 
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{selectedPlan}',
      to_jsonb(plan_name)
    )
    WHERE id = user_id;
    
    RETURN FOUND;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_plan TO authenticated; 