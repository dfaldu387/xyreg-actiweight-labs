import { supabase } from '@/integrations/supabase/client';
import { FDADevice, FDA510kDevice, FDACompetitiveData, EnhancedCompetitiveAnalysis } from '@/types/fda';

export interface FDASearchParams {
  searchQuery?: string;
  productCode?: string;
  deviceClass?: string;
  applicant?: string;
  limit?: number;
  skip?: number;
  emdnCode?: string;
}

export class FDACompetitiveAnalysisService {
  private static cache = new Map<string, any>();
  private static pendingRequests = new Map<string, Promise<any>>();

  static async searchFDADevices(params: FDASearchParams): Promise<FDACompetitiveData> {
    const cacheKey = JSON.stringify(params);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Check if request is already pending
    const pending = this.pendingRequests.get(cacheKey);
    if (pending) {
      return pending;
    }

    // Create new request
    const request = this.fetchFDAData(params);
    this.pendingRequests.set(cacheKey, request);

    try {
      const result = await request;
      this.cache.set(cacheKey, result);
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  private static async fetchFDAData(params: FDASearchParams): Promise<FDACompetitiveData> {
    try {
      console.log('[FDAService] Searching FDA devices with params:', params);

      // Clear FDA service cache to get fresh data with device class inference
      console.log('[FDAService] Clearing cache to get fresh device classifications');
      fdaCompetitiveAnalysisService.clearCache();
      
      // Clear FDA service cache to get fresh data with device class inference
      console.log('[FDAService] Clearing cache to get fresh device classifications');
      fdaCompetitiveAnalysisService.clearCache();
      
      const { data, error } = await supabase.functions.invoke('fda-device-search', {
        body: params
      });

      if (error) {
        console.error('[FDAService] Error from FDA search function:', error);
        throw new Error(`FDA search failed: ${error.message}`);
      }

      if (!data.success) {
        console.error('[FDAService] FDA search returned error:', data.error);
        throw new Error(`FDA API error: ${data.error}`);
      }

      const fdaData = data.data;
      console.log('[FDAService] FDA data received:', {
        deviceCount: fdaData.devices.length,
        totalDevices: fdaData.analytics.total_devices
      });

      return {
        total_devices: fdaData.analytics.total_devices,
        devices_by_class: fdaData.analytics.devices_by_class,
        devices_by_state: fdaData.analytics.devices_by_state,
        devices_by_applicant: fdaData.analytics.devices_by_applicant,
        recent_clearances: fdaData.devices.slice(0, 10), // Most recent 10
        regulatory_pathways: fdaData.analytics.regulatory_pathways,
        geographic_distribution: fdaData.analytics.geographic_distribution,
        devices: fdaData.devices
      };
    } catch (error) {
      console.error('[FDAService] Error fetching FDA data:', error);
      return this.createEmptyFDAData();
    }
  }

  static async enhancedCompetitiveAnalysis(
    emdnCode: string,
    searchQuery?: string
  ): Promise<EnhancedCompetitiveAnalysis> {
    try {
      console.log('[FDAService] Starting enhanced competitive analysis for EMDN:', emdnCode);

      // Get EU data from existing EUDAMED service
      const { data: euDevices, error: euError } = await supabase.rpc('get_eudamed_devices_by_emdn_with_markets', {
        emdn_code: emdnCode.split(':')[0].trim(),
        limit_count: 1000
      });

      if (euError) {
        console.error('[FDAService] Error fetching EU data:', euError);
      }

      // Process EU data
      const euData = {
        total_competitors: euDevices?.length || 0,
        competitors_by_class: {},
        geographic_distribution: {},
        devices: euDevices || []
      };

      // Calculate EU analytics
      euDevices?.forEach((device: any) => {
        const riskClass = device.risk_class || 'Unknown';
        euData.competitors_by_class[riskClass] = (euData.competitors_by_class[riskClass] || 0) + 1;

        const country = device.country || 'Unknown';
        euData.geographic_distribution[country] = (euData.geographic_distribution[country] || 0) + 1;
      });

      // Get US FDA data with targeted search
      const usData = await this.searchFDADevices({
        emdnCode: emdnCode,
        searchQuery: searchQuery,
        limit: 500
      });

      // Cross-reference analysis
      const crossReference = this.performCrossReferenceAnalysis(euDevices || [], usData.devices);

      // Calculate market insights
      const marketInsights = this.calculateMarketInsights(euData, usData);

      return {
        emdn_code: emdnCode,
        eu_data: euData,
        us_data: usData,
        cross_reference_matches: crossReference,
        market_insights: marketInsights,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('[FDAService] Error in enhanced competitive analysis:', error);
      throw error;
    }
  }

  private static performCrossReferenceAnalysis(euDevices: any[], usDevices: FDADevice[]) {
    const euOrganizations = new Set(euDevices.map(d => d.organization?.toLowerCase().trim()).filter(Boolean));
    const usApplicants = new Set(usDevices.map(d => d.applicant?.toLowerCase().trim()).filter(Boolean));

    const matchedCompanies: string[] = [];
    const potentialGlobalCompetitors: string[] = [];

    // Find exact matches
    euOrganizations.forEach(euOrg => {
      usApplicants.forEach(usApp => {
        if (euOrg === usApp) {
          matchedCompanies.push(euOrg);
        }
        // Fuzzy matching for similar company names
        else if (this.calculateSimilarity(euOrg, usApp) > 0.8) {
          potentialGlobalCompetitors.push(`${euOrg} ≈ ${usApp}`);
        }
      });
    });

    return {
      matched_companies: Array.from(new Set(matchedCompanies)),
      potential_global_competitors: Array.from(new Set(potentialGlobalCompetitors))
    };
  }

  private static calculateSimilarity(str1: string, str2: string): number {
    // Simple similarity calculation - could be enhanced with more sophisticated algorithms
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  private static calculateMarketInsights(euData: any, usData: FDACompetitiveData) {
    // Calculate market concentration (Herfindahl index approximation)
    const euConcentration = this.calculateHerfindahlIndex(Object.values(euData.competitors_by_class));
    const usConcentration = this.calculateHerfindahlIndex(Object.values(usData.devices_by_applicant));

    // Regulatory complexity score based on device class distribution
    const euClasses = Object.keys(euData.competitors_by_class).length;
    const usClasses = Object.keys(usData.devices_by_class).length;
    const regulatoryComplexity = Math.min(100, (euClasses + usClasses) * 10);

    // Global market opportunity assessment
    let globalOpportunity = 'Moderate';
    if (euData.total_competitors < 50 && usData.total_devices < 100) {
      globalOpportunity = 'High';
    } else if (euData.total_competitors > 200 || usData.total_devices > 500) {
      globalOpportunity = 'Low';
    }

    return {
      eu_market_concentration: Math.round(euConcentration * 100),
      us_market_concentration: Math.round(usConcentration * 100),
      regulatory_complexity_score: regulatoryComplexity,
      global_market_opportunity: globalOpportunity
    };
  }

  private static calculateHerfindahlIndex(values: number[]): number {
    const total = values.reduce((sum, val) => sum + val, 0);
    if (total === 0) return 0;
    
    const squares = values.map(val => Math.pow(val / total, 2));
    return squares.reduce((sum, square) => sum + square, 0);
  }

  private static createEmptyFDAData(): FDACompetitiveData {
    return {
      total_devices: 0,
      devices_by_class: {},
      devices_by_state: {},
      devices_by_applicant: {},
      recent_clearances: [],
      regulatory_pathways: {},
      geographic_distribution: {},
      devices: []
    };
  }

  // Clear cache for testing or when data might be stale
  static clearCache() {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

export const fdaCompetitiveAnalysisService = FDACompetitiveAnalysisService;