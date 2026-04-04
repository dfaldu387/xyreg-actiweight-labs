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

    // Verify the request is from a super admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authorization')
    }

    // Check if the requesting user is a super admin
    if (user.user_metadata?.role !== 'super_admin') {
      throw new Error('Access denied: Super admin privileges required')
    }

    const { targetUserId } = await req.json()

    if (!targetUserId) {
      throw new Error('Target user ID is required')
    }

    // Get target user details
    const { data: targetUser, error: targetUserError } = await supabaseClient.auth.admin.getUserById(targetUserId)
    
    if (targetUserError || !targetUser) {
      throw new Error('Target user not found')
    }

    // Generate an access token for the target user
    const { data: tokenData, error: tokenError } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email: targetUser.user.email!,
      options: {
        redirectTo: `${req.headers.get('origin')}/app`
      }
    })

    if (tokenError || !tokenData) {
      throw new Error('Failed to generate impersonation token')
    }

    // Log the impersonation action for audit purposes
    await supabaseClient
      .from('product_audit_logs')
      .insert({
        user_id: user.id,
        company_id: null, // System-level action
        action: 'IMPERSONATE_USER',
        entity_type: 'User',
        entity_id: targetUserId,
        entity_name: `${targetUser.user.email}`,
        description: `Super admin ${user.email} impersonated user ${targetUser.user.email}`,
        ip_address: req.headers.get('x-forwarded-for') || 'Unknown',
        user_agent: req.headers.get('user-agent') || 'Unknown',
        metadata: {
          target_user_id: targetUserId,
          target_user_email: targetUser.user.email,
          impersonation_type: 'admin_login'
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        loginUrl: tokenData.properties?.action_link,
        targetUser: {
          id: targetUser.user.id,
          email: targetUser.user.email,
          metadata: targetUser.user.user_metadata
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in impersonate-user function:', error)
    
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