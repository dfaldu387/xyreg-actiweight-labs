import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReviewerAssignmentEmailRequest {
  reviewerEmail: string;
  reviewerName: string;
  documentName: string;
  reviewerGroupName: string;
  companyName: string;
  dueDate?: string;
  senderName: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Reviewer assignment email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      reviewerEmail, 
      reviewerName, 
      documentName, 
      reviewerGroupName, 
      companyName, 
      dueDate, 
      senderName 
    }: ReviewerAssignmentEmailRequest = await req.json();

    console.log("Processing email for:", { reviewerEmail, documentName, reviewerGroupName });

    const dueDateText = dueDate ? 
      `Due Date: ${new Date(dueDate).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}` : 
      'No specific due date set';

    const emailResponse = await resend.emails.send({
      from: "noreply@xyreg.com",
      to: [reviewerEmail],
      subject: `Document Review Assignment: ${documentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #1f2937; margin-bottom: 20px; font-size: 24px;">Document Review Assignment</h1>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
              Hello ${reviewerName},
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
              You have been assigned a document for review as part of the <strong>${reviewerGroupName}</strong> reviewer group at <strong>${companyName}</strong>.
            </p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Document Details:</h3>
              <p style="margin: 5px 0; color: #374151;"><strong>Document Name:</strong> ${documentName}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>Reviewer Group:</strong> ${reviewerGroupName}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>Company:</strong> ${companyName}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>${dueDateText}</strong></p>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
              Please log in to the document management system to access the document and begin your review process.
            </p>
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
                This assignment was initiated by <strong>${senderName}</strong>. If you have any questions about this review assignment, please contact them directly or reach out to your system administrator.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-reviewer-assignment-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);