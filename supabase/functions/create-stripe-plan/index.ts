import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { corsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-STRIPE-PLAN] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
   
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    
    // Check if user is super admin
    const isSuperAdmin = user.user_metadata?.role === 'super_admin';
    if (!isSuperAdmin) {
      throw new Error("Only super admins can create plans");
    }
    logStep("Super admin verified", { userId: user.id });

    const body = await req.json();
    const { name, description, price, currency, interval, features, is_featured } = body;

    if (!name || !price) {
      throw new Error("Plan name and price are required");
    }

    logStep("Creating Stripe product", { name, price });

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });

    // Create Stripe product
    const product = await stripe.products.create({
      name,
      description: description || '',
    });
    logStep("Stripe product created", { productId: product.id });

    // Create Stripe price
    const priceData = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(price * 100), // Convert to cents
      currency: currency || 'usd',
      recurring: {
        interval: interval || 'month',
      },
    });
    logStep("Stripe price created", { priceId: priceData.id });

    // Save to database
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .insert({
        name,
        description: description || '',
        stripe_product_id: product.id,
        stripe_price_id: priceData.id,
        price,
        currency: currency || 'USD',
        interval: interval || 'month',
        is_active: true,
        is_featured: is_featured || false,
        features: features || [],
      })
      .select()
      .single();

    if (planError) {
      // If database save fails, try to delete the Stripe product
      try {
        await stripe.products.update(product.id, { active: false });
      } catch (e) {
        logStep("Failed to deactivate Stripe product after DB error", { error: e });
      }
      throw new Error(`Failed to save plan: ${planError.message}`);
    }

    logStep("Plan saved to database", { planId: plan.id });

    return new Response(JSON.stringify({ success: true, plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-stripe-plan", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
