import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Price IDs from Stripe Dashboard
const PRICE_IDS: Record<string, string> = {
  genesis: Deno.env.get("STRIPE_PRICE_GENESIS") || "",
  core_os: Deno.env.get("STRIPE_PRICE_CORE_OS") || "",
  enterprise: Deno.env.get("STRIPE_PRICE_ENTERPRISE") || "",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const {
      planId,
      planName,
      price,
      companyId,
      successUrl,
      cancelUrl,
      metadata
    } = await req.json();

    // Get or create Stripe customer
    let customerId: string | undefined;

    // Check if user already has a Stripe customer ID
    const { data: existingSession } = await supabaseClient
      .from("stripe_checkout_sessions")
      .select("customer_id")
      .eq("user_id", user.id)
      .not("customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existingSession?.customer_id) {
      customerId = existingSession.customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
          company_id: companyId || "",
        },
      });
      customerId = customer.id;
    }

    // Get price ID or create dynamic price
    let priceData: Stripe.Checkout.SessionCreateParams.LineItem;
    const priceId = PRICE_IDS[planId];

    if (priceId) {
      priceData = {
        price: priceId,
        quantity: 1,
      };
    } else {
      // Create dynamic price for custom amounts
      priceData = {
        price_data: {
          currency: "eur",
          product_data: {
            name: planName || "Subscription",
            description: `${planName} subscription plan`,
          },
          unit_amount: Math.round(parseFloat(price) * 100), // Convert to cents
          recurring: {
            interval: "month",
          },
        },
        quantity: 1,
      };
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [priceData],
      mode: "subscription",
      success_url: successUrl || `${req.headers.get("origin")}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/checkout/cancel`,
      metadata: {
        userId: user.id,
        companyId: companyId || "",
        planId: planId,
        planName: planName,
        ...metadata,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          companyId: companyId || "",
          planId: planId,
          planName: planName,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: "required",
    });

    // Save checkout session to database
    await supabaseClient.from("stripe_checkout_sessions").insert({
      session_id: session.id,
      user_id: user.id,
      company_id: companyId || null,
      customer_id: customerId,
      plan_id: planId,
      plan_name: planName,
      price_amount: Math.round(parseFloat(price) * 100),
      status: "pending",
      metadata: metadata || {},
    });

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        checkoutUrl: session.url
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});