import { supabase } from '@/integrations/supabase/client';
import { showNoCreditDialog } from '@/context/AiCreditContext';

export interface UserNeedSuggestion {
  description: string;
  rationale: string;
  confidence: number;
  category?: string;
}

export interface UserNeedsAIRequest {
  companyId: string;
  productData: {
    clinical_purpose?: string;
    indications_for_use?: string;
    target_population?: string;
    use_environment?: string;
    duration_of_use?: string;
    device_class?: string;
    product_name?: string;
    markets?: any[]; // Market-specific requirements
    // Support product data from intended_purpose_data structure
    intended_purpose_data?: {
      clinicalPurpose?: string;
      indicationsForUse?: string;
      targetPopulation?: string;
      useEnvironment?: string;
      durationOfUse?: string;
    };
  };
  categories?: string[];
  existingItems?: string[];
}

export interface UserNeedsAIResponse {
  success: boolean;
  suggestions?: UserNeedSuggestion[];
  metadata?: {
    generatedAt: string;
    productName?: string;
    totalSuggestions: number;
  };
  error?: string;
  errorType?: string;
}

export class UserNeedsAIService {
  static async generateUserNeedsSuggestions(
    request: UserNeedsAIRequest
  ): Promise<UserNeedsAIResponse> {
    try {
      console.log('[UserNeedsAIService] Generating user needs suggestions:', {
        companyId: request.companyId,
        productName: request.productData.product_name
      });

      const { data, error } = await supabase.functions.invoke('ai-user-needs-generator', {
        body: request
      });

      if (error) {
        console.error('[UserNeedsAIService] Error calling edge function:', error);
        throw error;
      }

      if (data?.error === 'NO_CREDITS') {
        showNoCreditDialog();
        return { success: false, error: 'NO_CREDITS', errorType: 'no_credits' };
      }

      if (!data?.suggestions) {
        console.error('[UserNeedsAIService] AI generation failed:', data?.error);
        throw new Error(data?.error || 'AI user needs generation failed');
      }

      console.log('[UserNeedsAIService] Generated', data.suggestions?.length || 0, 'suggestions');
      return {
        success: true,
        suggestions: data.suggestions,
        metadata: {
          generatedAt: new Date().toISOString(),
          productName: request.productData.product_name,
          totalSuggestions: data.suggestions.length
        }
      };
    } catch (error) {
      console.error('[UserNeedsAIService] Service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'unknown'
      };
    }
  }
}

export const userNeedsAIService = new UserNeedsAIService();