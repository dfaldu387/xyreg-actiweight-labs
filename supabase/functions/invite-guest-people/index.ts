import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create admin client for user management
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};


const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    // Parse request body once
    const { email, role, product_id } = await req.json();
    
    // Generate a random password with only letters and 7 characters
    const letters = 'abcdefghijklm@#$%^&nopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let password = '';
    for (let i = 0; i < 7; i++) {
      password += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    // Validate required fields
    if (!email || !role || !product_id) {
      return new Response(JSON.stringify({ error: "Email, role, and product_id are required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        role: role,
        requires_password_change: true
      }
    });

    if (authError) {
      console.error("Error inviting guest people:", authError);
      return new Response(JSON.stringify({
        error: authError.message
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }

    if (!authData.user) {
      console.error("No user data returned from signup");
      return new Response(JSON.stringify({
        error: "Failed to create user account"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      });
    }


    // Create product user access record
    const { data: accessData, error: accessError } = await supabaseAdmin
      .from('product_user_access')
      .insert({
        product_id: product_id,
        user_id: authData.user.id,
        user_type: role,
        role_name: role,
        access_level: 'read', // Default access level
        is_active: true,
        invited_by: authData.user.id, // You might want to get this from the request
        permissions: {}
      })
      .select()
      .single();

    if (accessError) {
      console.error("Error creating product user access:", accessError);
      return new Response(JSON.stringify({
        error: "Failed to create product access record",
        details: accessError.message
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      });
    }

    const emailResponse = await resend.emails.send({
      from: "noreply@xyreg.com",
      to: [email],
      subject: "Welcome to XYREG",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to XYREG</title>
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
                          Welcome to XYREG
                        </h1>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Main content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="color: #1a202c; margin: 0 0 10px 0; font-size: 24px; font-weight: 600;">
                          Welcome to XYREG
                        </h2>
                        <p style="color: #718096; margin: 0; font-size: 16px;">
                          Thank you for signing up for XYREG.
                        </p>
                      </div>
                      
                      
                      <!-- Main message -->
                      <div style="text-align: center; margin: 30px 0;">
                        <p style="color: #4a5568; font-size: 16px; margin: 0 0 25px 0; line-height: 1.7;">
                          Hello,
                        </p>
                      </div>
                      <p style="color: #4a5568; font-size: 16px; margin: 0 0 25px 0; line-height: 1.7;">
                        Thank you for signing up for XYREG. 
                        <br>
                        Your Role is: <strong>${role}</strong>
                        <br>
                        Your Email is: <strong>${email}</strong>
                        <br>
                        Please use this password to sign in to your account.
                        <br>
                        Your password is: <strong>${password}</strong>
                        <br>
                        Thank you for using XYREG.
                      </p>
                  </td>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    });

    if (emailResponse.error) {
      console.error("Error sending email:", emailResponse.error);
      return new Response(JSON.stringify({
        error: "Failed to send invitation email",
        details: emailResponse.error
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    return new Response(JSON.stringify({
      message: "Guest people invited successfully",
      data: {
        email: email,
        role: role,
        userId: authData.user.id,
        productId: product_id,
        accessId: accessData.id,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
  }
  catch (error) {
    console.error("Error inviting guest people:", error);
    return new Response(JSON.stringify({
      error: "Failed to invite guest people",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
};

// Serve the handler
serve(handler);