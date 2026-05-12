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
      kind,
      recipientEmail,
      recipientName,
      actorName,
      companyName,
      ccrId,
      ccrTitle,
      reason,
      actionUrl,
    } = await req.json();

    if (kind !== 'approved' && kind !== 'rejected') {
      throw new Error(`Unsupported kind: ${kind}`);
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const safeRecipientName = escapeHtml(recipientName || 'there');
    const safeActorName = escapeHtml(actorName || 'A teammate');
    const safeCompanyName = escapeHtml(companyName || 'the company');
    const safeCcrId = escapeHtml(ccrId || 'Change Control Request');
    const safeCcrTitle = escapeHtml(ccrTitle || 'Untitled change');
    const safeReason = escapeHtml(reason || '').replace(/\n/g, '<br />');
    const safeActionUrl = String(actionUrl || '#');

    const isApproved = kind === 'approved';
    const headerColor = isApproved ? '#10b981' : '#dc2626';
    const accentColor = isApproved ? '#10b981' : '#dc2626';
    const headerEmoji = isApproved ? '✓' : '✕';
    const headerTitle = isApproved
      ? 'Change Control Request Approved'
      : 'Change Control Request Rejected';
    const subject = isApproved
      ? `Approved: ${safeCcrId} — ${safeCcrTitle}`
      : `Rejected: ${safeCcrId} — ${safeCcrTitle}`;
    const introLine = isApproved
      ? `<strong>${safeActorName}</strong> approved this Change Control Request. All assigned reviewers have signed off and the Change Control Request is locked for implementation.`
      : `<strong>${safeActorName}</strong> rejected this Change Control Request. Please review the rationale below, revise, and resubmit.`;
    const reasonLabel = isApproved ? 'Approval note' : 'Rejection reason';
    const ctaLabel = isApproved
      ? 'Open Change Control Request'
      : 'Open & Revise Change Control Request';

    const payload = {
      from: 'noreply@xyreg.com',
      to: [recipientEmail],
      subject,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${headerTitle} — ${safeCcrId}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f8fafc; line-height: 1.6;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background: #ffffff; overflow: hidden; border: 1px solid #e2e8f0;">

                  <!-- Header -->
                  <tr>
                    <td style="background-color: ${headerColor}; padding: 36px 30px; text-align: center;">
                      <div style="color: #ffffff; font-size: 36px; line-height: 1; margin-bottom: 8px;">${headerEmoji}</div>
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">
                        ${headerTitle}
                      </h1>
                      <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0 0; font-size: 14px;">
                        ${safeCcrId} on ${safeCompanyName}
                      </p>
                    </td>
                  </tr>

                  <!-- Main content -->
                  <tr>
                    <td style="padding: 36px 30px;">
                      <p style="color: #1a202c; font-size: 16px; margin: 0 0 16px 0;">
                        Hi ${safeRecipientName},
                      </p>
                      <p style="color: #4a5568; font-size: 16px; margin: 0 0 24px 0; line-height: 1.7;">
                        ${introLine}
                      </p>

                      <!-- Change Control Request details card -->
                      <table role="presentation" style="width: 100%; background: #f7fafc; border-left: 4px solid ${accentColor}; margin: 24px 0;" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 18px 22px;">
                            <table role="presentation" style="width: 100%;">
                              <tr>
                                <td style="padding: 6px 0;">
                                  <strong style="color: #2d3748; font-size: 14px;">Change Control Request ID:</strong>
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
                            </table>
                          </td>
                        </tr>
                      </table>

                      ${
                        safeReason
                          ? `
                      <!-- Reason -->
                      <div style="margin: 24px 0;">
                        <p style="color: #2d3748; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">${reasonLabel}:</p>
                        <div style="color: #4a5568; font-size: 14px; padding: 14px 16px; background: #f8fafc; border: 1px solid #e2e8f0;">
                          ${safeReason}
                        </div>
                      </div>
                      `
                          : ''
                      }

                      <!-- CTA Button -->
                      <div style="text-align: center; margin: 32px 0;">
                        <a href="${safeActionUrl}"
                           style="background-color: ${accentColor};
                                  color: #ffffff;
                                  text-decoration: none;
                                  padding: 14px 36px;
                                  font-weight: 600;
                                  font-size: 16px;
                                  display: inline-block;">
                          ${ctaLabel}
                        </a>
                      </div>

                      <!-- Alternative link -->
                      <div style="text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                        <p style="color: #a0aec0; font-size: 13px; margin: 0 0 8px 0;">
                          Can't click the button? Copy and paste this link:
                        </p>
                        <a href="${safeActionUrl}" style="color: ${accentColor}; font-size: 13px; word-break: break-all; text-decoration: none;">
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
    console.error('Error in send-ccr-status-email function:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
