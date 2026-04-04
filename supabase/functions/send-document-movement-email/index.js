import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client for database queries
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface DocumentMovementEmailRequest {
  companyId: string;
  documentName: string;
  fromStatus: string;
  toStatus: string;
  movedBy: string;
  reviewerGroupName?: string;
  productName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Document movement email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      companyId,
      documentName, 
      fromStatus,
      toStatus,
      movedBy,
      reviewerGroupName,
      productName
    }: DocumentMovementEmailRequest = await req.json();

    console.log("Processing document movement email for:", { 
      companyId, 
      documentName, 
      fromStatus, 
      toStatus 
    });

    // Fetch all users and filter for company admins
    const { data: allUsers, error: adminError } = await supabase
      .rpc('fetch_all_users_with_companies');

    if (adminError) {
      console.error('Error fetching users:', adminError);
      throw new Error('Failed to fetch company administrators');
    }

    // Filter for admins of the specific company
    const companyAdmins = allUsers?.filter((user: any) => {
      return user.companies?.some((company: any) => 
        company.company_id === companyId && company.access_level === 'admin'
      );
    }) || [];

    if (companyAdmins.length === 0) {
      console.log('No company administrators found for company:', companyId);
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No administrators to notify' 
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Fetch company name
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();

    if (companyError) {
      console.error('Error fetching company:', companyError);
    }

    const companyName = companyData?.name || 'Your Company';

    // Format status names for display
    const formatStatus = (status: string) => {
      return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const fromStatusFormatted = formatStatus(fromStatus);
    const toStatusFormatted = formatStatus(toStatus);

    // Determine status color for email styling
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'complete': return '#10b981'; // green
        case 'rejected': return '#ef4444'; // red
        case 'in_review': return '#f59e0b'; // orange
        case 'changes_requested': return '#eab308'; // yellow
        default: return '#6b7280'; // gray
      }
    };

    // Send email to each admin
    const emailPromises = companyAdmins.map(async (admin: any) => {
      const adminEmail = admin.email;
      const adminName = admin.first_name || 'Administrator';

      if (!adminEmail) {
        console.log('Admin without email found, skipping...');
        return null;
      }

      console.log('Sending email to admin:', adminEmail);

      return await resend.emails.send({
        from: "noreply@xyreg.com",
        to: [adminEmail],
        subject: `Document Status Update: ${documentName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #1f2937; margin-bottom: 20px; font-size: 24px;">Document Status Update</h1>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                Hello ${adminName},
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                A document has been moved in the review workflow at <strong>${companyName}</strong>.
              </p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Document Details:</h3>
                <p style="margin: 5px 0; color: #374151;"><strong>Document:</strong> ${documentName}</p>
                ${productName ? `<p style="margin: 5px 0; color: #374151;"><strong>Product:</strong> ${productName}</p>` : ''}
                ${reviewerGroupName ? `<p style="margin: 5px 0; color: #374151;"><strong>Reviewer Group:</strong> ${reviewerGroupName}</p>` : ''}
                <p style="margin: 5px 0; color: #374151;"><strong>Moved by:</strong> ${movedBy}</p>
              </div>

              <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${getStatusColor(toStatus)};">
                <h3 style="color: #1f2937; margin: 0 0 10px 0; font-size: 16px;">Status Change:</h3>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="background-color: #e5e7eb; color: #374151; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${fromStatusFormatted}</span>
                  <span style="color: #6b7280;">→</span>
                  <span style="background-color: ${getStatusColor(toStatus)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${toStatusFormatted}</span>
                </div>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                You can review the current status of all documents in your review dashboard.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  View Review Dashboard
                </a>
              </div>
              
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
                  This notification was automatically generated when a document was moved in the review workflow. 
                  If you have any questions about this change, please contact <strong>${movedBy}</strong> or your system administrator.
                </p>
              </div>
            </div>
          </div>
        `,
      });
    });

    // Wait for all emails to be sent
    const emailResults = await Promise.allSettled(emailPromises);
    
    // Count successful and failed emails
    const successfulEmails = emailResults.filter(result => 
      result.status === 'fulfilled' && result.value !== null
    ).length;
    
    const failedEmails = emailResults.filter(result => 
      result.status === 'rejected' || result.value === null
    ).length;

    console.log(`Email notification results: ${successfulEmails} sent, ${failedEmails} failed`);

    return new Response(JSON.stringify({ 
      success: true, 
      emailsSent: successfulEmails,
      emailsFailed: failedEmails
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-document-movement-email function:", error);
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