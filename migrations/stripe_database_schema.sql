-- Stripe Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- 1. Stripe Checkout Sessions Table
CREATE TABLE IF NOT EXISTS stripe_checkout_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    price_amount INTEGER NOT NULL, -- Amount in cents
    price_currency TEXT DEFAULT 'usd',
    payment_status TEXT DEFAULT 'pending',
    subscription_id TEXT,
    customer_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Stripe Subscriptions Table
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id TEXT UNIQUE NOT NULL,
    checkout_session_id UUID REFERENCES stripe_checkout_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    status TEXT NOT NULL, -- active, canceled, past_due, etc.
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Stripe Invoices Table
CREATE TABLE IF NOT EXISTS stripe_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id TEXT UNIQUE NOT NULL,
    subscription_id UUID REFERENCES stripe_subscriptions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    amount_paid INTEGER NOT NULL, -- Amount in cents
    amount_due INTEGER NOT NULL, -- Amount in cents
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL, -- paid, open, void, etc.
    paid_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Stripe Payment Methods Table
CREATE TABLE IF NOT EXISTS stripe_payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_method_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- card, bank_account, etc.
    card_brand TEXT,
    card_last4 TEXT,
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    is_default BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Stripe Customers Table
CREATE TABLE IF NOT EXISTS stripe_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT,
    phone TEXT,
    address JSONB,
    shipping JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Stripe Events/Webhooks Table
CREATE TABLE IF NOT EXISTS stripe_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    api_version TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    data JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at_db TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Plan History Table (for tracking plan changes)
CREATE TABLE IF NOT EXISTS plan_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    old_plan TEXT,
    new_plan TEXT NOT NULL,
    change_reason TEXT, -- upgrade, downgrade, payment, manual, etc.
    subscription_id UUID REFERENCES stripe_subscriptions(id),
    checkout_session_id UUID REFERENCES stripe_checkout_sessions(id),
    changed_by UUID REFERENCES auth.users(id), -- who made the change
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user_id ON stripe_checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_company_id ON stripe_checkout_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_status ON stripe_checkout_sessions(payment_status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON stripe_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_id ON stripe_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON stripe_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON stripe_invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON stripe_invoices(status);
CREATE INDEX IF NOT EXISTS idx_events_type ON stripe_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_processed ON stripe_events(processed);
CREATE INDEX IF NOT EXISTS idx_plan_history_user_id ON plan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_history_company_id ON plan_history(company_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_checkout_sessions_updated_at BEFORE UPDATE ON stripe_checkout_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON stripe_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON stripe_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON stripe_payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON stripe_customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE stripe_checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stripe_checkout_sessions
CREATE POLICY "Users can view their own checkout sessions" ON stripe_checkout_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checkout sessions" ON stripe_checkout_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checkout sessions" ON stripe_checkout_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for stripe_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON stripe_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON stripe_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON stripe_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for stripe_invoices
CREATE POLICY "Users can view their own invoices" ON stripe_invoices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices" ON stripe_invoices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for stripe_payment_methods
CREATE POLICY "Users can view their own payment methods" ON stripe_payment_methods
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods" ON stripe_payment_methods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods" ON stripe_payment_methods
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods" ON stripe_payment_methods
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for stripe_customers
CREATE POLICY "Users can view their own customer data" ON stripe_customers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own customer data" ON stripe_customers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customer data" ON stripe_customers
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for plan_history
CREATE POLICY "Users can view their own plan history" ON plan_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plan history" ON plan_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for stripe_events (admin only)
CREATE POLICY "Only admins can view events" ON stripe_events
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can insert events" ON stripe_events
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Helper functions for common operations
CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid UUID)
RETURNS TABLE (
    subscription_id TEXT,
    plan_name TEXT,
    status TEXT,
    current_period_end TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ss.subscription_id,
        ss.plan_name,
        ss.status,
        ss.current_period_end
    FROM stripe_subscriptions ss
    WHERE ss.user_id = user_uuid
    AND ss.status = 'active'
    ORDER BY ss.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current plan
CREATE OR REPLACE FUNCTION get_user_current_plan(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    current_plan TEXT;
BEGIN
    SELECT plan_name INTO current_plan
    FROM stripe_subscriptions
    WHERE user_id = user_uuid
    AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN COALESCE(current_plan, 'Starter');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record plan change
CREATE OR REPLACE FUNCTION record_plan_change(
    user_uuid UUID,
    company_uuid UUID DEFAULT NULL,
    new_plan TEXT,
    old_plan TEXT DEFAULT NULL,
    change_reason TEXT DEFAULT 'payment',
    subscription_uuid UUID DEFAULT NULL,
    checkout_session_uuid UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    history_id UUID;
BEGIN
    INSERT INTO plan_history (
        user_id,
        company_id,
        old_plan,
        new_plan,
        change_reason,
        subscription_id,
        checkout_session_id,
        changed_by
    ) VALUES (
        user_uuid,
        company_uuid,
        old_plan,
        new_plan,
        change_reason,
        subscription_uuid,
        checkout_session_uuid,
        user_uuid
    ) RETURNING id INTO history_id;
    
    RETURN history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated; 