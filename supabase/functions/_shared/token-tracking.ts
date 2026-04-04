import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Track token usage for API calls and update company_api_keys table
 */
export async function trackTokenUsage(
  companyId: string,
  keyType: 'gemini' | 'openai' | 'anthropic' | 'google_vertex',
  usage: TokenUsage,
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[token-tracking] Tracking usage for company ${companyId}, key_type: ${keyType}`, usage);

    // Get current API key record
    const { data: apiKey, error: fetchError } = await supabase
      .from('company_api_keys')
      .select('id, token_usage_data')
      .eq('company_id', companyId)
      .eq('key_type', keyType)
      .single();

    if (fetchError || !apiKey) {
      console.error('[token-tracking] Error fetching API key:', fetchError);
      return; // Don't throw - tracking failure shouldn't break the main function
    }

    // Parse existing usage data
    const currentUsage = apiKey.token_usage_data || {};
    const currentInputTokens = currentUsage.total_input_tokens || 0;
    const currentOutputTokens = currentUsage.total_output_tokens || 0;
    const currentTotalTokens = currentUsage.total_tokens || 0;
    const currentRequests = currentUsage.total_requests || 0;

    // Accumulate new usage
    const newUsageData = {
      ...currentUsage,
      total_input_tokens: currentInputTokens + usage.promptTokens,
      total_output_tokens: currentOutputTokens + usage.completionTokens,
      total_tokens: currentTotalTokens + usage.totalTokens,
      total_requests: currentRequests + 1,
      last_tracked_at: new Date().toISOString(),
    };

    // Update the database
    const { error: updateError } = await supabase
      .from('company_api_keys')
      .update({
        token_usage_data: newUsageData,
        last_usage_at: new Date().toISOString(),
      })
      .eq('id', apiKey.id);

    if (updateError) {
      console.error('[token-tracking] Error updating usage:', updateError);
    } else {
      console.log('[token-tracking] Usage updated successfully:', newUsageData);
    }
  } catch (error) {
    console.error('[token-tracking] Unexpected error:', error);
    // Don't throw - tracking failure shouldn't break the main function
  }
}

/**
 * Extract token usage from Lovable AI gateway response
 */
export function extractLovableAIUsage(responseData: any): TokenUsage | null {
  try {
    const usage = responseData.usage;
    if (!usage) return null;

    return {
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || (usage.prompt_tokens || 0) + (usage.completion_tokens || 0),
    };
  } catch (error) {
    console.error('[token-tracking] Error extracting Lovable AI usage:', error);
    return null;
  }
}

/**
 * Extract token usage from direct Gemini API response
 */
export function extractGeminiUsage(responseData: any): TokenUsage | null {
  try {
    const usageMetadata = responseData.usageMetadata;
    if (!usageMetadata) return null;

    return {
      promptTokens: usageMetadata.promptTokenCount || 0,
      completionTokens: usageMetadata.candidatesTokenCount || 0,
      totalTokens: usageMetadata.totalTokenCount || 0,
    };
  } catch (error) {
    console.error('[token-tracking] Error extracting Gemini usage:', error);
    return null;
  }
}
