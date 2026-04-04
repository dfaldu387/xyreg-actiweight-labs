import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, name, code } = await req.json();

    if (!email || !name || !code) {
      return new Response(
        JSON.stringify({ success: false, message: "Email, name, and code are required" }),
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

    const genesisUrl = `https://xyreg.com/genesis`;
    const appUrl = `https://app.xyreg.com/register?code=${encodeURIComponent(code)}&plan=genesis`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "XYREG <welcome@xyreg.com>",
        to: [email],
        subject: "Your XYREG Genesis Access Code is Here!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a;">
            <div style="background: linear-gradient(135deg, #0d9488, #0891b2); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to Genesis 500!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 15px 0 0; font-size: 18px;">
                You've been approved for the XYREG Genesis program
              </p>
            </div>

            <div style="padding: 40px; background: #1e293b;">
              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                Hi ${name},
              </p>

              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                Great news! Your request to join the Genesis 500 has been approved. You're now part of an exclusive group
                of MedTech innovators who will help shape the future of XYREG.
              </p>

              <div style="background: linear-gradient(135deg, #134e4a, #0f766e); border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
                <p style="color: #5eead4; margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">
                  Your Access Code
                </p>
                <div style="background: #0f172a; border-radius: 8px; padding: 20px; margin: 10px 0;">
                  <code style="color: #2dd4bf; font-size: 32px; font-weight: bold; letter-spacing: 4px;">
                    ${code}
                  </code>
                </div>
                <p style="color: #94a3b8; margin: 15px 0 0; font-size: 14px;">
                  This code is unique to you. Keep it safe!
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}"
                   style="display: inline-block; background: linear-gradient(135deg, #0d9488, #0891b2); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
                  Activate Your Genesis Account
                </a>
              </div>

              <div style="background: #0f172a; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <h3 style="color: #f1f5f9; margin: 0 0 15px;">What's included in Genesis:</h3>
                <ul style="color: #94a3b8; margin: 0; padding-left: 20px; line-height: 2;">
                  <li><span style="color: #2dd4bf;">✓</span> Zero subscription fees - Free for life</li>
                  <li><span style="color: #2dd4bf;">✓</span> Direct roadmap influence with our product team</li>
                  <li><span style="color: #2dd4bf;">✓</span> Priority regulatory sync and early access</li>
                  <li><span style="color: #2dd4bf;">✓</span> Unlimited users for your company</li>
                </ul>
              </div>

              <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
                If you have any questions, just reply to this email. We're here to help!
              </p>

              <p style="color: #cbd5e1; font-size: 16px; margin-top: 30px;">
                Welcome aboard,<br>
                <strong style="color: #2dd4bf;">The XYREG Team</strong>
              </p>
            </div>

            <div style="padding: 25px; background: #0f172a; text-align: center; border-top: 1px solid #334155;">
              <p style="color: #64748b; margin: 0; font-size: 14px;">
                XYREG - The OS for Medical Device Lifecycle
              </p>
              <p style="color: #475569; margin: 10px 0 0; font-size: 12px;">
                © 2025 XYREG. All rights reserved.
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      return new Response(
        JSON.stringify({ success: false, message: "Failed to send email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Access code email sent successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ success: false, message: "An error occurred. Please try again." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
