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
// --- Per-request AI token usage tracking ---

export type AiSource = 'professor_xyreg' | 'document_ai_assistant' | 'auto_fill_section' | 'ai_suggestion' | 'ai_user_needs' | 'ai_system_requirements' | 'ai_software_requirements' | 'ai_hardware_requirements' | 'ai_hazard_analysis' | 'ai_vv_plan';

interface DetailedTokenUsage {
  inputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
  totalTokens: number;
}

/**
 * Extract detailed token usage from Gemini response including thinking tokens
 */
export function extractGeminiDetailedUsage(responseData: any): DetailedTokenUsage | null {
  try {
    const usageMetadata = responseData.usageMetadata;
    if (!usageMetadata) return null;

    return {
      inputTokens: usageMetadata.promptTokenCount || 0,
      outputTokens: usageMetadata.candidatesTokenCount || 0,
      thinkingTokens: usageMetadata.thoughtsTokenCount || 0,
      totalTokens: usageMetadata.totalTokenCount || 0,
    };
  } catch (error) {
    console.error('[token-tracking] Error extracting Gemini detailed usage:', error);
    return null;
  }
}

interface AiTokenUsageRecord {
  companyId: string;
  userId?: string;
  source: AiSource;
  model: string;
  usage: DetailedTokenUsage;
  metadata?: Record<string, unknown>;
}

/**
 * Check if a company has remaining AI credits (1 credit = 1 API call).
 * Returns { allowed: true } or { allowed: false, used, limit }.
 */
export async function checkAiCredits(companyId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const { data: usageRows } = await supabase
      .from('ai_token_usage')
      .select('id')
      .eq('company_id', companyId)
      .gte('created_at', firstOfMonth.toISOString());

    const used = (usageRows || []).length;

    const { data: companyPlan } = await supabase
      .from('new_pricing_company_plans')
      .select('ai_booster_packs, plan:new_pricing_plans(included_ai_credits)')
      .eq('company_id', companyId)
      .in('status', ['active', 'trial', 'cancelled'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Credit limit = ai_booster_packs value directly (set by super admin / webhook)
    // We do NOT use included_ai_credits from the plan as it stores token counts, not API call credits
    let limit = 0;
    if (companyPlan) {
      limit = companyPlan.ai_booster_packs || 0;
    }

    // If no plan exists at all, allow (company not provisioned yet)
    if (!companyPlan) return { allowed: true, used, limit };

    // If company has a plan, enforce credit limit (0 means no credits available)
    const allowed = used < limit;
    console.log(`[token-tracking] Credit check: used=${used}, limit=${limit}, allowed=${allowed}`);
    return { allowed, used, limit };
  } catch (error) {
    console.error('[token-tracking] Error checking AI credits:', error);
    return { allowed: true, used: 0, limit: 0 };
  }
}

/**
 * Log a per-request AI token usage row into ai_token_usage table
 */
export async function logAiTokenUsage(record: AiTokenUsageRecord): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase.from('ai_token_usage').insert({
      company_id: record.companyId,
      user_id: record.userId ?? null,
      source: record.source,
      model: record.model,
      input_tokens: record.usage.inputTokens,
      output_tokens: record.usage.outputTokens,
      thinking_tokens: record.usage.thinkingTokens,
      total_tokens: record.usage.totalTokens,
      metadata: record.metadata ?? {},
    });

    if (error) {
      console.error('[token-tracking] Error logging AI token usage:', error);
    } else {
      console.log(`[token-tracking] AI usage logged: source=${record.source}, total=${record.usage.totalTokens}`);
    }
  } catch (error) {
    console.error('[token-tracking] Unexpected error logging AI token usage:', error);
  }
}

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
