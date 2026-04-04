import { supabase } from "@/integrations/supabase/client";
import { CurrencyService } from './currencyService';
import { SmartCostIntelligence } from './smartCostIntelligence';

export interface CostTemplate {
  id: string;
  marketCode: string;
  marketName: string;
  deviceClass: string;
  costCategory: 'regulatory' | 'manufacturing' | 'clinical' | 'marketing' | 'distribution' | 'maintenance';
  costSubcategory?: string;
  typicalCost: number;
  minCost?: number;
  maxCost?: number;
  currency: string;
  costDescription?: string;
  justification?: string;
  timelineMonths?: number;
  frequency: 'one_time' | 'annual' | 'monthly' | 'quarterly';
}

export interface CostTemplateOverride {
  id: string;
  companyId: string;
  templateId: string;
  overrideCost: number;
  overrideJustification?: string;
}

export class CostTemplateService {
  static async getMarketCostTemplates(
    marketCode: string, 
    deviceClass: string
  ): Promise<CostTemplate[]> {
    const { data, error } = await supabase
      .from('regulatory_cost_templates')
      .select('*')
      .eq('market_code', marketCode)
      .in('device_class', [deviceClass, 'All Classes'])
      .eq('is_active', true)
      .order('cost_category', { ascending: true })
      .order('cost_subcategory', { ascending: true });

    if (error) {
      console.error('Error fetching cost templates:', error);
      throw error;
    }

    return data.map(template => ({
      id: template.id,
      marketCode: template.market_code,
      marketName: template.market_name,
      deviceClass: template.device_class,
      costCategory: template.cost_category as CostTemplate['costCategory'],
      costSubcategory: template.cost_subcategory,
      typicalCost: parseFloat(template.typical_cost.toString()),
      minCost: template.min_cost ? parseFloat(template.min_cost.toString()) : undefined,
      maxCost: template.max_cost ? parseFloat(template.max_cost.toString()) : undefined,
      currency: template.currency,
      costDescription: template.cost_description,
      justification: template.justification,
      timelineMonths: template.timeline_months,
      frequency: template.frequency as CostTemplate['frequency']
    }));
  }

  static async getCompanyOverrides(
    companyId: string, 
    templateIds: string[]
  ): Promise<CostTemplateOverride[]> {
    const { data, error } = await supabase
      .from('company_cost_template_overrides')
      .select('*')
      .eq('company_id', companyId)
      .in('template_id', templateIds);

    if (error) {
      console.error('Error fetching company overrides:', error);
      throw error;
    }

    return data.map(override => ({
      id: override.id,
      companyId: override.company_id,
      templateId: override.template_id,
      overrideCost: parseFloat(override.override_cost.toString()),
      overrideJustification: override.override_justification
    }));
  }

  static async saveCompanyOverride(
    companyId: string,
    templateId: string,
    overrideCost: number,
    justification?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('company_cost_template_overrides')
      .upsert({
        company_id: companyId,
        template_id: templateId,
        override_cost: overrideCost,
        override_justification: justification,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }, {
        onConflict: 'company_id,template_id'
      });

    if (error) {
      console.error('Error saving company override:', error);
      throw error;
    }
  }

  static async deleteCompanyOverride(
    companyId: string,
    templateId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('company_cost_template_overrides')
      .delete()
      .eq('company_id', companyId)
      .eq('template_id', templateId);

    if (error) {
      console.error('Error deleting company override:', error);
      throw error;
    }
  }

  static getCostRangeLabel(template: CostTemplate): string {
    if (!template.minCost || !template.maxCost) {
      return `${CurrencyService.formatCurrency(template.typicalCost, template.currency)}`;
    }
    
    return `${CurrencyService.formatCurrency(template.minCost, template.currency)} - ${CurrencyService.formatCurrency(template.maxCost, template.currency)} (typical: ${CurrencyService.formatCurrency(template.typicalCost, template.currency)})`;
  }

  static async getSmartCostEstimate(
    template: CostTemplate,
    options: {
      deviceClass: string;
      scenario: 'conservative' | 'typical' | 'aggressive';
      launchDate: Date;
      targetCurrency?: string;
      inflationRate?: number;
    }
  ): Promise<{
    smartCost: number;
    originalCost: number;
    adjustments: any;
    currencyConversion?: any;
  }> {
    // Calculate smart cost with all adjustments
    const smartCostResult = SmartCostIntelligence.calculateSmartCost(
      template.typicalCost,
      {
        deviceClass: options.deviceClass,
        costCategory: template.costCategory,
        scenario: options.scenario,
        launchDate: options.launchDate,
        inflationRate: options.inflationRate || 0.03
      }
    );

    let result = {
      smartCost: smartCostResult.finalCost,
      originalCost: template.typicalCost,
      adjustments: smartCostResult.adjustments,
      currencyConversion: undefined as any
    };

    // Apply currency conversion if needed
    if (options.targetCurrency && options.targetCurrency !== template.currency) {
      const conversion = await CurrencyService.convertCurrency(
        smartCostResult.finalCost,
        template.currency,
        options.targetCurrency
      );
      
      result.smartCost = conversion.convertedAmount;
      result.currencyConversion = conversion;
    }

    return result;
  }

  static aggregateCostsByCategory(templates: CostTemplate[]): Record<string, number> {
    return templates.reduce((acc, template) => {
      if (!acc[template.costCategory]) {
        acc[template.costCategory] = 0;
      }
      acc[template.costCategory] += template.typicalCost;
      return acc;
    }, {} as Record<string, number>);
  }
}