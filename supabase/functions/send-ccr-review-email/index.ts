import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const escapeHtml = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      recipientEmail,
      recipientName,
      inviterName,
      companyName,
      ccrId,
      ccrTitle,
      perspectives,
      reason,
      actionUrl,
    } = await req.json();

    const RESEND_API_KEY = 're_QWBM83YN_NxPhjZwYFzyzwQBPYHwEnK4L';

    const safeRecipientName = escapeHtml(recipientName || 'there');
    const safeInviterName = escapeHtml(inviterName || 'A teammate');
    const safeCompanyName = escapeHtml(companyName || 'the company');
    const safeCcrId = escapeHtml(ccrId || 'CCR');
    const safeCcrTitle = escapeHtml(ccrTitle || 'Untitled change');
    const safePerspectives = Array.isArray(perspectives)
      ? perspectives.map((p: string) => escapeHtml(p)).join(', ')
      : escapeHtml(perspectives || '');
    const safeReason = escapeHtml(reason || '').replace(/\n/g, '<br />');
    const safeActionUrl = String(actionUrl || '#');

    const payload = {
      from: 'noreply@xyreg.com',
      to: [recipientEmail],
      subject: `Review requested: ${safeCcrId} — ${safeCcrTitle}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Review requested for ${safeCcrId}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f8fafc; line-height: 1.6;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background: #ffffff; overflow: hidden; border: 1px solid #e2e8f0;">

                  <!-- Header -->
                  <tr>
                    <td style="background-color: #0f172a; padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">
                        Review Requested
                      </h1>
                      <p style="color: #cbd5e0; margin: 8px 0 0 0; font-size: 14px;">
                        ${safeCcrId} on ${safeCompanyName}
                      </p>
                    </td>
                  </tr>

                  <!-- Main content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="color: #1a202c; font-size: 16px; margin: 0 0 16px 0;">
                        Hi ${safeRecipientName},
                      </p>
                      <p style="color: #4a5568; font-size: 16px; margin: 0 0 24px 0; line-height: 1.7;">
                        <strong>${safeInviterName}</strong> has assigned you as a reviewer on a Change Control Request and is asking you to sign off as <strong>${safePerspectives}</strong>.
                      </p>

                      <!-- CCR details card -->
                      <table role="presentation" style="width: 100%; background: #f7fafc; border-left: 4px solid #0f172a; margin: 24px 0;" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 20px 25px;">
                            <table role="presentation" style="width: 100%;">
                              <tr>
                                <td style="padding: 6px 0;">
                                  <strong style="color: #2d3748; font-size: 14px;">CCR ID:</strong>
                                  <span style="color: #4a5568; font-size: 14px; padding-left: 10px;">${safeCcrId}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 6px 0;">
                                  <strong style="color: #2d3748; font-size: 14px;">Title:</strong>
                                  <span style="color: #4a5568; font-size: 14px; padding-left: 10px;">${safeCcrTitle}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 6px 0;">
                                  <strong style="color: #2d3748; font-size: 14px;">Company:</strong>
                                  <span style="color: #4a5568; font-size: 14px; padding-left: 10px;">${safeCompanyName}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 6px 0;">
                                  <strong style="color: #2d3748; font-size: 14px;">Your perspectives:</strong>
                                  <span style="background: #e6fffa; color: #285e61; padding: 4px 8px; font-size: 12px; font-weight: 600; margin-left: 10px;">${safePerspectives}</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      ${
                        safeReason
                          ? `
                      <!-- Reason -->
                      <div style="margin: 24px 0;">
                        <p style="color: #2d3748; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">Reason from ${safeInviterName}:</p>
                        <div style="color: #4a5568; font-size: 14px; padding: 14px 16px; background: #f8fafc; border: 1px solid #e2e8f0;">
                          ${safeReason}
                        </div>
                      </div>
                      `
                          : ''
                      }

                      <!-- CTA Button -->
                      <div style="text-align: center; margin: 36px 0;">
                        <a href="${safeActionUrl}"
                           style="background-color: #0f172a;
                                  color: #ffffff;
                                  text-decoration: none;
                                  padding: 14px 36px;
                                  font-weight: 600;
                                  font-size: 16px;
                                  display: inline-block;">
                          Open CCR &amp; Sign Off
                        </a>
                      </div>

                      <!-- Alternative link -->
                      <div style="text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                        <p style="color: #a0aec0; font-size: 13px; margin: 0 0 8px 0;">
                          Can't click the button? Copy and paste this link:
                        </p>
                        <a href="${safeActionUrl}" style="color: #0f172a; font-size: 13px; word-break: break-all; text-decoration: none;">
                          ${safeActionUrl}
                        </a>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                      <p style="color: #0f172a; font-size: 18px; font-weight: 700; margin: 0 0 10px 0;">XYREG</p>
                      <p style="color: #a0aec0; font-size: 13px; margin: 0 0 8px 0;">
                        Audit-trailed under ISO 13485 §4.2.5
                      </p>
                      <p style="color: #cbd5e0; font-size: 12px; margin: 0;">
                        If you didn't expect this review request, please contact ${safeInviterName}.
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
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Resend API error: ${result.message || response.statusText}`);
    }

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in send-ccr-review-email function:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
