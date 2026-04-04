import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the request is from the impersonated user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authorization')
    }

    const { superAdminId, superAdminEmail } = await req.json()

    if (!superAdminId || !superAdminEmail) {
      throw new Error('Super admin ID and email are required')
    }

    // Get super admin user details
    const { data: superAdminUser, error: superAdminUserError } = await supabaseClient.auth.admin.getUserById(superAdminId)
    
    if (superAdminUserError || !superAdminUser) {
      throw new Error('Super admin user not found')
    }

    // Verify the super admin user has super_admin role
    if (superAdminUser.user.user_metadata?.role !== 'super_admin') {
      throw new Error('Access denied: User is not a super admin')
    }

    // Generate a magic link for the super admin
    const { data: tokenData, error: tokenError } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email: superAdminUser.user.email!,
      options: {
        redirectTo: `${req.headers.get('origin')}/super-admin/app/users`
      }
    })

    if (tokenError || !tokenData) {
      throw new Error('Failed to generate super admin return token')
    }

    // Log the return action for audit purposes
    await supabaseClient
      .from('product_audit_logs')
      .insert({
        user_id: superAdminId,
        company_id: null, // System-level action
        action: 'RETURN_TO_SUPER_ADMIN',
        entity_type: 'User',
        entity_id: user.id,
        entity_name: `${user.email}`,
        description: `Super admin ${superAdminUser.user.email} returned from impersonating user ${user.email}`,
        ip_address: req.headers.get('x-forwarded-for') || 'Unknown',
        user_agent: req.headers.get('user-agent') || 'Unknown',
        metadata: {
          impersonated_user_id: user.id,
          impersonated_user_email: user.email,
          return_type: 'super_admin_return'
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        returnUrl: tokenData.properties?.action_link,
        superAdminUser: {
          id: superAdminUser.user.id,
          email: superAdminUser.user.email,
          metadata: superAdminUser.user.user_metadata
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in return-to-super-admin function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
