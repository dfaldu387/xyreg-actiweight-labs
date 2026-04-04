import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { recipientEmail, inviterName, companyName, accessLevel, invitationLink } = await req.json();
    const RESEND_API_KEY = 're_QWBM83YN_NxPhjZwYFzyzwQBPYHwEnK4L';
    
    const payload = {
      from: 'noreply@xyreg.com',
      to: [recipientEmail],
      subject: `🎉 You're invited to join ${companyName} on Xreg`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitation to ${companyName}</title>
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
                          🎉 You're Invited!
                        </h1>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Main content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="color: #1a202c; margin: 0 0 10px 0; font-size: 24px; font-weight: 600;">
                          Join ${companyName}
                        </h2>
                        <p style="color: #718096; margin: 0; font-size: 16px;">
                          You've been invited to collaborate on Xreg
                        </p>
                      </div>
                      
                      <!-- Invitation details card -->
                      <div style="background: #f7fafc; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #667eea;">
                        <table role="presentation" style="width: 100%;">
                          <tr>
                            <td style="padding: 8px 0;">
                              <strong style="color: #2d3748; font-size: 14px;">Invited by:</strong>
                              <span style="color: #4a5568; font-size: 14px; margin-left: 10px;">${inviterName}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <strong style="color: #2d3748; font-size: 14px;">Company:</strong>
                              <span style="color: #4a5568; font-size: 14px; margin-left: 10px;">${companyName}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <strong style="color: #2d3748; font-size: 14px;">Access Level:</strong>
                              <span style="background: #e6fffa; color: #285e61; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; margin-left: 10px;">${accessLevel}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <strong style="color: #2d3748; font-size: 14px;">Recipient:</strong>
                              <span style="color: #4a5568; font-size: 14px; margin-left: 10px;">${recipientEmail}</span>
                            </td>
                          </tr>
                        </table>
                      </div>
                      
                      <!-- Main message -->
                      <div style="text-align: center; margin: 30px 0;">
                        <p style="color: #4a5568; font-size: 16px; margin: 0 0 25px 0; line-height: 1.7;">
                          ${inviterName} has invited you to join <strong>${companyName}</strong> on Xreg. 
                          You'll have <strong>${accessLevel}</strong> access to collaborate with the team.
                        </p>
                      </div>
                      
                      <!-- CTA Button -->
                      <div style="text-align: center; margin: 40px 0;">
                        <a href="${invitationLink}" 
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
                          ✨ Accept Invitation
                        </a>
                      </div>
                      
                      <!-- Alternative link -->
                      <div style="text-align: center; margin-top: 30px; padding-top: 25px; border-top: 1px solid #e2e8f0;">
                        <p style="color: #a0aec0; font-size: 14px; margin: 0 0 10px 0;">
                          Can't click the button? Copy and paste this link:
                        </p>
                        <a href="${invitationLink}" style="color: #667eea; font-size: 14px; word-break: break-all; text-decoration: none;">
                          ${invitationLink}
                        </a>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                      <div style="margin-bottom: 20px;">
                        <img src="https://via.placeholder.com/120x40/667eea/ffffff?text=Xreg" alt="Xreg" style="height: 32px; width: auto;">
                      </div>
                      <p style="color: #a0aec0; font-size: 14px; margin: 0 0 10px 0;">
                        This invitation was sent by ${inviterName} from ${companyName}
                      </p>
                      <p style="color: #cbd5e0; font-size: 12px; margin: 0;">
                        If you didn't expect this invitation, you can safely ignore this email.
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
      `
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Resend API error: ${result.message || response.statusText}`);
    }

    return new Response(JSON.stringify({
      success: true,
      messageId: result.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Error in send-email function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});