import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const getResetPasswordEmailHtml = (resetLink: string): string => {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif;">
  <tr>
    <td align="center" style="padding:40px 20px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr>
          <td align="center" style="background-color:#667eea;padding:40px 30px;">
            <h1 style="color:#ffffff;font-size:28px;font-weight:600;margin:0;line-height:1.2;">Reset Your Password</h1>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding:40px 30px;">
            <h2 style="color:#1f2937;font-size:24px;font-weight:600;margin:0 0 20px 0;line-height:1.2;">Password Reset Request</h2>
            <p style="color:#374151;font-size:16px;line-height:1.6;margin:16px 0;">Hello,</p>
            <p style="color:#374151;font-size:16px;line-height:1.6;margin:16px 0;">We received a request to reset the password for your <strong>Xyreg</strong> account. Click the button below to set a new password:</p>
            <!-- Info box -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
              <tr>
                <td style="background-color:#f3f4f6;padding:12px 20px;border-radius:8px;border-left:4px solid #667eea;">
                  <p style="color:#374151;font-size:16px;margin:0;font-weight:500;">This link will expire in 24 hours for your security.</p>
                </td>
              </tr>
            </table>
            <!-- CTA Button -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0;">
              <tr>
                <td align="center">
                  <a href="${resetLink}" target="_blank" style="background-color:#667eea;border-radius:8px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;text-align:center;display:inline-block;padding:16px 32px;border:none;cursor:pointer;">Reset Password</a>
                </td>
              </tr>
            </table>
            <p style="color:#374151;font-size:16px;line-height:1.6;margin:16px 0;">If the button does not work, you can copy and paste this link into your browser:</p>
            <!-- Fallback link -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:15px 0;">
              <tr>
                <td style="background-color:#f9fafb;padding:15px;border-radius:6px;border:1px solid #e5e7eb;">
                  <a href="${resetLink}" style="color:#667eea;font-size:14px;font-family:monospace;word-break:break-all;text-decoration:underline;">${resetLink}</a>
                </td>
              </tr>
            </table>
            <p style="color:#374151;font-size:16px;line-height:1.6;margin:16px 0;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            <p style="color:#374151;font-size:16px;line-height:1.6;margin:24px 0 16px 0;"><strong>Stay secure!</strong></p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:30px;background-color:#f9fafb;text-align:center;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="border-top:1px solid #e5e7eb;padding-top:20px;text-align:center;">
                  <p style="color:#6b7280;font-size:14px;margin:5px 0;"><strong>Xyreg</strong> - Your Company Management Platform</p>
                  <p style="color:#6b7280;font-size:14px;margin:5px 0;">&#169; 2025 Xyreg. All rights reserved.</p>
                  <p style="color:#9ca3af;font-size:12px;margin:10px 0 0 0;">This is an automated security email from Xyreg. You received this because a password reset was requested for your account.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Reset password email function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { email, redirectUrl, appUrl } = body;

    console.log("=== RESET PASSWORD EDGE FUNCTION START ===");
    console.log("Received body:", JSON.stringify(body));
    console.log("Email:", email);
    console.log("redirectUrl:", redirectUrl);
    console.log("appUrl:", appUrl);

    if (!email) {
      console.log("ERROR: No email provided");
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create Supabase admin client to generate recovery link
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    console.log("Supabase URL:", supabaseUrl);
    console.log("Service key exists:", !!supabaseServiceKey);

    console.log("STEP 1: Creating Supabase client...");
    let supabaseClient;
    try {
      supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      console.log("STEP 1 DONE: Supabase client created");
    } catch (e) {
      console.error("STEP 1 FAILED: createClient error:", String(e));
      throw e;
    }

    // Use dynamic appUrl from frontend (like invitation flow) or fall back to defaults
    const baseAppUrl = appUrl || 'https://app.xyreg.com';
    const finalRedirectUrl = redirectUrl || `${baseAppUrl}/reset-password?source=email`;
    console.log("STEP 2: baseAppUrl:", baseAppUrl, "finalRedirectUrl:", finalRedirectUrl);

    // Generate recovery link using Supabase Admin API
    console.log("STEP 3: Calling generateLink...");
    let linkData, linkError;
    try {
      const result = await supabaseClient.auth.admin.generateLink({
        type: "recovery",
        email: email,
        options: {
          redirectTo: finalRedirectUrl,
        },
      });
      linkData = result.data;
      linkError = result.error;
      console.log("STEP 3 DONE: generateLink completed");
    } catch (e) {
      console.error("STEP 3 FAILED: generateLink threw:", String(e));
      throw e;
    }

    if (linkError) {
      console.error("STEP 3 ERROR: generateLink returned error:", JSON.stringify(linkError));
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists, a reset email has been sent." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let resetLink = linkData?.properties?.action_link;
    console.log("STEP 4: original resetLink:", resetLink);
    console.log("STEP 4: hashed_token:", linkData?.properties?.hashed_token);

    // Supabase generateLink ignores redirectTo if the URL isn't in the allowlist,
    // falling back to the Site URL. Fix this by replacing redirect_to in the link
    // with our desired dynamic URL.
    if (resetLink && finalRedirectUrl) {
      try {
        const linkUrl = new URL(resetLink);
        linkUrl.searchParams.set('redirect_to', finalRedirectUrl);
        resetLink = linkUrl.toString();
        console.log("STEP 4: fixed resetLink:", resetLink);
      } catch (e) {
        console.error("STEP 4: failed to fix redirect_to:", String(e));
      }
    }

    if (!resetLink) {
      console.error("STEP 4 ERROR: No action link in response. Full data:", JSON.stringify(linkData));
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists, a reset email has been sent." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email via Resend API
    console.log("STEP 5: Sending email via Resend to:", email);
    let emailResponse;
    try {
      emailResponse = await resend.emails.send({
        from: "Xyreg <noreply@xyreg.com>",
        to: [email],
        subject: "Reset Your Password - Xyreg",
        html: getResetPasswordEmailHtml(resetLink),
      });
      console.log("STEP 5 DONE: Resend response:", JSON.stringify(emailResponse));
    } catch (e) {
      console.error("STEP 5 FAILED: Resend threw:", String(e));
      throw e;
    }

    console.log("=== RESET PASSWORD EDGE FUNCTION COMPLETED SUCCESSFULLY ===");

    return new Response(
      JSON.stringify({ success: true, message: "Password reset email sent." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in reset password email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to send reset email" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
};

serve(handler);
