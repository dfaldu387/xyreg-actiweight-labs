import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type PricingRule = Database['public']['Tables']['pricing_rules']['Row'];
type PricingRuleInsert = Database['public']['Tables']['pricing_rules']['Insert'];
type PricingRuleUpdate = Database['public']['Tables']['pricing_rules']['Update'];
type PricingEffective = Database['public']['Tables']['pricing_effective']['Row'];

export class PricingService {
  // Get all pricing rules for a company
  static async getCompanyPricingRules(companyId: string) {
    const { data, error } = await supabase
      .from('pricing_rules')
      .select(`
        *,
        products (
          id,
          name,
          model_reference
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Get pricing rules for a specific product and market
  static async getProductPricingRules(productId: string, marketCode?: string) {
    let query = supabase
      .from('pricing_rules')
      .select('*')
      .eq('product_id', productId);

    if (marketCode) {
      query = query.eq('market_code', marketCode);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  // Get model-level pricing rules for a company and market
  static async getModelPricingRules(companyId: string, marketCode?: string) {
    let query = supabase
      .from('pricing_rules')
      .select('*')
      .eq('company_id', companyId)
      .not('model_name', 'is', null);

    if (marketCode) {
      query = query.eq('market_code', marketCode);
    }

    const { data, error } = await query.order('model_name', { ascending: true });
    if (error) throw error;
    return data;
  }

  // Get effective pricing for products
  static async getEffectivePricing(companyId: string, marketCode?: string) {
    let query = supabase
      .from('pricing_effective')
      .select(`
        *,
        products (
          id,
          name,
          model_reference,
          parent_product_id
        )
      `)
      .eq('company_id', companyId);

    if (marketCode) {
      query = query.eq('market_code', marketCode);
    }

    const { data, error } = await query.order('computed_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  // Create a new pricing rule
  static async createPricingRule(rule: PricingRuleInsert) {
    const { data, error } = await supabase
      .from('pricing_rules')
      .insert(rule)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update an existing pricing rule
  static async updatePricingRule(id: string, updates: PricingRuleUpdate) {
    const { data, error } = await supabase
      .from('pricing_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete a pricing rule
  static async deletePricingRule(id: string) {
    const { error } = await supabase
      .from('pricing_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Trigger price recomputation for a company
  static async recomputeCompanyPricing(companyId: string, marketCode?: string) {
    const { data, error } = await supabase.rpc('price_recompute_company', {
      p_company_id: companyId,
      p_market_code: marketCode
    });

    if (error) throw error;
    return data;
  }

  // Get distinct markets that have pricing rules for a company
  static async getCompanyMarkets(companyId: string) {
    const { data, error } = await supabase
      .from('pricing_rules')
      .select('market_code')
      .eq('company_id', companyId)
      .not('market_code', 'is', null);

    if (error) throw error;
    
    const uniqueMarkets = [...new Set(data.map(d => d.market_code))];
    return uniqueMarkets;
  }

  // Get pricing rule types
  static getPricingRuleTypes() {
    return [
      { value: 'BASE', label: 'Base Price', description: 'Set a base price for this level' },
      { value: 'RELATIVE', label: 'Relative Adjustment', description: 'Adjust price relative to parent' },
      { value: 'ABSOLUTE', label: 'Absolute Override', description: 'Override with absolute price' }
    ];
  }

  // Get relative types for relative pricing rules
  static getRelativeTypes() {
    return [
      { value: 'PERCENT', label: 'Percentage', description: 'Adjust by percentage' },
      { value: 'FIXED', label: 'Fixed Amount', description: 'Adjust by fixed amount' }
    ];
  }

  // Validate pricing rule data
  static validatePricingRule(rule: Partial<PricingRuleInsert>) {
    const errors: string[] = [];

    if (!rule.company_id) {
      errors.push('Company ID is required');
    }

    if (!rule.market_code) {
      errors.push('Market code is required');
    }

    if (!rule.rule_type) {
      errors.push('Rule type is required');
    }

    if (rule.rule_type === 'BASE' || rule.rule_type === 'ABSOLUTE') {
      if (!rule.base_price || rule.base_price <= 0) {
        errors.push('Base price must be greater than 0');
      }
      if (!rule.currency_code) {
        errors.push('Currency code is required for base/absolute rules');
      }
    }

    if (rule.rule_type === 'RELATIVE') {
      if (!rule.relative_type) {
        errors.push('Relative type is required for relative rules');
      }
      if (!rule.relative_value) {
        errors.push('Relative value is required for relative rules');
      }
      if (rule.relative_type === 'PERCENT' && Math.abs(rule.relative_value) > 1000) {
        errors.push('Percentage adjustment cannot exceed 1000%');
      }
    }

    if (!rule.product_id && !rule.model_name) {
      errors.push('Either product ID or model name must be specified');
    }

    if (rule.product_id && rule.model_name) {
      errors.push('Cannot specify both product ID and model name');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}