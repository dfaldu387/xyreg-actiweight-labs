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

    // Parse request body for companyId
    let companyId: string | null = null;
    try {
      const body = await req.json();
      companyId = body?.companyId || null;
    } catch {
      // No body provided
    }

    let customerId: string | null = null;

    // 1. Check companies table for stripe_customer_id
    if (companyId) {
      const { data: company } = await supabaseClient
        .from("companies")
        .select("stripe_customer_id")
        .eq("id", companyId)
        .single();

      customerId = company?.stripe_customer_id || null;
    }

    // 2. Fallback: check stripe_customers table
    if (!customerId && companyId) {
      const { data: stripeCustomer } = await supabaseClient
        .from("stripe_customers")
        .select("customer_id")
        .eq("company_id", companyId)
        .limit(1)
        .single();

      customerId = stripeCustomer?.customer_id || null;
    }

    // 3. Fallback: check checkout sessions (legacy)
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
      throw new Error("No customer found");
    }

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.headers.get("origin")}/app/profile`,
    });

    return new Response(
      JSON.stringify({ url: portalSession.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error creating portal session:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});