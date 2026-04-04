import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Email template for Helix OS Pilot Opportunity
function getHelixPilotEmail(firstName: string): { subject: string; html: string } {
  return {
    subject: "Update: Helix OS Launching Q2 2026",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #e0f2fe, #f0f9ff); padding: 40px; text-align: center; border-bottom: 1px solid #e2e8f0;">
          <img src="https://app.xyreg.com/asset/nav_bar-removebg-preview-logo.png" alt="XYREG" style="height: 40px; margin-bottom: 20px;" />
          <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 600;">
            Helix OS Pilot Opportunity
          </h1>
        </div>

        <!-- Body -->
        <div style="padding: 40px; background: #f8fafc;">
          <p style="color: #1e293b; font-size: 18px; line-height: 1.6; margin: 0 0 20px;">
            Hi ${firstName},
          </p>

          <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 20px;">
            As a founding member of Xyreg Genesis, we wanted to give you an update on our roadmap. Our full-scale lifecycle infrastructure, <strong>Helix OS</strong>, is officially scheduled for launch in <strong>Q2 2026</strong>.
          </p>

          <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">
            We are currently selecting a limited number of pilot customers to gain early access to the platform before the general release. If you would like to move your project from a business case into a full-scale validated operating system, please let us know.
          </p>

          <!-- Helix OS Feature Box -->
          <div style="background: linear-gradient(135deg, #134e4a, #0f766e); border-radius: 12px; padding: 25px; margin: 25px 0;">
            <h3 style="color: #5eead4; margin: 0 0 15px; font-size: 18px;">Helix OS - Coming Q2 2026</h3>
            <p style="color: #99f6e4; margin: 0; line-height: 1.6;">
              Transform your business case into a full-scale validated operating system. Be among the first to experience the next generation of medical device lifecycle management.
            </p>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="mailto:support@xyreg.com?subject=Helix%20OS%20Pilot%20Interest"
               style="display: inline-block; background: linear-gradient(135deg, #0d9488, #0891b2); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.4);">
              Express Interest in Pilot Program
            </a>
          </div>

          <!-- Sign off -->
          <p style="color: #475569; font-size: 16px; margin-top: 30px; line-height: 1.6;">
            Best regards,<br>
            <strong style="color: #0d9488;">The Xyreg Engineering Team</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="padding: 30px; background: #1e293b; text-align: center;">
          <p style="color: #94a3b8; margin: 0 0 10px; font-size: 14px;">
            XYREG - The OS for Medical Device Lifecycle
          </p>
          <div style="margin: 15px 0;">
            <a href="https://xyreg.com" style="color: #5eead4; text-decoration: none; margin: 0 10px; font-size: 13px;">Website</a>
            <a href="https://www.linkedin.com/company/xyreg" style="color: #5eead4; text-decoration: none; margin: 0 10px; font-size: 13px;">LinkedIn</a>
          </div>
          <p style="color: #64748b; margin: 15px 0 0; font-size: 12px;">
            © ${new Date().getFullYear()} XYREG. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };
}

// Email template for Genesis Account Expiration Warning
function getAccountExpirationEmail(firstName: string, expirationDate: string): { subject: string; html: string } {
  return {
    subject: "Action Required: Your 'Free for Life' access expires soon",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 40px; text-align: center;">
          <img src="https://app.xyreg.com/asset/nav_bar-removebg-preview-logo.png" alt="XYREG" style="height: 40px; margin-bottom: 20px; filter: brightness(0) invert(1);" />
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
            Action Required
          </h1>
        </div>

        <!-- Body -->
        <div style="padding: 40px; background: #f8fafc;">
          <p style="color: #1e293b; font-size: 18px; line-height: 1.6; margin: 0 0 20px;">
            Hi ${firstName},
          </p>

          <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 20px;">
            To maintain your <strong>Free for Life</strong> status on Xyreg Genesis, our "Use it or Lose it" policy requires a login at least once every 6 weeks.
          </p>

          <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">
            Our records show you haven't logged in recently. To keep your business cases and your lifetime marketplace access active, please log in before <strong>${expirationDate}</strong>.
          </p>

          <!-- Warning Box -->
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 25px; margin: 25px 0;">
            <h3 style="color: #dc2626; margin: 0 0 15px; font-size: 18px;">⚠️ What happens if you don't log in?</h3>
            <ul style="color: #991b1b; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Your Free for Life status will be revoked</li>
              <li>Your business cases may become inaccessible</li>
              <li>Your marketplace access will be deactivated</li>
            </ul>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="https://app.xyreg.com"
               style="display: inline-block; background: linear-gradient(135deg, #0d9488, #0891b2); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.4);">
              Log in to Xyreg Genesis
            </a>
          </div>

          <!-- Help Section -->
          <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin-top: 25px;">
            <p style="color: #475569; margin: 0; font-size: 14px; line-height: 1.6;">
              <strong>Having trouble logging in?</strong> Contact us at
              <a href="mailto:support@xyreg.com" style="color: #0d9488; text-decoration: none;">support@xyreg.com</a>
              and we'll help you regain access.
            </p>
          </div>

          <!-- Sign off -->
          <p style="color: #475569; font-size: 16px; margin-top: 30px; line-height: 1.6;">
            Best regards,<br>
            <strong style="color: #0d9488;">The XYREG Team</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="padding: 30px; background: #1e293b; text-align: center;">
          <p style="color: #94a3b8; margin: 0 0 10px; font-size: 14px;">
            XYREG - The OS for Medical Device Lifecycle
          </p>
          <div style="margin: 15px 0;">
            <a href="https://xyreg.com" style="color: #5eead4; text-decoration: none; margin: 0 10px; font-size: 13px;">Website</a>
            <a href="https://www.linkedin.com/company/xyreg" style="color: #5eead4; text-decoration: none; margin: 0 10px; font-size: 13px;">LinkedIn</a>
          </div>
          <p style="color: #64748b; margin: 15px 0 0; font-size: 12px;">
            © ${new Date().getFullYear()} XYREG. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };
}

// Original welcome email template
function getWelcomeEmail(
  firstName: string,
  lastName: string | undefined,
  companyName: string | undefined,
  planTier: string | undefined
): { subject: string; html: string } {
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;
  const isGenesis = planTier === 'genesis';

  const planBadge = isGenesis
    ? `<span style="background: linear-gradient(135deg, #0d9488, #0891b2); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">GENESIS 500</span>`
    : planTier === 'core'
      ? `<span style="background: #3b82f6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">CORE</span>`
      : `<span style="background: #8b5cf6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">ENTERPRISE</span>`;

  const genesisMessage = isGenesis ? `
    <div style="background: linear-gradient(135deg, #134e4a, #0f766e); border-radius: 12px; padding: 25px; margin: 25px 0;">
      <h3 style="color: #5eead4; margin: 0 0 15px; font-size: 18px;">You're Part of Something Special</h3>
      <p style="color: #99f6e4; margin: 0; line-height: 1.6;">
        As a Genesis 500 member, you're among the first 500 companies to join XYREG.
        Your feedback will directly shape the future of our platform. We're building this together.
      </p>
    </div>
  ` : '';

  return {
    subject: isGenesis
      ? `Welcome to the Genesis 500, ${firstName}!`
      : `Welcome to XYREG, ${firstName}!`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #e0f2fe, #f0f9ff); padding: 40px; text-align: center; border-bottom: 1px solid #e2e8f0;">
          <img src="https://app.xyreg.com/asset/nav_bar-removebg-preview-logo.png" alt="XYREG" style="height: 40px; margin-bottom: 20px;" />
          <h1 style="color: #0f172a; margin: 0; font-size: 28px; font-weight: 600;">
            Welcome to XYREG!
          </h1>
          <div style="margin-top: 15px;">
            ${planBadge}
          </div>
        </div>

        <!-- Body -->
        <div style="padding: 40px; background: #f8fafc;">
          <p style="color: #1e293b; font-size: 18px; line-height: 1.6; margin: 0 0 20px;">
            Hi ${fullName},
          </p>

          <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 20px;">
            Thank you for joining XYREG! We're thrilled to have you on board. Your account has been created
            ${companyName ? `and your company <strong>"${companyName}"</strong> is all set up` : ''}.
          </p>

          <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">
            XYREG is designed to be the operating system for your medical device lifecycle - from initial
            concept through regulatory approval and beyond. We're here to make compliance simpler,
            collaboration seamless, and your path to market clearer.
          </p>

          ${genesisMessage}

          <!-- What's Next Section -->
          <div style="background: white; border-radius: 12px; padding: 25px; margin: 25px 0; border: 1px solid #e2e8f0;">
            <h3 style="color: #1e293b; margin: 0 0 20px; font-size: 18px;">Getting Started</h3>

            <div style="margin-bottom: 15px; display: flex; align-items: flex-start;">
              <div style="background: #0d9488; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 12px; flex-shrink: 0;">1</div>
              <div>
                <strong style="color: #1e293b;">Verify your email</strong>
                <p style="color: #64748b; margin: 5px 0 0; font-size: 14px;">Check your inbox for a verification link to activate your account.</p>
              </div>
            </div>

            <div style="margin-bottom: 15px; display: flex; align-items: flex-start;">
              <div style="background: #0d9488; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 12px; flex-shrink: 0;">2</div>
              <div>
                <strong style="color: #1e293b;">Complete your company profile</strong>
                <p style="color: #64748b; margin: 5px 0 0; font-size: 14px;">Add your team members and set up your regulatory preferences.</p>
              </div>
            </div>

            <div style="display: flex; align-items: flex-start;">
              <div style="background: #0d9488; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 12px; flex-shrink: 0;">3</div>
              <div>
                <strong style="color: #1e293b;">Create your first device project</strong>
                <p style="color: #64748b; margin: 5px 0 0; font-size: 14px;">Start tracking your device through its regulatory journey.</p>
              </div>
            </div>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="https://app.xyreg.com"
               style="display: inline-block; background: linear-gradient(135deg, #0d9488, #0891b2); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.4);">
              Go to Your Dashboard
            </a>
          </div>

          <!-- Help Section -->
          <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin-top: 25px;">
            <p style="color: #475569; margin: 0; font-size: 14px; line-height: 1.6;">
              <strong>Need help?</strong> Our team is here for you. Simply reply to this email or reach out at
              <a href="mailto:support@xyreg.com" style="color: #0d9488; text-decoration: none;">support@xyreg.com</a>.
              We typically respond within 24 hours.
            </p>
          </div>

          <!-- Sign off -->
          <p style="color: #475569; font-size: 16px; margin-top: 30px; line-height: 1.6;">
            We're excited to be part of your journey,<br>
            <strong style="color: #0d9488;">The XYREG Team</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="padding: 30px; background: #1e293b; text-align: center;">
          <p style="color: #94a3b8; margin: 0 0 10px; font-size: 14px;">
            XYREG - The OS for Medical Device Lifecycle
          </p>
          <div style="margin: 15px 0;">
            <a href="https://xyreg.com" style="color: #5eead4; text-decoration: none; margin: 0 10px; font-size: 13px;">Website</a>
            <a href="https://www.linkedin.com/company/xyreg" style="color: #5eead4; text-decoration: none; margin: 0 10px; font-size: 13px;">LinkedIn</a>
          </div>
          <p style="color: #64748b; margin: 15px 0 0; font-size: 12px;">
            © ${new Date().getFullYear()} XYREG. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      email,
      firstName,
      lastName,
      companyName,
      planTier,
      emailType = 'welcome', // 'welcome' | 'helix-pilot' | 'account-expiration'
      expirationDate // Required for account-expiration email
    } = await req.json();

    if (!email || !firstName) {
      return new Response(
        JSON.stringify({ success: false, message: "Email and first name are required" }),
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

    // Get the appropriate email template based on emailType
    let emailContent: { subject: string; html: string };
    let fromAddress = "XYREG <support@xyreg.com>";

    switch (emailType) {
      case 'helix-pilot':
        emailContent = getHelixPilotEmail(firstName);
        fromAddress = "XYREG Engineering <support@xyreg.com>";
        break;

      case 'account-expiration':
        if (!expirationDate) {
          return new Response(
            JSON.stringify({ success: false, message: "Expiration date is required for account-expiration emails" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
        emailContent = getAccountExpirationEmail(firstName, expirationDate);
        fromAddress = "XYREG <noreply@xyreg.com>";
        break;

      case 'welcome':
      default:
        emailContent = getWelcomeEmail(firstName, lastName, companyName, planTier);
        break;
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        bcc: ["info@xybel.com", "arnar.kristjansson@xybel.com", "dfaldu387@gmail.com", "ravisanchala190@gmail.com"],
        reply_to: "info@xybel.com",
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      return new Response(
        JSON.stringify({ success: false, message: `Failed to send ${emailType} email` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log(`${emailType} email sent to ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: `${emailType} email sent successfully` }),
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
