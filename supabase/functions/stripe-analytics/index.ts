import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

type StripeSubscription = Stripe.Subscription;
type StripeInvoice = Stripe.Invoice;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-ANALYTICS] ${step}${detailsStr}`);
};

interface AnalyticsData {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  canceledSubscriptions: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  churnRate: number;
  subscriptionGrowth: Array<{
    period: string;
    subscriptions: number;
    revenue: number;
  }>;
  revenueByPlan: Array<{
    planName: string;
    revenue: number;
    subscriptions: number;
  }>;
  recentTransactions: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    customerEmail: string;
    createdAt: string;
    description: string;
  }>;
}

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
    const isSuperAdmin = user.user_metadata?.role === 'super_admin';
    if (!isSuperAdmin) {
      throw new Error("Only super admins can access analytics");
    }

    logStep("Super admin verified", { userId: user.id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });

    // Get query parameters for date range
    const url = new URL(req.url);
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const period = url.searchParams.get('period') || '30d';

    // Calculate date range
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : now;

    logStep("Fetching analytics data", { start: start.toISOString(), end: end.toISOString() });

    // Fetch all subscriptions
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      created: {
        gte: Math.floor(start.getTime() / 1000),
        lte: Math.floor(end.getTime() / 1000),
      },
    });

    // Fetch all customers for additional data
    const customers = await stripe.customers.list({ limit: 100 });

    // Fetch recent invoices for revenue calculation
    const invoices = await stripe.invoices.list({
      limit: 100,
      created: {
        gte: Math.floor(start.getTime() / 1000),
        lte: Math.floor(end.getTime() / 1000),
      },
    });

    // Calculate analytics
    const analytics: AnalyticsData = {
      totalSubscriptions: subscriptions.data.length,
      activeSubscriptions: subscriptions.data.filter((s: StripeSubscription) => s.status === 'active').length,
      trialingSubscriptions: subscriptions.data.filter((s: StripeSubscription) => s.status === 'trialing').length,
      canceledSubscriptions: subscriptions.data.filter((s: StripeSubscription) => s.status === 'canceled').length,
      totalRevenue: 0,
      monthlyRecurringRevenue: 0,
      averageRevenuePerUser: 0,
      churnRate: 0,
      subscriptionGrowth: [],
      revenueByPlan: [],
      recentTransactions: [],
    };

    // Calculate total revenue from paid invoices
    const paidInvoices = invoices.data.filter((invoice: StripeInvoice) => invoice.status === 'paid');
    analytics.totalRevenue = paidInvoices.reduce((sum: number, invoice: StripeInvoice) => sum + (invoice.amount_paid || 0), 0) / 100;

    // Calculate MRR from active subscriptions
    analytics.monthlyRecurringRevenue = subscriptions.data
      .filter((s: StripeSubscription) => s.status === 'active')
      .reduce((sum: number, sub: StripeSubscription) => {
        const price = sub.items.data[0]?.price;
        if (price && price.recurring?.interval === 'month') {
          return sum + (price.unit_amount || 0) / 100;
        } else if (price && price.recurring?.interval === 'year') {
          return sum + (price.unit_amount || 0) / 100 / 12;
        }
        return sum;
      }, 0);

    // Calculate ARPU
    analytics.averageRevenuePerUser = analytics.activeSubscriptions > 0 
      ? analytics.monthlyRecurringRevenue / analytics.activeSubscriptions 
      : 0;

    // Calculate churn rate (simplified)
    const canceledCount = subscriptions.data.filter((s: StripeSubscription) => s.status === 'canceled').length;
    analytics.churnRate = analytics.totalSubscriptions > 0 
      ? (canceledCount / analytics.totalSubscriptions) * 100 
      : 0;

    // Generate subscription growth data (last 12 months)
    const growthData = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthSubscriptions = subscriptions.data.filter((s: StripeSubscription) => {
        const subDate = new Date(s.created * 1000);
        return subDate.getMonth() === date.getMonth() && subDate.getFullYear() === date.getFullYear();
      }).length;
      
      const monthRevenue = paidInvoices.filter((invoice: StripeInvoice) => {
        const invoiceDate = new Date(invoice.created * 1000);
        return invoiceDate.getMonth() === date.getMonth() && invoiceDate.getFullYear() === date.getFullYear();
      }).reduce((sum: number, invoice: StripeInvoice) => sum + (invoice.amount_paid || 0), 0) / 100;

      growthData.push({
        period: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        subscriptions: monthSubscriptions,
        revenue: monthRevenue,
      });
    }
    analytics.subscriptionGrowth = growthData;

    // Calculate revenue by plan
    const planRevenue: { [key: string]: { revenue: number; subscriptions: number; name: string } } = {};
    
    subscriptions.data.forEach((sub: StripeSubscription) => {
      const price = sub.items.data[0]?.price;
      if (price) {
        const planKey = price.id;
        if (!planRevenue[planKey]) {
          planRevenue[planKey] = { revenue: 0, subscriptions: 0, name: price.nickname || 'Unknown Plan' };
        }
        planRevenue[planKey].subscriptions++;
        
        // Calculate revenue for this subscription
        const monthlyAmount = price.recurring?.interval === 'month' 
          ? (price.unit_amount || 0) / 100
          : (price.unit_amount || 0) / 100 / 12;
        planRevenue[planKey].revenue += monthlyAmount;
      }
    });

    analytics.revenueByPlan = Object.values(planRevenue).map(plan => ({
      planName: plan.name,
      revenue: plan.revenue,
      subscriptions: plan.subscriptions,
    }));

    // Get recent transactions (from invoices)
    analytics.recentTransactions = paidInvoices.slice(0, 10).map((invoice: StripeInvoice) => ({
      id: invoice.id,
      amount: (invoice.amount_paid || 0) / 100,
      currency: invoice.currency,
      status: invoice.status || 'paid',
      customerEmail: invoice.customer_email || 'Unknown',
      createdAt: new Date(invoice.created * 1000).toISOString(),
      description: invoice.description || 'Subscription payment',
    }));

    logStep("Analytics calculated successfully", {
      totalSubscriptions: analytics.totalSubscriptions,
      totalRevenue: analytics.totalRevenue,
      mrr: analytics.monthlyRecurringRevenue,
    });

    return new Response(JSON.stringify(analytics), {
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
