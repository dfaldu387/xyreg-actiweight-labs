import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Module-level singletons — constructed once per cold start
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const endpointSecret = Deno.env.get("STRIPE_CONSULTING_WEBHOOK_SECRET") || "";

// Service-role client so we can write to new_pricing_company_plans
// without being blocked by RLS policies.
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("[consulting-webhook] Missing stripe-signature header");
    return new Response("No signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret);
  } catch (err) {
    console.error("[consulting-webhook] Signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log("[consulting-webhook] Received event:", event.type);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleConsultingCheckoutCompleted(session);
    }
  } catch (err) {
    console.error("[consulting-webhook] Handler error:", err.message);
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

async function handleConsultingCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  console.log("[consulting-webhook] checkout.session.completed:", session.id);

  // Only act on consulting_hours checkouts
  if (session.metadata?.type !== "consulting_hours") {
    console.log(
      "[consulting-webhook] Skipping — metadata.type is not consulting_hours:",
      session.metadata?.type
    );
    return;
  }

  const companyId = session.metadata?.companyId;
  const quantityStr = session.metadata?.quantity ?? "1";
  const quantity = parseInt(quantityStr, 10);
  const packageId = session.metadata?.packageId;

  if (!companyId) {
    console.error("[consulting-webhook] No companyId in session metadata:", session.id);
    return;
  }

  if (isNaN(quantity) || quantity < 1) {
    console.error("[consulting-webhook] Invalid quantity in metadata:", quantityStr);
    return;
  }

  // Resolve hours_per_pack: prefer metadata (set at checkout creation),
  // fall back to a fresh DB lookup if missing (e.g. older sessions).
  let hoursPerPack = parseInt(session.metadata?.hoursPerPack ?? "", 10);
  if ((isNaN(hoursPerPack) || hoursPerPack <= 0) && packageId) {
    const { data: pkg, error: pkgError } = await supabase
      .from("dynamic_products")
      .select("metadata")
      .eq("id", packageId)
      .maybeSingle();

    if (pkgError) {
      console.error("[consulting-webhook] Failed to fetch package:", pkgError.message);
    } else if (pkg) {
      hoursPerPack = Number(
        (pkg.metadata as Record<string, unknown> | null)?.hours_per_pack ?? 0
      );
    }
  }

  if (!Number.isFinite(hoursPerPack) || hoursPerPack <= 0) {
    console.error(
      "[consulting-webhook] Could not resolve hoursPerPack for session:",
      session.id
    );
    throw new Error("Missing or invalid hoursPerPack");
  }

  const hoursToAdd = quantity * hoursPerPack;
  console.log(
    `[consulting-webhook] Adding ${quantity} pack(s) × ${hoursPerPack}h = ${hoursToAdd} hours for company ${companyId}`
  );

  // 1. Read current value
  const { data: existing, error: fetchError } = await supabase
    .from("new_pricing_company_plans")
    .select("id, consulting_hours")
    .eq("company_id", companyId)
    .maybeSingle();

  if (fetchError) {
    console.error("[consulting-webhook] Failed to fetch company plan:", fetchError.message);
    throw new Error(`DB fetch failed: ${fetchError.message}`);
  }

  if (!existing) {
    console.error(
      "[consulting-webhook] No new_pricing_company_plans row found for company:",
      companyId
    );
    throw new Error(`No plan row for companyId ${companyId}`);
  }

  const currentHours = existing.consulting_hours ?? 0;
  const newHours = currentHours + hoursToAdd;

  // 2. Write the incremented value back
  const { error: updateError } = await supabase
    .from("new_pricing_company_plans")
    .update({
      consulting_hours: newHours,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (updateError) {
    console.error("[consulting-webhook] Failed to update consulting_hours:", updateError.message);
    throw new Error(`DB update failed: ${updateError.message}`);
  }

  console.log(
    `[consulting-webhook] Success — consulting_hours updated: ${currentHours} → ${newHours} ` +
      `(+${hoursToAdd} hours from ${quantity} pack(s)) for company ${companyId}`
  );

  // 3. Log the purchase in consulting_hours_log
  const userId = session.metadata?.userId;
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  const invoiceId = typeof session.invoice === 'string' ? session.invoice : session.invoice?.id;
  {
    const { error: logError } = await supabase
      .from("consulting_hours_log")
      .insert({
        company_id: companyId,
        user_id: userId,
        type: "purchase",
        hours: hoursToAdd,
        description: `Purchased ${quantity} consulting pack(s) — ${hoursToAdd} hours`,
        stripe_session_id: session.id,
        amount_paid: session.amount_total || 0,
        currency: session.currency || "usd",
        metadata: {
          quantity,
          hours_per_pack: hoursPerPack,
          package_id: packageId ?? null,
          previous_balance: currentHours,
          new_balance: newHours,
        },
      });

    if (logError) {
      console.error("[consulting-webhook] Failed to log purchase:", logError.message);
    } else {
      console.log("[consulting-webhook] Purchase logged to consulting_hours_log");
    }
  }

  // 4. Save invoice to stripe_invoices so it shows in Invoice History

  if (invoiceId && userId) {
    let invoicePdf: string | null = null;
    let hostedUrl: string | null = null;
    try {
      const inv = await stripe.invoices.retrieve(invoiceId);
      invoicePdf = inv.invoice_pdf || null;
      hostedUrl = inv.hosted_invoice_url || null;
    } catch (e) {
      console.log("[consulting-webhook] Could not fetch invoice details:", e.message);
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
        currency: session.currency || 'usd',
        status: 'paid',
        invoice_url: invoicePdf,
        hosted_invoice_url: hostedUrl,
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }, { onConflict: 'invoice_id' });

    if (invError) {
      console.error("[consulting-webhook] Failed to store invoice:", invError.message);
    } else {
      console.log("[consulting-webhook] Invoice stored:", invoiceId);
    }
  }
}
