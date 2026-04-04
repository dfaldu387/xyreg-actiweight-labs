import { supabase } from "@/integrations/supabase/client";

export interface PrefixSuggestionRequest {
  company_id: string;
  issuing_agency: string;
  company_identifier?: string;
}

export interface PrefixSuggestionResponse {
  success: boolean;
  suggested_prefix?: string;
  confidence: 'high' | 'medium' | 'low' | 'insufficient';
  data_source: 'eudamed' | 'none';
  udi_count: number;
  algorithm_used: string;
  error?: string;
  details?: string;
}

export class UDICompanyPrefixService {
  /**
   * Suggest company prefix based on EUDAMED data
   */
  static async suggestCompanyPrefix(request: PrefixSuggestionRequest): Promise<PrefixSuggestionResponse> {
    try {
      console.log('[UDICompanyPrefixService] Requesting prefix suggestion:', request);

      const { data, error } = await supabase.functions.invoke('suggest-udi-company-prefix', {
        body: request
      });

      if (error) {
        console.error('[UDICompanyPrefixService] Edge function error:', error);
        throw error;
      }

      if (!data?.success) {
        console.error('[UDICompanyPrefixService] Suggestion failed:', data?.error);
        throw new Error(data?.error || 'Prefix suggestion failed');
      }

      console.log('[UDICompanyPrefixService] Suggestion completed:', data);
      return data as PrefixSuggestionResponse;
    } catch (error) {
      console.error('[UDICompanyPrefixService] Service error:', error);
      
      // Return a fallback response for graceful degradation
      return {
        success: false,
        confidence: 'insufficient',
        data_source: 'none',
        udi_count: 0,
        algorithm_used: 'none',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Unable to connect to suggestion service'
      };
    }
  }

  /**
   * Validate a suggested prefix against agency rules
   */
  static validatePrefixFormat(agency: string, prefix: string): { valid: boolean; error?: string } {
    if (!prefix.trim()) {
      return { valid: false, error: 'Prefix cannot be empty' };
    }

    switch (agency) {
      case 'GS1':
        if (!/^\d{6,12}$/.test(prefix)) {
          return { valid: false, error: 'GS1 Company Prefix must be 6-12 digits' };
        }
        break;
      case 'HIBCC':
        if (!/^[A-Z0-9]{4,25}$/.test(prefix)) {
          return { valid: false, error: 'HIBCC LIC must be 4-25 alphanumeric characters' };
        }
        break;
      case 'ICCBBA':
        if (!/^[A-Z0-9]{6}$/.test(prefix)) {
          return { valid: false, error: 'ICCBBA Labeler Code must be exactly 6 alphanumeric characters' };
        }
        break;
      default:
        return { valid: false, error: 'Unknown issuing agency' };
    }

    return { valid: true };
  }

  /**
   * Get confidence level description
   */
  static getConfidenceDescription(confidence: string): string {
    switch (confidence) {
      case 'high':
        return 'High confidence: Consistent pattern across multiple UDI-DIs';
      case 'medium':
        return 'Medium confidence: Some consistency detected';
      case 'low':
        return 'Low confidence: Limited data or inconsistent patterns';
      case 'insufficient':
        return 'Insufficient data: Unable to determine reliable pattern';
      default:
        return 'Unknown confidence level';
    }
  }

  /**
   * Get user-friendly confidence color
   */
  static getConfidenceColor(confidence: string): string {
    switch (confidence) {
      case 'high':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-orange-600';
      case 'insufficient':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }
}

export const udiCompanyPrefixService = new UDICompanyPrefixService();