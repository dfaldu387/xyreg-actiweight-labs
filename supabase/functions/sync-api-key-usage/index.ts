import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyId, keyType, apiKey } = await req.json();

    if (!keyId || !keyType || !apiKey) {
      throw new Error('Missing required parameters');
    }

    console.log(`Syncing usage for ${keyType} key: ${keyId}`);

    let usageData: Record<string, unknown> = {};
    let lastUsageAt: string | null = null;
    let response: unknown = null;
    // Fetch usage data based on key type
    switch (keyType) {
      case 'gemini': {
        const geminiUsage = await fetchGeminiUsage(apiKey);
        usageData = geminiUsage.data;
        lastUsageAt = geminiUsage.lastUsage;
        response = geminiUsage.response;
        break;
      }
      
      case 'openai': {
        const openaiUsage = await fetchOpenAIUsage(apiKey);
        usageData = openaiUsage.data;
        lastUsageAt = openaiUsage.lastUsage;
        response = openaiUsage.response;
        break;
      }
      
      case 'anthropic': {
        const anthropicUsage = await fetchAnthropicUsage(apiKey);
        usageData = anthropicUsage.data;
        lastUsageAt = anthropicUsage.lastUsage;
        break;
      }
      
      case 'serpapi': {
        const serpapiUsage = await fetchSerpAPIUsage(apiKey);
        usageData = serpapiUsage.data;
        lastUsageAt = serpapiUsage.lastUsage;
        break;
      }
      
      default:
        throw new Error(`Unsupported key type: ${keyType}`);
    }

    console.log('Usage data to save:', JSON.stringify(usageData, null, 2));
    
    // Update database with usage data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: updateData, error: updateError } = await supabase
      .from('company_api_keys')
      .update({
        token_usage_data: usageData,
        last_usage_at: lastUsageAt,
        usage_last_synced_at: new Date().toISOString()
      })
      .eq('id', keyId)
      .select();

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }
    
    console.log('Database updated successfully:', updateData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        usageData,
        lastUsageAt,
        response,
        syncedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error syncing API key usage:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function fetchGeminiUsage(apiKey: string) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Failed to verify Gemini API key: ${response.status}`);
    }

    const responseData = await response.json();
    
    // Extract useful information from the models response
    const models = responseData.models || [];
    const modelCount = models.length;
    const modelNames = models.slice(0, 5).map((m: any) => m.displayName || m.name);
    
    // Calculate total token limits across all models
    const totalInputTokens = models.reduce((sum: number, m: any) => sum + (m.inputTokenLimit || 0), 0);
    const totalOutputTokens = models.reduce((sum: number, m: any) => sum + (m.outputTokenLimit || 0), 0);
    
    return {
      data: {
        status: 'active',
        model_count: modelCount,
        sample_models: modelNames,
        total_input_token_limit: totalInputTokens,
        total_output_token_limit: totalOutputTokens,
        note: 'Gemini API does not provide detailed usage statistics via API',
        api_verified: true,
        verified_at: new Date().toISOString()
      },
      lastUsage: new Date().toISOString(),
      response: responseData
    };
  } catch (error) {
    console.error('Error fetching Gemini usage:', error);
    return {
      data: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      },
      lastUsage: null,
      response: null
    };
  }
}

async function fetchOpenAIUsage(apiKey: string) {
  try {
    // OpenAI usage API endpoint
    const response = await fetch('https://api.openai.com/v1/usage', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch OpenAI usage data');
    }

    const data = await response.json();
    
    return {
      data: {
        total_tokens: data.total_tokens || 0,
        total_requests: data.total_requests || 0
      },
      lastUsage: data.aggregation_timestamp || null,
      response: data
    };
  } catch (error) {
    console.error('Error fetching OpenAI usage:', error);
    return {
      data: { error: error instanceof Error ? error.message : 'Unknown error' },
      lastUsage: null,
      response: null
    };
  }
}

async function fetchAnthropicUsage(apiKey: string) {
  try {
    // Anthropic doesn't provide a usage API
    // We'll verify the key works
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to verify Anthropic API key');
    }

    return {
      data: {
        status: 'active',
        note: 'Anthropic API does not provide usage statistics via API'
      },
      lastUsage: null
    };
  } catch (error) {
    console.error('Error fetching Anthropic usage:', error);
    return {
      data: { error: error instanceof Error ? error.message : 'Unknown error' },
      lastUsage: null
    };
  }
}

async function fetchSerpAPIUsage(apiKey: string) {
  try {
    // SerpAPI account endpoint
    const response = await fetch(`https://serpapi.com/account.json?api_key=${apiKey}`);

    if (!response.ok) {
      throw new Error('Failed to fetch SerpAPI usage data');
    }

    const data = await response.json();
    
    return {
      data: {
        total_searches: data.total_searches_left || 0,
        searches_per_month: data.searches_per_month || 0,
        plan_type: data.plan_type || 'unknown'
      },
      lastUsage: data.last_hour_searches ? new Date().toISOString() : null
    };
  } catch (error) {
    console.error('Error fetching SerpAPI usage:', error);
    return {
      data: { error: error instanceof Error ? error.message : 'Unknown error' },
      lastUsage: null
    };
  }
}
