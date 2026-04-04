import { supabase } from '@/integrations/supabase/client';
import {
  PredicateDevice,
  PredicateReference,
  PredicateTrail,
  DocumentSearchParams,
  DocumentSearchResult,
  DocumentIntelligence,
  EUUSBridge
} from '@/types/fdaPredicateTrail';

export class FDAPredicateService {
  private static cache = new Map<string, any>();

  // Extract predicate device references from statement/summary text
  static extractPredicateReferences(statementText: string, sourceKNumber: string): PredicateReference[] {
    if (!statementText) return [];

    const references: PredicateReference[] = [];
    
    // Pattern to match K-numbers (K123456, K12-3456, etc.)
    const kNumberPattern = /K\d{2}[-]?\d{4,5}/gi;
    const matches = statementText.match(kNumberPattern);
    
    if (matches) {
      matches.forEach(match => {
        const kNumber = match.replace('-', '').toUpperCase();
        if (kNumber !== sourceKNumber) {
          // Find the surrounding context
          const index = statementText.indexOf(match);
          const start = Math.max(0, index - 100);
          const end = Math.min(statementText.length, index + 100);
          const context = statementText.substring(start, end);
          
          references.push({
            sourceKNumber,
            predicateKNumber: kNumber,
            confidence: this.calculatePredicateConfidence(context, match),
            extractedText: context,
            referenceType: this.determineReferenceType(context)
          });
        }
      });
    }

    return references;
  }

  private static calculatePredicateConfidence(context: string, match: string): number {
    const lowerContext = context.toLowerCase();
    let confidence = 0.5; // Base confidence
    
    // Higher confidence for explicit predicate language
    if (lowerContext.includes('predicate') || lowerContext.includes('substantial equivalence')) {
      confidence += 0.3;
    }
    
    // Higher confidence for comparison language
    if (lowerContext.includes('similar to') || lowerContext.includes('equivalent to')) {
      confidence += 0.2;
    }
    
    // Lower confidence for references in context of differences
    if (lowerContext.includes('different from') || lowerContext.includes('unlike')) {
      confidence -= 0.2;
    }
    
    return Math.min(Math.max(confidence, 0.1), 1.0);
  }

  private static determineReferenceType(context: string): 'explicit' | 'similar' | 'technology' {
    const lowerContext = context.toLowerCase();
    
    if (lowerContext.includes('predicate') || lowerContext.includes('substantial equivalence')) {
      return 'explicit';
    }
    
    if (lowerContext.includes('similar') || lowerContext.includes('comparable')) {
      return 'similar';
    }
    
    return 'technology';
  }

  // Comprehensive document search with predicate trail analysis
  static async searchDocuments(params: DocumentSearchParams): Promise<{
    results: DocumentSearchResult[];
    totalResults: number;
    intelligence: DocumentIntelligence;
  }> {
    try {
      console.log('[FDAPredicateService] Starting document search:', params);
      
      const { data, error } = await supabase.functions.invoke('fda-predicate-search', {
        body: params
      });

      if (error) {
        console.error('[FDAPredicateService] Error from predicate search function:', error);
        throw new Error(`FDA predicate search failed: ${error.message}`);
      }

      if (!data.success) {
        console.error('[FDAPredicateService] Search returned error:', data.error);
        throw new Error(`FDA predicate API error: ${data.error}`);
      }

      return data.data;
    } catch (error) {
      console.error('[FDAPredicateService] Error searching documents:', error);
      throw error;
    }
  }

  // Build complete predicate trail for a device using AI-enhanced analysis
  static async buildPredicateTrail(kNumber: string, maxDepth: number = 3): Promise<PredicateTrail> {
    // Ensure K-number has the 'K' prefix
    const cleanKNumber = kNumber.startsWith('K') ? kNumber : `K${kNumber}`;
    
    console.log('[FDAPredicateService] Building predicate trail for:', cleanKNumber);
    console.log('Using AI method with Gemini API');
    
    // Use AI method first since it has access to more comprehensive data
    try {
      return await this.buildAIPredicateTrail(cleanKNumber, maxDepth);
    } catch (error) {
      console.warn('[FDAPredicateService] AI method failed, falling back to traditional:', error);
      return this.buildTraditionalPredicateTrail(cleanKNumber, maxDepth);
    }
  }

  private static async buildAIPredicateTrail(kNumber: string, maxDepth: number) {
    // Get the Gemini API key from company settings
    // For now, we'll need to get this from the component that has access to it
    // This method needs to be called with the API key parameter
    const { data, error } = await supabase.functions.invoke('ai-predicate-trail', {
      body: {
        kNumber: kNumber,
        maxDepth,
        // geminiApiKey will need to be passed from the calling component
      }
    });

    if (error) {
      console.error('Error calling AI predicate trail function:', error);
      throw error;
    }

    if (!data.success) {
      console.error('AI predicate trail failed:', data.error);
      throw new Error(data.error || 'AI predicate trail analysis failed');
    }

    return data.data;
  }

  private static async buildTraditionalPredicateTrail(kNumber: string, maxDepth: number = 3): Promise<PredicateTrail> {
    // Ensure K-number has the 'K' prefix for traditional method too
    const cleanKNumber = kNumber.startsWith('K') ? kNumber : `K${kNumber}`;
    const { data, error } = await supabase.functions.invoke('fda-build-predicate-trail', {
      body: { kNumber: cleanKNumber, maxDepth }
    });

    if (error) {
      console.error('[FDAPredicateService] Error building trail:', error);
      throw new Error(`Failed to build predicate trail: ${error.message}`);
    }

    if (!data.success) {
      console.error('[FDAPredicateService] Trail building returned error:', data.error);
      throw new Error(`Predicate trail error: ${data.error}`);
    }

    return data.data;
  }

  // Generate EU-US regulatory bridge recommendations
  static async generateEUUSBridge(eudamedDeviceId: string): Promise<EUUSBridge> {
    try {
      console.log('[FDAPredicateService] Generating EU-US bridge for device:', eudamedDeviceId);
      
      const { data, error } = await supabase.functions.invoke('fda-eu-us-bridge', {
        body: { eudamedDeviceId }
      });

      if (error) {
        console.error('[FDAPredicateService] Error generating bridge:', error);
        throw new Error(`Failed to generate EU-US bridge: ${error.message}`);
      }

      if (!data.success) {
        console.error('[FDAPredicateService] Bridge generation returned error:', data.error);
        throw new Error(`EU-US bridge error: ${data.error}`);
      }

      return data.data;
    } catch (error) {
      console.error('[FDAPredicateService] Error generating EU-US bridge:', error);
      throw error;
    }
  }

  // Search for similar devices based on text similarity
  static async findSimilarDevices(deviceDescription: string, limit: number = 10): Promise<DocumentSearchResult[]> {
    const params: DocumentSearchParams = {
      query: deviceDescription,
      searchType: 'similarity',
      limit
    };
    
    const results = await this.searchDocuments(params);
    return results.results;
  }

  // Get predicate recommendations for a device type
  static async getPredicateRecommendations(
    deviceName: string,
    deviceClass?: string,
    productCode?: string
  ): Promise<Array<{ kNumber: string; confidence: number; reasoning: string }>> {
    try {
      const { data, error } = await supabase.functions.invoke('fda-predicate-recommendations', {
        body: { deviceName, deviceClass, productCode }
      });

      if (error || !data.success) {
        console.error('[FDAPredicateService] Error getting recommendations:', error || data.error);
        return [];
      }

      return data.data.recommendations;
    } catch (error) {
      console.error('[FDAPredicateService] Error getting predicate recommendations:', error);
      return [];
    }
  }

  // Generate FDA document URL
  static generateDocumentUrl(kNumber: string): string {
    // FDA provides direct access to 510(k) documents
    const cleanKNumber = kNumber.replace(/[^A-Z0-9]/g, '');
    return `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=${cleanKNumber}`;
  }

  // Clear service cache
  static clearCache() {
    this.cache.clear();
  }
}