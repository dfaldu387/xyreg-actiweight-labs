import { supabase } from '@/integrations/supabase/client';
import { MarketExtension, RegulatoryPhase, CommercialFactor } from './interfaces';

export class MarketExtensionService {
  /**
   * Create a new market extension for a product
   */
  static async createMarketExtension(
    productId: string,
    companyId: string,
    marketExtension: Omit<MarketExtension, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MarketExtension> {
    const { data, error } = await supabase
      .from('market_extensions')
      .insert({
        platform_project_id: productId,
        company_id: companyId,
        market_code: marketExtension.marketCode,
        market_name: marketExtension.marketName,
        is_enabled: marketExtension.isActive,
        revenue_forecast: marketExtension.revenueForecast as any,
        market_specific_investment: marketExtension.marketSpecificCosts.regulatorySubmissionFees || 0,
        market_commercial_loa: 75,
        estimated_launch_date: marketExtension.revenueForecast.launchDate?.toISOString(),
        regulatory_requirements: {
          phases: marketExtension.regulatoryPhases,
          commercialFactors: marketExtension.commercialFactors
        } as any
      } as any)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create market extension: ${error.message}`);
    }

    return this.transformFromDatabase(data);
  }

  /**
   * Get all market extensions for a product
   */
  static async getMarketExtensions(productId: string): Promise<MarketExtension[]> {
    const { data, error } = await supabase
      .from('market_extensions')
      .select('*')
      .eq('platform_project_id', productId)
      .eq('is_enabled', true)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch market extensions: ${error.message}`);
    }

    return data.map(this.transformFromDatabase);
  }

  /**
   * Update a market extension
   */
  static async updateMarketExtension(
    extensionId: string,
    updates: Partial<MarketExtension>
  ): Promise<MarketExtension> {
    const updateData: any = {};

    if (updates.marketName) updateData.market_name = updates.marketName;
    if (updates.isActive !== undefined) updateData.is_enabled = updates.isActive;
    if (updates.revenueForecast) updateData.revenue_forecast = updates.revenueForecast as any;
    if (updates.marketSpecificCosts) {
      updateData.market_specific_investment = updates.marketSpecificCosts.regulatorySubmissionFees || 0;
    }
    if (updates.regulatoryPhases || updates.commercialFactors) {
      updateData.regulatory_requirements = {
        phases: updates.regulatoryPhases || [],
        commercialFactors: updates.commercialFactors || []
      } as any;
    }

    const { data, error } = await supabase
      .from('market_extensions')
      .update(updateData)
      .eq('id', extensionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update market extension: ${error.message}`);
    }

    return this.transformFromDatabase(data);
  }

  /**
   * Delete a market extension
   */
  static async deleteMarketExtension(extensionId: string): Promise<void> {
    const { error } = await supabase
      .from('market_extensions')
      .delete()
      .eq('id', extensionId);

    if (error) {
      throw new Error(`Failed to delete market extension: ${error.message}`);
    }
  }

  /**
   * Create regulatory phases for a market extension
   */
  static async createRegulatoryPhases(
    marketExtensionId: string,
    phases: Omit<RegulatoryPhase, 'id'>[]
  ): Promise<RegulatoryPhase[]> {
    // This would be stored in the regulatory_requirements JSONB field
    // For now, return the phases with generated IDs
    return phases.map(phase => ({
      ...phase,
      id: `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }));
  }

  /**
   * Create commercial factors for a market extension
   */
  static async createCommercialFactors(
    marketExtensionId: string,
    factors: Omit<CommercialFactor, 'id'>[]
  ): Promise<CommercialFactor[]> {
    // This would be stored in the regulatory_requirements JSONB field
    // For now, return the factors with generated IDs
    return factors.map(factor => ({
      ...factor,
      id: `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }));
  }

  /**
   * Get market extensions by company for portfolio analysis
   */
  static async getCompanyMarketExtensions(companyId: string): Promise<MarketExtension[]> {
    const { data, error } = await supabase
      .from('market_extensions')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_enabled', true)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch company market extensions: ${error.message}`);
    }

    return data.map(this.transformFromDatabase);
  }

  /**
   * Transform database record to MarketExtension interface
   */
  private static transformFromDatabase(data: any): MarketExtension {
    const regulatoryRequirements = data.regulatory_requirements || {};
    
    return {
      id: data.id,
      productId: data.platform_project_id,
      companyId: data.company_id,
      marketCode: data.market_code,
      marketName: data.market_name,
      isActive: data.is_enabled,
      revenueForecast: {
        currency: 'USD',
        discountRate: 0.10,
        launchDate: data.estimated_launch_date ? new Date(data.estimated_launch_date) : new Date(),
        monthlyRevenue: data.revenue_forecast?.monthlyRevenue || [],
        ...data.revenue_forecast
      },
      marketSpecificCosts: {
        currency: 'USD',
        regulatorySubmissionFees: data.market_specific_investment || 0,
        clinicalTrialCosts: 0,
        marketingInvestment: 0,
        distributionCosts: 0,
        maintenanceCosts: 0,
        additionalCosts: []
      },
      regulatoryPhases: regulatoryRequirements.phases || [],
      commercialFactors: regulatoryRequirements.commercialFactors || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  /**
   * Get available markets for selection
   */
  static getAvailableMarkets(): Array<{code: string, name: string, region: string}> {
    return [
      { code: 'US', name: 'United States', region: 'North America' },
      { code: 'EU', name: 'European Union', region: 'Europe' },
      { code: 'UK', name: 'United Kingdom', region: 'Europe' },
      { code: 'CA', name: 'Canada', region: 'North America' },
      { code: 'JP', name: 'Japan', region: 'Asia' },
      { code: 'AU', name: 'Australia', region: 'Oceania' },
      { code: 'BR', name: 'Brazil', region: 'South America' },
      { code: 'CN', name: 'China', region: 'Asia' },
      { code: 'IN', name: 'India', region: 'Asia' },
      { code: 'SG', name: 'Singapore', region: 'Asia' }
    ];
  }

  /**
   * Get regulatory templates for a specific market
   */
  static getRegulatoryTemplatesForMarket(marketCode: string): RegulatoryPhase[] {
    const templates: Record<string, RegulatoryPhase[]> = {
      'US': [
        {
          id: 'fda_510k',
          name: 'FDA 510(k) Clearance',
          description: 'Pre-market notification to FDA for medical devices',
          marketCode: 'US',
          likelihoodOfApproval: 85,
          timelineMonths: 6,
          costs: 100000,
          dependencies: [],
          position: 1
        },
        {
          id: 'fda_quality_audit',
          name: 'FDA Quality System Audit',
          description: 'Inspection of manufacturing quality systems',
          marketCode: 'US',
          likelihoodOfApproval: 90,
          timelineMonths: 3,
          costs: 50000,
          dependencies: ['fda_510k'],
          position: 2
        }
      ],
      'EU': [
        {
          id: 'ce_marking',
          name: 'CE Marking Process',
          description: 'European Conformity marking for medical devices',
          marketCode: 'EU',
          likelihoodOfApproval: 80,
          timelineMonths: 8,
          costs: 150000,
          dependencies: [],
          position: 1
        },
        {
          id: 'notified_body_review',
          name: 'Notified Body Assessment',
          description: 'Third-party conformity assessment',
          marketCode: 'EU',
          likelihoodOfApproval: 85,
          timelineMonths: 4,
          costs: 75000,
          dependencies: ['ce_marking'],
          position: 2
        }
      ]
    };

    return templates[marketCode] || [];
  }

  /**
   * Get commercial factor templates for a market
   */
  static getCommercialFactorTemplatesForMarket(marketCode: string): CommercialFactor[] {
    const templates: Record<string, CommercialFactor[]> = {
      'US': [
        {
          id: 'us_reimbursement',
          name: 'Insurance Reimbursement Approval',
          description: 'Securing reimbursement from major insurance providers',
          likelihoodOfSuccess: 70,
          impact: 'high',
          timelineMonths: 12,
          marketCodes: ['US'],
          dependencies: []
        },
        {
          id: 'us_key_accounts',
          name: 'Key Account Acquisition',
          description: 'Securing partnerships with major hospital systems',
          likelihoodOfSuccess: 80,
          impact: 'medium',
          timelineMonths: 6,
          marketCodes: ['US'],
          dependencies: ['us_reimbursement']
        }
      ],
      'EU': [
        {
          id: 'eu_reimbursement',
          name: 'HTA and Reimbursement',
          description: 'Health Technology Assessment and reimbursement approval',
          likelihoodOfSuccess: 65,
          impact: 'high',
          timelineMonths: 18,
          marketCodes: ['EU'],
          dependencies: []
        },
        {
          id: 'eu_distribution',
          name: 'Distribution Network',
          description: 'Establishing distribution channels across EU markets',
          likelihoodOfSuccess: 85,
          impact: 'medium',
          timelineMonths: 9,
          marketCodes: ['EU'],
          dependencies: []
        }
      ]
    };

    return templates[marketCode] || [];
  }
}