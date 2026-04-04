import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
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
    console.error("No stripe-signature header");
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);

    console.log("Received Stripe webhook event:", event.type);

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

      case "customer.subscription.paused": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionPaused(subscription);
        break;
      }

      case "customer.subscription.resumed": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionResumed(subscription);
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

      case "invoice.created": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceCreated(invoice);
        break;
      }

      case "invoice.finalized": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceFinalized(invoice);
        break;
      }

      // ============ CHECKOUT EVENTS ============
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(session);
        break;
      }

      // ============ CUSTOMER EVENTS ============
      case "customer.created": {
        const customer = event.data.object as Stripe.Customer;
        await handleCustomerCreated(customer);
        break;
      }

      case "customer.updated": {
        const customer = event.data.object as Stripe.Customer;
        await handleCustomerUpdated(customer);
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

// ============ SUBSCRIPTION HANDLER FUNCTIONS ============

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("Processing subscription created:", subscription.id);

  const userId = subscription.metadata?.userId || subscription.metadata?.user_id;
  const companyId = subscription.metadata?.companyId || subscription.metadata?.company_id;
  const planName = subscription.metadata?.planName || subscription.items.data[0]?.price?.nickname || "Premium";
  const extraDevices = parseInt(subscription.metadata?.extraDevices || "0");
  const extraModules = parseInt(subscription.metadata?.extraModules || "0");
  const aiBoosterPacks = parseInt(subscription.metadata?.aiBoosterPacks || "0");

  if (!userId) {
    console.error("No user_id in subscription metadata");
    return;
  }

  // Insert/Update subscription record
  const { error: subError } = await supabase.from("stripe_subscriptions").upsert({
    user_id: userId,
    company_id: companyId || null,
    subscription_id: subscription.id,
    customer_id: subscription.customer as string,
    plan_name: planName,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    metadata: {
      extraDevices,
      extraModules,
      aiBoosterPacks,
      tier: subscription.metadata?.tier,
      stripePriceId: subscription.metadata?.stripePriceId,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (subError) {
    console.error("Error inserting subscription:", subError);
  }

  // Update user_subscriptions table
  const { error: userSubError } = await supabase.from("user_subscriptions").upsert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    product_id: subscription.items.data[0]?.price?.id || "",
    status: subscription.status,
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  }, { onConflict: "user_id" });

  if (userSubError) {
    console.error("Error updating user_subscriptions:", userSubError);
  }

  // Record in plan history
  const { error: historyError } = await supabase.from("plan_history").insert({
    user_id: userId,
    company_id: companyId || null,
    new_plan: planName,
    change_reason: "subscription_created",
    changed_by: userId,
    metadata: {
      subscription_id: subscription.id,
      extraDevices,
      extraModules,
      aiBoosterPacks,
    },
  });

  if (historyError) {
    console.error("Error recording plan history:", historyError);
  }

  console.log("Subscription created successfully:", subscription.id);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("Processing subscription updated:", subscription.id);

  const planName = subscription.metadata?.planName || subscription.items.data[0]?.price?.nickname || "Premium";

  const { error } = await supabase
    .from("stripe_subscriptions")
    .update({
      status: subscription.status,
      plan_name: planName,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq("subscription_id", subscription.id);

  if (error) {
    console.error("Error updating subscription:", error);
  }

  // Update user_subscriptions table
  await supabase
    .from("user_subscriptions")
    .update({
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  // ── Sync expires_at in new_pricing_company_plans ──
  const companyId = subscription.metadata?.company_id || subscription.metadata?.companyId;
  if (companyId && subscription.current_period_end) {
    const newExpiresAt = new Date(subscription.current_period_end * 1000).toISOString();
    const newStatus = subscription.cancel_at_period_end ? 'cancelled' :
                     (subscription.status === 'active' ? 'active' :
                      subscription.status === 'trialing' ? 'trial' : subscription.status);

    const { error: pricingError } = await supabase
      .from('new_pricing_company_plans')
      .update({
        expires_at: newExpiresAt,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('company_id', companyId);

    if (pricingError) {
      console.error("Error syncing new_pricing_company_plans:", pricingError);
    } else {
      console.log("Synced expires_at:", { companyId, expiresAt: newExpiresAt, status: newStatus });
    }
  }

  console.log("Subscription updated successfully:", subscription.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("Processing subscription deleted:", subscription.id);

  // Get user_id from existing subscription record
  const { data: subRecord } = await supabase
    .from("stripe_subscriptions")
    .select("user_id, company_id, plan_name")
    .eq("subscription_id", subscription.id)
    .single();

  // Update subscription status
  const { error } = await supabase
    .from("stripe_subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("subscription_id", subscription.id);

  if (error) {
    console.error("Error updating subscription:", error);
  }

  // Update user_subscriptions
  await supabase
    .from("user_subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  // Record cancellation in plan history
  if (subRecord?.user_id) {
    await supabase.from("plan_history").insert({
      user_id: subRecord.user_id,
      company_id: subRecord.company_id || null,
      old_plan: subRecord.plan_name,
      new_plan: "Genesis", // Downgrade to free plan
      change_reason: "subscription_canceled",
      changed_by: subRecord.user_id,
      metadata: { subscription_id: subscription.id },
    });
  }

  console.log("Subscription deleted successfully:", subscription.id);
}

async function handleSubscriptionPaused(subscription: Stripe.Subscription) {
  console.log("Processing subscription paused:", subscription.id);

  const { error } = await supabase
    .from("stripe_subscriptions")
    .update({
      status: "paused",
      updated_at: new Date().toISOString(),
    })
    .eq("subscription_id", subscription.id);

  if (error) {
    console.error("Error updating subscription:", error);
  }

  console.log("Subscription paused successfully:", subscription.id);
}

async function handleSubscriptionResumed(subscription: Stripe.Subscription) {
  console.log("Processing subscription resumed:", subscription.id);

  const { error } = await supabase
    .from("stripe_subscriptions")
    .update({
      status: subscription.status,
      updated_at: new Date().toISOString(),
    })
    .eq("subscription_id", subscription.id);

  if (error) {
    console.error("Error updating subscription:", error);
  }

  console.log("Subscription resumed successfully:", subscription.id);
}

// ============ INVOICE HANDLER FUNCTIONS ============

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("Processing invoice payment succeeded:", invoice.id);

  if (!invoice.subscription) {
    console.log("No subscription linked to invoice, skipping");
    return;
  }

  // Get user_id from subscription
  const { data: subRecord } = await supabase
    .from("stripe_subscriptions")
    .select("user_id, company_id")
    .eq("subscription_id", invoice.subscription as string)
    .single();

  if (!subRecord?.user_id) {
    console.error("No subscription found for invoice");
    return;
  }

  // Insert invoice record
  const { error: invoiceError } = await supabase.from("stripe_invoices").upsert({
    user_id: subRecord.user_id,
    company_id: subRecord.company_id || null,
    invoice_id: invoice.id,
    subscription_id: invoice.subscription as string,
    customer_id: invoice.customer as string,
    amount_paid: invoice.amount_paid,
    currency: invoice.currency,
    status: "paid",
    invoice_url: invoice.invoice_pdf,
    hosted_invoice_url: invoice.hosted_invoice_url,
    paid_at: new Date().toISOString(),
    created_at: new Date(invoice.created * 1000).toISOString(),
  }, { onConflict: "invoice_id" });

  if (invoiceError) {
    console.error("Error inserting invoice:", invoiceError);
  }

  // Update subscription status to active
  await supabase
    .from("stripe_subscriptions")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("subscription_id", invoice.subscription as string);

  // Update user_subscriptions
  await supabase
    .from("user_subscriptions")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", invoice.subscription as string);

  console.log("Invoice payment succeeded processed:", invoice.id);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log("Processing invoice payment failed:", invoice.id);

  if (!invoice.subscription) return;

  // Update subscription status to past_due
  await supabase
    .from("stripe_subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("subscription_id", invoice.subscription as string);

  // Update user_subscriptions
  await supabase
    .from("user_subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", invoice.subscription as string);

  // TODO: Send email notification to user about failed payment
  console.log("Invoice payment failed, user should be notified");
}

async function handleInvoiceCreated(invoice: Stripe.Invoice) {
  console.log("Processing invoice created:", invoice.id);

  if (!invoice.subscription) return;

  // Get user_id from subscription
  const { data: subRecord } = await supabase
    .from("stripe_subscriptions")
    .select("user_id, company_id")
    .eq("subscription_id", invoice.subscription as string)
    .single();

  if (!subRecord?.user_id) return;

  // Insert invoice record with pending status
  await supabase.from("stripe_invoices").upsert({
    user_id: subRecord.user_id,
    company_id: subRecord.company_id || null,
    invoice_id: invoice.id,
    subscription_id: invoice.subscription as string,
    customer_id: invoice.customer as string,
    amount_paid: 0,
    currency: invoice.currency,
    status: "draft",
    created_at: new Date(invoice.created * 1000).toISOString(),
  }, { onConflict: "invoice_id" });

  console.log("Invoice created processed:", invoice.id);
}

async function handleInvoiceFinalized(invoice: Stripe.Invoice) {
  console.log("Processing invoice finalized:", invoice.id);

  await supabase
    .from("stripe_invoices")
    .update({
      status: "open",
      invoice_url: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
      updated_at: new Date().toISOString(),
    })
    .eq("invoice_id", invoice.id);

  console.log("Invoice finalized processed:", invoice.id);
}

// ============ CHECKOUT HANDLER FUNCTIONS ============

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("Processing checkout completed:", session.id);

  const userId = session.metadata?.userId || session.metadata?.user_id;
  const companyId = session.metadata?.companyId || session.metadata?.company_id;
  const planName = session.metadata?.planName || "Premium";
  const extraDevices = parseInt(session.metadata?.extraDevices || "0");
  const extraModules = parseInt(session.metadata?.extraModules || "0");
  const aiBoosterPacks = parseInt(session.metadata?.aiBoosterPacks || "0");

  // Update checkout session record
  const { error } = await supabase
    .from("stripe_checkout_sessions")
    .update({
      status: "complete",
      customer_id: session.customer as string,
      subscription_id: session.subscription as string,
      payment_status: session.payment_status,
      metadata: {
        ...session.metadata,
        extraDevices,
        extraModules,
        aiBoosterPacks,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("session_id", session.id);

  if (error) {
    console.error("Error updating checkout session:", error);
  }

  // Update user's selected plan
  if (userId) {
    // Update user metadata via admin API would go here
    // For now, the plan is tracked in stripe_subscriptions
    console.log(`User ${userId} completed checkout for plan: ${planName}`);
  }

  console.log("Checkout completed processed:", session.id);
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  console.log("Processing checkout expired:", session.id);

  await supabase
    .from("stripe_checkout_sessions")
    .update({
      status: "expired",
      updated_at: new Date().toISOString(),
    })
    .eq("session_id", session.id);

  console.log("Checkout expired processed:", session.id);
}

// ============ CUSTOMER HANDLER FUNCTIONS ============

async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log("Processing customer created:", customer.id);

  // Store customer_id linked to user if email matches
  if (customer.email) {
    // You could update a users table or stripe_customers table here
    console.log(`Customer created with email: ${customer.email}`);
  }
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  console.log("Processing customer updated:", customer.id);
  // Handle customer updates if needed
}
