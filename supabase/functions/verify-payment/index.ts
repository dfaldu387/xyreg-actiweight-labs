import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.0.0'

const stripe = new Stripe('sk_test_51RmECBPWQwH62VVmhYMKf8EicZZ8g9FbXmildKivZkW53D0HgZbhbc2JjF8NhadwS8Q8d9G5ZOf52lG0o5ASIoJw00mPRclpFv', {
  apiVersion: '2023-10-16',
})

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
    const { sessionId } = await req.json()

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'subscription'],
    })

    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ error: 'Payment not completed' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract metadata from session
    const { planName, companyId, userId } = session.metadata || {}

    if (!planName || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing plan information' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update the plan in the database
    const success = await updatePlanInDatabase(planName, companyId, userId)

    if (!success) {
      return new Response(
        JSON.stringify({ error: 'Failed to update plan' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        planName, 
        companyId: companyId || null 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error verifying payment:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Helper function to update plan in database
async function updatePlanInDatabase(planName: string, companyId: string | null, userId: string): Promise<boolean> {
  try {
    const supabaseUrl = 'https://wzzkbmmgxxrfhhxggrcl.supabase.co'
    const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6emtibW1neHhyZmhoeGdncmNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTM5NjU5OSwiZXhwIjoyMDYwOTcyNTk5fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8' // You'll need to replace this with your actual service role key
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (companyId) {
      // Update company plan
      const { error: companyError } = await supabase
        .from('companies')
        .update({ subscription_plan: planName })
        .eq('id', companyId)

      if (companyError) {
        console.error('Error updating company plan:', companyError)
        return false
      }
    } else {
      // Update user plan in metadata
      const { error: userError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { selectedPlan: planName }
      })

      if (userError) {
        console.error('Error updating user plan:', userError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error updating plan in database:', error)
    return false
  }
} 