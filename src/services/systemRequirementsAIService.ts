import { supabase } from '@/integrations/supabase/client';

export interface SystemRequirementSuggestion {
  description: string;
  category: string;
  rationale: string;
  traces_to: string;
  linked_risks: string;
  acceptance_criteria: string;
  confidence: number;
}

export interface SystemRequirementsAIRequest {
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

export interface SystemRequirementsAIResponse {
  success: boolean;
  suggestions?: SystemRequirementSuggestion[];
  metadata?: {
    generatedAt: string;
    productName?: string;
    totalSuggestions: number;
    categoriesGenerated: string[];
  };
  error?: string;
  errorType?: string;
}

export class SystemRequirementsAIService {
  static async generateSystemRequirements(
    request: SystemRequirementsAIRequest
  ): Promise<SystemRequirementsAIResponse> {
    try {
      console.log('[SystemRequirementsAIService] Generating system requirements:', {
        companyId: request.companyId,
        productName: request.productData.product_name,
        userNeedsCount: request.userNeeds.length,
        selectedCategories: request.selectedCategories
      });

      const { data, error } = await supabase.functions.invoke('ai-system-requirements-generator', {
        body: request
      });

      if (error) {
        console.error('[SystemRequirementsAIService] Error calling edge function:', error);
        throw error;
      }

      if (!data?.success) {
        console.error('[SystemRequirementsAIService] AI generation failed:', data?.error);
        throw new Error(data?.error || 'AI system requirements generation failed');
      }

      console.log('[SystemRequirementsAIService] Generated', data.suggestions?.length || 0, 'suggestions');
      return data as SystemRequirementsAIResponse;
    } catch (error) {
      console.error('[SystemRequirementsAIService] Service error:', error);
      throw error;
    }
  }
}

export const systemRequirementsAIService = new SystemRequirementsAIService();