import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ valid: false, message: "Access code is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up the code
    const { data: codeRecord, error } = await supabase
      .from("whx_event_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .single();

    if (error || !codeRecord) {
      return new Response(
        JSON.stringify({ valid: false, message: "Invalid access code. Please check and try again." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if code has expired
    if (codeRecord.expires_at && new Date(codeRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, message: "This access code has expired." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if max uses reached
    if (codeRecord.max_uses !== null && codeRecord.current_uses >= codeRecord.max_uses) {
      return new Response(
        JSON.stringify({ valid: false, message: "This access code has reached its maximum usage limit." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment usage count
    await supabase
      .from("whx_event_codes")
      .update({ current_uses: codeRecord.current_uses + 1 })
      .eq("id", codeRecord.id);

    // Return success with redirect URL
    const mainAppUrl = Deno.env.get("MAIN_APP_URL") ?? "https://app.xyreg.com";
    const redirectUrl = `${mainAppUrl}/register?code=${encodeURIComponent(code.toUpperCase())}&plan=genesis`;

    return new Response(
      JSON.stringify({
        valid: true,
        message: "Access code verified successfully!",
        redirectUrl: redirectUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error validating code:", error);
    return new Response(
      JSON.stringify({ valid: false, message: "An error occurred. Please try again." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
