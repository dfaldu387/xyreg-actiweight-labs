import { supabase } from '@/integrations/supabase/client';

export interface ReimbursementCodeSuggestion {
  code: string;
  description: string;
  rationale: string;
  confidence: number;
  status: 'exact_match' | 'partial_match' | 'application_pending';
}

export interface ReimbursementCodeAIRequest {
  companyId: string;
  market: string;
  productData: {
    product_name?: string;
    intended_use?: string;
    device_type?: string;
    clinical_purpose?: string;
    indications_for_use?: string;
  };
}

export interface ReimbursementCodeAIResponse {
  success: boolean;
  suggestions?: ReimbursementCodeSuggestion[];
  metadata?: {
    generatedAt: string;
    market: string;
    productName?: string;
    totalSuggestions: number;
  };
  error?: string;
  errorType?: string;
}

export class ReimbursementCodeAIService {
  static async generateCodeSuggestions(
    request: ReimbursementCodeAIRequest
  ): Promise<ReimbursementCodeAIResponse> {
    try {
      console.log('[ReimbursementCodeAIService] Generating code suggestions:', {
        companyId: request.companyId,
        market: request.market,
        productName: request.productData.product_name
      });

      const { data, error } = await supabase.functions.invoke('ai-reimbursement-code-suggester', {
        body: request
      });

      if (error) {
        console.error('[ReimbursementCodeAIService] Error calling edge function:', error);
        throw error;
      }

      if (!data?.success) {
        console.error('[ReimbursementCodeAIService] AI generation failed:', data?.error);
        throw new Error(data?.error || 'AI code suggestion generation failed');
      }

      console.log('[ReimbursementCodeAIService] Generated', data.suggestions?.length || 0, 'suggestions');
      return data as ReimbursementCodeAIResponse;
    } catch (error) {
      console.error('[ReimbursementCodeAIService] Service error:', error);
      throw error;
    }
  }
}

export const reimbursementCodeAIService = new ReimbursementCodeAIService();
