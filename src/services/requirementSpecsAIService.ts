import { supabase } from '@/integrations/supabase/client';
import { showNoCreditDialog } from '@/context/AiCreditContext';

export interface RequirementSpecSuggestion {
  description: string;
  category: string;
  rationale: string;
  traces_to: string;
  linked_risks: string;
  acceptance_criteria: string;
  confidence: number;
}

export interface RequirementSpecsAIRequest {
  companyId: string;
  productData: {
    clinical_purpose?: string;
    indications_for_use?: string;
    target_population?: string;
    use_environment?: string;
    duration_of_use?: string;
    device_class?: string;
    product_name?: string;
  };
  userNeeds: Array<{
    id: string;
    user_need_id: string;
    description: string;
  }>;
  selectedCategories: string[];
  existingItems?: string[];
}

export interface RequirementSpecsAIResponse {
  success: boolean;
  suggestions?: RequirementSpecSuggestion[];
  metadata?: {
    generatedAt: string;
    productName?: string;
    totalSuggestions: number;
    categoriesGenerated: string[];
  };
  error?: string;
  errorType?: string;
}

export class RequirementSpecsAIService {
  static async generateRequirementSpecifications(
    request: RequirementSpecsAIRequest
  ): Promise<RequirementSpecsAIResponse> {
    try {
      console.log('[RequirementSpecsAIService] Generating requirement specifications:', {
        companyId: request.companyId,
        productName: request.productData.product_name,
        userNeedsCount: request.userNeeds.length,
        selectedCategories: request.selectedCategories
      });

      const { data, error } = await supabase.functions.invoke('ai-requirement-specs-generator', {
        body: request
      });

      if (error) {
        console.error('[RequirementSpecsAIService] Error calling edge function:', error);
        console.error('[RequirementSpecsAIService] Error details:', {
          name: error.name,
          message: error.message,
          context: error.context
        });
        throw error;
      }

      console.log('[RequirementSpecsAIService] Raw response from edge function:', data);

      if (data?.error === 'NO_CREDITS') {
        showNoCreditDialog();
        throw new Error('NO_CREDITS');
      }

      if (!data?.success) {
        console.error('[RequirementSpecsAIService] AI generation failed:', data?.error);
        console.error('[RequirementSpecsAIService] Error type:', data?.errorType);
        throw new Error(data?.error || 'AI requirement specifications generation failed');
      }

      console.log('[RequirementSpecsAIService] Generated', data.suggestions?.length || 0, 'suggestions');
      return data as RequirementSpecsAIResponse;
    } catch (error) {
      console.error('[RequirementSpecsAIService] Service error:', error);
      console.error('[RequirementSpecsAIService] Error type:', typeof error);
      console.error('[RequirementSpecsAIService] Error name:', error instanceof Error ? error.name : 'Unknown');
      throw error;
    }
  }
}

export const requirementSpecsAIService = new RequirementSpecsAIService();