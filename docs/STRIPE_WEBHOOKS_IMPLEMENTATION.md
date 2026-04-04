# Stripe Webhooks Implementation Guide

## Overview
This document outlines the Stripe webhook events that need to be implemented to handle subscription lifecycle, payment events, and invoice management.

---

## Setup Requirements

### 1. Create Webhook Endpoint
- **Endpoint URL:** `https://your-project.supabase.co/functions/v1/stripe-webhook`
- **Events to subscribe:** Listed below

### 2. Webhook Secret
- Get webhook signing secret from Stripe Dashboard
- Add to Supabase secrets: `STRIPE_WEBHOOK_SECRET`

---

## Webhook Events to Handle

### Subscription Events

| Event | Description | Action Required |
|-------|-------------|-----------------|
| `customer.subscription.created` | New subscription created | Insert into `stripe_subscriptions` table |
| `customer.subscription.updated` | Subscription modified (plan change, cancel scheduled) | Update `stripe_subscriptions` table |
| `customer.subscription.deleted` | Subscription fully canceled | Update status to "canceled" in database |
| `customer.subscription.trial_will_end` | Trial ending in 3 days | Send email notification to user |
| `customer.subscription.paused` | Subscription paused | Update status in database |
| `customer.subscription.resumed` | Subscription resumed | Update status in database |

### Payment Events

| Event | Description | Action Required |
|-------|-------------|-----------------|
| `invoice.payment_succeeded` | Payment successful | Update subscription status, insert into `stripe_invoices` |
| `invoice.payment_failed` | Payment failed | Notify user, update subscription status |
| `invoice.created` | New invoice generated | Insert into `stripe_invoices` table |
| `invoice.finalized` | Invoice ready for payment | Update invoice record |
| `invoice.paid` | Invoice marked as paid | Update invoice status |
| `invoice.upcoming` | Invoice will be created soon | Optional: Send reminder email |

### Checkout Events

| Event | Description | Action Required |
|-------|-------------|-----------------|
| `checkout.session.completed` | Checkout successful | Update `stripe_checkout_sessions`, create subscription record |
| `checkout.session.expired` | Checkout session expired | Update session status |
| `checkout.session.async_payment_succeeded` | Async payment succeeded | Same as completed |
| `checkout.session.async_payment_failed` | Async payment failed | Notify user |

### Customer Events

| Event | Description | Action Required |
|-------|-------------|-----------------|
| `customer.created` | New Stripe customer | Store customer_id in database |
| `customer.updated` | Customer info updated | Update customer record if needed |
| `customer.deleted` | Customer deleted | Handle cleanup |

### Payment Method Events

| Event | Description | Action Required |
|-------|-------------|-----------------|
| `payment_method.attached` | Card added to customer | Optional: Update payment method display |
| `payment_method.detached` | Card removed | Optional: Update payment method display |
| `payment_method.updated` | Card details updated | Optional: Update expiry info |

---

## Database Updates Per Event

### `customer.subscription.created`
```
INSERT INTO stripe_subscriptions:
- user_id (from metadata)
- company_id (from metadata)
- subscription_id
- customer_id
- plan_name (from price nickname or product name)
- status
- current_period_start
- current_period_end
- cancel_at_period_end
- created_at
```

### `customer.subscription.updated`
```
UPDATE stripe_subscriptions:
- status
- plan_name (if changed)
- current_period_start
- current_period_end
- cancel_at_period_end
- updated_at
```

### `customer.subscription.deleted`
```
UPDATE stripe_subscriptions:
- status = "canceled"
- updated_at

INSERT INTO plan_history:
- change_type = "canceled"
```

### `invoice.payment_succeeded`
```
INSERT INTO stripe_invoices:
- user_id
- invoice_id
- subscription_id
- amount_paid
- currency
- status = "paid"
- invoice_url (PDF)
- hosted_invoice_url
- paid_at
```

### `invoice.payment_failed`
```
UPDATE stripe_subscriptions:
- status = "past_due"

ACTION: Send email to user about failed payment
```

### `checkout.session.completed`
```
UPDATE stripe_checkout_sessions:
- status = "complete"
- customer_id
- subscription_id
- payment_status

INSERT INTO stripe_subscriptions (if subscription mode)
```

---

## Edge Function Code

### File: `supabase/functions/stripe-webhook/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);

    console.log("Received event:", event.type);

    switch (event.type) {
      // ============ SUBSCRIPTION EVENTS ============
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      // ============ INVOICE EVENTS ============
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      // ============ CHECKOUT EVENTS ============
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});

// ============ HANDLER FUNCTIONS ============

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  const companyId = subscription.metadata?.company_id;

  if (!userId) {
    console.error("No user_id in subscription metadata");
    return;
  }

  await supabase.from("stripe_subscriptions").upsert({
    user_id: userId,
    company_id: companyId,
    subscription_id: subscription.id,
    customer_id: subscription.customer as string,
    plan_name: subscription.items.data[0]?.price?.nickname || "Premium",
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Record in plan history
  await supabase.from("plan_history").insert({
    user_id: userId,
    plan_name: subscription.items.data[0]?.price?.nickname || "Premium",
    change_type: "created",
    metadata: { subscription_id: subscription.id },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await supabase
    .from("stripe_subscriptions")
    .update({
      status: subscription.status,
      plan_name: subscription.items.data[0]?.price?.nickname || "Premium",
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq("subscription_id", subscription.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { data: subRecord } = await supabase
    .from("stripe_subscriptions")
    .select("user_id")
    .eq("subscription_id", subscription.id)
    .single();

  await supabase
    .from("stripe_subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("subscription_id", subscription.id);

  if (subRecord?.user_id) {
    await supabase.from("plan_history").insert({
      user_id: subRecord.user_id,
      plan_name: subscription.items.data[0]?.price?.nickname || "Premium",
      change_type: "canceled",
      metadata: { subscription_id: subscription.id },
    });
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  // Get user_id from subscription
  const { data: subRecord } = await supabase
    .from("stripe_subscriptions")
    .select("user_id")
    .eq("subscription_id", invoice.subscription as string)
    .single();

  if (!subRecord?.user_id) return;

  await supabase.from("stripe_invoices").upsert({
    user_id: subRecord.user_id,
    invoice_id: invoice.id,
    subscription_id: invoice.subscription as string,
    amount_paid: invoice.amount_paid,
    currency: invoice.currency,
    status: "paid",
    invoice_url: invoice.invoice_pdf,
    hosted_invoice_url: invoice.hosted_invoice_url,
    paid_at: new Date().toISOString(),
    created_at: new Date(invoice.created * 1000).toISOString(),
  });

  // Update subscription status to active
  await supabase
    .from("stripe_subscriptions")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("subscription_id", invoice.subscription as string);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  // Update subscription status to past_due
  await supabase
    .from("stripe_subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("subscription_id", invoice.subscription as string);

  // TODO: Send email notification to user about failed payment
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  await supabase
    .from("stripe_checkout_sessions")
    .update({
      status: "complete",
      customer_id: session.customer as string,
      subscription_id: session.subscription as string,
      payment_status: session.payment_status,
      updated_at: new Date().toISOString(),
    })
    .eq("session_id", session.id);
}
```

---

## Stripe Dashboard Setup

### Step 1: Go to Webhooks
1. Open Stripe Dashboard
2. Go to **Developers** > **Webhooks**
3. Click **Add endpoint**

### Step 2: Configure Endpoint
1. **Endpoint URL:** `https://[your-project-ref].supabase.co/functions/v1/stripe-webhook`
2. **Events to send:** Select all events listed above

### Step 3: Get Webhook Secret
1. After creating endpoint, click on it
2. Click **Reveal** under "Signing secret"
3. Copy the secret (starts with `whsec_`)

### Step 4: Add Secret to Supabase
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

---

## Testing Webhooks Locally

### Using Stripe CLI
```bash
# Install Stripe CLI
# Login to Stripe
stripe login

# Forward webhooks to local function
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
stripe trigger checkout.session.completed
```

---

## Deployment

```bash
# Deploy the webhook function
supabase functions deploy stripe-webhook

# Set required secrets
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## Important Notes

1. **Always verify webhook signatures** - Prevents fake webhook attacks
2. **Use Service Role Key** - Webhooks need to bypass RLS to update data
3. **Handle idempotency** - Stripe may send same event multiple times
4. **Log all events** - Helps debugging issues
5. **Return 200 quickly** - Stripe expects response within 30 seconds
6. **Test in Stripe Test Mode first** - Before going live

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Signature verification failed | Check webhook secret is correct |
| 401 Unauthorized | Ensure function is deployed and accessible |
| Data not updating | Check user_id/company_id in metadata |
| Duplicate records | Add upsert logic or check before insert |
| Timeout errors | Move heavy operations to background jobs |

---

## Next Steps After Implementation

1. Set up email notifications for:
   - Payment failed
   - Subscription canceled
   - Trial ending soon
   - Subscription renewed

2. Add admin dashboard to view:
   - All subscriptions
   - Failed payments
   - Revenue metrics

3. Implement retry logic for failed webhook processing
