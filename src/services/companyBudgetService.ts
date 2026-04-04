import { supabase } from "@/integrations/supabase/client";

export interface ProductBudgetSummary {
  product_id: string;
  product_name: string;
  total_budget: number;
  total_actual: number;
  variance: number;
  phase_count: number;
  currency: string;
}

export interface PhaseCategorySummary {
  phase_name: string;
  total_budget: number;
  total_actual: number;
  item_count: number;
}

export interface TimelineCashFlow {
  month: string;
  budget: number;
  actual: number;
}

export class CompanyBudgetService {
  
  /**
   * Aggregate budget data across all products for a company
   */
  static async getCompanyBudgetSummary(companyId: string): Promise<{
    totalBudget: number;
    totalActual: number;
    totalVariance: number;
    productCount: number;
    phaseCount: number;
  }> {
    try {
      
      // Fetch products
      const productsResult = await supabase
        .from('products')
        .select('id')
        .eq('company_id', companyId);

      if (productsResult.error) {
        console.error('Error fetching products:', productsResult.error);
        throw productsResult.error;
      }

      const products = productsResult.data || [];
      if (products.length === 0) {
        
        return {
          totalBudget: 0,
          totalActual: 0,
          totalVariance: 0,
          productCount: 0,
          phaseCount: 0
        };
      }

      const productIds = products.map(p => p.id);
      

      // Fetch lifecycle phases (budget items are linked to lifecycle_phases, not phases)
      const phasesResult = await supabase
        .from('lifecycle_phases')
        .select('id')
        .in('product_id', productIds);

      if (phasesResult.error) {
        console.error('Error fetching lifecycle phases:', phasesResult.error);
        throw phasesResult.error;
      }

      const phases = phasesResult.data || [];
      if (phases.length === 0) {
        
        return {
          totalBudget: 0,
          totalActual: 0,
          totalVariance: 0,
          productCount: productIds.length,
          phaseCount: 0
        };
      }

      const phaseIds = phases.map(p => p.id);
      

      // Fetch budget items
      const budgetResult = await supabase
        .from('phase_budget_items')
        .select('cost, actual_cost')
        .in('phase_id', phaseIds);

      if (budgetResult.error) {
        console.error('Error fetching budget items:', budgetResult.error);
        throw budgetResult.error;
      }

      const items = budgetResult.data || [];
      const totalBudget = items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
      const totalActual = items.reduce((sum, item) => sum + (Number(item.actual_cost) || 0), 0);

      

      return {
        totalBudget,
        totalActual,
        totalVariance: totalActual - totalBudget,
        productCount: productIds.length,
        phaseCount: phaseIds.length
      };
    } catch (error) {
      console.error('Error in getCompanyBudgetSummary:', error);
      return {
        totalBudget: 0,
        totalActual: 0,
        totalVariance: 0,
        productCount: 0,
        phaseCount: 0
      };
    }
  }

  /**
   * Get budget summary grouped by product
   */
  static async getProductBudgetSummaries(companyId: string): Promise<ProductBudgetSummary[]> {
    try {
      
      
      const productsResult = await supabase
        .from('products')
        .select('id, name')
        .eq('company_id', companyId);

      if (productsResult.error) {
        console.error('Error fetching products:', productsResult.error);
        throw productsResult.error;
      }

      const products = productsResult.data || [];
      if (products.length === 0) {
        console.log('No products found');
        return [];
      }

      const summaries: ProductBudgetSummary[] = [];

      for (const product of products) {
        const phasesResult = await supabase
          .from('lifecycle_phases')
          .select('id')
          .eq('product_id', product.id);

        if (phasesResult.error) {
          console.error(`Error fetching lifecycle phases for product ${product.id}:`, phasesResult.error);
          continue;
        }

        const phases = phasesResult.data || [];
        const phaseIds = phases.map(p => p.id);

        if (phaseIds.length === 0) {
          summaries.push({
            product_id: product.id,
            product_name: product.name,
            total_budget: 0,
            total_actual: 0,
            variance: 0,
            phase_count: 0,
            currency: 'USD'
          });
          continue;
        }

        const budgetResult = await supabase
          .from('phase_budget_items')
          .select('cost, actual_cost, currency')
          .in('phase_id', phaseIds);

        if (budgetResult.error) {
          console.error(`Error fetching budget items for product ${product.id}:`, budgetResult.error);
          continue;
        }

        const items = budgetResult.data || [];
        let totalBudget = 0;
        let totalActual = 0;
        let currency = 'USD';

        items.forEach(item => {
          totalBudget += Number(item.cost) || 0;
          totalActual += Number(item.actual_cost) || 0;
          if (item.currency) currency = item.currency;
        });

        summaries.push({
          product_id: product.id,
          product_name: product.name,
          total_budget: totalBudget,
          total_actual: totalActual,
          variance: totalActual - totalBudget,
          phase_count: phaseIds.length,
          currency
        });
      }

      
      return summaries.sort((a, b) => b.total_budget - a.total_budget);
    } catch (error) {
      console.error('Error getting product budget summaries:', error);
      return [];
    }
  }

  /**
   * Get budget breakdown by phase categories
   */
  static async getPhaseCategorySummaries(companyId: string): Promise<PhaseCategorySummary[]> {
    try {
      
      
      const productsResult = await supabase
        .from('products')
        .select('id')
        .eq('company_id', companyId);

      if (productsResult.error) {
        console.error('Error fetching products:', productsResult.error);
        throw productsResult.error;
      }

      const products = productsResult.data || [];
      const productIds = products.map(p => p.id);

      if (productIds.length === 0) {
        
        return [];
      }

      const phasesResult = await supabase
        .from('lifecycle_phases')
        .select('id, name')
        .in('product_id', productIds);

      if (phasesResult.error) {
        console.error('Error fetching lifecycle phases:', phasesResult.error);
        throw phasesResult.error;
      }

      const phaseData = phasesResult.data || [];
      const phaseIds = phaseData.map(p => p.id);

      if (phaseIds.length === 0) {
        
        return [];
      }

      const budgetResult = await supabase
        .from('phase_budget_items')
        .select('phase_id, cost, actual_cost')
        .in('phase_id', phaseIds);

      if (budgetResult.error) {
        console.error('Error fetching budget items:', budgetResult.error);
        throw budgetResult.error;
      }

      const items = budgetResult.data || [];

      // Create phase map
      const phaseMap = new Map<string, string>();
      phaseData.forEach(phase => {
        phaseMap.set(phase.id, phase.name);
      });

      // Group by phase name
      const groupedByPhaseName = new Map<string, {
        budget: number;
        actual: number;
        count: number;
      }>();

      items.forEach(item => {
        const phaseName = phaseMap.get(item.phase_id) || 'Unknown';
        const existing = groupedByPhaseName.get(phaseName) || {
          budget: 0,
          actual: 0,
          count: 0
        };

        existing.budget += Number(item.cost) || 0;
        existing.actual += Number(item.actual_cost) || 0;
        existing.count += 1;

        groupedByPhaseName.set(phaseName, existing);
      });

      const summaries: PhaseCategorySummary[] = Array.from(groupedByPhaseName.entries()).map(
        ([name, data]) => ({
          phase_name: name,
          total_budget: data.budget,
          total_actual: data.actual,
          item_count: data.count
        })
      );

      
      return summaries.sort((a, b) => b.total_budget - a.total_budget);
    } catch (error) {
      console.error('Error getting phase category summaries:', error);
      return [];
    }
  }

  /**
   * Get timeline cash flow (monthly aggregation) - placeholder for future implementation
   */
  static async getTimelineCashFlow(companyId: string): Promise<TimelineCashFlow[]> {
    return [];
  }

  /**
   * Get phase budget summary for a specific product (for rNPV integration)
   */
  static async getProductPhaseBudgetSummary(productId: string): Promise<{
    totalBudget: number;
    totalActual: number;
    phaseBreakdown: Array<{
      phaseId: string;
      phaseName: string;
      totalBudget: number;
      totalActual: number;
    }>;
  }> {
    try {
      

      // Get lifecycle phases
      const { data: phases, error: phasesError } = await supabase
        .from('lifecycle_phases')
        .select('id, name')
        .eq('product_id', productId)
        .order('position');

      if (phasesError) {
        console.error('[CompanyBudgetService] Error fetching phases:', phasesError);
        throw phasesError;
      }

      if (!phases || phases.length === 0) {
        return {
          totalBudget: 0,
          totalActual: 0,
          phaseBreakdown: []
        };
      }

      // Get budget items for all phases
      const phaseIds = phases.map(p => p.id);
      const { data: budgetItems, error: budgetError } = await supabase
        .from('phase_budget_items')
        .select('phase_id, cost, actual_cost')
        .in('phase_id', phaseIds);

      if (budgetError) {
        console.error('[CompanyBudgetService] Error fetching budget items:', budgetError);
        throw budgetError;
      }

      // Aggregate by phase
      const phaseMap = new Map<string, { budget: number; actual: number }>();
      phases.forEach(phase => {
        phaseMap.set(phase.id, { budget: 0, actual: 0 });
      });

      (budgetItems || []).forEach(item => {
        const existing = phaseMap.get(item.phase_id);
        if (existing) {
          existing.budget += Number(item.cost) || 0;
          existing.actual += Number(item.actual_cost) || 0;
        }
      });

      const phaseBreakdown = phases.map(phase => {
        const data = phaseMap.get(phase.id) || { budget: 0, actual: 0 };
        return {
          phaseId: phase.id,
          phaseName: phase.name,
          totalBudget: data.budget,
          totalActual: data.actual
        };
      });

      const totalBudget = phaseBreakdown.reduce((sum, p) => sum + p.totalBudget, 0);
      const totalActual = phaseBreakdown.reduce((sum, p) => sum + p.totalActual, 0);

      

      return {
        totalBudget,
        totalActual,
        phaseBreakdown
      };
    } catch (error) {
      console.error('[CompanyBudgetService] Error getting product phase budget summary:', error);
      return {
        totalBudget: 0,
        totalActual: 0,
        phaseBreakdown: []
      };
    }
  }
}
