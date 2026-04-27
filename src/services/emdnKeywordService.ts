import { supabase } from '@/integrations/supabase/client';
import { showNoCreditDialog } from '@/context/AiCreditContext';

const STOP_WORDS = ['and', 'or', 'for', 'with', 'in', 'on', 'at', 'to', 'from', 'by', 'of', 'the', 'a', 'an'];

interface ApiKey {
  id: string;
  company_id: string;
  key_type: 'openai' | 'gemini' | 'anthropic' | 'serpapi';
  encrypted_key: string;
  created_at: string;
  updated_at: string;
}

export class EmdnKeywordService {
  /**
   * Simple word extraction from EMDN description - no AI needed
   */
  static extractSimpleKeywords(description: string): string[] {
    if (!description) return [];

    console.log('[EmdnKeywordService] Simple extraction for:', description);

    // Clean and split into words
    const words = description
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(word => word.length > 2 && !STOP_WORDS.includes(word))
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)); // Capitalize first letter

    console.log('[EmdnKeywordService] Extracted words:', words);
    
    // Return first 5 meaningful words
    return words.slice(0, 5);
  }

  /**
   * Check if API keys are available for AI-enhanced keyword generation
   */
  static async checkApiKeysAvailable(companyId: string): Promise<boolean> {
    try {
      const { data: apiKeys } = await supabase
        .from('company_api_keys')
        .select('key_type')
        .eq('company_id', companyId)
        .in('key_type', ['openai', 'gemini', 'anthropic']);

      return Boolean(apiKeys && apiKeys.length > 0);
    } catch (error) {
      console.error('[EmdnKeywordService] Error checking API keys:', error);
      return false;
    }
  }

  /**
   * Generate AI-enhanced keywords using available AI services
   */
  static async generateAIKeywords(emdnCode: string, description: string, companyId: string): Promise<string[]> {
    try {
      console.log('[EmdnKeywordService] Generating AI keywords for:', { emdnCode, description });

      const { data, error } = await supabase.functions.invoke('ai-keyword-generator', {
        body: {
          emdnCode,
          description,
          companyId
        }
      });

      if (error) {
        console.error('[EmdnKeywordService] AI keyword generation error:', error);
        return this.extractSimpleKeywords(description);
      }

      if (data?.error === 'NO_CREDITS') {
        showNoCreditDialog();
        return this.extractSimpleKeywords(description);
      }

      if (data?.success && data?.keywords) {
        console.log('[EmdnKeywordService] AI generated keywords:', data.keywords);
        return data.keywords;
      }

      // Fallback to simple extraction
      return this.extractSimpleKeywords(description);
    } catch (error) {
      console.error('[EmdnKeywordService] AI keyword generation failed:', error);
      return this.extractSimpleKeywords(description);
    }
  }

  /**
   * Main method: Get suggested keywords with AI enhancement when available
   */
  static async getSuggestedKeywords(emdnCode: string, description?: string, companyId?: string): Promise<string[]> {
    console.log('[EmdnKeywordService] getSuggestedKeywords called with:', { emdnCode, description, companyId });
    
    // Extract description from EMDN code if not provided separately
    let finalDescription = description;
    if (!finalDescription && emdnCode) {
      // EMDN codes often come in format "CODE: DESCRIPTION"
      const colonIndex = emdnCode.indexOf(':');
      if (colonIndex > -1) {
        finalDescription = emdnCode.substring(colonIndex + 1).trim();
        console.log('[EmdnKeywordService] Extracted description from EMDN code:', finalDescription);
      }
    }
    
    if (!finalDescription) {
      console.log('[EmdnKeywordService] No description available');
      return [];
    }

    // If no company ID provided, use simple extraction
    if (!companyId) {
      console.log('[EmdnKeywordService] No company ID, using simple extraction');
      return this.extractSimpleKeywords(finalDescription);
    }

    // Check if AI API keys are available
    const hasApiKeys = await this.checkApiKeysAvailable(companyId);
    console.log('[EmdnKeywordService] API keys available:', hasApiKeys);

    if (hasApiKeys) {
      // Use AI-enhanced keyword generation
      return this.generateAIKeywords(emdnCode, finalDescription, companyId);
    } else {
      // Fallback to simple word extraction
      return this.extractSimpleKeywords(finalDescription);
    }
  }
}