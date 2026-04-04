import { supabase } from '@/integrations/supabase/client';
import { competitiveAnalysisService, CompetitiveAnalysis, CompetitorDevice } from './competitiveAnalysisService';
import { fdaCompetitiveAnalysisService, FDASearchParams } from './fdaCompetitiveAnalysisService';
import { FDADevice, FDACompetitiveData } from '@/types/fda';

export interface CombinedCompetitorDevice extends CompetitorDevice {
  market_source: 'EU' | 'US';
  fda_device?: FDADevice;
  applicant?: string;
  k_number?: string;
  clearance_type?: string;
  decision_date?: string;
  product_code?: string;
  device_class?: string;
}

export interface CombinedCompetitiveAnalysis extends CompetitiveAnalysis {
  us_data: FDACompetitiveData;
  cross_market_insights: {
    global_competitors: string[];
    eu_only_competitors: string[];
    us_only_competitors: string[];
    market_overlap_percentage: number;
    regulatory_complexity_score: number;
  };
  combined_devices: CombinedCompetitorDevice[];
  market_sources: {
    eu: number;
    us: number;
    total: number;
  };
  sample_sources: {
    eu: number;
    us: number;
    total: number;
  };
}

export class CombinedCompetitiveAnalysisService {
  private static cache = new Map<string, CombinedCompetitiveAnalysis>();
  private static pendingRequests = new Map<string, Promise<CombinedCompetitiveAnalysis>>();

  static async analyzeCombinedMarket(
    emdnCode?: string,
    fdaProductCode?: string,
    searchQuery?: string
  ): Promise<CombinedCompetitiveAnalysis> {
    const cacheKey = JSON.stringify({ emdnCode, fdaProductCode, searchQuery });
    
    // Check cache first (removed aggressive cache clearing for better performance)
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log('[CombinedService] Returning cached data for:', cacheKey);
      return cached;
    }

    // Check if request is already pending
    const pending = this.pendingRequests.get(cacheKey);
    if (pending) {
      return pending;
    }

    // Create new request
    const request = this.fetchCombinedData(emdnCode, fdaProductCode, searchQuery);
    this.pendingRequests.set(cacheKey, request);

    try {
      const result = await request;
      this.cache.set(cacheKey, result);
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  private static async fetchCombinedData(
    emdnCode?: string,
    fdaProductCode?: string,
    searchQuery?: string
  ): Promise<CombinedCompetitiveAnalysis> {
    console.log('[CombinedService] Starting combined analysis:', { emdnCode, fdaProductCode, searchQuery });

    // Initialize with empty data
    let euAnalysis: CompetitiveAnalysis = this.createEmptyEUAnalysis();
    let usData: FDACompetitiveData = this.createEmptyUSData();

    try {
      // Fetch EU data if EMDN code is provided
      if (emdnCode) {
        euAnalysis = await competitiveAnalysisService.analyzeCompetitiveLandscape(emdnCode, undefined, 1000);
        console.log('[CombinedService] EU analysis completed:', {
          totalCompetitors: euAnalysis.totalCompetitors,
          devices: euAnalysis.devices.length
        });
      }

      // Fetch US data if FDA product code is provided
      if (fdaProductCode) {
        const fdaParams: FDASearchParams = {
          productCode: fdaProductCode,
          searchQuery: searchQuery,
          limit: 500,
          emdnCode: emdnCode
        };
        
        const rawUSData = await fdaCompetitiveAnalysisService.searchFDADevices(fdaParams);
        
        // FORCE CLASS II FOR LMH DEVICES - Backup fix at combined service level
        if (fdaProductCode === 'LMH') {
          console.log('[CombinedService] LMH product code detected - forcing all devices to Class II');
          
          // Force all devices to Class II and update analytics
          const updatedDevices = rawUSData.devices.map(device => ({
            ...device,
            device_class: '2' // Force Class II for all LMH devices
          }));
          
          // Recalculate analytics with forced Class II
          const updatedAnalytics = { ...rawUSData };
          updatedAnalytics.devices_by_class = { '2': rawUSData.total_devices };
          updatedAnalytics.devices = updatedDevices;
          
          console.log('[CombinedService] Forced Class II for', rawUSData.total_devices, 'LMH devices');
          usData = updatedAnalytics;
        } else {
          usData = rawUSData;
        }
        
        console.log('[CombinedService] US analysis completed:', {
          totalDevices: usData.total_devices,
          devices: usData.devices.length,
          devicesByClass: usData.devices_by_class
        });
      }

      // Combine devices from both markets
      const combinedDevices = this.combineDeviceData(euAnalysis.devices, usData.devices);

      // Perform cross-market analysis
      const crossMarketInsights = this.analyzeCrossMarketData(euAnalysis, usData);

      // Calculate combined statistics
      const combinedStats = this.calculateCombinedStats(euAnalysis, usData, combinedDevices);

      return {
        ...euAnalysis,
        ...combinedStats,
        us_data: usData,
        cross_market_insights: crossMarketInsights,
        combined_devices: combinedDevices,
        market_sources: {
          eu: euAnalysis.totalCompetitors,
          us: usData.total_devices,
          total: euAnalysis.totalCompetitors + usData.total_devices
        },
        sample_sources: {
          eu: euAnalysis.devices.length,
          us: usData.devices.length,
          total: combinedDevices.length
        }
      };
    } catch (error) {
      console.error('[CombinedService] Error in combined analysis:', error);
      return this.createEmptyCombinedAnalysis();
    }
  }

  private static combineDeviceData(euDevices: CompetitorDevice[], usDevices: FDADevice[]): CombinedCompetitorDevice[] {
    const combined: CombinedCompetitorDevice[] = [];

    // Add EU devices
    euDevices.forEach(device => {
      combined.push({
        ...device,
        market_source: 'EU'
      });
    });

    // Add US devices with proper risk class mapping
    usDevices.forEach(device => {
      // Map FDA device class to EU-style risk class
      let riskClass = device.device_class;
      if (!riskClass || riskClass.trim() === '') {
        riskClass = 'Unknown';
      } else {
        // Normalize FDA device classes to match EU format
        const normalizedClass = riskClass.toString().trim().toLowerCase();
        if (normalizedClass.includes('class 1') || normalizedClass === '1') {
          riskClass = 'Class I';
        } else if (normalizedClass.includes('class 2') || normalizedClass === '2') {
          riskClass = 'Class II';
        } else if (normalizedClass.includes('class 3') || normalizedClass === '3') {
          riskClass = 'Class III';
        } else {
          riskClass = device.device_class || 'Unknown';
        }
      }
      
      combined.push({
        udi_di: device.k_number || device.device_name || 'N/A',
        organization: device.applicant || 'Unknown',
        trade_names: device.trade_name,
        device_name: device.device_name,
        device_model: device.device_name,
        basic_udi_di_code: device.k_number,
        risk_class: riskClass,
        country: 'United States',
        nomenclature_codes: device.product_code,
        market_source: 'US',
        fda_device: device,
        applicant: device.applicant,
        k_number: device.k_number,
        clearance_type: device.clearance_type,
        decision_date: device.decision_date,
        product_code: device.product_code,
        device_class: device.device_class
      });
    });

    return combined;
  }

  private static analyzeCrossMarketData(euAnalysis: CompetitiveAnalysis, usData: FDACompetitiveData) {
    // Extract company names from both markets
    const euCompanies = new Set(
      euAnalysis.devices
        .map(d => d.organization?.toLowerCase().trim())
        .filter(Boolean)
    );
    
    const usCompanies = new Set(
      usData.devices
        .map(d => d.applicant?.toLowerCase().trim())
        .filter(Boolean)
    );

    // Find overlapping companies (global competitors)
    const globalCompetitors: string[] = [];
    euCompanies.forEach(euCompany => {
      usCompanies.forEach(usCompany => {
        if (this.companiesMatch(euCompany, usCompany)) {
          globalCompetitors.push(euCompany);
        }
      });
    });

    // Companies only in EU
    const euOnlyCompetitors = Array.from(euCompanies).filter(
      euCompany => !globalCompetitors.some(global => this.companiesMatch(euCompany, global))
    );

    // Companies only in US
    const usOnlyCompetitors = Array.from(usCompanies).filter(
      usCompany => !globalCompetitors.some(global => this.companiesMatch(usCompany, global))
    );

    // Calculate market overlap percentage
    const totalUniqueCompanies = euCompanies.size + usCompanies.size - globalCompetitors.length;
    const marketOverlapPercentage = totalUniqueCompanies > 0 
      ? Math.round((globalCompetitors.length / totalUniqueCompanies) * 100)
      : 0;

    // Calculate regulatory complexity score
    const euClasses = Object.keys(euAnalysis.competitors_by_class || {}).length;
    const usClasses = Object.keys(usData.devices_by_class || {}).length;
    const regulatoryComplexityScore = Math.min(100, (euClasses + usClasses) * 8);

    return {
      global_competitors: Array.from(new Set(globalCompetitors)),
      eu_only_competitors: euOnlyCompetitors.slice(0, 10), // Limit for performance
      us_only_competitors: usOnlyCompetitors.slice(0, 10), // Limit for performance
      market_overlap_percentage: marketOverlapPercentage,
      regulatory_complexity_score: regulatoryComplexityScore
    };
  }

  private static companiesMatch(company1: string, company2: string): boolean {
    // Simple fuzzy matching - can be enhanced
    if (company1 === company2) return true;
    
    // Check if one contains the other (for subsidiaries, etc.)
    const c1Words = company1.split(/\s+/).filter(w => w.length > 2);
    const c2Words = company2.split(/\s+/).filter(w => w.length > 2);
    
    // If any significant word matches, consider it a match
    for (const word1 of c1Words) {
      for (const word2 of c2Words) {
        if (word1.includes(word2) || word2.includes(word1)) {
          return true;
        }
      }
    }
    
    return false;
  }

  private static calculateCombinedStats(
    euAnalysis: CompetitiveAnalysis, 
    usData: FDACompetitiveData,
    combinedDevices: CombinedCompetitorDevice[]
  ) {
    // Combine geographical distribution
    const combinedGeography = { ...euAnalysis.geographic_distribution };
    if (usData.devices_by_state) {
      Object.entries(usData.devices_by_state).forEach(([state, count]) => {
        combinedGeography[`US-${state}`] = count;
      });
    }

    // Combine risk class distribution with proper normalization
    const combinedRiskClasses = { ...euAnalysis.competitors_by_class };
    console.log('[CombinedService] EU risk classes:', euAnalysis.competitors_by_class);
    console.log('[CombinedService] US devices_by_class raw:', usData.devices_by_class);
    
    if (usData.devices_by_class) {
      Object.entries(usData.devices_by_class).forEach(([deviceClass, count]) => {
        // Normalize FDA device classes to match EU format
        let normalizedClass = deviceClass;
        if (!normalizedClass || normalizedClass.trim() === '') {
          normalizedClass = 'Unknown';
        } else {
          const classStr = normalizedClass.toString().trim().toLowerCase();
          if (classStr.includes('class 1') || classStr === '1') {
            normalizedClass = 'Class I';
          } else if (classStr.includes('class 2') || classStr === '2') {
            normalizedClass = 'Class II';
          } else if (classStr.includes('class 3') || classStr === '3') {
            normalizedClass = 'Class III';
          } else if (classStr.includes('class i') && !classStr.includes('class ii')) {
            normalizedClass = 'Class I';
          } else if (classStr.includes('class ii')) {
            normalizedClass = 'Class II';
          }
          // Keep original format for already normalized classes
        }
        
        console.log(`[CombinedService] Mapping FDA class ${deviceClass} -> ${normalizedClass} (count: ${count})`);
        combinedRiskClasses[normalizedClass] = (combinedRiskClasses[normalizedClass] || 0) + count;
      });
    }
    
    console.log('[CombinedService] Final combined risk classes:', combinedRiskClasses);

    // Combine market penetration (by organization)
    const combinedMarketPenetration = { ...euAnalysis.market_penetration };
    if (usData.devices_by_applicant) {
      Object.entries(usData.devices_by_applicant).forEach(([applicant, count]) => {
        const normalizedApplicant = applicant || 'Unknown US Applicant';
        combinedMarketPenetration[normalizedApplicant] = (combinedMarketPenetration[normalizedApplicant] || 0) + count;
      });
    }

    // Calculate combined market insights including dominant risk class
    const totalCombinedDevices = euAnalysis.totalCompetitors + usData.total_devices;
    const dominantRiskClass = Object.entries(combinedRiskClasses)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';
    
    console.log('[CombinedService] Dominant risk class from combined data:', dominantRiskClass);

    return {
      total_competitors: totalCombinedDevices,
      totalCompetitors: totalCombinedDevices,
      competitors_by_class: combinedRiskClasses,
      competitorsByRiskClass: combinedRiskClasses,
      market_penetration: combinedMarketPenetration,
      regulatory_distribution: combinedRiskClasses,
      geographic_distribution: combinedGeography,
      devices: combinedDevices,
      competitorsByOrganization: combinedMarketPenetration,
      competitorsByCountry: combinedGeography,
      marketInsights: {
        uniqueOrganizations: Object.keys(combinedMarketPenetration).length,
        averageDevicesPerOrganization: Math.round(totalCombinedDevices / Math.max(1, Object.keys(combinedMarketPenetration).length)),
        devicesByOrganization: combinedMarketPenetration,
        marketLeaders: Object.entries(combinedMarketPenetration)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([org]) => org),
        topCountries: Object.entries(combinedGeography)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([country]) => country),
        dominantRiskClass
      }
    };
  }

  private static createEmptyEUAnalysis(): CompetitiveAnalysis {
    return {
      total_competitors: 0,
      totalCompetitors: 0,
      competitors_by_class: {},
      competitorsByRiskClass: {},
      market_penetration: {},
      regulatory_distribution: {},
      geographic_distribution: {},
      devices: [],
      competitorsByOrganization: {},
      competitorsByCountry: {},
      marketInsights: {
        uniqueOrganizations: 0,
        averageDevicesPerOrganization: 0,
        devicesByOrganization: {},
        marketLeaders: [],
        topCountries: [],
        dominantRiskClass: 'Unknown'
      },
      topCompetitors: []
    };
  }

  private static createEmptyUSData(): FDACompetitiveData {
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

  private static createEmptyCombinedAnalysis(): CombinedCompetitiveAnalysis {
    return {
      ...this.createEmptyEUAnalysis(),
      us_data: this.createEmptyUSData(),
      cross_market_insights: {
        global_competitors: [],
        eu_only_competitors: [],
        us_only_competitors: [],
        market_overlap_percentage: 0,
        regulatory_complexity_score: 0
      },
      combined_devices: [],
      market_sources: {
        eu: 0,
        us: 0,
        total: 0
      },
      sample_sources: {
        eu: 0,
        us: 0,
        total: 0
      }
    };
  }

  static clearCache() {
    this.cache.clear();
    this.pendingRequests.clear();
    console.log('[CombinedService] All caches cleared');
  }
}

export const combinedCompetitiveAnalysisService = CombinedCompetitiveAnalysisService;