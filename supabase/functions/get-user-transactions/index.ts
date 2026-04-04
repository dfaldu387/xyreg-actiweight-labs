import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

type StripePaymentIntent = Stripe.PaymentIntent;
type StripeSubscription = Stripe.Subscription;
type StripeInvoice = Stripe.Invoice;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-USER-TRANSACTIONS] ${step}${detailsStr}`);
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
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });
    
    // Find customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning empty transactions");
      return new Response(JSON.stringify({ transactions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Fetch payment intents, invoices, and subscriptions
    const [paymentIntents, invoices, subscriptions] = await Promise.all([
      stripe.paymentIntents.list({
        customer: customerId,
        limit: 100,
      }),
      stripe.invoices.list({
        customer: customerId,
        limit: 100,
      }),
      stripe.subscriptions.list({
        customer: customerId,
        limit: 100,
      })
    ]);
    
    logStep("Fetched payment intents, invoices, and subscriptions", { 
      paymentIntentsCount: paymentIntents.data.length,
      invoicesCount: invoices.data.length,
      subscriptionsCount: subscriptions.data.length
    });

    // Transform payment intents to transaction format
    const paymentTransactions = paymentIntents.data.map((pi: StripePaymentIntent) => ({
      id: pi.id,
      amount: pi.amount, // Amount in cents
      currency: pi.currency.toUpperCase(),
      status: pi.status,
      created: pi.created,
      description: pi.description || `Payment for ${pi.currency.toUpperCase()} ${(pi.amount / 100).toFixed(2)}`,
      type: 'payment_intent'
    }));

    // Create a map of subscription IDs to their prices for trial invoice handling
    const subscriptionPriceMap = new Map<string, number>();
    subscriptions.data.forEach((sub: StripeSubscription) => {
      if (sub.items.data.length > 0) {
        subscriptionPriceMap.set(sub.id, sub.items.data[0].price.unit_amount || 0);
      }
    });

    // Transform invoices to transaction format
    const invoiceTransactions = invoices.data.map((invoice: StripeInvoice) => {
      let amount = invoice.amount_paid || invoice.total;
      let description = invoice.description;
      
      // Handle trial invoices - use subscription price instead of invoice amount
      if (invoice.billing_reason === 'subscription_create' && invoice.subscription) {
        const subscriptionPrice = subscriptionPriceMap.get(invoice.subscription);
        if (subscriptionPrice && subscriptionPrice > 0) {
          amount = subscriptionPrice;
          description = `Trial subscription for ${invoice.currency.toUpperCase()} ${(subscriptionPrice / 100).toFixed(2)}`;
        }
      }
      
      // Handle regular subscription invoices
      if (!description && invoice.subscription) {
        const subscriptionPrice = subscriptionPriceMap.get(invoice.subscription);
        if (subscriptionPrice && subscriptionPrice > 0) {
          description = `Subscription payment for ${invoice.currency.toUpperCase()} ${(subscriptionPrice / 100).toFixed(2)}`;
        } else {
          description = `Subscription payment for ${invoice.currency.toUpperCase()} ${(amount / 100).toFixed(2)}`;
        }
      }
      
      return {
        id: invoice.id,
        amount: amount, // Amount in cents
        currency: invoice.currency.toUpperCase(),
        status: invoice.status === 'paid' ? 'succeeded' : invoice.status,
        created: invoice.created,
        description: description || `Subscription payment for ${invoice.currency.toUpperCase()} ${(amount / 100).toFixed(2)}`,
        type: 'subscription'
      };
    });

    // Combine and sort by creation date (newest first)
    const allTransactions = [...paymentTransactions, ...invoiceTransactions]
      .sort((a, b) => b.created - a.created);
    
    logStep("Combined transactions", { totalCount: allTransactions.length });

    logStep("Returning transactions", { count: allTransactions.length });

    return new Response(JSON.stringify({ transactions: allTransactions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in get-user-transactions", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage, transactions: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
