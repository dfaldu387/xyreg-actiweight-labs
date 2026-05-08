import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface ResolvedProduct {
  id: string;
  product_key: string;
  stripe_product_id: string;
  stripe_price_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  metadata: Record<string, unknown>;
  sort_order: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const productKey: string | undefined = body?.product_key;

    let query = supabase
      .from("dynamic_products")
      .select("id, product_key, stripe_product_id, metadata, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (productKey) {
      query = query.eq("product_key", productKey);
    }

    const { data: rows, error } = await query;

    if (error) {
      throw new Error(`DB query failed: ${error.message}`);
    }

    const products: ResolvedProduct[] = [];

    for (const row of rows ?? []) {
      try {
        const product = await stripe.products.retrieve(row.stripe_product_id);
        const defaultPriceId =
          typeof product.default_price === "string"
            ? product.default_price
            : product.default_price?.id;

        if (!defaultPriceId) {
          console.error(
            `[get-dynamic-products] Product ${row.stripe_product_id} has no default_price — skipping`
          );
          continue;
        }

        const price =
          typeof product.default_price === "object" && product.default_price
            ? product.default_price
            : await stripe.prices.retrieve(defaultPriceId);

        if (price.unit_amount == null || !price.currency) {
          console.error(
            `[get-dynamic-products] Price ${defaultPriceId} missing unit_amount/currency — skipping`
          );
          continue;
        }

        products.push({
          id: row.id,
          product_key: row.product_key,
          stripe_product_id: row.stripe_product_id,
          stripe_price_id: price.id,
          name: product.name,
          description: product.description,
          price_cents: price.unit_amount,
          currency: price.currency,
          metadata: (row.metadata ?? {}) as Record<string, unknown>,
          sort_order: row.sort_order,
        });
      } catch (err) {
        console.error(
          `[get-dynamic-products] Failed to resolve ${row.stripe_product_id}:`,
          (err as Error).message
        );
      }
    }

    return new Response(
      JSON.stringify({ products }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("[get-dynamic-products] Error:", (error as Error).message);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
