import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
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

    const body = await req.json();
    const { companyId, priceId, quantity = 1 } = body;

    if (!priceId) {
      throw new Error("Price ID is required");
    }

    // Find Stripe customer ID (same logic as create-portal-session)
    let customerId: string | null = null;

    // 1. Check companies table
    if (companyId) {
      const { data: company } = await supabaseClient
        .from("companies")
        .select("stripe_customer_id")
        .eq("id", companyId)
        .single();
      customerId = company?.stripe_customer_id || null;
    }

    // 2. Fallback: stripe_customers table
    if (!customerId && companyId) {
      const { data: stripeCustomer } = await supabaseClient
        .from("stripe_customers")
        .select("customer_id")
        .eq("company_id", companyId)
        .limit(1)
        .single();
      customerId = stripeCustomer?.customer_id || null;
    }

    // 3. Fallback: checkout sessions
    if (!customerId) {
      const { data: checkoutSession } = await supabaseClient
        .from("stripe_checkout_sessions")
        .select("customer_id")
        .eq("user_id", userData.user.id)
        .not("customer_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      customerId = checkoutSession?.customer_id || null;
    }

    if (!customerId) {
      throw new Error("No Stripe customer found for this company");
    }

    // Create Stripe Checkout Session for the booster pack
    const origin = req.headers.get("origin") || "http://localhost:8080";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      allow_promotion_codes: true,
      invoice_creation: { enabled: true },
      line_items: [
        {
          price: priceId,
          quantity: quantity,
        },
      ],
      metadata: {
        companyId: companyId || "",
        userId: userData.user.id,
        type: "ai_booster_pack",
        quantity: quantity.toString(),
      },
      success_url: `${origin}/app/company/${body.companyName || ""}/profile?tab=addons&booster=success`,
      cancel_url: `${origin}/app/company/${body.companyName || ""}/profile?tab=addons&booster=cancelled`,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error creating booster checkout:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
