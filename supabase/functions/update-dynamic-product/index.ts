import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Mirrors the RLS policy on public.dynamic_products. Update both together
// when the super-admin gating moves to a roles table or JWT claim.
const SUPER_ADMIN_EMAIL = "superadmin@gmail.com";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseService = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface UpdateBody {
  id: string;
  name?: string;
  description?: string | null;
  price_cents?: number;
  hours_per_pack?: number;
  credits?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await supabaseAuth.auth.getUser();
    if (!userData.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    if (userData.user.email !== SUPER_ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const body = (await req.json()) as UpdateBody;
    const { id, name, description, price_cents, hours_per_pack, credits } = body;
    if (!id) {
      throw new Error("id is required");
    }

    const { data: row, error: rowErr } = await supabaseService
      .from("dynamic_products")
      .select("stripe_product_id, metadata")
      .eq("id", id)
      .maybeSingle();
    if (rowErr) {
      throw new Error(`Lookup failed: ${rowErr.message}`);
    }
    if (!row) {
      throw new Error("Product row not found");
    }

    const updated: Record<string, unknown> = {};

    // 1) name / description → Stripe Product
    const productPatch: Stripe.ProductUpdateParams = {};
    if (typeof name === "string" && name.trim().length > 0) {
      productPatch.name = name.trim();
    }
    if (description !== undefined) {
      productPatch.description = description === null ? "" : description;
    }
    if (Object.keys(productPatch).length > 0) {
      const updatedProduct = await stripe.products.update(
        row.stripe_product_id,
        productPatch
      );
      if (productPatch.name) updated.name = updatedProduct.name;
      if ("description" in productPatch) updated.description = updatedProduct.description;
    }

    // 2) price → create new Stripe Price, set as Product default, archive previous
    if (typeof price_cents === "number" && price_cents > 0) {
      const product = await stripe.products.retrieve(row.stripe_product_id);
      const currentPriceId =
        typeof product.default_price === "string"
          ? product.default_price
          : product.default_price?.id;

      let currency = "eur";
      if (currentPriceId) {
        const currentPrice = await stripe.prices.retrieve(currentPriceId);
        currency = currentPrice.currency;
      }

      const newPrice = await stripe.prices.create({
        product: row.stripe_product_id,
        unit_amount: price_cents,
        currency,
      });
      await stripe.products.update(row.stripe_product_id, {
        default_price: newPrice.id,
      });
      updated.default_price_id = newPrice.id;
      updated.price_cents = price_cents;

      if (currentPriceId && currentPriceId !== newPrice.id) {
        try {
          await stripe.prices.update(currentPriceId, { active: false });
        } catch (e) {
          console.error(
            "[update-dynamic-product] Failed to archive old price:",
            (e as Error).message
          );
        }
      }
    }

    // 3) metadata fields (hours_per_pack / credits) → dynamic_products.metadata
    const metadataPatch: Record<string, unknown> = {};
    if (typeof hours_per_pack === "number" && hours_per_pack > 0) {
      metadataPatch.hours_per_pack = hours_per_pack;
    }
    if (typeof credits === "number" && credits > 0) {
      metadataPatch.credits = credits;
    }
    if (Object.keys(metadataPatch).length > 0) {
      const currentMetadata =
        (row.metadata as Record<string, unknown> | null) ?? {};
      const newMetadata = { ...currentMetadata, ...metadataPatch };
      const { error: updateErr } = await supabaseService
        .from("dynamic_products")
        .update({ metadata: newMetadata })
        .eq("id", id);
      if (updateErr) {
        throw new Error(`Failed to update metadata: ${updateErr.message}`);
      }
      Object.assign(updated, metadataPatch);
    }

    return new Response(
      JSON.stringify({ success: true, updated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("[update-dynamic-product]", (error as Error).message);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
