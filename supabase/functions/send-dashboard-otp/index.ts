import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

function generateOTP(): string {
  const digits = "0123456789";
  let code = "";
  const array = new Uint8Array(6);
  crypto.getRandomValues(array);
  for (let i = 0; i < 6; i++) {
    code += digits[array[i] % 10];
  }
  return code;
}

function getDashboardOtpEmailHtml(code: string, userName: string, companyName: string): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 40px; text-align: center;">
        <img src="https://app.xyreg.com/asset/nav_bar-removebg-preview-logo.png" alt="XYREG" style="height: 40px; margin-bottom: 20px; filter: brightness(0) invert(1);" />
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
          Dashboard Access Verification
        </h1>
      </div>

      <div style="padding: 40px; background: #f8fafc;">
        <p style="color: #1e293b; font-size: 18px; line-height: 1.6; margin: 0 0 20px;">
          Hi ${userName},
        </p>

        <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">
          You are requesting access to the <strong>${companyName}</strong> dashboard on XYREG. Please use the verification code below to confirm your identity.
        </p>

        <div style="background: linear-gradient(135deg, #134e4a, #0f766e); border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center;">
          <p style="color: #5eead4; margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">
            Your Verification Code
          </p>
          <div style="background: #0f172a; border-radius: 8px; padding: 20px; margin: 10px 0;">
            <code style="color: #2dd4bf; font-size: 36px; font-weight: bold; letter-spacing: 8px;">
              ${code}
            </code>
          </div>
          <p style="color: #94a3b8; margin: 15px 0 0; font-size: 14px;">
            This code expires in 5 minutes
          </p>
        </div>

        <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin: 25px 0;">
          <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
            <strong>Important:</strong> This code is used to verify your identity for dashboard access.
            If you did not initiate this request, please ignore this email and contact your administrator.
          </p>
        </div>

        <p style="color: #475569; font-size: 16px; margin-top: 30px; line-height: 1.6;">
          Best regards,<br>
          <strong style="color: #0d9488;">The XYREG Team</strong>
        </p>
      </div>

      <div style="padding: 30px; background: #1e293b; text-align: center;">
        <p style="color: #94a3b8; margin: 0 0 10px; font-size: 14px;">
          XYREG - The OS for Medical Device Lifecycle
        </p>
        <p style="color: #64748b; margin: 15px 0 0; font-size: 12px;">
          &copy; ${new Date().getFullYear()} XYREG. All rights reserved.
        </p>
      </div>
    </div>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, email, userId, code, companyName, companyId, userName: clientUserName, rememberMinutes } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // check and get-preference don't need email
    if (!email && action !== "check" && action !== "get-preference") {
      return new Response(
        JSON.stringify({ success: false, message: "Email is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // --- SEND OTP ---
    if (action === "send") {
      if (!userId) {
        return new Response(
          JSON.stringify({ success: false, message: "userId is required for sending OTP" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      if (!RESEND_API_KEY) {
        console.error("RESEND_API_KEY not configured");
        return new Response(
          JSON.stringify({ success: false, message: "Email service not configured" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      // Invalidate any existing unused codes for this user
      await supabase
        .from("esign_otp_codes")
        .update({ used: true })
        .eq("user_id", userId)
        .eq("used", false);

      // Generate new OTP
      const otpCode = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

      // Store in DB
      const { error: insertError } = await supabase
        .from("esign_otp_codes")
        .insert({
          user_id: userId,
          email,
          code: otpCode,
          expires_at: expiresAt,
          used: false,
          company_id: companyId || null,
        });

      if (insertError) {
        console.error("Failed to store OTP:", insertError);
        return new Response(
          JSON.stringify({ success: false, message: "Failed to generate verification code" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      // Get user name for the email
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", userId)
        .maybeSingle();

      const userName = profile
        ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || clientUserName || "User"
        : clientUserName || "User";

      // Send email via Resend
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "XYREG <noreply@xyreg.com>",
          to: [email],
          subject: `Your Dashboard Access Verification Code: ${otpCode}`,
          html: getDashboardOtpEmailHtml(otpCode, userName, companyName || "your company"),
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        console.error("Resend API error:", errorData);
        return new Response(
          JSON.stringify({ success: false, message: "Failed to send verification email" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      console.log(`Dashboard OTP sent to ${email} for company: ${companyName}`);

      return new Response(
        JSON.stringify({ success: true, message: "Verification code sent" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- VERIFY OTP ---
    if (action === "verify") {
      if (!code) {
        return new Response(
          JSON.stringify({ verified: false, message: "Verification code is required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Look up the code
      const { data: otpRecord, error: lookupError } = await supabase
        .from("esign_otp_codes")
        .select("*")
        .eq("email", email)
        .eq("code", code)
        .eq("used", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lookupError || !otpRecord) {
        return new Response(
          JSON.stringify({ verified: false, message: "Invalid verification code" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check expiry
      if (new Date(otpRecord.expires_at) < new Date()) {
        await supabase
          .from("esign_otp_codes")
          .update({ used: true })
          .eq("id", otpRecord.id);

        return new Response(
          JSON.stringify({ verified: false, message: "Verification code has expired" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark as used + store remember preferences
      const updatePayload: Record<string, any> = { used: true };
      if (rememberMinutes && typeof rememberMinutes === "number" && rememberMinutes > 0) {
        updatePayload.remember_minutes = rememberMinutes;
        updatePayload.last_redirect_at = new Date().toISOString();
      }

      await supabase
        .from("esign_otp_codes")
        .update(updatePayload)
        .eq("id", otpRecord.id);

      console.log(`Dashboard OTP verified for ${email}${rememberMinutes ? ` (remember ${rememberMinutes}min)` : ""}`);

      return new Response(
        JSON.stringify({ verified: true, message: "Code verified successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- GET PREFERENCE ---
    if (action === "get-preference") {
      if (!userId || !companyId) {
        return new Response(
          JSON.stringify({ remember_minutes: null }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: prefRow } = await supabase
        .from("esign_otp_codes")
        .select("remember_minutes")
        .eq("user_id", userId)
        .eq("company_id", companyId)
        .eq("used", true)
        .not("remember_minutes", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return new Response(
        JSON.stringify({ remember_minutes: prefRow?.remember_minutes || null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- CHECK REMEMBER ---
    if (action === "check") {
      if (!userId || !companyId) {
        return new Response(
          JSON.stringify({ remembered: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: otpRow } = await supabase
        .from("esign_otp_codes")
        .select("created_at, remember_minutes")
        .eq("user_id", userId)
        .eq("company_id", companyId)
        .eq("used", true)
        .not("remember_minutes", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!otpRow || !otpRow.remember_minutes) {
        return new Response(
          JSON.stringify({ remembered: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const verifiedAt = new Date(otpRow.created_at).getTime();
      const expiresAt = verifiedAt + otpRow.remember_minutes * 60 * 1000;
      const remembered = Date.now() < expiresAt;

      // Update last_redirect_at if still remembered
      if (remembered) {
        await supabase
          .from("esign_otp_codes")
          .update({ last_redirect_at: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("company_id", companyId)
          .eq("used", true)
          .not("remember_minutes", "is", null)
          .order("created_at", { ascending: false })
          .limit(1);
      }

      return new Response(
        JSON.stringify({ remembered }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: "Invalid action. Use 'send', 'verify', or 'check'" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  } catch (error) {
    console.error("Error in send-dashboard-otp:", error);
    return new Response(
      JSON.stringify({ success: false, message: "An error occurred. Please try again." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
