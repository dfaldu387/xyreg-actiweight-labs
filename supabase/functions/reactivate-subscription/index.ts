import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);

    if (!userData.user) {
      throw new Error("Not authenticated");
    }

    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      throw new Error("Subscription ID is required");
    }

    // Retrieve the current subscription
    const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);

    let subscription;

    if (currentSubscription.status === "canceled") {
      // Subscription is fully canceled - need to create a new one
      const customerId = currentSubscription.customer as string;
      const oldPriceId = currentSubscription.items.data[0]?.price?.id;
      const productId = currentSubscription.items.data[0]?.price?.product as string;

      if (!oldPriceId || !productId) {
        throw new Error("Could not find price/product information from previous subscription");
      }

      // Try to get the old price first
      let activePriceId = null;

      try {
        const oldPrice = await stripe.prices.retrieve(oldPriceId);
        if (oldPrice.active) {
          activePriceId = oldPriceId;
        }
      } catch (e) {
        console.log("Old price not found or inactive");
      }

      // If old price is inactive, find an active price for the same product
      if (!activePriceId) {
        const prices = await stripe.prices.list({
          product: productId,
          active: true,
          limit: 10,
        });

        if (prices.data.length > 0) {
          // Prefer recurring prices, then match the billing interval
          const oldInterval = currentSubscription.items.data[0]?.price?.recurring?.interval;

          // Try to find a price with the same interval
        let matchingPrice = prices.data.find(
          (p: { recurring?: { interval?: string } }) => p.recurring?.interval === oldInterval
        );

          // If no matching interval, just use the first active price
          if (!matchingPrice) {
            matchingPrice = prices.data[0];
          }

          activePriceId = matchingPrice.id;
        }
      }

      // If still no active price, try to find any active price from the product's metadata or fallback
      if (!activePriceId) {
        // Get product to check for default price
        try {
          const product = await stripe.products.retrieve(productId);
          if (product.default_price && typeof product.default_price === "string") {
            const defaultPrice = await stripe.prices.retrieve(product.default_price);
            if (defaultPrice.active) {
              activePriceId = product.default_price;
            }
          }
        } catch (e) {
          console.log("Could not get default price from product");
        }
      }

      if (!activePriceId) {
        // No active price found - user needs to select a new plan
        return new Response(
          JSON.stringify({
            success: false,
            requires_new_plan: true,
            message: "Your previous plan is no longer available. Please select a new plan.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      // Check if customer has a valid payment method
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
        limit: 1,
      });

      if (paymentMethods.data.length === 0) {
        // No payment method - need to collect one
        return new Response(
          JSON.stringify({
            success: false,
            requires_payment_method: true,
            message: "Please add a payment method to reactivate your subscription.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      // Set default payment method if not already set
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      if (!customer.invoice_settings?.default_payment_method) {
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethods.data[0].id,
          },
        });
      }

      // Create new subscription
      subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: activePriceId }],
        default_payment_method: paymentMethods.data[0].id,
        payment_behavior: "error_if_incomplete",
        proration_behavior: "none",
      });

      // Update database with new subscription
      await supabaseClient
        .from("stripe_subscriptions")
        .update({
          subscription_id: subscription.id,
          plan_name: subscription.items.data[0]?.price?.nickname ||
            subscription.items.data[0]?.price?.product?.name ||
            "Premium",
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userData.user.id);

    } else if (currentSubscription.cancel_at_period_end) {
      // Subscription is scheduled to cancel but still active - just remove the cancellation
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      // Update database
      await supabaseClient
        .from("stripe_subscriptions")
        .update({
          cancel_at_period_end: false,
          status: subscription.status,
          updated_at: new Date().toISOString(),
        })
        .eq("subscription_id", subscriptionId);

    } else {
      // Subscription is already active and not scheduled to cancel
      return new Response(
        JSON.stringify({
          success: true,
          message: "Subscription is already active",
          subscription: {
            id: currentSubscription.id,
            status: currentSubscription.status,
            cancel_at_period_end: currentSubscription.cancel_at_period_end,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Record plan change in history
    await supabaseClient.from("plan_history").insert({
      user_id: userData.user.id,
      plan_name: subscription.items.data[0]?.price?.nickname || "Premium",
      change_type: "reactivated",
      metadata: {
        subscription_id: subscription.id,
        previous_subscription_id: subscriptionId,
        reactivated_at: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error reactivating subscription:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});