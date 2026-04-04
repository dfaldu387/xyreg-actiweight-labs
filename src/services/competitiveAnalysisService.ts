import { supabase } from '@/integrations/supabase/client';

export interface CompetitorDevice {
  udi_di: string;
  organization: string;
  trade_names?: string;
  device_name?: string;
  device_model?: string;
  basic_udi_di_code?: string;
  risk_class?: string;
  country?: string;
  nomenclature_codes?: any;
  [key: string]: any;
}

export interface CompetitiveAnalysis {
  total_competitors: number;
  totalCompetitors: number; // Legacy compatibility
  competitors_by_class: Record<string, number>;
  competitorsByRiskClass: Record<string, number>; // Legacy compatibility
  market_penetration: Record<string, number>;
  regulatory_distribution: Record<string, number>;
  geographic_distribution: Record<string, number>;
  devices: CompetitorDevice[];
  // Legacy compatibility fields
  competitorsByOrganization?: Record<string, number>;
  competitorsByCountry?: Record<string, number>;
  marketInsights?: any;
  topCompetitors?: CompetitorDevice[];
}

export class CompetitiveAnalysisService {
  async analyzeCompetitiveSpace(
    emdnCode: string,
    userDevice?: any,
    limit: number = 1000
  ): Promise<CompetitiveAnalysis> {
    return this.analyzeCompetitiveLandscape(emdnCode, userDevice, limit);
  }

  async analyzeCompetitiveLandscape(
    emdnCode: string,
    userDevice?: any,
    limit: number = 1000
  ): Promise<CompetitiveAnalysis> {
    if (!emdnCode) {
      return this.createEmptyAnalysis();
    }

    try {
      // Extract only the code part before the colon for matching
      const cleanEmdnCode = emdnCode.split(':')[0].trim();
      console.log('[CompetitiveAnalysis] Starting analysis for EMDN code:', emdnCode);
      console.log('[CompetitiveAnalysis] Cleaned EMDN code for query:', cleanEmdnCode);
      console.log('[CompetitiveAnalysis] Using limit:', limit);
      
      // Try hierarchical fallback - start with exact code, then try parent codes
      let devices: any[] | null = null;
      let usedEmdnCode = cleanEmdnCode;
      let currentCode = cleanEmdnCode;
      
      // Try up to 5 levels of parent codes (e.g., D02010102 -> D0201010 -> D020101 -> D02010 -> D0201)
      for (let attempt = 0; attempt < 6 && currentCode.length >= 2; attempt++) {
        console.log(`[CompetitiveAnalysis] Attempt ${attempt + 1}: Trying EMDN code: ${currentCode}`);
        
        const { data, error } = await supabase.rpc('get_eudamed_devices_by_emdn', {
          emdn_code: currentCode,
          limit_count: limit
        });

        if (error) {
          console.error('[CompetitiveAnalysis] Error querying EUDAMED data:', error);
          break;
        }

        if (data && Array.isArray(data) && data.length > 0) {
          devices = data;
          usedEmdnCode = currentCode;
          console.log(`[CompetitiveAnalysis] Found ${data.length} devices at EMDN level: ${currentCode}`);
          break;
        }

        // Move to parent code by removing the last character
        currentCode = currentCode.slice(0, -1);
      }

      console.log('[CompetitiveAnalysis] Final query result:', { 
        usedEmdnCode,
        originalCode: cleanEmdnCode,
        devicesLength: devices?.length,
        firstFewDevices: devices?.slice(0, 3),
        allOrganizations: devices?.map(d => d.organization).slice(0, 10)
      });

      if (!devices || !Array.isArray(devices) || devices.length === 0) {
        console.log('[CompetitiveAnalysis] No devices found at any level, returning empty analysis');
        return this.createEmptyAnalysis();
      }

      // Process the devices data
      const competitorDevices: CompetitorDevice[] = devices.map((device: any) => ({
        udi_di: device.udi_di,
        organization: device.organization,
        trade_names: device.trade_names,
        device_name: device.device_name,
        device_model: device.device_model,
        basic_udi_di_code: device.basic_udi_di_code,
        risk_class: device.risk_class,
        country: device.country,
        nomenclature_codes: device.nomenclature_codes
      }));

      // Group by organization
      const competitorsByOrganization: Record<string, number> = {};
      const devicesByOrganization: Record<string, CompetitorDevice[]> = {};
      const competitorsByCountry: Record<string, number> = {};
      const competitorsByRiskClass: Record<string, number> = {};

      competitorDevices.forEach(device => {
        // Group by organization
        const org = device.organization || 'Unknown';
        competitorsByOrganization[org] = (competitorsByOrganization[org] || 0) + 1;
        if (!devicesByOrganization[org]) {
          devicesByOrganization[org] = [];
        }
        devicesByOrganization[org].push(device);

        // Group by country
        const country = device.country || 'Unknown';
        competitorsByCountry[country] = (competitorsByCountry[country] || 0) + 1;

        // Group by risk class with better handling
        let riskClass = device.risk_class;
        
        // Handle different formats and missing data
        if (!riskClass || riskClass.trim() === '') {
          riskClass = 'Unknown';
        } else {
          // Normalize risk class format
          riskClass = riskClass.toString().trim();
          // Map common variations
          if (riskClass.toLowerCase().includes('class 1') || riskClass === '1') riskClass = 'Class I';
          else if (riskClass.toLowerCase().includes('class 2') || riskClass === '2') riskClass = 'Class II';
          else if (riskClass.toLowerCase().includes('class 3') || riskClass === '3') riskClass = 'Class III';
          else if (riskClass.toLowerCase().includes('class i') && !riskClass.toLowerCase().includes('class ii')) riskClass = 'Class I';
          else if (riskClass.toLowerCase().includes('class iia')) riskClass = 'Class IIa';
          else if (riskClass.toLowerCase().includes('class iib')) riskClass = 'Class IIb';
        }
        
        competitorsByRiskClass[riskClass] = (competitorsByRiskClass[riskClass] || 0) + 1;
      });

      const totalCompetitors = competitorDevices.length;
      const uniqueOrganizations = Object.keys(competitorsByOrganization).length;

      console.log('[CompetitiveAnalysis] Data processing results:', {
        totalCompetitors,
        uniqueOrganizations,
        competitorsByOrganization,
        organizationNames: Object.keys(competitorsByOrganization),
        deviceCounts: Object.values(competitorsByOrganization)
      });

      // Calculate market leaders (top organizations by device count)
      const marketLeaders = Object.entries(competitorsByOrganization)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([org]) => org);

      // Calculate top countries by device count
      const topCountries = Object.entries(competitorsByCountry)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([country]) => country);

      // Calculate dominant risk class
      const dominantRiskClass = Object.entries(competitorsByRiskClass)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

      return {
        total_competitors: totalCompetitors,
        totalCompetitors: totalCompetitors,
        competitors_by_class: competitorsByRiskClass,
        competitorsByRiskClass: competitorsByRiskClass,
        market_penetration: competitorsByOrganization,
        regulatory_distribution: competitorsByRiskClass,
        geographic_distribution: competitorsByCountry,
        devices: competitorDevices,
        competitorsByOrganization: competitorsByOrganization,
        competitorsByCountry: competitorsByCountry,
        marketInsights: {
          uniqueOrganizations,
          averageDevicesPerOrganization: Math.round(totalCompetitors / uniqueOrganizations),
          devicesByOrganization,
          marketLeaders,
          topCountries,
          dominantRiskClass
        },
        topCompetitors: competitorDevices
      };
    } catch (error) {
      console.error('Error in competitive analysis:', error);
      return this.createEmptyAnalysis();
    }
  }

  async getCompetitorDetails(emdnCode: string): Promise<CompetitorDevice | null> {
    try {
      // Extract only the code part before the colon for matching
      const cleanEmdnCode = emdnCode.split(':')[0].trim();
      
      const { data: devices, error } = await supabase.rpc('get_eudamed_devices_by_emdn', {
        emdn_code: cleanEmdnCode,
        limit_count: 1
      });

      if (error || !devices || !Array.isArray(devices) || devices.length === 0) {
        return null;
      }

      return {
        udi_di: devices[0].udi_di,
        organization: devices[0].organization,
        trade_names: devices[0].trade_names,
        device_name: devices[0].device_name,
        device_model: devices[0].device_model,
        basic_udi_di_code: devices[0].basic_udi_di_code,
        risk_class: devices[0].risk_class,
        country: devices[0].country,
        nomenclature_codes: devices[0].nomenclature_codes
      };
    } catch (error) {
      console.error('Error getting competitor details:', error);
      return null;
    }
  }

  private createEmptyAnalysis(): CompetitiveAnalysis {
    return {
      total_competitors: 0,
      totalCompetitors: 0, // Legacy compatibility
      competitors_by_class: {},
      competitorsByRiskClass: {}, // Legacy compatibility
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
}

export const competitiveAnalysisService = new CompetitiveAnalysisService();
