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
    const { email, firstName, lastName, companyId, companyName, accessLevel, invitationToken, appUrl } = requestData;
    // Use appUrl from frontend (e.g., srk44.xyreg.com) or fallback to app.xyreg.com
    const loginUrl = appUrl || 'https://app.xyreg.com';
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
      // Check for multi-department assignments from invitation_department_assignments table
      const { data: invitationDeptAssignments, error: invDeptError } = await supabaseAdmin
        .from('invitation_department_assignments')
        .select('*')
        .eq('invitation_id', invitation.id);

      if (!invDeptError && invitationDeptAssignments && invitationDeptAssignments.length > 0) {
        console.log('Creating department assignments for existing user from invitation_department_assignments:', invitationDeptAssignments.length);
        for (const assignment of invitationDeptAssignments) {
          const { error: deptError } = await supabaseAdmin.from('user_department_assignments').upsert({
            user_id: existingUserByEmail.id,
            company_id: companyId,
            department_name: assignment.department_name,
            fte_allocation: assignment.fte_allocation,
            role: assignment.role && assignment.role.length > 0 ? assignment.role : null,
          }, { onConflict: 'user_id,company_id,department_name' });
          if (deptError) {
            console.error('Error creating department assignment for existing user:', deptError);
          }
        }
      } else if (invitation.functional_area && invitation.functional_area !== 'none') {
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

      // Apply device access from invitation for existing user
      const { data: existingUserDeviceAccess, error: existingDeviceErr } = await supabaseAdmin
        .from('invitation_device_access')
        .select('product_ids')
        .eq('invitation_id', invitation.id)
        .maybeSingle();

      // Also fetch per-device module restrictions
      const { data: existingUserDeviceModuleRows, error: existingDeviceModuleErr } = await supabaseAdmin
        .from('invitation_device_module_access')
        .select('device_id, module_ids')
        .eq('invitation_id', invitation.id);

      const existingDeviceModulesMap: Record<string, string[]> = {};
      if (!existingDeviceModuleErr && Array.isArray(existingUserDeviceModuleRows)) {
        for (const row of existingUserDeviceModuleRows) {
          if (row?.device_id && Array.isArray(row.module_ids) && row.module_ids.length > 0) {
            existingDeviceModulesMap[row.device_id] = row.module_ids;
          }
        }
      }
      const hasExistingDeviceModules = Object.keys(existingDeviceModulesMap).length > 0;
      const hasExistingDeviceAccess = !existingDeviceErr && existingUserDeviceAccess?.product_ids?.length > 0;

      if (hasExistingDeviceAccess || hasExistingDeviceModules) {
        console.log('Applying device access + module restrictions for existing user:',
          existingUserDeviceAccess?.product_ids?.length || 0, 'products,',
          Object.keys(existingDeviceModulesMap).length, 'device-module configs');
        const userTypeMap = { viewer: 'viewer', editor: 'editor', admin: 'admin', consultant: 'viewer' };
        // Check for existing active record (partial unique index prevents upsert)
        const { data: existingMatrix } = await supabaseAdmin
          .from('user_product_matrix')
          .select('id, permissions, product_ids')
          .eq('user_id', existingUserByEmail.id)
          .eq('company_id', companyId)
          .eq('is_active', true)
          .maybeSingle();

        if (existingMatrix) {
          const mergedPermissions = {
            ...((existingMatrix.permissions as any) || {}),
            ...(hasExistingDeviceModules ? { device_modules: existingDeviceModulesMap } : {}),
          };
          const updatePayload: any = {
            user_type: userTypeMap[accessLevel] || 'viewer',
            assigned_at: new Date().toISOString(),
            permissions: mergedPermissions,
          };
          if (hasExistingDeviceAccess) {
            updatePayload.product_ids = existingUserDeviceAccess.product_ids;
          }
          const { error: updateErr } = await supabaseAdmin.from('user_product_matrix')
            .update(updatePayload)
            .eq('id', existingMatrix.id);
          if (updateErr) console.error('Error updating device access for existing user:', updateErr);
        } else {
          const { error: insertErr } = await supabaseAdmin.from('user_product_matrix')
            .insert({
              user_id: existingUserByEmail.id,
              company_id: companyId,
              product_ids: hasExistingDeviceAccess ? existingUserDeviceAccess.product_ids : [],
              user_type: userTypeMap[accessLevel] || 'viewer',
              is_active: true,
              assigned_at: new Date().toISOString(),
              permissions: hasExistingDeviceModules ? { device_modules: existingDeviceModulesMap } : {},
            });
          if (insertErr) console.error('Error inserting device access for existing user:', insertErr);
        }
      }

      // Apply document permissions from invitation for existing user
      const { data: existingUserDocAccess, error: existingDocErr } = await supabaseAdmin
        .from('invitation_document_access')
        .select('document_ids')
        .eq('invitation_id', invitation.id)
        .maybeSingle();

      if (!existingDocErr && existingUserDocAccess?.document_ids?.length > 0) {
        console.log('Creating document permissions for existing user:', existingUserDocAccess.document_ids.length, 'documents');
        const { error: docInsertErr } = await supabaseAdmin
          .from('user_document_permissions')
          .upsert({
            user_id: existingUserByEmail.id,
            company_id: companyId,
            document_ids: existingUserDocAccess.document_ids,
          }, { onConflict: 'user_id,company_id' });
        if (docInsertErr) {
          console.error('Error inserting document permissions for existing user:', docInsertErr);
        }
      }

      // Apply module access from invitation for existing user
      const { data: existingUserModuleAccess, error: existingModuleErr } = await supabaseAdmin
        .from('invitation_module_access')
        .select('module_ids')
        .eq('invitation_id', invitation.id)
        .maybeSingle();

      if (!existingModuleErr && existingUserModuleAccess?.module_ids?.length > 0) {
        console.log('Creating module access for existing user:', existingUserModuleAccess.module_ids.length, 'modules');
        // Check for existing record
        const { data: existingModuleRecord } = await supabaseAdmin
          .from('user_company_module_access')
          .select('id')
          .eq('user_id', existingUserByEmail.id)
          .eq('company_id', companyId)
          .maybeSingle();

        if (existingModuleRecord) {
          const { error: moduleUpdateErr } = await supabaseAdmin
            .from('user_company_module_access')
            .update({
              module_ids: existingUserModuleAccess.module_ids,
              is_active: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingModuleRecord.id);
          if (moduleUpdateErr) console.error('Error updating module access for existing user:', moduleUpdateErr);
        } else {
          const { error: moduleInsertErr } = await supabaseAdmin
            .from('user_company_module_access')
            .insert({
              user_id: existingUserByEmail.id,
              company_id: companyId,
              module_ids: existingUserModuleAccess.module_ids,
              is_active: true,
              assigned_at: new Date().toISOString(),
            });
          if (moduleInsertErr) console.error('Error inserting module access for existing user:', moduleInsertErr);
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

          // Create department assignments from invitation_department_assignments table
          const { data: fallbackDeptAssignments, error: fallbackDeptError } = await supabaseAdmin
            .from('invitation_department_assignments')
            .select('*')
            .eq('invitation_id', invitation.id);

          if (!fallbackDeptError && fallbackDeptAssignments && fallbackDeptAssignments.length > 0) {
            console.log('Creating department assignments for fallback user from invitation_department_assignments:', fallbackDeptAssignments.length);
            for (const assignment of fallbackDeptAssignments) {
              const { error: deptError } = await supabaseAdmin.from('user_department_assignments').upsert({
                user_id: fallbackUser.id,
                company_id: companyId,
                department_name: assignment.department_name,
                fte_allocation: assignment.fte_allocation,
                role: assignment.role && assignment.role.length > 0 ? assignment.role : null,
              }, { onConflict: 'user_id,company_id,department_name' });
              if (deptError) {
                console.error('Error creating department assignment for fallback user:', deptError);
              }
            }
          } else if (invitation.functional_area && invitation.functional_area !== 'none') {
            // Backward compat: fall back to single functional_area from invitation
            console.log('Creating department assignment for fallback user (legacy):', invitation.functional_area);
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
    // Create department assignments from invitation_department_assignments table
    console.log('Looking up invitation_department_assignments for invitation_id:', invitation.id);
    const { data: newUserDeptAssignments, error: newUserDeptError } = await supabaseAdmin
      .from('invitation_department_assignments')
      .select('*')
      .eq('invitation_id', invitation.id);

    console.log('invitation_department_assignments query result:', JSON.stringify({ data: newUserDeptAssignments, error: newUserDeptError }));
    console.log('invitation functional_area:', invitation.functional_area, 'department_role:', invitation.department_role);

    if (!newUserDeptError && newUserDeptAssignments && newUserDeptAssignments.length > 0) {
      console.log('Creating department assignments from invitation_department_assignments:', newUserDeptAssignments.length);
      for (const assignment of newUserDeptAssignments) {
        const { error: deptError } = await supabaseAdmin.from('user_department_assignments').upsert({
          user_id: authUser.user.id,
          company_id: companyId,
          department_name: assignment.department_name,
          fte_allocation: assignment.fte_allocation,
          role: assignment.role && assignment.role.length > 0 ? assignment.role : null,
        }, { onConflict: 'user_id,company_id,department_name' });
        if (deptError) {
          console.error('Error creating department assignment:', deptError);
        }
      }
    } else if (invitation.functional_area && invitation.functional_area !== 'none') {
      // Backward compat: fall back to single functional_area from invitation
      console.log('Creating department assignment (legacy):', invitation.functional_area);
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

    // Apply device access from invitation for new user
    const { data: newUserDeviceAccess, error: newUserDeviceErr } = await supabaseAdmin
      .from('invitation_device_access')
      .select('product_ids')
      .eq('invitation_id', invitation.id)
      .maybeSingle();

    // Also fetch per-device module restrictions for new user
    const { data: newUserDeviceModuleRows, error: newUserDeviceModuleErr } = await supabaseAdmin
      .from('invitation_device_module_access')
      .select('device_id, module_ids')
      .eq('invitation_id', invitation.id);

    const newUserDeviceModulesMap: Record<string, string[]> = {};
    if (!newUserDeviceModuleErr && Array.isArray(newUserDeviceModuleRows)) {
      for (const row of newUserDeviceModuleRows) {
        if (row?.device_id && Array.isArray(row.module_ids) && row.module_ids.length > 0) {
          newUserDeviceModulesMap[row.device_id] = row.module_ids;
        }
      }
    }
    const hasNewUserDeviceModules = Object.keys(newUserDeviceModulesMap).length > 0;
    const hasNewUserDeviceAccess = !newUserDeviceErr && newUserDeviceAccess?.product_ids?.length > 0;

    if (hasNewUserDeviceAccess || hasNewUserDeviceModules) {
      console.log('Applying device access + module restrictions for new user:',
        newUserDeviceAccess?.product_ids?.length || 0, 'products,',
        Object.keys(newUserDeviceModulesMap).length, 'device-module configs');
      const userTypeMap = { viewer: 'viewer', editor: 'editor', admin: 'admin', consultant: 'viewer' };
      const { error: insertErr } = await supabaseAdmin.from('user_product_matrix')
        .insert({
          user_id: authUser.user.id,
          company_id: companyId,
          product_ids: hasNewUserDeviceAccess ? newUserDeviceAccess.product_ids : [],
          user_type: userTypeMap[accessLevel] || 'viewer',
          is_active: true,
          assigned_at: new Date().toISOString(),
          permissions: hasNewUserDeviceModules ? { device_modules: newUserDeviceModulesMap } : {},
        });
      if (insertErr) {
        console.error('Error inserting device access for new user:', insertErr);
      }
    }

    // Apply document permissions from invitation for new user
    const { data: newUserDocAccess, error: newUserDocErr } = await supabaseAdmin
      .from('invitation_document_access')
      .select('document_ids')
      .eq('invitation_id', invitation.id)
      .maybeSingle();

    if (!newUserDocErr && newUserDocAccess?.document_ids?.length > 0) {
      console.log('Creating document permissions for new user:', newUserDocAccess.document_ids.length, 'documents');
      const { error: docInsertErr } = await supabaseAdmin
        .from('user_document_permissions')
        .upsert({
          user_id: authUser.user.id,
          company_id: companyId,
          document_ids: newUserDocAccess.document_ids,
        }, { onConflict: 'user_id,company_id' });
      if (docInsertErr) {
        console.error('Error inserting document permissions for new user:', docInsertErr);
      }
    }

    // Apply module access from invitation for new user
    const { data: newUserModuleAccess, error: newUserModuleErr } = await supabaseAdmin
      .from('invitation_module_access')
      .select('module_ids')
      .eq('invitation_id', invitation.id)
      .maybeSingle();

    if (!newUserModuleErr && newUserModuleAccess?.module_ids?.length > 0) {
      console.log('Creating module access for new user:', newUserModuleAccess.module_ids.length, 'modules');
      const { error: moduleInsertErr } = await supabaseAdmin
        .from('user_company_module_access')
        .insert({
          user_id: authUser.user.id,
          company_id: companyId,
          module_ids: newUserModuleAccess.module_ids,
          is_active: true,
          assigned_at: new Date().toISOString(),
        });
      if (moduleInsertErr) {
        console.error('Error inserting module access for new user:', moduleInsertErr);
      }
    }

    // Send login credentials email
    console.log('Sending login credentials email...');
    const emailResult = await sendLoginCredentialsEmail(email, firstName, lastName, companyName, username, temporaryPassword, accessLevel, loginUrl);
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
async function sendLoginCredentialsEmail(email, firstName, lastName, companyName, username, password, accessLevel, loginUrl) {
  try {
    console.log(`Sending login credentials email to: ${email}`);
    const emailPayload = {
      from: 'noreply@xyreg.com',
      to: [
        email
      ],
      subject: `🔐 Your Login Credentials for ${companyName} - Xreg Platform`,
      html: generateLoginCredentialsTemplate(firstName, lastName, companyName, username, password, accessLevel, email, loginUrl)
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
function generateLoginCredentialsTemplate(firstName, lastName, companyName, username, password, accessLevel, email, loginUrl = 'https://app.xyreg.com') {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /> 
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Your Login Credentials - ${companyName}</title>
  <!--[if gte mso 9]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .fluid { max-width: 100% !important; height: auto !important; }
      .stack-column { display: block !important; width: 100% !important; }
      .content-padding { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">

  <!-- Email Container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!--[if mso]>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" align="center"><tr><td>
        <![endif]-->

        <!-- Main Email Card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden;">

          <!-- Header with gradient background -->
          <tr>
            <td align="center" style="padding: 0;">
              <!--[if gte mso 9]>
              <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;">
                <v:fill type="gradient" color="#1e40af" color2="#3730a3" angle="135" />
                <v:textbox style="mso-fit-shape-to-text:true" inset="40px,40px,40px,30px">
              <![endif]-->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #667eea;">
                <tr>
                  <td align="center" style="padding: 40px 40px 30px; text-align: center;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                      <tr>
                        <td align="center" style="background-color: rgba(255, 255, 255, 0.2); border-radius: 12px; padding: 12px 24px;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">&#128272; Xreg</h1>
                        </td>
                      </tr>
                    </table>
                    <h2 style="margin: 16px 0 0; color: #ffffff; font-size: 18px; font-weight: 500; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Your Login Credentials</h2>
                  </td>
                </tr>
              </table>
              <!--[if gte mso 9]>
                </v:textbox>
              </v:rect>
              <![endif]-->
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td class="content-padding" style="padding: 48px 40px 40px;">

              <!-- Welcome Message -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <h1 style="margin: 0 0 12px; color: #1e293b; font-size: 28px; font-weight: 700; line-height: 1.2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Welcome to the Team, ${firstName}! &#127881;</h1>
                    <p style="margin: 0; color: #64748b; font-size: 16px; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Your account has been successfully created for <strong>${companyName}</strong></p>
                  </td>
                </tr>
              </table>

              <!-- Credentials Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-radius: 16px; border: 2px solid #e2e8f0;">
                <tr>
                  <td bgcolor="#f8fafc" style="background-color: #f8fafc; padding: 32px; border-radius: 16px;">

                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="padding-bottom: 24px;">
                          <h3 style="margin: 0; color: #1e293b; font-size: 20px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Your Login Details</h3>
                        </td>
                      </tr>
                    </table>

                    <!-- Username -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
                      <tr>
                        <td bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 12px; padding: 20px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="padding-bottom: 8px;">
                                <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Username</p>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 6px;">
                                  <tr>
                                    <td bgcolor="#f9fafb" style="background-color: #f9fafb; padding: 8px 12px; border-radius: 6px;">
                                      <p style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600; font-family: 'Courier New', Courier, monospace;">${email}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Password -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
                      <tr>
                        <td bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 12px; padding: 20px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="padding-bottom: 8px;">
                                <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Temporary Password</p>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 6px;">
                                  <tr>
                                    <td bgcolor="#f9fafb" style="background-color: #f9fafb; padding: 8px 12px; border-radius: 6px;">
                                      <p style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600; font-family: 'Courier New', Courier, monospace;">${password}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top: 12px;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid #fcd34d; border-radius: 8px;">
                                  <tr>
                                    <td bgcolor="#fef3c7" style="background-color: #fef3c7; padding: 12px; border-radius: 8px;">
                                      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                        <tr>
                                          <td valign="middle" style="padding-right: 8px;">
                                            <span style="color: #d97706; font-size: 14px;">&#9888;&#65039;</span>
                                          </td>
                                          <td valign="middle">
                                            <span style="color: #92400e; font-size: 12px; font-weight: 500; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">You'll be required to change this password on first login</span>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Access Level -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-radius: 12px; border: 1px solid #e2e8f0;">
                      <tr>
                        <td bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 12px; padding: 20px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td>
                                <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Access Level</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top: 4px;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                  <tr>
                                    <td bgcolor="#dbeafe" style="background-color: #dbeafe; padding: 6px 12px; border-radius: 6px;">
                                      <span style="color: #1d4ed8; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">${accessLevel}</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- Spacer -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td height="32" style="font-size: 1px; line-height: 1px;">&#160;</td></tr></table>

              <!-- Login Instructions -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid #bae6fd; border-radius: 12px;">
                <tr>
                  <td bgcolor="#f0f9ff" style="background-color: #f0f9ff; padding: 24px; border-radius: 12px;">
                    <h3 style="margin: 0 0 16px; color: #0c4a6e; font-size: 18px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">&#128640; Getting Started</h3>
                    <ol style="margin: 0; padding-left: 20px; color: #0369a1; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      <li style="margin-bottom: 8px;"><strong>Visit the login page:</strong> <a href="${loginUrl}" style="color: #2563eb; text-decoration: none;">${loginUrl}</a></li>
                      <li style="margin-bottom: 8px;"><strong>Enter your username and temporary password</strong> (case-sensitive)</li>
                      <li style="margin-bottom: 8px;"><strong>Create a new secure password</strong> when prompted</li>
                      <li style="margin-bottom: 8px;"><strong>Complete your profile setup</strong> to get started</li>
                    </ol>
                  </td>
                </tr>
              </table>

              <!-- Spacer -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td height="32" style="font-size: 1px; line-height: 1px;">&#160;</td></tr></table>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${loginUrl}" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="23%" strokecolor="#1d4ed8" fillcolor="#3b82f6">
                      <v:fill type="gradient" color="#3b82f6" color2="#1d4ed8" angle="135" />
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">&#128640; Login to Your Account</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${loginUrl}" target="_blank" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; mso-padding-alt: 0;">
                        &#128640; Login to Your Account
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid #fecaca; border-radius: 12px;">
                <tr>
                  <td bgcolor="#fee2e2" style="background-color: #fee2e2; padding: 20px; border-radius: 12px;">
                    <h4 style="margin: 0 0 12px; color: #dc2626; font-size: 16px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">&#128274; Security Notice</h4>
                    <ul style="margin: 0; padding-left: 20px; color: #dc2626; font-size: 14px; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      <li>Keep your credentials secure and don't share them with anyone</li>
                      <li>Change your password immediately after first login</li>
                      <li>If you suspect unauthorized access, contact support immediately</li>
                    </ul>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="#f8fafc" style="background-color: #f8fafc; padding: 32px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 16px; color: #64748b; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                Need help getting started? <a href="mailto:support@xyreg.com" style="color: #3b82f6; text-decoration: none;">Contact our support team</a>
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-top: 1px solid #e2e8f0;">
                <tr>
                  <td align="center" style="padding-top: 16px;">
                    <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      This email contains sensitive login information for ${firstName} ${lastName}
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      &copy; 2025 Xreg. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <!--[if mso]>
        </td></tr></table>
        <![endif]-->

      </td>
    </tr>
  </table>

</body>
</html>`;
}
