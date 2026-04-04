-- Create subscription tracking table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  product_id TEXT,
  price_id TEXT,
  status TEXT NOT NULL DEFAULT 'trialing',
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON public.user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER set_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Create function to initialize trial for new users
CREATE OR REPLACE FUNCTION public.initialize_user_trial()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_subscriptions (
    user_id,
    status,
    trial_start,
    trial_end
  ) VALUES (
    NEW.id,
    'trialing',
    now(),
    now() + interval '30 days'
  );
  RETURN NEW;
END;
$$;

-- Trigger to auto-create trial when user signs up
CREATE TRIGGER on_auth_user_created_trial
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_trial();

-- Create feature limits table
CREATE TABLE IF NOT EXISTS public.plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key TEXT NOT NULL UNIQUE,
  max_products INTEGER,
  max_users INTEGER,
  max_companies INTEGER,
  features JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert plan limits
INSERT INTO public.plan_features (plan_key, max_products, max_users, max_companies, features) VALUES
  ('starter', 5, 3, 1, '{"basic_docs": true, "email_support": true}'),
  ('professional', -1, 10, 3, '{"advanced_compliance": true, "priority_support": true, "api_access": true}'),
  ('enterprise', -1, -1, -1, '{"dedicated_support": true, "custom_integrations": true, "sla": true, "advanced_analytics": true}')
ON CONFLICT (plan_key) DO NOTHING;

-- Enable RLS on plan_features
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

-- Everyone can read plan features
CREATE POLICY "Anyone can view plan features"
  ON public.plan_features
  FOR SELECT
  TO authenticated
  USING (true);