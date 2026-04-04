import { supabase } from "@/integrations/supabase/client";

export interface PhaseBudgetItem {
  id: string;
  phase_id: string;
  category: 'fixed' | 'variable' | 'other';
  item_name: string;
  cost: number;
  actual_cost?: number | null;
  currency: string;
  timing_type: 'pre_launch' | 'post_launch' | 'both' | 'milestone';
  post_launch_cost?: number | null;
  frequency: 'one_time' | 'monthly' | 'quarterly' | 'yearly';
  active_start_date?: string | null;
  active_end_date?: string | null;
  // Feasibility scenario support
  worst_case_amount?: number | null;
  likely_case_amount?: number | null;
  best_case_amount?: number | null;
  is_feasibility?: boolean;
  feasibility_portfolio_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBudgetItemData {
  phase_id: string;
  category: 'fixed' | 'variable' | 'other';
  item_name: string;
  cost: number;
  currency?: string;
  timing_type?: 'pre_launch' | 'post_launch' | 'both' | 'milestone';
  post_launch_cost?: number | null;
  frequency?: 'one_time' | 'monthly' | 'quarterly' | 'yearly';
  active_start_date?: Date | null;
  active_end_date?: Date | null;
  // Feasibility scenario support
  worst_case_amount?: number | null;
  likely_case_amount?: number | null;
  best_case_amount?: number | null;
  is_feasibility?: boolean;
  feasibility_portfolio_id?: string | null;
}

export interface UpdateBudgetItemData {
  item_name?: string;
  cost?: number;
  actual_cost?: number | null;
  currency?: string;
  timing_type?: 'pre_launch' | 'post_launch' | 'both' | 'milestone';
  post_launch_cost?: number | null;
  frequency?: 'one_time' | 'monthly' | 'quarterly' | 'yearly';
  active_start_date?: Date | null;
  active_end_date?: Date | null;
  // Feasibility scenario support
  worst_case_amount?: number | null;
  likely_case_amount?: number | null;
  best_case_amount?: number | null;
}

export class PhaseBudgetService {
  
  /**
   * Fetch all budget items for a specific phase
   */
  static async getBudgetItemsByPhase(phaseId: string): Promise<PhaseBudgetItem[]> {
    try {
      const { data, error } = await supabase
        .from('phase_budget_items')
        .select('*')
        .eq('phase_id', phaseId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching budget items:', error);
        throw error;
      }

      return (data || []) as PhaseBudgetItem[];
    } catch (error) {
      console.error('Error in getBudgetItemsByPhase:', error);
      throw error;
    }
  }

  /**
   * Create a new budget item
   */
  static async createBudgetItem(data: CreateBudgetItemData): Promise<PhaseBudgetItem> {
    try {
      const insertData: any = {
        phase_id: data.phase_id,
        category: data.category,
        item_name: data.item_name,
        cost: data.cost,
        currency: data.currency || 'USD',
        timing_type: data.timing_type || 'both',
        frequency: data.frequency || 'monthly',
        is_feasibility: data.is_feasibility || false
      };

      // Add optional fields if provided
      if (data.post_launch_cost !== undefined) {
        insertData.post_launch_cost = data.post_launch_cost;
      }
      if (data.active_start_date) {
        insertData.active_start_date = data.active_start_date.toISOString().split('T')[0];
      }
      if (data.active_end_date) {
        insertData.active_end_date = data.active_end_date.toISOString().split('T')[0];
      }
      
      // Feasibility scenario amounts
      if (data.worst_case_amount !== undefined) {
        insertData.worst_case_amount = data.worst_case_amount;
      }
      if (data.likely_case_amount !== undefined) {
        insertData.likely_case_amount = data.likely_case_amount;
      }
      if (data.best_case_amount !== undefined) {
        insertData.best_case_amount = data.best_case_amount;
      }
      if (data.feasibility_portfolio_id) {
        insertData.feasibility_portfolio_id = data.feasibility_portfolio_id;
      }

      const { data: result, error } = await supabase
        .from('phase_budget_items')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating budget item:', error);
        throw error;
      }

      return result as PhaseBudgetItem;
    } catch (error) {
      console.error('Error in createBudgetItem:', error);
      throw error;
    }
  }

  /**
   * Update an existing budget item
   */
  static async updateBudgetItem(itemId: string, data: UpdateBudgetItemData): Promise<PhaseBudgetItem> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Copy scalar fields
      if (data.item_name !== undefined) updateData.item_name = data.item_name;
      if (data.cost !== undefined) updateData.cost = data.cost;
      if (data.currency !== undefined) updateData.currency = data.currency;
      if (data.timing_type !== undefined) updateData.timing_type = data.timing_type;
      if (data.frequency !== undefined) updateData.frequency = data.frequency;

      // Handle null values explicitly
      if (data.actual_cost !== undefined) {
        updateData.actual_cost = data.actual_cost;
      }
      if (data.post_launch_cost !== undefined) {
        updateData.post_launch_cost = data.post_launch_cost;
      }
      
      // Feasibility scenario amounts
      if (data.worst_case_amount !== undefined) {
        updateData.worst_case_amount = data.worst_case_amount;
      }
      if (data.likely_case_amount !== undefined) {
        updateData.likely_case_amount = data.likely_case_amount;
      }
      if (data.best_case_amount !== undefined) {
        updateData.best_case_amount = data.best_case_amount;
      }

      // Handle date fields
      if (data.active_start_date !== undefined) {
        updateData.active_start_date = data.active_start_date 
          ? data.active_start_date.toISOString().split('T')[0] 
          : null;
      }
      if (data.active_end_date !== undefined) {
        updateData.active_end_date = data.active_end_date 
          ? data.active_end_date.toISOString().split('T')[0] 
          : null;
      }

      const { data: result, error } = await supabase
        .from('phase_budget_items')
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        console.error('Error updating budget item:', error);
        throw error;
      }

      return result as PhaseBudgetItem;
    } catch (error) {
      console.error('Error in updateBudgetItem:', error);
      throw error;
    }
  }

  /**
   * Delete a budget item
   */
  static async deleteBudgetItem(itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('phase_budget_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error deleting budget item:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteBudgetItem:', error);
      throw error;
    }
  }

  /**
   * Calculate totals for budget categories with phase duration and timing considerations
   */
  static calculateTotals(items: PhaseBudgetItem[], phaseDurationDays?: number, isPreLaunch?: boolean) {
    const totals = {
      fixed: 0,
      variable: 0,
      variableDaily: 0, // Daily rate for variable costs
      other: 0,
      total: 0,
      actualFixed: 0,
      actualVariable: 0,
      actualVariableDaily: 0,
      actualOther: 0,
      actualTotal: 0,
      // New timing-based totals
      preLaunchTotal: 0,
      postLaunchTotal: 0,
      actualPreLaunchTotal: 0,
      actualPostLaunchTotal: 0
    };

    items.forEach(item => {
      const useCost = item.cost;
      const useActualCost = item.actual_cost;
      
      // Determine which cost to use based on timing
      let effectiveCost = useCost;
      let effectiveActualCost = useActualCost;
      
      if (item.timing_type === 'both' && item.post_launch_cost !== null && isPreLaunch === false) {
        effectiveCost = item.post_launch_cost;
        // For actual costs, use actual_cost if available, otherwise use the same logic as planned
        if (useActualCost !== null && useActualCost !== undefined) {
          effectiveActualCost = useActualCost;
        }
      }

      if (item.category === 'variable') {
        // Store daily rate separately
        totals.variableDaily += effectiveCost;
        // Calculate total variable cost based on duration
        const variableCost = phaseDurationDays ? effectiveCost * phaseDurationDays : effectiveCost;
        totals.variable += variableCost;
        totals.total += variableCost;

        // Handle actual costs for variable items
        if (effectiveActualCost !== null && effectiveActualCost !== undefined) {
          totals.actualVariableDaily += effectiveActualCost;
          const actualVariableCost = phaseDurationDays ? effectiveActualCost * phaseDurationDays : effectiveActualCost;
          totals.actualVariable += actualVariableCost;
          totals.actualTotal += actualVariableCost;
        }
      } else {
        totals[item.category] += effectiveCost;
        totals.total += effectiveCost;

        // Handle actual costs for fixed and other items
        if (effectiveActualCost !== null && effectiveActualCost !== undefined) {
          const actualKey = `actual${item.category.charAt(0).toUpperCase() + item.category.slice(1)}` as keyof typeof totals;
          (totals[actualKey] as number) += effectiveActualCost;
          totals.actualTotal += effectiveActualCost;
        }
      }

      // Track timing-based totals
      if (item.timing_type === 'pre_launch' || item.timing_type === 'both') {
        const preCost = item.timing_type === 'both' ? useCost : effectiveCost;
        totals.preLaunchTotal += preCost;
        if (useActualCost !== null && useActualCost !== undefined) {
          totals.actualPreLaunchTotal += useActualCost;
        }
      }
      
      if (item.timing_type === 'post_launch' || item.timing_type === 'both') {
        const postCost = item.timing_type === 'both' && item.post_launch_cost !== null 
          ? item.post_launch_cost 
          : effectiveCost;
        totals.postLaunchTotal += postCost;
        if (useActualCost !== null && useActualCost !== undefined) {
          totals.actualPostLaunchTotal += useActualCost;
        }
      }
    });

    return totals;
  }

  /**
   * Get unique budget item names that have been used before for a specific category and product
   */
  static async getPreviouslyUsedItems(productId: string, category: 'fixed' | 'variable' | 'other'): Promise<string[]> {
    try {
      // Get budget items with phase information using join
      const { data: budgetData, error: budgetError } = await supabase
        .from('phase_budget_items')
        .select(`
          item_name,
          lifecycle_phases!phase_budget_items_phase_id_fkey(product_id)
        `)
        .eq('category', category);

      if (budgetError) {
        console.error('Error fetching budget items:', budgetError);
        return [];
      }

      // Filter by product_id and get unique names
      const filteredItems = budgetData?.filter((item: any) => 
        item.lifecycle_phases?.product_id === productId
      ) || [];
      
      const itemNames = filteredItems.map((item: any) => item.item_name);
      const filteredNames = itemNames.filter((name: string) => name && name.trim());
      const uniqueNames = [...new Set(filteredNames)];
      return uniqueNames;
    } catch (error) {
      console.error('Error in getPreviouslyUsedItems:', error);
      return [];
    }
  }

  /**
   * Get budget items grouped by category
   */
  static groupByCategory(items: PhaseBudgetItem[]) {
    const grouped = {
      fixed: [] as PhaseBudgetItem[],
      variable: [] as PhaseBudgetItem[],
      other: [] as PhaseBudgetItem[]
    };

    items.forEach(item => {
      grouped[item.category].push(item);
    });

    return grouped;
  }

  /**
   * Get feasibility budget items for a portfolio
   */
  static async getFeasibilityBudgetsByPortfolio(portfolioId: string): Promise<PhaseBudgetItem[]> {
    try {
      const { data, error } = await supabase
        .from('phase_budget_items')
        .select('*')
        .eq('feasibility_portfolio_id', portfolioId)
        .eq('is_feasibility', true)
        .order('phase_id', { ascending: true });

      if (error) {
        console.error('Error fetching feasibility budgets:', error);
        throw error;
      }

      return (data || []) as PhaseBudgetItem[];
    } catch (error) {
      console.error('Error in getFeasibilityBudgetsByPortfolio:', error);
      throw error;
    }
  }

  /**
   * Calculate scenario totals for feasibility budgets
   */
  static calculateScenarioTotals(items: PhaseBudgetItem[], scenario: 'worst' | 'likely' | 'best') {
    let total = 0;

    items.forEach(item => {
      switch (scenario) {
        case 'worst':
          total += item.worst_case_amount || 0;
          break;
        case 'likely':
          total += item.likely_case_amount || 0;
          break;
        case 'best':
          total += item.best_case_amount || 0;
          break;
      }
    });

    return total;
  }
}