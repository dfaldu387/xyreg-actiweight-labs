import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "info@xyreg.com";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, email, company, reason } = await req.json();

    // Validate required fields
    if (!name || !email || !company || !reason) {
      return new Response(
        JSON.stringify({ success: false, message: "All fields are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email already has a pending request
    const { data: existingRequest } = await supabase
      .from("whx_access_requests")
      .select("id, status")
      .eq("email", email.toLowerCase())
      .eq("status", "pending")
      .single();

    if (existingRequest) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "You already have a pending access request. We'll review it soon!",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert the request
    const { error: insertError } = await supabase.from("whx_access_requests").insert({
      name,
      email: email.toLowerCase(),
      company,
      reason,
      status: "pending",
    });

    if (insertError) {
      console.error("Error inserting request:", insertError);
      throw new Error("Failed to submit request");
    }

    // Send notification email to admin using Resend
    if (RESEND_API_KEY) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "XYREG Notifications <notifications@xyreg.com>",
            to: [ADMIN_EMAIL],
            subject: `[WHX] New Genesis Access Request from ${company}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #0d9488, #0891b2); padding: 30px; text-align: center;">
                  <h1 style="color: white; margin: 0;">New Access Request</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">WHX Event - Genesis 500</p>
                </div>

                <div style="padding: 30px; background: #f8fafc;">
                  <h2 style="color: #1e293b; margin-top: 0;">Request Details</h2>

                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #64748b;">Name</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${name}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #64748b;">Email</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b;">
                        <a href="mailto:${email}" style="color: #0d9488;">${email}</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #64748b;">Company</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${company}</td>
                    </tr>
                  </table>

                  <div style="margin-top: 20px; padding: 20px; background: white; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <h3 style="color: #1e293b; margin-top: 0;">Why they need access:</h3>
                    <p style="color: #475569; line-height: 1.6; margin: 0;">${reason}</p>
                  </div>

                  <div style="margin-top: 30px; text-align: center;">
                    <a href="https://app.xyreg.com/super-admin/app/whx-codes"
                       style="display: inline-block; background: #0d9488; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                      Review in Admin Panel
                    </a>
                  </div>
                </div>

                <div style="padding: 20px; background: #1e293b; text-align: center;">
                  <p style="color: #94a3b8; margin: 0; font-size: 14px;">
                    XYREG - The OS for Medical Device Lifecycle
                  </p>
                </div>
              </div>
            `,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          console.error("Resend API error:", errorData);
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Your request has been submitted. We'll review it and get back to you within 24-48 hours.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ success: false, message: "An error occurred. Please try again." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
