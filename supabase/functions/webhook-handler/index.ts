import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[WEBHOOK-HANDLER] ${step}${detailsStr}`);
};

serve(async (req) => {
  const requestTimestamp = new Date().toISOString();
  console.log(`[WEBHOOK-HANDLER] ====== INCOMING REQUEST at ${requestTimestamp} ======`);
  console.log(`[WEBHOOK-HANDLER] Method: ${req.method}, URL: ${req.url}`);
  console.log(`[WEBHOOK-HANDLER] Headers: stripe-signature=${req.headers.get("stripe-signature") ? "PRESENT" : "MISSING"}, content-type=${req.headers.get("content-type")}`);

  if (req.method === "OPTIONS") {
    console.log(`[WEBHOOK-HANDLER] OPTIONS preflight - returning 200`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    logStep("Environment check", {
      hasStripeKey: !!stripeKey,
      hasWebhookSecret: !!webhookSecret,
      stripeKeyPrefix: stripeKey ? stripeKey.substring(0, 7) + "..." : "MISSING",
      webhookSecretPrefix: webhookSecret ? webhookSecret.substring(0, 10) + "..." : "MISSING",
    });

    if (!stripeKey || !webhookSecret) {
      throw new Error(`Missing Stripe configuration - STRIPE_SECRET_KEY: ${!!stripeKey}, STRIPE_WEBHOOK_SECRET: ${!!webhookSecret}`);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    const body = await req.text();
    logStep("Request body received", { bodyLength: body.length, bodyPreview: body.substring(0, 200) });

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      logStep("Signature verification SUCCESS", { eventId: event.id, eventType: event.type });
    } catch (sigError) {
      const sigErrMsg = sigError instanceof Error ? sigError.message : String(sigError);
      logStep("Signature verification FAILED", { error: sigErrMsg });
      throw sigError;
    }

    logStep("Event type", { type: event.type });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        logStep('Processing checkout completed event');
        const session = event.data.object as Stripe.CheckoutSession;

        // Get the subscription from the session
        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id;

        if (!subscriptionId) {
          logStep('No subscription found in session');
          break;
        }

        const fullSubscription = await stripe.subscriptions.retrieve(subscriptionId);
        const productId = fullSubscription.items.data[0]?.price.product as string;
        const priceId = fullSubscription.items.data[0]?.price.id as string;
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

        // Get user email from multiple possible sources
        let userEmail = session.customer_email;

        // If no customer_email, try to get from metadata
        if (!userEmail && session.metadata?.user_email) {
          userEmail = session.metadata.user_email;
        }

        // If still no email, fetch from Stripe customer
        if (!userEmail && customerId) {
          const customer = await stripe.customers.retrieve(customerId);
          if (customer && !customer.deleted && customer.email) {
            userEmail = customer.email;
          }
        }

        logStep('Checkout details', {
          subscriptionId,
          productId,
          priceId,
          customerId,
          userEmail
        });

        if (!userEmail) {
          logStep('No email found for customer');
          break;
        }

        // Find user by email
        const { data: userProfile, error: userError } = await supabaseClient
          .from('user_profiles')
          .select('id')
          .eq('email', userEmail)
          .single();

        if (userError || !userProfile) {
          logStep('User not found', { email: userEmail, error: userError });
          break;
        }

        // Get plan name from subscription_plans table using price_id
        let planName = 'Unknown';
        let planTier = 'Unknown';
        const { data: planData } = await supabaseClient
          .from('subscription_plans')
          .select('name')
          .eq('stripe_price_id', priceId)
          .single();

        if (planData) {
          planName = planData.name;
          planTier = planData.name;
        }
        logStep('Plan details', { planName, planTier, priceId });

        // Save checkout session to stripe_checkout_sessions table
        const checkoutSessionData = {
          session_id: session.id,
          user_id: userProfile.id,
          customer_id: customerId,
          subscription_id: subscriptionId,
          plan_id: priceId, // Store Stripe price ID in plan_id field
          plan_name: planName,
          price_amount: session.amount_total || 0,
          price_currency: session.currency || 'usd',
          payment_status: session.payment_status,
          metadata: {
            stripe_price_id: priceId,
            stripe_product_id: productId,
            tier: planTier,
            user_email: userEmail,
          },
        };

        const { error: checkoutError } = await supabaseClient
          .from('stripe_checkout_sessions')
          .insert(checkoutSessionData);

        if (checkoutError) {
          logStep('Error saving checkout session', { error: checkoutError });
        } else {
          logStep('Checkout session saved successfully', { sessionId: session.id });
        }

        // Upsert subscription record
        const subscriptionData: any = {
          user_id: userProfile.id,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          product_id: productId,
          price_id: priceId,
          status: fullSubscription.status,
          cancel_at_period_end: false,
        };

        // Add dates safely
        if (fullSubscription.current_period_start) {
          subscriptionData.current_period_start = new Date(fullSubscription.current_period_start * 1000).toISOString();
        }
        if (fullSubscription.current_period_end) {
          subscriptionData.current_period_end = new Date(fullSubscription.current_period_end * 1000).toISOString();
        }
        if (fullSubscription.trial_start) {
          subscriptionData.trial_start = new Date(fullSubscription.trial_start * 1000).toISOString();
        }
        if (fullSubscription.trial_end) {
          subscriptionData.trial_end = new Date(fullSubscription.trial_end * 1000).toISOString();
        }

        const { error: subError } = await supabaseClient
          .from('user_subscriptions')
          .upsert(subscriptionData, {
            onConflict: 'user_id'
          });

        if (subError) {
          logStep('Error creating subscription record', { error: subError });
        } else {
          logStep('Subscription record created successfully', { userId: userProfile.id });
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        logStep("Processing subscription event", {
          eventType: event.type,
          subscriptionId: subscription.id,
          customerId,
          status: subscription.status,
          periodEnd: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
          metadata: subscription.metadata,
        });

        // Find user by Stripe customer ID
        let existingSub: { user_id: string } | null = null;
        const { data: subByCustomer } = await supabaseClient
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();
        existingSub = subByCustomer;

        // Fallback: find user by email from Stripe customer
        if (!existingSub) {
          logStep("User not found by customer_id, trying email fallback", { customerId });
          const stripeKeyForLookup = Deno.env.get("STRIPE_SECRET_KEY");
          if (stripeKeyForLookup) {
            const stripeLookup = new Stripe(stripeKeyForLookup, { apiVersion: "2024-11-20.acacia" });
            const customer = await stripeLookup.customers.retrieve(customerId);
            if (customer && !customer.deleted && customer.email) {
              const { data: userByEmail } = await supabaseClient
                .from('user_profiles')
                .select('id')
                .eq('email', customer.email)
                .single();

              if (userByEmail) {
                existingSub = { user_id: userByEmail.id };
                logStep("User found by email", { email: customer.email, userId: userByEmail.id });

                // Also create/update user_subscriptions so future lookups work
                await supabaseClient
                  .from('user_subscriptions')
                  .upsert({
                    user_id: userByEmail.id,
                    stripe_customer_id: customerId,
                    stripe_subscription_id: subscription.id,
                    product_id: subscription.items.data[0]?.price?.product as string || '',
                    price_id: subscription.items.data[0]?.price?.id || '',
                    status: subscription.status,
                    current_period_end: subscription.current_period_end
                      ? new Date(subscription.current_period_end * 1000).toISOString()
                      : null,
                  }, { onConflict: 'user_id' });

                logStep("Created user_subscriptions record for user", { userId: userByEmail.id });
              }
            }
          }
        }

        if (existingSub) {
          const updateData: any = {
            stripe_subscription_id: subscription.id,
            product_id: subscription.items.data[0].price.product as string,
            price_id: subscription.items.data[0].price.id,
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          };

          // Add dates safely
          if (subscription.current_period_start) {
            updateData.current_period_start = new Date(subscription.current_period_start * 1000).toISOString();
          }
          if (subscription.current_period_end) {
            updateData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
          }
          if (subscription.trial_end) {
            updateData.trial_end = new Date(subscription.trial_end * 1000).toISOString();
          }

          await supabaseClient
            .from('user_subscriptions')
            .update(updateData)
            .eq('user_id', existingSub.user_id);

          logStep("Subscription updated", { userId: existingSub.user_id });

          // ── Sync expires_at in new_pricing_company_plans ──
          // Determine the correct expiry date: current_period_end, or trial_end for trials
          let periodEndTimestamp = subscription.current_period_end || subscription.trial_end;

          // If still null, fetch the full subscription from Stripe API
          if (!periodEndTimestamp) {
            logStep("No period end in event, fetching full subscription from Stripe");
            const stripeKeyForFetch = Deno.env.get("STRIPE_SECRET_KEY");
            if (stripeKeyForFetch) {
              const stripeFetch = new Stripe(stripeKeyForFetch, { apiVersion: "2024-11-20.acacia" });
              const fullSub = await stripeFetch.subscriptions.retrieve(subscription.id);
              periodEndTimestamp = fullSub.current_period_end || fullSub.trial_end;
              logStep("Fetched full subscription", {
                currentPeriodEnd: fullSub.current_period_end,
                trialEnd: fullSub.trial_end,
              });
            }
          }

          // Find company_id from metadata or user lookup
          let companyId = subscription.metadata?.company_id || subscription.metadata?.companyId;
          if (!companyId) {
            const { data: userCompany } = await supabaseClient
              .from('user_company_access')
              .select('company_id')
              .eq('user_id', existingSub.user_id)
              .eq('is_primary', true)
              .single();
            companyId = userCompany?.company_id;
          }

          if (companyId && periodEndTimestamp) {
            const newExpiresAt = new Date(periodEndTimestamp * 1000).toISOString();
            const newStatus = subscription.cancel_at_period_end ? 'cancelled' :
                             (subscription.status === 'active' ? 'active' :
                              subscription.status === 'trialing' ? 'trial' : subscription.status);

            const { error: pricingError } = await supabaseClient
              .from('new_pricing_company_plans')
              .update({
                expires_at: newExpiresAt,
                status: newStatus,
                updated_at: new Date().toISOString(),
              })
              .eq('company_id', companyId);

            if (pricingError) {
              logStep("Error updating new_pricing_company_plans", { error: pricingError });
            } else {
              logStep("Synced expires_at in new_pricing_company_plans", {
                companyId,
                expiresAt: newExpiresAt,
                status: newStatus,
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
              });
            }
          } else {
            logStep("Could not sync expires_at", { companyId, hasPeriodEnd: !!periodEndTimestamp });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: existingSub } = await supabaseClient
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (existingSub) {
          await supabaseClient
            .from('user_subscriptions')
            .update({
              status: 'canceled',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', existingSub.user_id);

          // ── Mark company plan as cancelled so menus lock after expires_at ──
          const companyId = subscription.metadata?.company_id || subscription.metadata?.companyId;
          const targetCompanyId = companyId || await (async () => {
            const { data } = await supabaseClient
              .from('user_company_access')
              .select('company_id')
              .eq('user_id', existingSub.user_id)
              .eq('is_primary', true)
              .single();
            return data?.company_id;
          })();

          if (targetCompanyId) {
            await supabaseClient
              .from('new_pricing_company_plans')
              .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('company_id', targetCompanyId);

            logStep("Company plan marked cancelled", { companyId: targetCompanyId });
          }

          logStep("Subscription canceled", { userId: existingSub.user_id });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        let invoiceSubscriptionId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id;

        logStep("Payment succeeded", { invoiceId: invoice.id, subscriptionId: invoiceSubscriptionId, amountPaid: invoice.amount_paid });

        // Find the user by Stripe customer ID
        const invCustomerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        const { data: invUserSub } = await supabaseClient
          .from('user_subscriptions')
          .select('user_id, stripe_subscription_id')
          .eq('stripe_customer_id', invCustomerId)
          .single();

        // If user not found by customer ID, try finding by email
        let invUserId = invUserSub?.user_id;
        if (!invUserId && invoice.customer_email) {
          const { data: userByEmail } = await supabaseClient
            .from('user_profiles')
            .select('id')
            .eq('email', invoice.customer_email)
            .single();
          invUserId = userByEmail?.id;
          logStep("User found by email fallback", { email: invoice.customer_email, userId: invUserId });
        }

        // Fallback: if subscriptionId missing from invoice, get it from user_subscriptions
        if (!invoiceSubscriptionId && invUserSub?.stripe_subscription_id) {
          invoiceSubscriptionId = invUserSub.stripe_subscription_id;
          logStep("SubscriptionId fallback from DB", { subscriptionId: invoiceSubscriptionId });
        }

        // Find company_id for this user
        let invCompanyId: string | undefined;
        if (invUserId) {
          const { data: uc } = await supabaseClient
            .from('user_company_access')
            .select('company_id')
            .eq('user_id', invUserId)
            .eq('is_primary', true)
            .single();
          invCompanyId = uc?.company_id;
        }

        // ── Store invoice in stripe_invoices table ──
        if (invUserId) {
          const invoiceRecord = {
            user_id: invUserId,
            company_id: invCompanyId || null,
            invoice_id: invoice.id,
            subscription_id: invoiceSubscriptionId || null,
            customer_id: invCustomerId,
            amount_paid: invoice.amount_paid || 0,
            currency: invoice.currency || 'eur',
            status: 'paid',
            invoice_url: invoice.invoice_pdf || null,
            hosted_invoice_url: invoice.hosted_invoice_url || null,
            paid_at: new Date().toISOString(),
            created_at: new Date((invoice.created || 0) * 1000).toISOString(),
          };

          const { error: invoiceInsertError } = await supabaseClient
            .from('stripe_invoices')
            .upsert(invoiceRecord, { onConflict: 'invoice_id' });

          if (invoiceInsertError) {
            logStep("Error storing invoice", { error: invoiceInsertError });
          } else {
            logStep("Invoice stored successfully", { invoiceId: invoice.id, userId: invUserId, companyId: invCompanyId });
          }
        } else {
          logStep("Could not find user for invoice", { customerId: invCustomerId, email: invoice.customer_email });
        }

        // ── Update expires_at and next billing date on payment success ──
        const stripeKeyForInvoice = Deno.env.get("STRIPE_SECRET_KEY");
        if (stripeKeyForInvoice && invoiceSubscriptionId) {
          const stripeClient = new Stripe(stripeKeyForInvoice, { apiVersion: "2024-11-20.acacia" });
          const fullSub = await stripeClient.subscriptions.retrieve(invoiceSubscriptionId);

          // Update current_period_end (next billing date) in user_subscriptions
          if (invUserId && fullSub.current_period_end) {
            const subUpdateData: any = {
              current_period_end: new Date(fullSub.current_period_end * 1000).toISOString(),
              status: fullSub.status,
              updated_at: new Date().toISOString(),
            };
            if (fullSub.current_period_start) {
              subUpdateData.current_period_start = new Date(fullSub.current_period_start * 1000).toISOString();
            }

            const { error: subUpdateError } = await supabaseClient
              .from('user_subscriptions')
              .update(subUpdateData)
              .eq('user_id', invUserId);

            if (subUpdateError) {
              logStep("Error updating user_subscriptions billing dates", { error: subUpdateError });
            } else {
              logStep("Updated next billing date in user_subscriptions", {
                userId: invUserId,
                currentPeriodEnd: subUpdateData.current_period_end,
              });
            }
          }

          // Update expires_at in new_pricing_company_plans
          if (fullSub.current_period_end) {
            const newExpiresAt = new Date(fullSub.current_period_end * 1000).toISOString();

            // Find company_id from subscription metadata or fallback to user lookup
            const targetCompanyId = fullSub.metadata?.company_id || fullSub.metadata?.companyId || invCompanyId;

            if (targetCompanyId) {
              const { error: pricingUpdateError } = await supabaseClient
                .from('new_pricing_company_plans')
                .update({
                  expires_at: newExpiresAt,
                  status: 'active',
                  updated_at: new Date().toISOString(),
                })
                .eq('company_id', targetCompanyId);

              if (pricingUpdateError) {
                logStep("Error updating expires_at", { error: pricingUpdateError });
              } else {
                logStep("Renewed expires_at on payment success", {
                  companyId: targetCompanyId,
                  newExpiresAt,
                });
              }
            } else {
              logStep("No company_id found to update expires_at", { userId: invUserId });
            }
          }
        } else {
          logStep("Cannot update billing dates", { hasStripeKey: !!stripeKeyForInvoice, hasSubscriptionId: !!invoiceSubscriptionId });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { invoiceId: invoice.id });
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    logStep("====== WEBHOOK PROCESSED SUCCESSFULLY ======", { eventType: event.type, eventId: event.id });
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logStep("====== WEBHOOK ERROR ======", { message: errorMessage, stack: errorStack });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
