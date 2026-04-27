import { supabase } from '@/integrations/supabase/client';
import { showNoCreditDialog } from '@/context/AiCreditContext';
import { HazardSuggestion } from './hazardAIService';

export interface UsabilityHazardAIRequest {
  productData: {
    clinical_purpose?: string;
    indications_for_use?: string;
    target_population?: string;
    use_environment?: string;
    duration_of_use?: string;
    device_class?: string;
    product_name?: string;
  };
  existingHazardDescriptions: string[];
  uiCharacteristics?: { feature: string; category?: string; safety_relevance?: string; description?: string }[];
  focusCategory?: string;
}

export interface UsabilityHazardAIResponse {
  success: boolean;
  suggestions?: HazardSuggestion[];
  error?: string;
}

export async function generateUsabilityHazardSuggestions(
  request: UsabilityHazardAIRequest
): Promise<UsabilityHazardAIResponse> {
  const { data, error } = await supabase.functions.invoke('ai-usability-hazard-generator', {
    body: request
  });

  if (error) {
    console.error('[UsabilityHazardAI] Edge function error:', error);
    throw error;
  }

  if (data?.error === 'NO_CREDITS') {
    showNoCreditDialog();
    throw new Error('NO_CREDITS');
  }

  if (!data?.success) {
    throw new Error(data?.error || 'AI usability hazard generation failed');
  }

  return data as UsabilityHazardAIResponse;
}
