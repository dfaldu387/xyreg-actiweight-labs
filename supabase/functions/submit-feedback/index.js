import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface FeedbackSubmission {
  type: 'bug_report' | 'improvement_suggestion';
  title: string;
  description: string;
  screenshot: string;
  metadata: {
    page_url: string;
    user_agent: string;
    screen_resolution: string;
    viewport_size: string;
    timestamp: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing feedback submission...');
    
    // Parse request body
    const requestData: FeedbackSubmission = await req.json();
    console.log('Request data received:', { 
      type: requestData.type, 
      title: requestData.title,
      hasScreenshot: !!requestData.screenshot,
      pageUrl: requestData.metadata.page_url
    });

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    // Create client with user JWT
    const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: { authorization: authHeader }
      }
    });

    // Get user from JWT
    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Failed to authenticate user');
    }

    console.log('User authenticated:', user.id);

    // Get user's company
    const { data: userCompanyData, error: companyError } = await supabase
      .from('user_company_access')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (companyError || !userCompanyData) {
      throw new Error('Failed to get user company');
    }

    console.log('User company found:', userCompanyData.company_id);

    let screenshotUrl = null;

    // Upload screenshot if provided
    if (requestData.screenshot) {
      console.log('Uploading screenshot...');
      
      // Convert base64 to blob
      const base64Data = requestData.screenshot.replace(/^data:image\/[a-z]+;base64,/, '');
      const imageData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      // Generate unique filename
      const fileName = `${user.id}/${Date.now()}_feedback.png`;
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('feedback-screenshots')
        .upload(fileName, imageData, {
          contentType: 'image/png',
          upsert: false
        });

      if (uploadError) {
        console.error('Screenshot upload error:', uploadError);
        throw new Error('Failed to upload screenshot');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('feedback-screenshots')
        .getPublicUrl(fileName);
      
      screenshotUrl = urlData.publicUrl;
      console.log('Screenshot uploaded successfully:', screenshotUrl);
    }

    // Insert feedback submission
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedback_submissions')
      .insert({
        user_id: user.id,
        company_id: userCompanyData.company_id,
        type: requestData.type,
        title: requestData.title,
        description: requestData.description,
        screenshot_url: screenshotUrl,
        page_url: requestData.metadata.page_url,
        user_agent: requestData.metadata.user_agent,
        screen_resolution: requestData.metadata.screen_resolution,
        viewport_size: requestData.metadata.viewport_size,
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('Feedback insert error:', feedbackError);
      throw new Error('Failed to save feedback');
    }

    console.log('Feedback saved successfully:', feedbackData.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: feedbackData.id,
        message: 'Feedback submitted successfully'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in submit-feedback function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);