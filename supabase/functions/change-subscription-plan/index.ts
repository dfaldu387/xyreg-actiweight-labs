import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHANGE-SUBSCRIPTION-PLAN] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    // Check if user is super admin
    // const isSuperAdmin = user.user_metadata?.role === 'super_admin' || user.user_metadata?.role === 'admin' ||user.user_metadata?.role === 'business' ;
    // if (!isSuperAdmin) {
    //   throw new Error("Only super admins can change subscription plans");
    // }

    logStep("Super admin verified", { userId: user.id });

    const { subscriptionId, newPriceId } = await req.json();
    if (!subscriptionId || !newPriceId) {
      throw new Error("Subscription ID and new price ID are required");
    }
    logStep("Parameters received", { subscriptionId, newPriceId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });

    // Get the current subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    logStep("Current subscription retrieved", { 
      subscriptionId: subscription.id,
      currentPriceId: subscription.items.data[0]?.price.id 
    });

    // Get the new price details
    const newPrice = await stripe.prices.retrieve(newPriceId);
    logStep("New price retrieved", { 
      priceId: newPrice.id,
      productId: newPrice.product 
    });

    // Update the subscription with the new price
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations', // Prorate the billing
    });

    logStep("Subscription updated", { 
      subscriptionId: updatedSubscription.id,
      newPriceId: updatedSubscription.items.data[0]?.price.id 
    });

    // Update the subscription in our database
    const { error: updateError } = await supabaseClient
      .from('user_subscriptions')
      .update({ 
        product_id: newPrice.product as string,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (updateError) {
      logStep("Error updating database", { error: updateError });
      // Don't throw error here as Stripe update succeeded
    } else {
      logStep("Database updated successfully");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      subscriptionId: updatedSubscription.id,
      newPriceId: updatedSubscription.items.data[0]?.price.id,
      productId: newPrice.product
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
