import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface Recipient {
  email: string;
  name: string;
  accessCode?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { recipients, subject, message } = await req.json();

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "At least one recipient is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!subject || !message) {
      return new Response(
        JSON.stringify({ success: false, message: "Subject and message are required" }),
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

    // Convert plain text message to HTML paragraphs
    const messageHtml = message
      .split("\n")
      .map((line: string) =>
        line.trim()
          ? `<p style="color: #334155; font-size: 15px; line-height: 1.8; margin: 0 0 14px;">${line}</p>`
          : '<div style="height: 10px;"></div>'
      )
      .join("\n");

    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const recipient of recipients as Recipient[]) {
      try {
        // Build access code block if code exists
        const accessCodeBlock = recipient.accessCode
          ? `
            <div style="margin: 28px 0; border-radius: 12px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #0d9488, #0891b2); padding: 20px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td>
                      <p style="color: rgba(255,255,255,0.85); font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px; font-weight: 600;">
                        Your Genesis Access Code
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 8px;">
                      <div style="background: rgba(0,0,0,0.2); border-radius: 8px; padding: 14px 20px; display: inline-block;">
                        <span style="color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: 4px; font-family: 'Courier New', monospace;">
                          ${recipient.accessCode}
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 8px 0 0;">
                        Use this code to activate your Genesis 500 account
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
            </div>
          `
          : '';

        // Build the activate button URL with code if available
        const activateUrl = recipient.accessCode
          ? `https://app.xyreg.com/register?code=${encodeURIComponent(recipient.accessCode)}&plan=genesis`
          : 'https://app.xyreg.com';

        const ctaLabel = recipient.accessCode ? 'Activate Your Account' : 'Go to XYREG';

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "XYREG <hello@xyreg.com>",
            to: [recipient.email],
            subject: subject,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 32px 16px;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">

                        <!-- Header -->
                        <tr>
                          <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 40px; border-radius: 16px 16px 0 0; text-align: center;">
                            <img src="https://app.xyreg.com/asset/nav_bar-removebg-preview-logo.png" alt="XYREG" style="height: 32px; filter: brightness(0) invert(1);" />
                            <div style="margin-top: 16px;">
                              <span style="display: inline-block; background: linear-gradient(135deg, #0d9488, #0891b2); color: white; padding: 5px 16px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">
                                Genesis 500
                              </span>
                            </div>
                          </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                          <td style="background: #ffffff; padding: 40px;">

                            <!-- Greeting -->
                            <p style="color: #0f172a; font-size: 20px; font-weight: 600; margin: 0 0 24px; line-height: 1.4;">
                              Hi ${recipient.name || 'there'},
                            </p>

                            <!-- Message content -->
                            ${messageHtml}

                            <!-- Access Code Block -->
                            ${accessCodeBlock}

                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 32px 0;">
                              <a href="${activateUrl}"
                                 style="display: inline-block; background: linear-gradient(135deg, #0d9488, #0891b2); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; letter-spacing: 0.3px;">
                                ${ctaLabel}
                              </a>
                            </div>

                            <!-- Divider -->
                            <div style="border-top: 1px solid #e2e8f0; margin: 32px 0 24px;"></div>

                            <!-- Sign off -->
                            <p style="color: #475569; font-size: 15px; margin: 0; line-height: 1.6;">
                              Best regards,
                            </p>
                            <p style="color: #0f172a; font-size: 15px; font-weight: 600; margin: 4px 0 0;">
                              The XYREG Team
                            </p>
                          </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                          <td style="background: #f8fafc; padding: 28px 40px; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="color: #64748b; margin: 0 0 6px; font-size: 13px; font-weight: 500;">
                              XYREG &mdash; The OS for Medical Device Lifecycle
                            </p>
                            <p style="color: #94a3b8; margin: 0 0 16px; font-size: 12px;">
                              Simplifying compliance. Accelerating innovation.
                            </p>
                            <div style="margin-bottom: 12px;">
                              <a href="https://xyreg.com" style="color: #0d9488; text-decoration: none; font-size: 12px; margin: 0 8px;">Website</a>
                              <span style="color: #cbd5e1;">|</span>
                              <a href="https://www.linkedin.com/company/xyreg" style="color: #0d9488; text-decoration: none; font-size: 12px; margin: 0 8px;">LinkedIn</a>
                              <span style="color: #cbd5e1;">|</span>
                              <a href="mailto:support@xyreg.com" style="color: #0d9488; text-decoration: none; font-size: 12px; margin: 0 8px;">Support</a>
                            </div>
                            <p style="color: #cbd5e1; margin: 0; font-size: 11px;">
                              &copy; ${new Date().getFullYear()} XYREG. All rights reserved.
                            </p>
                          </td>
                        </tr>

                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
            `,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          console.error(`Failed to send to ${recipient.email}:`, errorData);
          results.push({ email: recipient.email, success: false, error: "Send failed" });
        } else {
          results.push({ email: recipient.email, success: true });
        }
      } catch (err) {
        console.error(`Error sending to ${recipient.email}:`, err);
        results.push({ email: recipient.email, success: false, error: String(err) });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: failCount === 0,
        message: `Sent ${successCount}/${recipients.length} emails${failCount > 0 ? `. ${failCount} failed.` : ''}`,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending messages:", error);
    return new Response(
      JSON.stringify({ success: false, message: "An error occurred. Please try again." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
