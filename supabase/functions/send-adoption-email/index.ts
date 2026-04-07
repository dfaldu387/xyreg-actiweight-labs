import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, companyName, releaseVersion, adoptedAt, preferredDate, preferredTimeStart, preferredTimeEnd } = await req.json();

    if (!to || !Array.isArray(to) || to.length === 0) {
      return new Response(JSON.stringify({ error: "No recipients" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formattedDate = new Date(adoptedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }) + " UTC";

    function formatTime12h(time: string): string {
      const [h, m] = time.split(":").map(Number);
      const suffix = h >= 12 ? "PM" : "AM";
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${hour12}:${m.toString().padStart(2, "0")} ${suffix}`;
    }

    let preferredWindow = "";
    if (preferredDate) {
      const dateStr = new Date(preferredDate + "T00:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (preferredTimeStart && preferredTimeEnd) {
        preferredWindow = `${dateStr}, ${formatTime12h(preferredTimeStart)} – ${formatTime12h(preferredTimeEnd)}`;
      } else {
        preferredWindow = dateStr;
      }
    }

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #e0f2fe, #f0f9ff); padding: 32px; text-align: center; border-bottom: 1px solid #e2e8f0;">
          <img src="https://app.xyreg.com/asset/nav_bar-removebg-preview-logo.png" alt="XYREG" style="height: 36px; margin-bottom: 16px;" />
          <h1 style="color: #0f172a; margin: 0; font-size: 22px; font-weight: 600;">
            Version Adoption Notification
          </h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
            A company has adopted a new XYREG release:
          </p>
          <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 16px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #64748b; font-size: 14px; padding: 6px 0;">Company</td>
                <td style="color: #0f172a; font-size: 14px; font-weight: 600; padding: 6px 0; text-align: right;">${companyName}</td>
              </tr>
              <tr>
                <td style="color: #64748b; font-size: 14px; padding: 6px 0;">Version</td>
                <td style="color: #0f172a; font-size: 14px; font-weight: 600; padding: 6px 0; text-align: right;">v${releaseVersion}</td>
              </tr>
              <tr>
                <td style="color: #64748b; font-size: 14px; padding: 6px 0;">Adopted At</td>
                <td style="color: #0f172a; font-size: 14px; padding: 6px 0; text-align: right;">${formattedDate}</td>
              </tr>
              ${preferredWindow ? `<tr>
                <td style="color: #64748b; font-size: 14px; padding: 6px 0;">Preferred Update Window</td>
                <td style="color: #0d9488; font-size: 14px; font-weight: 600; padding: 6px 0; text-align: right;">${preferredWindow}</td>
              </tr>` : ""}
            </table>
          </div>
          <div style="text-align: center; margin: 28px 0;">
            <a href="https://staging-xyreg.vercel.app/super-admin/app/releases"
               style="display: inline-block; background: linear-gradient(135deg, #0d9488, #0891b2); color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
              View in Admin Dashboard
            </a>
          </div>
          <p style="color: #475569; font-size: 14px; margin-top: 24px; line-height: 1.6;">
            Best regards,<br>
            <strong style="color: #0d9488;">XYREG Platform</strong>
          </p>
        </div>
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            This is an automated notification from XYREG. You received this because your email is configured for adoption alerts.
          </p>
        </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "XYREG <noreply@xyreg.com>",
        to,
        subject: preferredWindow
          ? `${companyName} adopted XYREG v${releaseVersion} — Update requested: ${preferredWindow}`
          : `${companyName} adopted XYREG v${releaseVersion}`,
        html,
      }),
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: res.ok ? 200 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
