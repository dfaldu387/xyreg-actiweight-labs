# XyReg Pricing Module - Implementation Plan

## Overview

This document outlines the complete end-to-end implementation plan for the XyReg Pricing Module, including the new pricing UI, Stripe integration, account creation flow, and subscription management features.

---

## Table of Contents

1. [Pricing Tiers Overview](#1-pricing-tiers-overview)
2. [User Flow: "Don't Have an Account"](#2-user-flow-dont-have-an-account)
3. [Stripe Integration](#3-stripe-integration)
4. [Account Creation Flow](#4-account-creation-flow)
5. [Subscription Management](#5-subscription-management)
6. [Database Schema](#6-database-schema)
7. [API Endpoints](#7-api-endpoints)
8. [Implementation Checklist](#8-implementation-checklist)

---

## 1. Pricing Tiers Overview

### Tier Structure

| Tier | Name | Target Audience | Base Price | Description |
|------|------|-----------------|------------|-------------|
| **Genesis** | The Founder Sandbox | Pre-Seed Founders | **Free Forever** | Build business case, prove viability, share with investors |
| **Core OS** | The Builder Engine | Funded Startups | **€499/month** | Full design controls & risk management |
| **Enterprise** | The Scale Platform | Scale-ups & VPs | **Custom** | Multi-device portfolio management |
| **Investor** | For VCs & Angels | Investors/Incubators | **Free Sourcing** | Source vetted startups, sponsor compliance |

### Detailed Pricing Configuration

```typescript
const PRICING = {
  core: {
    base: 499,                    // €499/month base
    extraDevice: 150,             // +€150 per additional device
    extraModuleSlot: 100,         // +€100 per additional module slot
    aiBooster: 50,                // €50 per AI booster pack
    aiBoosterCredits: 1000,       // 1000 credits per booster
    includedDevices: 1,           // 1 device included
    includedModuleSlots: 3,       // 3 module slots included
    includedAICredits: 500,       // 500 AI credits/month included
  },
  genesis: {
    aiBooster: 49,                // €49 for Genesis AI pack
    aiBoosterCredits: 500,        // 500 credits per pack
    referralCredits: 150,         // Credits per qualified referral
    referralExpiryDays: 60,       // Referral credits expire in 60 days
    maxReferrals: 10,             // Max referrals per user
  },
  enterprise: {
    volumeDeviceDiscount: 50,     // Devices 10+ cost €50/mo instead of €150
    volumeThreshold: 10,          // Volume discount threshold
  },
  investor: {
    kpiWatchtower: 199,           // €199 per company per month
    dueDiligenceRoom: 99,         // €99 per room per month
  }
};
```

### Investor Sponsorship Packages

| Package | Licenses | Price | Included KPI | Included DD Rooms |
|---------|----------|-------|--------------|-------------------|
| **Starter Pack** | 5 Core OS | €1,999/mo | 5 | 2 |
| **Growth Pack** | 10 Core OS | €3,499/mo | 10 | 5 |
| **Portfolio Pack** | 25+ Custom | Custom | Unlimited | Unlimited |

---

## 2. User Flow: "Don't Have an Account"

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    LANDING PAGE / LOGIN                          │
│                                                                   │
│  [Login]  [Don't have an account? → Sign Up]                     │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEW PRICING PAGE                              │
│                    /pricing (Public Route)                       │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ GENESIS  │ │ CORE OS  │ │ENTERPRISE│ │ INVESTOR │           │
│  │  Free    │ │ €499/mo  │ │  Custom  │ │Free Source│          │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
│       │            │            │            │                   │
│       ▼            ▼            ▼            ▼                   │
│  [Get Started] [Subscribe] [Contact Us] [Get Started]           │
└───────┬────────────┬────────────┬────────────┬──────────────────┘
        │            │            │            │
        ▼            ▼            ▼            ▼
┌───────────────────────────────────────────────────────────────────┐
│                    PLAN SELECTION MODAL                            │
│                                                                     │
│  Selected: [Plan Name]                                             │
│  Configuration: [Devices, Modules, Add-ons]                        │
│  Monthly Total: €XXX                                               │
│                                                                     │
│  [Continue to Checkout →]                                          │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│              STRIPE CHECKOUT (for paid plans)                      │
│              OR ACCOUNT CREATION (for free plans)                  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ STRIPE CHECKOUT PAGE                                          │ │
│  │ - Plan: Core OS                                               │ │
│  │ - Amount: €499/month                                          │ │
│  │ - Customer Email: [prefilled if available]                    │ │
│  │                                                               │ │
│  │ [Pay €499] [Cancel]                                           │ │
│  └─────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼ (On Success)
┌───────────────────────────────────────────────────────────────────┐
│              ACCOUNT CREATION PAGE                                  │
│              /signup?plan=core&session_id=xxx                      │
│                                                                     │
│  Payment Successful! Now create your account.                      │
│                                                                     │
│  - Full Name: [________________]                                   │
│  - Email: [________________] (prefilled from Stripe)               │
│  - Password: [________________]                                    │
│  - Company Name: [________________]                                │
│                                                                     │
│  [Create Account]                                                  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│              ONBOARDING / DASHBOARD                                │
│              /app/dashboard                                        │
│                                                                     │
│  Welcome! Your [Plan Name] subscription is active.                 │
└────────────────────────────────────────────────────────────────────┘
```

### Route Configuration

```typescript
// src/App.tsx - Add these routes

// Public pricing page (no auth required)
<Route path="/pricing" element={<PricingPage />} />

// Signup with plan selection
<Route path="/signup" element={<SignupPage />} />

// Checkout callbacks
<Route path="/checkout/success" element={<CheckoutSuccessPage />} />
<Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
```

---

## 3. Stripe Integration

### 3.1 Stripe Products Setup

Create the following products in Stripe Dashboard:

| Product Name | Price ID Format | Price | Billing |
|--------------|-----------------|-------|---------|
| Genesis AI Booster | `price_genesis_ai_booster` | €49 | One-time |
| Core OS Base | `price_core_base` | €499 | Monthly |
| Core OS Extra Device | `price_core_extra_device` | €150 | Monthly |
| Core OS Extra Module | `price_core_extra_module` | €100 | Monthly |
| Core OS AI Booster | `price_core_ai_booster` | €50 | One-time |
| Investor Starter Pack | `price_investor_starter` | €1,999 | Monthly |
| Investor Growth Pack | `price_investor_growth` | €3,499 | Monthly |
| KPI Watchtower | `price_kpi_watchtower` | €199 | Monthly |
| Due Diligence Room | `price_dd_room` | €99 | Monthly |

### 3.2 Checkout Session Creation

```typescript
// src/services/stripeService.ts

interface CheckoutConfig {
  tier: 'genesis' | 'core' | 'enterprise' | 'investor';
  devices?: number;
  moduleSlots?: number;
  aiBoosterPacks?: number;
  selectedModules?: string[];
  sponsorshipPackage?: string;
  kpiCompanyCount?: number;
  ddRoomCount?: number;
  email?: string;  // For new users
  userId?: string; // For existing users
  companyId?: string;
}

static async createConfiguredCheckout(config: CheckoutConfig) {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  // Build line items based on tier and configuration
  if (config.tier === 'core') {
    // Base subscription
    lineItems.push({
      price: 'price_core_base',
      quantity: 1,
    });

    // Extra devices
    if (config.devices && config.devices > 1) {
      lineItems.push({
        price: 'price_core_extra_device',
        quantity: config.devices - 1,
      });
    }

    // Extra module slots
    if (config.moduleSlots && config.moduleSlots > 3) {
      lineItems.push({
        price: 'price_core_extra_module',
        quantity: config.moduleSlots - 3,
      });
    }

    // AI Booster packs
    if (config.aiBoosterPacks && config.aiBoosterPacks > 0) {
      lineItems.push({
        price: 'price_core_ai_booster',
        quantity: config.aiBoosterPacks,
      });
    }
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'subscription',
    success_url: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${window.location.origin}/checkout/cancel`,
    customer_email: config.email,
    metadata: {
      tier: config.tier,
      devices: config.devices?.toString(),
      moduleSlots: config.moduleSlots?.toString(),
      selectedModules: JSON.stringify(config.selectedModules),
    },
    subscription_data: {
      metadata: {
        tier: config.tier,
        devices: config.devices?.toString(),
        moduleSlots: config.moduleSlots?.toString(),
      },
    },
  });

  return session;
}
```

### 3.3 Customer Portal Integration

```typescript
// For managing existing subscriptions
static async createCustomerPortalSession(customerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${window.location.origin}/app/billing`,
  });

  return session.url;
}
```

### 3.4 Webhook Handler

```typescript
// supabase/functions/webhook-handler/index.ts

const webhookEvents = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
];

async function handleWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionCanceled(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
  }
}
```

---

## 4. Account Creation Flow

### 4.1 New User Flow (No Account Yet)

```typescript
// src/pages/SignupPage.tsx

function SignupPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const selectedPlan = searchParams.get('plan');

  // If coming from successful checkout, prefill email
  useEffect(() => {
    if (sessionId) {
      // Fetch session details from Stripe to get email
      fetchCheckoutSession(sessionId);
    }
  }, [sessionId]);

  const handleSignup = async (formData: SignupFormData) => {
    // 1. Create user account in Supabase Auth
    const { user } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          selected_plan: selectedPlan,
        }
      }
    });

    // 2. Create company record
    const { data: company } = await supabase
      .from('companies')
      .insert({
        name: formData.companyName,
        subscription_plan: selectedPlan,
        owner_id: user.id,
      })
      .select()
      .single();

    // 3. Link Stripe customer to user/company
    if (sessionId) {
      await linkStripeCustomer(sessionId, user.id, company.id);
    }

    // 4. Redirect to onboarding
    navigate('/app/onboarding');
  };
}
```

### 4.2 Existing User Upgrade Flow

```typescript
// src/pages/BillingPage.tsx

function handleUpgrade(newPlan: string) {
  // 1. Create checkout session with existing customer
  const session = await StripeService.createCheckoutSession({
    planName: newPlan,
    userId: currentUser.id,
    companyId: currentCompany.id,
    successUrl: `${origin}/app/billing?upgrade=success`,
    cancelUrl: `${origin}/app/billing`,
  });

  // 2. Redirect to Stripe
  window.location.href = session.url;
}
```

---

## 5. Subscription Management

### 5.1 Cancel Subscription

```typescript
// src/services/subscriptionService.ts

interface CancellationConfig {
  subscriptionId: string;
  cancelAtPeriodEnd: boolean; // true = cancel at end of billing period
  reason?: string;
  feedback?: string;
}

static async cancelSubscription(config: CancellationConfig) {
  // 1. Update subscription in Stripe
  const subscription = await stripe.subscriptions.update(config.subscriptionId, {
    cancel_at_period_end: config.cancelAtPeriodEnd,
    metadata: {
      cancellation_reason: config.reason,
      cancellation_feedback: config.feedback,
    },
  });

  // 2. Update local database
  await supabase
    .from('stripe_subscriptions')
    .update({
      status: config.cancelAtPeriodEnd ? 'canceling' : 'canceled',
      cancel_at_period_end: config.cancelAtPeriodEnd,
      canceled_at: new Date().toISOString(),
      cancellation_reason: config.reason,
    })
    .eq('subscription_id', config.subscriptionId);

  // 3. Send cancellation email
  await sendCancellationEmail(config.subscriptionId);

  // 4. If immediate cancel, downgrade to Genesis
  if (!config.cancelAtPeriodEnd) {
    await downgradeToGenesis(config.subscriptionId);
  }

  return subscription;
}
```

### 5.2 Update Subscription (Change Plan)

```typescript
static async updateSubscription(subscriptionId: string, newConfig: PlanConfig) {
  // 1. Calculate proration
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // 2. Update subscription items
  const items = buildLineItemsFromConfig(newConfig);

  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: items,
    proration_behavior: 'create_prorations', // or 'none' for no proration
    metadata: {
      tier: newConfig.tier,
      devices: newConfig.devices?.toString(),
      moduleSlots: newConfig.moduleSlots?.toString(),
    },
  });

  // 3. Update local database
  await updateLocalSubscription(subscriptionId, newConfig);

  return updatedSubscription;
}
```

### 5.3 Upgrade with Add-ons

```typescript
interface AddOnConfig {
  subscriptionId: string;
  addOns: {
    extraDevices?: number;
    extraModules?: number;
    aiBoosterPacks?: number;
    kpiWatchtower?: boolean;
    ddRooms?: number;
  };
}

static async addAddOns(config: AddOnConfig) {
  const subscription = await stripe.subscriptions.retrieve(config.subscriptionId);
  const newItems = [...subscription.items.data];

  // Add extra devices
  if (config.addOns.extraDevices) {
    newItems.push({
      price: 'price_core_extra_device',
      quantity: config.addOns.extraDevices,
    });
  }

  // Add extra modules
  if (config.addOns.extraModules) {
    newItems.push({
      price: 'price_core_extra_module',
      quantity: config.addOns.extraModules,
    });
  }

  // Add AI boosters (one-time)
  if (config.addOns.aiBoosterPacks) {
    await stripe.invoiceItems.create({
      customer: subscription.customer,
      price: 'price_core_ai_booster',
      quantity: config.addOns.aiBoosterPacks,
    });
    // Immediately invoice for one-time items
    await stripe.invoices.create({
      customer: subscription.customer,
      auto_advance: true,
    });
  }

  // Update subscription with new items
  return await stripe.subscriptions.update(config.subscriptionId, {
    items: newItems.map(item => ({
      id: item.id,
      price: item.price.id,
      quantity: item.quantity,
    })),
  });
}
```

### 5.4 Subscription Status UI Component

```typescript
// src/components/subscription/SubscriptionStatus.tsx

function SubscriptionStatus({ subscription }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Plan */}
          <div className="flex justify-between">
            <span>Plan:</span>
            <Badge>{subscription.planName}</Badge>
          </div>

          {/* Status */}
          <div className="flex justify-between">
            <span>Status:</span>
            <Badge variant={subscription.status === 'active' ? 'success' : 'warning'}>
              {subscription.status}
            </Badge>
          </div>

          {/* Billing Period */}
          <div className="flex justify-between">
            <span>Current Period:</span>
            <span>
              {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
            </span>
          </div>

          {/* Monthly Cost */}
          <div className="flex justify-between">
            <span>Monthly Cost:</span>
            <span className="font-bold">€{subscription.monthlyTotal}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <Button onClick={handleUpgrade}>Upgrade Plan</Button>
            <Button variant="outline" onClick={handleManageAddOns}>Manage Add-ons</Button>
            <Button variant="destructive" onClick={handleCancel}>Cancel</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 6. Database Schema

### Required Tables

```sql
-- Stripe Checkout Sessions
CREATE TABLE stripe_checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  customer_id TEXT,
  subscription_id TEXT,
  plan_id TEXT,
  plan_name TEXT,
  price_amount INTEGER,
  currency TEXT DEFAULT 'eur',
  status TEXT DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stripe Subscriptions
CREATE TABLE stripe_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  customer_id TEXT,
  plan_name TEXT NOT NULL,
  tier TEXT NOT NULL, -- 'genesis', 'core', 'enterprise', 'investor'
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  -- Configuration
  devices INTEGER DEFAULT 1,
  module_slots INTEGER DEFAULT 3,
  ai_credits INTEGER DEFAULT 500,
  selected_modules TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stripe Invoices
CREATE TABLE stripe_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id TEXT UNIQUE NOT NULL,
  subscription_id TEXT REFERENCES stripe_subscriptions(subscription_id),
  user_id UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  customer_id TEXT,
  amount_paid INTEGER,
  currency TEXT DEFAULT 'eur',
  status TEXT,
  invoice_url TEXT,
  hosted_invoice_url TEXT,
  paid_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plan History (for tracking changes)
CREATE TABLE plan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  old_plan TEXT,
  new_plan TEXT NOT NULL,
  change_reason TEXT, -- 'upgrade', 'downgrade', 'cancel', 'payment'
  subscription_id TEXT,
  checkout_session_id TEXT,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Credits Usage
CREATE TABLE ai_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  credits_purchased INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  credits_remaining INTEGER DEFAULT 0,
  source TEXT, -- 'subscription', 'booster', 'referral'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. API Endpoints

### Supabase Edge Functions

| Function | Method | Description |
|----------|--------|-------------|
| `create-checkout` | POST | Create Stripe checkout session |
| `verify-payment` | POST | Verify payment after checkout |
| `webhook-handler` | POST | Handle Stripe webhooks |
| `cancel-subscription` | POST | Cancel subscription |
| `change-subscription-plan` | POST | Update subscription |
| `customer-portal` | POST | Get customer portal URL |
| `get-subscription-status` | GET | Get current subscription details |
| `add-subscription-items` | POST | Add add-ons to subscription |

### Example Edge Function

```typescript
// supabase/functions/create-checkout/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  const { tier, config, email, userId, companyId } = await req.json();

  const lineItems = buildLineItems(tier, config);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'subscription',
    success_url: `${Deno.env.get('SITE_URL')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${Deno.env.get('SITE_URL')}/checkout/cancel`,
    customer_email: email,
    metadata: { tier, userId, companyId, ...config },
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

---

## 8. Implementation Checklist

### Phase 1: Foundation
- [ ] Create `/pricing` public route with PricingModule component
- [ ] Update "Don't have an account" link to navigate to `/pricing`
- [ ] Set up Stripe products and prices in Stripe Dashboard
- [ ] Create database tables for subscription tracking

### Phase 2: Checkout Flow
- [ ] Implement `createConfiguredCheckout` in StripeService
- [ ] Create checkout success page (`/checkout/success`)
- [ ] Create checkout cancel page (`/checkout/cancel`)
- [ ] Implement webhook handler for `checkout.session.completed`

### Phase 3: Account Creation
- [ ] Update signup page to accept plan parameter
- [ ] Prefill email from Stripe session on signup
- [ ] Link Stripe customer to user/company after account creation
- [ ] Implement onboarding flow based on selected plan

### Phase 4: Subscription Management
- [ ] Implement `cancelSubscription` method
- [ ] Implement `updateSubscription` method
- [ ] Implement `addAddOns` method
- [ ] Create subscription management UI in billing page
- [ ] Implement customer portal integration

### Phase 5: Webhooks & Sync
- [ ] Handle `customer.subscription.updated` webhook
- [ ] Handle `customer.subscription.deleted` webhook
- [ ] Handle `invoice.payment_failed` webhook
- [ ] Implement subscription status sync

### Phase 6: Testing & QA
- [ ] Test Genesis (free) signup flow
- [ ] Test Core OS checkout and signup flow
- [ ] Test upgrade flow (Genesis → Core)
- [ ] Test downgrade flow (Core → Genesis)
- [ ] Test add-on purchases
- [ ] Test cancellation flows
- [ ] Test webhook handling

---

## Environment Variables Required

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Stripe Price IDs
STRIPE_PRICE_CORE_BASE=price_xxx
STRIPE_PRICE_CORE_EXTRA_DEVICE=price_xxx
STRIPE_PRICE_CORE_EXTRA_MODULE=price_xxx
STRIPE_PRICE_CORE_AI_BOOSTER=price_xxx
STRIPE_PRICE_GENESIS_AI_BOOSTER=price_xxx
STRIPE_PRICE_INVESTOR_STARTER=price_xxx
STRIPE_PRICE_INVESTOR_GROWTH=price_xxx
STRIPE_PRICE_KPI_WATCHTOWER=price_xxx
STRIPE_PRICE_DD_ROOM=price_xxx

# Site Configuration
VITE_SITE_URL=https://app.xyreg.com
```

---

## Security Considerations

1. **Never expose Stripe secret key** in client-side code
2. **Validate webhook signatures** using Stripe's webhook secret
3. **Use HTTPS** for all checkout URLs
4. **Implement rate limiting** on checkout endpoints
5. **Verify session ownership** before applying subscription benefits
6. **Log all subscription changes** for audit trail

---

## Support & Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Billing Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
