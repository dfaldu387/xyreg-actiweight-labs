import { supabase } from '@/integrations/supabase/client';

export interface SoftwareRequirementSuggestion {
  description: string;
  category: string;
  rationale: string;
  traces_to: string;
  linked_risks: string;
  acceptance_criteria: string;
  confidence: number;
}

export interface SoftwareRequirementsAIRequest {
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
  systemRequirements: Array<{
    id: string;
    requirement_id: string;
    description: string;
  }>;
  selectedCategories: string[];
  existingItems?: string[];
}

export interface SoftwareRequirementsAIResponse {
  success: boolean;
  suggestions?: SoftwareRequirementSuggestion[];
  metadata?: {
    generatedAt: string;
    productName?: string;
    totalSuggestions: number;
    categoriesGenerated: string[];
  };
  error?: string;
  errorType?: string;
}

export class SoftwareRequirementsAIService {
  static async generateSoftwareRequirements(
    request: SoftwareRequirementsAIRequest
  ): Promise<SoftwareRequirementsAIResponse> {
    try {
      console.log('[SoftwareRequirementsAIService] Generating software requirements:', {
        companyId: request.companyId,
        productName: request.productData.product_name,
        systemRequirementsCount: request.systemRequirements.length,
        selectedCategories: request.selectedCategories
      });

      const { data, error } = await supabase.functions.invoke('ai-software-requirements-generator', {
        body: request
      });

      if (error) {
        console.error('[SoftwareRequirementsAIService] Error calling edge function:', error);
        throw error;
      }

      if (!data?.success) {
        console.error('[SoftwareRequirementsAIService] AI generation failed:', data?.error);
        throw new Error(data?.error || 'AI software requirements generation failed');
      }

      console.log('[SoftwareRequirementsAIService] Generated', data.suggestions?.length || 0, 'suggestions');
      return data as SoftwareRequirementsAIResponse;
    } catch (error) {
      console.error('[SoftwareRequirementsAIService] Service error:', error);
      throw error;
    }
  }
}

export const softwareRequirementsAIService = new SoftwareRequirementsAIService();