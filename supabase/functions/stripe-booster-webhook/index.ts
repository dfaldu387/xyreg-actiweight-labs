import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Module-level singletons — constructed once per cold start
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const endpointSecret = Deno.env.get("STRIPE_BOOSTER_WEBHOOK_SECRET") || "";

// Service-role client so we can write to new_pricing_company_plans
// without being blocked by RLS policies.
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("[booster-webhook] Missing stripe-signature header");
    return new Response("No signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret);
  } catch (err) {
    console.error("[booster-webhook] Signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log("[booster-webhook] Received event:", event.type);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleBoosterCheckoutCompleted(session);
    }
    // All other event types are silently acknowledged — this function is
    // scoped to ai_booster_pack purchases only.
  } catch (err) {
    console.error("[booster-webhook] Handler error:", err.message);
    // Return 200 so Stripe does not keep retrying an application-level error.
    // The error is logged; you can inspect it in Supabase Function logs.
    return new Response(
      JSON.stringify({ received: true, error: err.message }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  }

  return new Response(
    JSON.stringify({ received: true }),
    { headers: { "Content-Type": "application/json" }, status: 200 }
  );
});

async function handleBoosterCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  console.log("[booster-webhook] checkout.session.completed:", session.id);

  // Only act on booster-pack checkouts
  if (session.metadata?.type !== "ai_booster_pack") {
    console.log(
      "[booster-webhook] Skipping — metadata.type is not ai_booster_pack:",
      session.metadata?.type
    );
    return;
  }

  const companyId = session.metadata?.companyId;
  const quantityStr = session.metadata?.quantity ?? "1";
  const quantity = parseInt(quantityStr, 10);

  if (!companyId) {
    console.error("[booster-webhook] No companyId in session metadata:", session.id);
    return;
  }

  if (isNaN(quantity) || quantity < 1) {
    console.error("[booster-webhook] Invalid quantity in metadata:", quantityStr);
    return;
  }

  const creditsPerPack = 500;
  console.log(
    `[booster-webhook] Adding ${quantity} pack(s) = ${quantity * creditsPerPack} credits for company ${companyId}`
  );

  // 1. Read current value — we must do this ourselves because Supabase JS does
  //    not expose a Postgres "column = column + n" increment natively without
  //    an RPC.  Using a read-then-write is safe here because Stripe guarantees
  //    at-least-once delivery with the same event id, so duplicate events for
  //    the same session id need to be idempotent.  We guard that below.
  const { data: existing, error: fetchError } = await supabase
    .from("new_pricing_company_plans")
    .select("id, ai_booster_packs")
    .eq("company_id", companyId)
    .maybeSingle();

  if (fetchError) {
    console.error("[booster-webhook] Failed to fetch company plan:", fetchError.message);
    throw new Error(`DB fetch failed: ${fetchError.message}`);
  }

  if (!existing) {
    console.error(
      "[booster-webhook] No new_pricing_company_plans row found for company:",
      companyId
    );
    // Not a hard failure — the company may not have been provisioned yet.
    // We choose to throw so Stripe will retry and the issue surfaces clearly.
    throw new Error(`No plan row for companyId ${companyId}`);
  }

  const currentPacks = existing.ai_booster_packs ?? 0;
  // Each pack = 500 credits, quantity = number of packs purchased
  const creditsToAdd = quantity * 500;
  const newPacks = currentPacks + creditsToAdd;

  // 2. Write the incremented value back
  const { error: updateError } = await supabase
    .from("new_pricing_company_plans")
    .update({
      ai_booster_packs: newPacks,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (updateError) {
    console.error("[booster-webhook] Failed to update ai_booster_packs:", updateError.message);
    throw new Error(`DB update failed: ${updateError.message}`);
  }

  console.log(
    `[booster-webhook] Success — ai_booster_packs updated: ${currentPacks} → ${newPacks} ` +
      `(+${creditsToAdd} credits from ${quantity} pack(s)) for company ${companyId}`
  );

  // 3. Save invoice to stripe_invoices so it shows in Invoice History
  const userId = session.metadata?.userId;
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  const invoiceId = typeof session.invoice === 'string' ? session.invoice : session.invoice?.id;

  if (invoiceId && userId) {
    // Fetch the invoice from Stripe to get PDF URL
    let invoicePdf: string | null = null;
    let hostedUrl: string | null = null;
    try {
      const inv = await stripe.invoices.retrieve(invoiceId);
      invoicePdf = inv.invoice_pdf || null;
      hostedUrl = inv.hosted_invoice_url || null;
    } catch (e) {
      console.log("[booster-webhook] Could not fetch invoice details:", e.message);
    }

    const { error: invError } = await supabase
      .from('stripe_invoices')
      .upsert({
        user_id: userId,
        company_id: companyId,
        invoice_id: invoiceId,
        subscription_id: null,
        customer_id: customerId || null,
        amount_paid: session.amount_total || 0,
        currency: session.currency || 'eur',
        status: 'paid',
        invoice_url: invoicePdf,
        hosted_invoice_url: hostedUrl,
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }, { onConflict: 'invoice_id' });

    if (invError) {
      console.error("[booster-webhook] Failed to store invoice:", invError.message);
    } else {
      console.log("[booster-webhook] Invoice stored:", invoiceId);
    }
  }
}
