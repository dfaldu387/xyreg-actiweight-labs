import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  type: 'assignment' | 'state_change' | 'overdue' | 'closure' | 'action_due';
  capa_id: string;
  capa_number: string;
  recipient_id: string;
  recipient_email?: string;
  details?: {
    from_status?: string;
    to_status?: string;
    action_description?: string;
    due_date?: string;
    changed_by?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: NotificationPayload = await req.json();

    console.log("CAPA notification request:", payload);

    // Get recipient details if not provided
    let recipientEmail = payload.recipient_email;
    if (!recipientEmail && payload.recipient_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", payload.recipient_id)
        .maybeSingle();
      
      recipientEmail = profile?.email;
    }

    if (!recipientEmail) {
      console.log("No recipient email found, skipping notification");
      return new Response(
        JSON.stringify({ success: false, message: "No recipient email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build email content based on notification type
    let subject = "";
    let htmlContent = "";

    switch (payload.type) {
      case "assignment":
        subject = `[CAPA] You have been assigned to ${payload.capa_number}`;
        htmlContent = `
          <h2>CAPA Assignment Notification</h2>
          <p>You have been assigned to CAPA <strong>${payload.capa_number}</strong>.</p>
          <p>Please review and take appropriate action.</p>
        `;
        break;

      case "state_change":
        subject = `[CAPA] ${payload.capa_number} status changed to ${payload.details?.to_status}`;
        htmlContent = `
          <h2>CAPA Status Change</h2>
          <p>CAPA <strong>${payload.capa_number}</strong> has been moved from 
          <strong>${payload.details?.from_status}</strong> to 
          <strong>${payload.details?.to_status}</strong>.</p>
          ${payload.details?.changed_by ? `<p>Changed by: ${payload.details.changed_by}</p>` : ''}
        `;
        break;

      case "overdue":
        subject = `[CAPA] OVERDUE: ${payload.capa_number} requires attention`;
        htmlContent = `
          <h2>CAPA Overdue Alert</h2>
          <p>CAPA <strong>${payload.capa_number}</strong> is overdue and requires immediate attention.</p>
          <p>Target date was: ${payload.details?.due_date}</p>
        `;
        break;

      case "closure":
        subject = `[CAPA] ${payload.capa_number} has been closed`;
        htmlContent = `
          <h2>CAPA Closure Notification</h2>
          <p>CAPA <strong>${payload.capa_number}</strong> has been successfully closed.</p>
          ${payload.details?.changed_by ? `<p>Closed by: ${payload.details.changed_by}</p>` : ''}
        `;
        break;

      case "action_due":
        subject = `[CAPA] Action due for ${payload.capa_number}`;
        htmlContent = `
          <h2>CAPA Action Due</h2>
          <p>An action for CAPA <strong>${payload.capa_number}</strong> is due.</p>
          <p>Action: ${payload.details?.action_description}</p>
          <p>Due date: ${payload.details?.due_date}</p>
        `;
        break;

      default:
        subject = `[CAPA] Notification for ${payload.capa_number}`;
        htmlContent = `<p>CAPA ${payload.capa_number} requires your attention.</p>`;
    }

    // Send email if Resend API key is available
    if (resendApiKey) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "CAPA Notifications <notifications@xyreg.io>",
          to: [recipientEmail],
          subject,
          html: htmlContent,
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error("Failed to send email:", errorText);
      } else {
        console.log("Email sent successfully to:", recipientEmail);
      }
    } else {
      console.log("RESEND_API_KEY not configured, email notification skipped");
    }

    // Log notification in database for audit trail
    await supabase.from("notification_logs").insert({
      notification_type: `capa_${payload.type}`,
      recipient_id: payload.recipient_id,
      recipient_email: recipientEmail,
      subject,
      content: htmlContent,
      related_entity_type: "capa",
      related_entity_id: payload.capa_id,
    }).catch(err => {
      // notification_logs table may not exist, that's ok
      console.log("Could not log notification:", err.message);
    });

    return new Response(
      JSON.stringify({ success: true, message: "Notification processed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing CAPA notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
