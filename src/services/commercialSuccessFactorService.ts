import { supabase } from "@/integrations/supabase/client";

export interface CommercialSuccessFactor {
  id: string;
  product_id: string;
  company_id: string;
  category_id?: string;
  name: string;
  description?: string;
  likelihood_of_success: number; // LoS: Likelihood of Success (renamed from likelihood_of_approval)
  market_codes: any; // Will be JSON in DB, parsed as string[]
  position: number;
  is_active: boolean;
  estimated_timeline_months?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CommercialFactorCategory {
  id: string;
  name: string;
  description?: string;
  suggested_los_range?: string; // LoS: renamed from suggested_loa_range
  typical_timeline?: string;
  created_at: string;
  updated_at: string;
}

export interface CommercialRiskCalculation {
  combinedCommercialLoS: number; // LoS: renamed from combinedCommercialLoA
  individualFactors: {
    id: string;
    name: string;
    likelihood_of_success: number; // LoS: renamed from likelihood_of_approval
    category?: string;
  }[];
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
}

export class CommercialSuccessFactorService {
  
  static async getCommercialFactors(productId: string): Promise<CommercialSuccessFactor[]> {
    const { data, error } = await supabase
      .from('commercial_success_factors')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching commercial factors:', error);
      throw error;
    }

    // Parse market_codes JSON field
    return (data || []).map(factor => ({
      ...factor,
      market_codes: Array.isArray(factor.market_codes) ? factor.market_codes : JSON.parse(String(factor.market_codes || '[]'))
    }));
  }

  static async getCommercialFactorCategories(): Promise<CommercialFactorCategory[]> {
    const { data, error } = await supabase
      .from('commercial_factor_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching commercial factor categories:', error);
      throw error;
    }

    return data || [];
  }

  static async saveCommercialFactor(factorData: Partial<CommercialSuccessFactor>): Promise<CommercialSuccessFactor> {
    // Ensure required fields are present for upsert
    if (!factorData.product_id || !factorData.company_id) {
      throw new Error('Product ID and Company ID are required');
    }

    const { data, error } = await supabase
      .from('commercial_success_factors')
      .upsert({
        ...factorData,
        market_codes: JSON.stringify(factorData.market_codes || []),
        updated_at: new Date().toISOString(),
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error saving commercial factor:', error);
      throw error;
    }

    // Parse market_codes back to array
    return {
      ...data,
      market_codes: Array.isArray(data.market_codes) ? data.market_codes : JSON.parse(String(data.market_codes || '[]'))
    };
  }

  static async deleteCommercialFactor(factorId: string): Promise<void> {
    const { error } = await supabase
      .from('commercial_success_factors')
      .delete()
      .eq('id', factorId);

    if (error) {
      console.error('Error deleting commercial factor:', error);
      throw error;
    }
  }

  static async updateFactorPosition(factorId: string, newPosition: number): Promise<void> {
    const { error } = await supabase
      .from('commercial_success_factors')
      .update({ position: newPosition, updated_at: new Date().toISOString() })
      .eq('id', factorId);

    if (error) {
      console.error('Error updating factor position:', error);
      throw error;
    }
  }

  static calculateCombinedCommercialLoS(factors: CommercialSuccessFactor[]): CommercialRiskCalculation {
    const activeFactors = factors.filter(factor => factor.is_active);
    
    if (activeFactors.length === 0) {
      return {
        combinedCommercialLoS: 100, // No commercial risk if no factors
        individualFactors: [],
        riskLevel: 'low'
      };
    }

    // Calculate combined probability by multiplying individual probabilities
    const combinedLoS = activeFactors.reduce((combined, factor) => {
      return combined * (factor.likelihood_of_success / 100);
    }, 1) * 100;

    // Determine risk level based on combined LoS
    let riskLevel: 'low' | 'medium' | 'high' | 'very_high';
    if (combinedLoS >= 80) riskLevel = 'low';
    else if (combinedLoS >= 60) riskLevel = 'medium';
    else if (combinedLoS >= 40) riskLevel = 'high';
    else riskLevel = 'very_high';

    return {
      combinedCommercialLoS: Math.round(combinedLoS * 100) / 100, // Round to 2 decimal places
      individualFactors: activeFactors.map(factor => ({
        id: factor.id,
        name: factor.name,
        likelihood_of_success: factor.likelihood_of_success,
        category: factor.category_id
      })),
      riskLevel
    };
  }

  static async getDefaultCommercialFactors(
    productType?: string, 
    markets?: string[], 
    companyId?: string
  ): Promise<Partial<CommercialSuccessFactor>[]> {
    // Get all available categories as defaults
    const categories = await this.getCommercialFactorCategories();
    
    // Create default factors based on common commercial success requirements
    const defaultFactors: Partial<CommercialSuccessFactor>[] = categories.map((category, index) => ({
      name: category.name,
      description: category.description,
      category_id: category.id,
      likelihood_of_success: this.getSuggestedLoS(category.suggested_los_range),
      market_codes: markets || [],
      position: index,
      is_active: true,
      estimated_timeline_months: this.parseTimelineMonths(category.typical_timeline)
    }));

    return defaultFactors;
  }

  private static getSuggestedLoS(range?: string): number {
    if (!range) return 75; // Default middle value
    
    // Parse range like "70-85%" and return middle value
    const match = range.match(/(\d+)-(\d+)%?/);
    if (match) {
      const min = parseInt(match[1]);
      const max = parseInt(match[2]);
      return Math.round((min + max) / 2);
    }
    
    return 75;
  }

  private static parseTimelineMonths(timeline?: string): number | undefined {
    if (!timeline) return undefined;
    
    // Parse timeline like "6-18 months post-approval" and return average
    const match = timeline.match(/(\d+)-(\d+)\s*months/);
    if (match) {
      const min = parseInt(match[1]);
      const max = parseInt(match[2]);
      return Math.round((min + max) / 2);
    }
    
    // Parse single number like "12 months"
    const singleMatch = timeline.match(/(\d+)\s*months/);
    if (singleMatch) {
      return parseInt(singleMatch[1]);
    }
    
    return undefined;
  }

  static async enableCommercialFactorsForProduct(
    productId: string, 
    companyId: string,
    markets?: string[]
  ): Promise<void> {
    // Enable commercial factors flag on product
    const { error: productError } = await supabase
      .from('products')
      .update({ 
        commercial_factors_enabled: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (productError) {
      console.error('Error enabling commercial factors for product:', productError);
      throw productError;
    }

    // Check if product already has commercial factors
    const existingFactors = await this.getCommercialFactors(productId);
    
    if (existingFactors.length === 0) {
      // Create default commercial factors
      const defaultFactors = await this.getDefaultCommercialFactors(undefined, markets, companyId);
      
      for (const factor of defaultFactors) {
        await this.saveCommercialFactor({
          ...factor,
          product_id: productId,
          company_id: companyId,
        });
      }
    }
  }
}