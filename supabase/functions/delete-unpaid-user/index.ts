import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[DELETE-UNPAID-USER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData.user) throw new Error("User not authenticated");
    const user = userData.user;
    logStep("Authenticated", { userId: user.id });

    // Resolve service role key: prefer legacy var, fall back to the new SUPABASE_SECRET_KEYS JSON.
    let serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!serviceRoleKey) {
      try {
        const raw = Deno.env.get("SUPABASE_SECRET_KEYS") ?? "";
        if (raw) {
          const parsed = JSON.parse(raw);
          serviceRoleKey =
            parsed.service_role ??
            parsed.SERVICE_ROLE ??
            parsed.serviceRole ??
            "";
        }
      } catch (e) {
        logStep("Failed to parse SUPABASE_SECRET_KEYS", { message: String(e) });
      }
    }
    logStep("Service role key source", {
      legacy: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      newDict: !!Deno.env.get("SUPABASE_SECRET_KEYS"),
      hasKey: !!serviceRoleKey,
    });
    if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY not available");

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      serviceRoleKey,
    );

    // Refuse to delete only if the user actually completed payment.
    // Source of truth: stripe_checkout_sessions.status === 'completed'.
    // A subscription row may exist in trialing/incomplete state simply because
    // Stripe creates it when the checkout session opens — so it's NOT a reliable signal.
    const { data: completedSessions } = await adminClient
      .from("stripe_checkout_sessions")
      .select("session_id, status")
      .eq("user_id", user.id)
      .eq("status", "completed");

    const { data: subRows } = await adminClient
      .from("user_subscriptions")
      .select("id, status, stripe_subscription_id")
      .eq("user_id", user.id);
    logStep("Subscription state", {
      subscriptions: subRows ?? [],
      completedCheckouts: completedSessions?.length ?? 0,
    });

    if (completedSessions && completedSessions.length > 0) {
      logStep("User has completed checkout — refusing delete", { count: completedSessions.length });
      return new Response(
        JSON.stringify({ deleted: false, reason: "active_subscription" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // Best-effort cleanup of any company rows the user owns and was created during pending registration.
    const { data: accessRows } = await adminClient
      .from("user_company_access")
      .select("company_id")
      .eq("user_id", user.id);

    const companyIds = (accessRows ?? []).map((r) => r.company_id).filter(Boolean);

    if (companyIds.length > 0) {
      await adminClient.from("user_company_access").delete().eq("user_id", user.id);

      // Only delete companies that have no other users attached.
      for (const companyId of companyIds) {
        const { data: otherUsers } = await adminClient
          .from("user_company_access")
          .select("user_id")
          .eq("company_id", companyId)
          .limit(1);
        if (!otherUsers || otherUsers.length === 0) {
          await adminClient.from("companies").delete().eq("id", companyId);
          logStep("Orphaned company deleted", { companyId });
        }
      }
    }

    // Drop user-owned rows that may FK-block the auth user delete.
    const cleanupTables = [
      "stripe_checkout_sessions",
      "user_subscriptions",
      "plan_history",
    ];
    for (const table of cleanupTables) {
      const { error: cleanupErr } = await adminClient
        .from(table)
        .delete()
        .eq("user_id", user.id);
      if (cleanupErr) {
        logStep(`Cleanup warning for ${table}`, { message: cleanupErr.message });
      }
    }

    // Hard delete (shouldSoftDelete=false). A soft-delete leaves the email
    // collision in auth.users so the user can't re-register.
    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(user.id, false);
    if (deleteErr) {
      logStep("auth.admin.deleteUser failed", { message: deleteErr.message });
      throw new Error(`Failed to delete user: ${deleteErr.message}`);
    }
    logStep("User hard-deleted", { userId: user.id });

    return new Response(
      JSON.stringify({ deleted: true, userId: user.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
