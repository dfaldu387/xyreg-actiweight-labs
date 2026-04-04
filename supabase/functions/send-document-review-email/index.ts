import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DocumentReadyEmailRequest {
  recipientEmail: string;
  recipientName: string;
  documentTitle: string;
  roleType: string;
  roleLabel: string;
  senderName: string;
  companyName: string;
  dueDate?: string;
  documentLink?: string;
  documentFileUrl?: string;
  documentFileName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Document ready email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      recipientEmail,
      recipientName,
      documentTitle,
      roleType,
      roleLabel,
      senderName,
      companyName,
      dueDate,
      documentLink,
      documentFileUrl,
      documentFileName
    }: DocumentReadyEmailRequest = await req.json();

    console.log("Processing document ready email for:", {
      recipientEmail,
      documentTitle,
      roleType
    });

    const dueDateText = dueDate ?
      `Due Date: ${new Date(dueDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}` :
      'No specific due date set';

    // Determine role-specific messaging
    const getRoleMessage = (roleType: string) => {
      switch (roleType) {
        case 'prepared_by':
          return 'Your document is ready for preparation. Please complete the document according to the requirements.';
        case 'reviewed_by':
          return 'Your document is ready for your attention. Please check the content and provide your feedback.';
        case 'approved_by':
          return 'Your document is ready for approval. Please check and approve the document if it meets all requirements.';
        default:
          return 'Your document is ready for your action. Please complete your assigned tasks.';
      }
    };

    const roleMessage = getRoleMessage(roleType);

    const emailResponse = await resend.emails.send({
      from: "noreply@xyreg.com",
      to: [recipientEmail],
      subject: `Your Document is Ready: ${documentTitle}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document Assignment: ${documentTitle}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: #f8fafc; line-height: 1.6;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); overflow: hidden;">
                  
                  <!-- Header with gradient -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                      <div style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px; display: inline-block;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                          📄 Your Document is Ready
                        </h1>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Main content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="color: #1a202c; margin: 0 0 10px 0; font-size: 24px; font-weight: 600;">
                          Document Ready
                        </h2>
                        <p style="color: #718096; margin: 0; font-size: 16px;">
                          Your document is ready for your action
                        </p>
                      </div>
                      
                      
                      <!-- Main message -->
                      <div style="text-align: center; margin: 30px 0;">
                        <p style="color: #4a5568; font-size: 16px; margin: 0 0 25px 0; line-height: 1.7;">
                          Hello ${recipientName},
                        </p>
                        <p style="color: #4a5568; font-size: 16px; margin: 0 0 25px 0; line-height: 1.7;">
                          ${roleMessage}
                        </p>
                      </div>
                      
                      <!-- Document File Download Section -->
                      ${documentFileUrl ? `
                      <div style="background: #f0f9ff; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #0ea5e9;">
                        <h3 style="color: #0c4a6e; margin: 0 0 15px 0; font-size: 18px;">📄 Document File</h3>
                        <p style="color: #075985; font-size: 14px; margin: 0 0 15px 0;">
                          Click the button below to download the document file directly:
                        </p>
                        <div style="text-align: center; margin: 20px 0;">
                          <a href="${documentFileUrl}" 
                             style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); 
                                    color: #ffffff; 
                                    text-decoration: none; 
                                    padding: 12px 30px; 
                                    border-radius: 8px; 
                                    font-weight: 600; 
                                    font-size: 14px; 
                                    display: inline-block; 
                                    box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3);">
                            📥 Download ${documentFileName || 'Document'}
                          </a>
                        </div>
                        <p style="color: #64748b; font-size: 12px; margin: 15px 0 0 0; text-align: center;">
                          Direct file link: <a href="${documentFileUrl}" style="color: #0ea5e9; word-break: break-all;">${documentFileUrl}</a>
                        </p>
                      </div>
                      ` : ''}
                      
                      <!-- CTA Button -->
                      <div style="text-align: center; margin: 40px 0;">
                        <a href="${documentLink || '#'}" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: #ffffff; 
                                  text-decoration: none; 
                                  padding: 16px 40px; 
                                  border-radius: 50px; 
                                  font-weight: 600; 
                                  font-size: 16px; 
                                  display: inline-block; 
                                  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
                                  transition: all 0.3s ease;
                                  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);">
                          📋 Open Document
                        </a>
                      </div>
                      
                      <!-- Alternative link -->
                      ${documentLink ? `
                      <div style="text-align: center; margin-top: 30px; padding-top: 25px; border-top: 1px solid #e2e8f0;">
                        <p style="color: #a0aec0; font-size: 14px; margin: 0 0 10px 0;">
                          Can't click the button? Copy and paste this link:
                        </p>
                        <a href="${documentLink}" style="color: #667eea; font-size: 14px; word-break: break-all; text-decoration: none;">
                          ${documentLink}
                        </a>
                      </div>
                      ` : ''}
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                      <div style="margin-bottom: 20px;">
                        <img src="https://via.placeholder.com/120x40/667eea/ffffff?text=Xreg" alt="Xreg" style="height: 32px; width: auto;">
                      </div>
                      <p style="color: #a0aec0; font-size: 14px; margin: 0 0 10px 0;">
                        This document was sent by ${senderName} from ${companyName}
                      </p>
                      <p style="color: #cbd5e0; font-size: 12px; margin: 0;">
                        If you have any questions about this document, please contact ${senderName} or your system administrator.
                      </p>
                      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                        <p style="color: #cbd5e0; font-size: 12px; margin: 0;">
                          © 2025 Xreg. All rights reserved.
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
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
    console.error("Error in send-document-ready-email function:", error);
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
