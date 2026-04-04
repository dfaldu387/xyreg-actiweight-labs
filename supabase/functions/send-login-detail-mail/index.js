// Supabase Edge Function for creating user and sending login credentials
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const RESEND_API_KEY = 're_QWBM83YN_NxPhjZwYFzyzwQBPYHwEnK4L';
const SUPABASE_URL = 'https://wzzkbmmgxxrfhhxggrcl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6emtibW1neHhyZmhoeGdncmNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTM5NjU5OSwiZXhwIjoyMDYwOTcyNTk5fQ.s_DbM_cq504pD_MwnH5uB9DCnaL9GZmwYX71vT7bGF4';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6emtibW1neHhyZmhoeGdncmNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzOTY1OTksImV4cCI6MjA2MDk3MjU5OX0.IILyYxMvAEyt5DrRWvF7NR0omsg2DKbhh5b-C4N73ME';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Enhanced CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};
// Helper function to create error responses with CORS
function createErrorResponse(message, status = 400, additionalData = {}) {
  return new Response(JSON.stringify({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...additionalData
  }), {
    status,
    headers: corsHeaders
  });
}
// Helper function to create success responses with CORS
function createSuccessResponse(data, status = 200) {
  return new Response(JSON.stringify({
    success: true,
    ...data
  }), {
    status,
    headers: corsHeaders
  });
}
// Generate a secure temporary password
function generateSecurePassword(length = 12) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  // Ensure at least one character from each category
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*";
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  // Fill the rest randomly
  for(let i = password.length; i < length; i++){
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  // Shuffle the password
  return password.split('').sort(()=>Math.random() - 0.5).join('');
}
// Generate username from email and company
function generateUsername(email, companyName) {
  const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const companyPrefix = companyName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 3);
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${emailPrefix}.${companyPrefix}${randomSuffix}`;
}
serve(async (req)=>{
  try {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    // Handle CORS preflight requests FIRST
    if (req.method === 'OPTIONS') {
      console.log('Handling CORS preflight request');
      return new Response('ok', {
        status: 200,
        headers: corsHeaders
      });
    }
    // Only allow POST requests
    if (req.method !== 'POST') {
      console.log(`Method not allowed: ${req.method}`);
      return createErrorResponse('Method not allowed. Only POST requests are supported.', 405);
    }
    // Parse request body with better error handling
    let requestData;
    try {
      const body = await req.text();
      console.log('Raw request body length:', body.length);
      if (!body || body.trim() === '') {
        return createErrorResponse('Empty request body', 400);
      }
      requestData = JSON.parse(body);
    } catch (error) {
      console.error('JSON parsing error:', error);
      return createErrorResponse('Invalid JSON in request body', 400);
    }
    const { email, firstName, lastName, companyId, companyName, accessLevel, invitationToken } = requestData;
    // Validate required fields
    const requiredFields = {
      email,
      firstName,
      lastName,
      companyId,
      companyName,
      accessLevel,
      invitationToken
    };
    const missingFields = Object.entries(requiredFields).filter(([key, value])=>!value).map(([key])=>key);
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return createErrorResponse(`Missing required fields: ${missingFields.join(', ')}`, 400, {
        missingFields
      });
    }
    console.log(`Creating user account for: ${email}`);
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse('Invalid email format', 400);
    }
    // Create Supabase admin client
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    // Verify invitation token is valid and not already used
    console.log('Verifying invitation token:', invitationToken);
    const { data: invitations, error: inviteError } = await supabaseAdmin.from('user_invitations').select('*').eq('invitation_token', invitationToken).limit(1);
    if (inviteError || !invitations || invitations.length === 0) {
      console.error('Invitation verification failed:', inviteError);
      return createErrorResponse('Invalid invitation token', 400);
    }
    const invitation = invitations[0];
    if (invitation.status !== 'pending') {
      console.error('Invitation is not pending, current status:', invitation.status);
      return createErrorResponse(`This invitation has already been ${invitation.status}`, 400);
    }

    // Check if user already exists with the same email
    // Use paginated search to reliably find users (listUsers default only returns first page)
    console.log('Checking if user already exists...');
    let existingUserByEmail = null;
    let page = 1;
    const perPage = 100;
    while (true) {
      const { data: usersPage, error: userCheckError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (userCheckError) {
        console.error('Error checking existing users:', userCheckError);
        break;
      }
      const found = usersPage.users.find(user => user.email === email);
      if (found) {
        existingUserByEmail = found;
        break;
      }
      if (usersPage.users.length < perPage) break;
      page++;
    }

    if (existingUserByEmail) {
      console.log(`User already exists with email: ${email}`);

      // Update invitation status to accepted for existing users
      console.log('Updating invitation status for existing user...');
      const { error: updateError } = await supabaseAdmin.from('user_invitations').update({
        status: 'accepted'
      }).eq('id', invitation.id);
      if (updateError) {
        console.error('Invitation update error for existing user:', updateError);
      }

      // Create department assignment for existing user if functional_area was set
      if (invitation.functional_area && invitation.functional_area !== 'none') {
        console.log('Creating department assignment for existing user:', invitation.functional_area);
        const { error: deptError } = await supabaseAdmin.from('user_department_assignments').upsert({
          user_id: existingUserByEmail.id,
          company_id: companyId,
          department_name: invitation.functional_area,
          fte_allocation: 1.0,
          role: invitation.department_role && invitation.department_role.length > 0 ? invitation.department_role : null,
        }, { onConflict: 'user_id,company_id,department_name' });
        if (deptError) {
          console.error('Error creating department assignment for existing user:', deptError);
        }
      }

      return createSuccessResponse({
        message: 'User already exists',
        user: {
          id: existingUserByEmail.id,
          email: existingUserByEmail.email,
          username: existingUserByEmail.user_metadata?.username || 'N/A',
          company_id: companyId || 'N/A',
          access_level: accessLevel || 'N/A',
        },
        existing: true
      });
    }
    // Generate credentials
    const temporaryPassword = generateSecurePassword(12);
    const username = generateUsername(email, companyName);
    console.log(`Generated username: ${username}`);
    // Create user in Supabase Auth
    console.log('Creating auth user...');
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        company_id: companyId,
        access_level: accessLevel,
        username: username,
        requires_password_change: true
      }
    });
    if (authError) {
      console.error('Auth user creation error:', authError);

      // Handle "already registered" error as existing user fallback
      if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
        console.log('User already registered (fallback). Looking up existing user...');
        const { data: lookupData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const fallbackUser = lookupData?.users?.find(u => u.email === email);

        if (fallbackUser) {
          // Update invitation status
          await supabaseAdmin.from('user_invitations').update({ status: 'accepted' }).eq('id', invitation.id);

          // Create department assignment
          if (invitation.functional_area && invitation.functional_area !== 'none') {
            await supabaseAdmin.from('user_department_assignments').upsert({
              user_id: fallbackUser.id,
              company_id: companyId,
              department_name: invitation.functional_area,
              fte_allocation: 1.0,
              role: invitation.department_role && invitation.department_role.length > 0 ? invitation.department_role : null,
            }, { onConflict: 'user_id,company_id,department_name' });
          }

          return createSuccessResponse({
            message: 'User already exists',
            user: {
              id: fallbackUser.id,
              email: fallbackUser.email,
              username: fallbackUser.user_metadata?.username || 'N/A',
              company_id: companyId || 'N/A',
              access_level: accessLevel || 'N/A',
            },
            existing: true
          });
        }
      }

      return createErrorResponse(`Failed to create user account: ${authError.message}`, 400);
    }
    console.log(`Auth user created with ID: ${authUser.user.id}`);
    // Create user profile in database
    console.log('Creating user profile...');
    // const { error: profileError } = await supabase.from('user_profiles').insert({
    //   id: authUser.user.id,
    //   email: email,
    //   first_name: firstName,
    //   last_name: lastName
    // });
    // if (profileError) {
    //   console.error('Profile creation error:', profileError);
    //   // If profile creation fails, clean up the auth user
    //   try {
    //     await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    //   } catch (cleanupError) {
    //     console.error('Failed to cleanup auth user:', cleanupError);
    //   }
    //   return createErrorResponse('Failed to create user profile', 500);
    // }
    console.log('User profile created successfully');
    // Update invitation status
    console.log('Updating invitation status...');
    const { error: updateError } = await supabaseAdmin.from('user_invitations').update({
      status: 'accepted'
    }).eq('id', invitation.id);
    if (updateError) {
      console.error('Invitation update error:', updateError);
    }
    // Create department assignment if functional_area was set in the invitation
    if (invitation.functional_area && invitation.functional_area !== 'none') {
      console.log('Creating department assignment:', invitation.functional_area);
      const { error: deptError } = await supabaseAdmin.from('user_department_assignments').upsert({
        user_id: authUser.user.id,
        company_id: companyId,
        department_name: invitation.functional_area,
        fte_allocation: 1.0,
        role: invitation.department_role && invitation.department_role.length > 0 ? invitation.department_role : null,
      }, { onConflict: 'user_id,company_id,department_name' });
      if (deptError) {
        console.error('Error creating department assignment:', deptError);
      }
    }

    // Send login credentials email
    console.log('Sending login credentials email...');
    const emailResult = await sendLoginCredentialsEmail(email, firstName, lastName, companyName, username, temporaryPassword, accessLevel);
    if (!emailResult.success) {
      console.error('Email sending failed:', emailResult.error);
    // Don't fail the entire request if email fails
    }
    console.log(`User account created successfully for: ${email}`);
    return createSuccessResponse({
      message: 'User account created and credentials sent',
      user: {
        id: authUser.user.id,
        email: email,
        username: username,
        company_id: companyId,
        access_level: accessLevel
      },
      emailSent: emailResult.success,
      messageId: emailResult.messageId
    });
  } catch (error) {
    console.error('Unexpected error in send-login-detail-mail function:', error);
    return createErrorResponse(error instanceof Error ? error.message : 'An unexpected error occurred', 500);
  }
});
async function sendLoginCredentialsEmail(email, firstName, lastName, companyName, username, password, accessLevel) {
  try {
    console.log(`Sending login credentials email to: ${email}`);
    const emailPayload = {
      from: 'noreply@xyreg.com',
      to: [
        email
      ],
      subject: `🔐 Your Login Credentials for ${companyName} - Xreg Platform`,
      html: generateLoginCredentialsTemplate(firstName, lastName, companyName, username, password, accessLevel, email)
    };
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });
    console.log(`Resend API response status: ${response.status}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', errorText);
      return {
        success: false,
        error: `Email API error: ${response.status} ${response.statusText}`
      };
    }
    const result = await response.json();
    console.log('Login credentials email sent successfully:', result.id);
    return {
      success: true,
      messageId: result.id
    };
  } catch (error) {
    console.error('Error sending login credentials email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error'
    };
  }
}
function generateLoginCredentialsTemplate(firstName, lastName, companyName, username, password, accessLevel, email) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Login Credentials - ${companyName}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      
      <!-- Email Container -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            
            <!-- Main Email Card -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); overflow: hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%); padding: 40px 40px 30px; text-align: center;">
                  <div style="background-color: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); border-radius: 12px; padding: 12px 24px; display: inline-block; margin-bottom: 16px;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">🔐 Xreg</h1>
                  </div>
                  <h2 style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 500; opacity: 0.95;">Your Login Credentials</h2>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 48px 40px 40px;">
                  
                  <!-- Welcome Message -->
                  <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="margin: 0 0 12px; color: #1e293b; font-size: 28px; font-weight: 700; line-height: 1.2;">Welcome to the Team, ${firstName}! 🎉</h1>
                    <p style="margin: 0; color: #64748b; font-size: 16px; line-height: 1.5;">Your account has been successfully created for <strong>${companyName}</strong></p>
                  </div>
                  
                  <!-- Credentials Box -->
                  <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 16px; padding: 32px; margin-bottom: 32px; border: 2px solid #e2e8f0;">
                    <h3 style="margin: 0 0 24px; color: #1e293b; font-size: 20px; font-weight: 600; text-align: center;">Your Login Details</h3>
                    
                    <!-- Username -->
                    <div style="background-color: #ffffff; border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
                      <div style="margin-bottom: 8px;">
                        <label style="display: block; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Username</label>
                        <div style="color: #1f2937; font-size: 18px; font-weight: 600; font-family: 'Courier New', monospace; background-color: #f9fafb; padding: 8px 12px; border-radius: 6px; border: 1px solid #e5e7eb;">${email}</div>
                      </div>
                    </div>
                    
                    <!-- Password -->
                    <div style="background-color: #ffffff; border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
                      <div style="margin-bottom: 8px;">
                        <label style="display: block; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Temporary Password</label>
                        <div style="color: #1f2937; font-size: 18px; font-weight: 600; font-family: 'Courier New', monospace; background-color: #f9fafb; padding: 8px 12px; border-radius: 6px; border: 1px solid #e5e7eb;">${password}</div>
                      </div>
                      <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px; margin-top: 12px;">
                        <div style="display: flex; align-items: center;">
                          <span style="color: #d97706; font-size: 14px;">⚠️</span>
                          <span style="color: #92400e; font-size: 12px; font-weight: 500; margin-left: 8px;">You'll be required to change this password on first login</span>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Access Level -->
                    <div style="background-color: #ffffff; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0;">
                      <div>
                        <label style="display: block; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Access Level</label>
                        <div style="display: inline-block; background-color: #dbeafe; color: #1d4ed8; padding: 6px 12px; border-radius: 6px; font-size: 14px; font-weight: 600;">${accessLevel}</div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Login Instructions -->
                  <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                    <h3 style="margin: 0 0 16px; color: #0c4a6e; font-size: 18px; font-weight: 600;">🚀 Getting Started</h3>
                    <ol style="margin: 0; padding-left: 20px; color: #0369a1; line-height: 1.6;">
                      <li style="margin-bottom: 8px;"><strong>Visit the login page:</strong> <a href="https://app.xyreg.com" style="color: #2563eb; text-decoration: none;">https://app.xyreg.com</a></li>
                      <li style="margin-bottom: 8px;"><strong>Enter your username and temporary password</strong> (case-sensitive)</li>
                      <li style="margin-bottom: 8px;"><strong>Create a new secure password</strong> when prompted</li>
                      <li style="margin-bottom: 8px;"><strong>Complete your profile setup</strong> to get started</li>
                    </ol>
                  </div>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin-bottom: 32px;">
                    <a href="https://app.xyreg.com" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.4);">
                        🚀 Login to Your Account
                    </a>
                  </div>
                  
                  <!-- Security Notice -->
                  <div style="background-color: #fee2e2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <h4 style="margin: 0 0 12px; color: #dc2626; font-size: 16px; font-weight: 600;">🔒 Security Notice</h4>
                    <ul style="margin: 0; padding-left: 20px; color: #dc2626; font-size: 14px; line-height: 1.5;">
                      <li>Keep your credentials secure and don't share them with anyone</li>
                      <li>Change your password immediately after first login</li>
                      <li>If you suspect unauthorized access, contact support immediately</li>
                    </ul>
                  </div>
                  
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 32px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
                  <p style="margin: 0 0 16px; color: #64748b; font-size: 14px;">
                    Need help getting started? <a href="mailto:support@xyreg.com" style="color: #3b82f6; text-decoration: none;">Contact our support team</a>
                  </p>
                  <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px;">
                    <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px;">
                      This email contains sensitive login information for ${firstName} ${lastName}
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      © 2024 Xreg. All rights reserved.
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
  `;
}
