import { supabase } from '@/integrations/supabase/client';
import { FDAProductCodeService } from './fdaProductCodeService';
import type { FDAProductCodeInfo } from '@/types/fdaEnhanced';

export interface CategoryCompetitor {
  id: string;
  name: string;
  country: string;
  deviceCount: number;
  riskClass?: string;
  deviceNames?: string[];
  marketDistribution?: string;
}

export interface CategoryAnalysisResults {
  categoryCode: string;
  codeInfo?: FDAProductCodeInfo;
  euCompetitors: CategoryCompetitor[];
  fdaCompetitors: CategoryCompetitor[];
  geographicDistribution: {
    eu: Record<string, number>;
    us: Record<string, number>;
  };
  summary: {
    totalEuDevices: number;
    totalUsDevices: number;
    uniqueEuCompanies: number;
    uniqueUsCompanies: number;
    globalPlayers: string[];
  };
  isValidCode: boolean;
  errorMessage?: string;
}

export class CategoryCompetitiveAnalysisService {
  /**
   * Analyze competitive landscape by FDA product code or EMDN category
   */
  static async analyzeByCategoryCode(categoryCode: string): Promise<CategoryAnalysisResults> {
    const cleanCode = categoryCode.trim().toUpperCase();
    
    try {
      // First, try to get product code information
      const codeInfo = await FDAProductCodeService.getProductCodeInfo(cleanCode);
      
      // Get FDA competitors if it's a valid FDA product code
      const fdaResults = await this.getFDACompetitorsByProductCode(cleanCode);
      
      // Try to get EU competitors by treating it as an EMDN code
      const euResults = await this.getEUCompetitorsByCategory(cleanCode);
      
      // Calculate geographic distribution
      const geographicDistribution = this.calculateGeographicDistribution(euResults, fdaResults);
      
      // Find global players (companies in both markets)
      const globalPlayers = this.findGlobalPlayers(euResults, fdaResults);
      
      const summary = {
        totalEuDevices: euResults.reduce((sum, comp) => sum + comp.deviceCount, 0),
        totalUsDevices: fdaResults.reduce((sum, comp) => sum + comp.deviceCount, 0),
        uniqueEuCompanies: euResults.length,
        uniqueUsCompanies: fdaResults.length,
        globalPlayers
      };
      
      return {
        categoryCode: cleanCode,
        codeInfo: codeInfo || undefined,
        euCompetitors: euResults,
        fdaCompetitors: fdaResults,
        geographicDistribution,
        summary,
        isValidCode: codeInfo !== null || euResults.length > 0 || fdaResults.length > 0,
        errorMessage: !codeInfo && euResults.length === 0 && fdaResults.length === 0 
          ? `No data found for category code "${cleanCode}". Please verify the code is valid.`
          : undefined
      };
    } catch (error) {
      console.error('[CategoryAnalysis] Error analyzing category:', error);
      return {
        categoryCode: cleanCode,
        euCompetitors: [],
        fdaCompetitors: [],
        geographicDistribution: { eu: {}, us: {} },
        summary: {
          totalEuDevices: 0,
          totalUsDevices: 0,
          uniqueEuCompanies: 0,
          uniqueUsCompanies: 0,
          globalPlayers: []
        },
        isValidCode: false,
        errorMessage: `Error analyzing category "${cleanCode}": ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get FDA competitors by product code
   */
  private static async getFDACompetitorsByProductCode(productCode: string): Promise<CategoryCompetitor[]> {
    try {
      const { data, error } = await supabase.functions.invoke('fda-device-search', {
        body: { 
          productCode: productCode,
          limit: 500
        }
      });

      if (error || !data.success) {
        console.warn('[CategoryAnalysis] FDA search failed:', error);
        return [];
      }

      const devicesByApplicant: Record<string, any[]> = {};
      data.data.devices.forEach((device: any) => {
        const applicant = device.applicant || 'Unknown';
        if (!devicesByApplicant[applicant]) {
          devicesByApplicant[applicant] = [];
        }
        devicesByApplicant[applicant].push(device);
      });

      return Object.entries(devicesByApplicant).map(([applicant, devices]) => ({
        id: applicant.toLowerCase().replace(/\s+/g, '-'),
        name: applicant,
        country: this.extractUSState(devices[0]?.state || devices[0]?.address_1 || 'US'),
        deviceCount: devices.length,
        riskClass: devices[0]?.device_class,
        deviceNames: [...new Set(devices.map(d => d.device_name).filter(Boolean))].slice(0, 3)
      }));
    } catch (error) {
      console.error('[CategoryAnalysis] Error fetching FDA competitors:', error);
      return [];
    }
  }

  /**
   * Get EU competitors by EMDN category or product code
   */
  private static async getEUCompetitorsByCategory(categoryCode: string): Promise<CategoryCompetitor[]> {
    try {
      // First try as exact EMDN code
      const { data: devices, error } = await supabase.rpc('get_eudamed_devices_by_emdn', {
        emdn_code: categoryCode,
        limit_count: 500
      });

      if (error) {
        console.warn('[CategoryAnalysis] EU search failed:', error);
        return [];
      }

      if (!devices || devices.length === 0) {
        // Try partial match if exact match fails
        return this.getEUCompetitorsByPartialMatch(categoryCode);
      }

      const devicesByOrganization: Record<string, any[]> = {};
      devices.forEach((device: any) => {
        const org = device.organization || 'Unknown';
        if (!devicesByOrganization[org]) {
          devicesByOrganization[org] = [];
        }
        devicesByOrganization[org].push(device);
      });

      return Object.entries(devicesByOrganization).map(([org, orgDevices]) => ({
        id: org.toLowerCase().replace(/\s+/g, '-'),
        name: org,
        country: orgDevices[0]?.country || 'Unknown',
        deviceCount: orgDevices.length,
        riskClass: orgDevices[0]?.risk_class,
        deviceNames: [...new Set(orgDevices.map(d => d.device_name).filter(Boolean))].slice(0, 3),
        marketDistribution: orgDevices[0]?.market_distribution
      }));
    } catch (error) {
      console.error('[CategoryAnalysis] Error fetching EU competitors:', error);
      return [];
    }
  }

  /**
   * Try partial match for EMDN codes
   */
  private static async getEUCompetitorsByPartialMatch(categoryCode: string): Promise<CategoryCompetitor[]> {
    try {
      // Use RPC function for EUDAMED access instead of direct table access
      const { data: devices, error } = await supabase.rpc('get_eudamed_devices_by_emdn', {
        emdn_code: categoryCode,
        limit_count: 200
      });

      if (error || !devices) {
        return [];
      }

      const devicesByOrganization: Record<string, any[]> = {};
      devices.forEach((device: any) => {
        const org = device.organization || 'Unknown';
        if (!devicesByOrganization[org]) {
          devicesByOrganization[org] = [];
        }
        devicesByOrganization[org].push(device);
      });

      return Object.entries(devicesByOrganization).map(([org, orgDevices]) => ({
        id: org.toLowerCase().replace(/\s+/g, '-'),
        name: org,
        country: orgDevices[0]?.country || 'Unknown',
        deviceCount: orgDevices.length,
        riskClass: orgDevices[0]?.risk_class,
        deviceNames: [...new Set(orgDevices.map(d => d.device_name).filter(Boolean))].slice(0, 3),
        marketDistribution: orgDevices[0]?.market_distribution
      }));
    } catch (error) {
      console.error('[CategoryAnalysis] Error in partial match:', error);
      return [];
    }
  }

  /**
   * Calculate geographic distribution for visualization
   */
  private static calculateGeographicDistribution(
    euCompetitors: CategoryCompetitor[], 
    fdaCompetitors: CategoryCompetitor[]
  ) {
    const euDistribution: Record<string, number> = {};
    const usDistribution: Record<string, number> = {};

    euCompetitors.forEach(competitor => {
      const country = competitor.country || 'Unknown';
      euDistribution[country] = (euDistribution[country] || 0) + competitor.deviceCount;
    });

    fdaCompetitors.forEach(competitor => {
      const state = competitor.country || 'Unknown';
      usDistribution[state] = (usDistribution[state] || 0) + competitor.deviceCount;
    });

    return {
      eu: euDistribution,
      us: usDistribution
    };
  }

  /**
   * Find companies operating in both EU and US markets
   */
  private static findGlobalPlayers(
    euCompetitors: CategoryCompetitor[], 
    fdaCompetitors: CategoryCompetitor[]
  ): string[] {
    const euCompanyNames = new Set(
      euCompetitors.map(c => c.name.toLowerCase().trim())
    );
    
    const globalPlayers: string[] = [];
    
    fdaCompetitors.forEach(fdaComp => {
      const fdaName = fdaComp.name.toLowerCase().trim();
      
      // Check for exact matches
      if (euCompanyNames.has(fdaName)) {
        globalPlayers.push(fdaComp.name);
        return;
      }
      
      // Check for fuzzy matches (simple contains check)
      for (const euName of euCompanyNames) {
        if (this.isLikelyMatch(euName, fdaName)) {
          globalPlayers.push(`${fdaComp.name} ≈ ${euCompetitors.find(c => c.name.toLowerCase().trim() === euName)?.name}`);
          break;
        }
      }
    });

    return [...new Set(globalPlayers)];
  }

  /**
   * Simple fuzzy matching for company names
   */
  private static isLikelyMatch(name1: string, name2: string): boolean {
    // Remove common corporate suffixes and clean names
    const clean1 = name1.replace(/\b(inc|ltd|llc|corp|corporation|gmbh|sa|sas|bv|ag)\b/gi, '').trim();
    const clean2 = name2.replace(/\b(inc|ltd|llc|corp|corporation|gmbh|sa|sas|bv|ag)\b/gi, '').trim();
    
    // Check if either name contains the other (minimum 4 characters)
    if (clean1.length >= 4 && clean2.length >= 4) {
      return clean1.includes(clean2) || clean2.includes(clean1);
    }
    
    return false;
  }

  /**
   * Extract US state from address or return 'US' as default
   */
  private static extractUSState(location: string): string {
    if (!location) return 'US';
    
    // Common US state abbreviations
    const stateMatch = location.match(/\b[A-Z]{2}\b/);
    return stateMatch ? stateMatch[0] : 'US';
  }
}

export const categoryCompetitiveAnalysisService = CategoryCompetitiveAnalysisService;