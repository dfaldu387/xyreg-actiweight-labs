import { supabase } from '@/integrations/supabase/client';
import { PhaseBudgetItem, CreateBudgetItemData } from './phaseBudgetService';

export interface BudgetItemTemplate {
  item_name: string;
  category: 'fixed' | 'variable' | 'other';
  phases: string[]; // Phase IDs where this item exists
  sample_cost?: number; // Sample cost for reference
}

export interface PhaseBudgetSummary {
  phase_id: string;
  phase_name: string;
  items: PhaseBudgetItem[];
  fixed_total: number;
  variable_total: number;
  other_total: number;
  actual_fixed_total: number;
  actual_variable_total: number;
  actual_other_total: number;
}

export interface BulkBudgetUpdateData {
  phase_id: string;
  item_name: string;
  category: 'fixed' | 'variable' | 'other';
  cost: number;
  actual_cost?: number | null;
}

export class BulkBudgetService {
  /**
   * Get all budget items across all phases for a product
   */
  static async getAllBudgetItemsForProduct(productId: string): Promise<PhaseBudgetSummary[]> {
    const { data, error } = await supabase
      .from('phase_budget_items')
      .select(`
        *,
        lifecycle_phases!inner(
          id,
          name,
          product_id,
          start_date,
          end_date,
          company_phases(duration_days, position)
        )
      `)
      .eq('lifecycle_phases.product_id', productId);

    if (error) {
      console.error('Error fetching budget items:', error);
      throw new Error('Failed to fetch budget items');
    }

    // Group by phase
    const phaseGroups = new Map<string, {
      phase_id: string;
      phase_name: string;
      items: PhaseBudgetItem[];
      duration_days?: number;
      position?: number;
    }>();

    data.forEach((item) => {
      const phaseId = item.phase_id;
      const phaseName = item.lifecycle_phases.name;
      
      // Calculate phase duration
      let durationDays: number | undefined;
      let position: number | undefined;
      
      // Try company_phases duration and position first
      if (item.lifecycle_phases.company_phases?.[0]) {
        durationDays = item.lifecycle_phases.company_phases[0].duration_days;
        position = item.lifecycle_phases.company_phases[0].position;
      }
      // Fall back to calculating from dates
      if (!durationDays && item.lifecycle_phases.start_date && item.lifecycle_phases.end_date) {
        const startDate = new Date(item.lifecycle_phases.start_date);
        const endDate = new Date(item.lifecycle_phases.end_date);
        durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      if (!phaseGroups.has(phaseId)) {
        phaseGroups.set(phaseId, {
          phase_id: phaseId,
          phase_name: phaseName,
          items: [],
          duration_days: durationDays,
          position
        });
      }
      
      phaseGroups.get(phaseId)!.items.push(item as PhaseBudgetItem);
    });

    // Calculate totals for each phase (with variable costs multiplied by duration)
    const phaseSummaries = Array.from(phaseGroups.values()).map(group => {
      const fixed = group.items.filter(item => item.category === 'fixed');
      const variable = group.items.filter(item => item.category === 'variable');
      const other = group.items.filter(item => item.category === 'other');

      // Calculate variable costs considering duration
      const variableTotal = variable.reduce((sum, item) => {
        const dailyCost = item.cost;
        const totalCost = group.duration_days ? dailyCost * group.duration_days : dailyCost;
        return sum + totalCost;
      }, 0);

      const actualVariableTotal = variable.reduce((sum, item) => {
        const dailyActualCost = item.actual_cost || 0;
        const totalActualCost = group.duration_days ? dailyActualCost * group.duration_days : dailyActualCost;
        return sum + totalActualCost;
      }, 0);

      return {
        ...group,
        fixed_total: fixed.reduce((sum, item) => sum + item.cost, 0),
        variable_total: variableTotal,
        other_total: other.reduce((sum, item) => sum + item.cost, 0),
        actual_fixed_total: fixed.reduce((sum, item) => sum + (item.actual_cost || 0), 0),
        actual_variable_total: actualVariableTotal,
        actual_other_total: other.reduce((sum, item) => sum + (item.actual_cost || 0), 0),
        position: group.position
      };
    });

    // Sort by position to ensure chronological order
    return phaseSummaries.sort((a, b) => {
      if (a.position !== undefined && b.position !== undefined) {
        return a.position - b.position;
      }
      // Fallback to alphabetical if no position
      return a.phase_name.localeCompare(b.phase_name);
    });
  }

  /**
   * Get budget item templates (unique items across phases)
   */
  static async getBudgetItemTemplates(productId: string): Promise<BudgetItemTemplate[]> {
    const { data, error } = await supabase
      .from('phase_budget_items')
      .select(`
        item_name,
        category,
        cost,
        phase_id,
        lifecycle_phases!inner(
          product_id
        )
      `)
      .eq('lifecycle_phases.product_id', productId);

    if (error) {
      console.error('Error fetching budget templates:', error);
      throw new Error('Failed to fetch budget templates');
    }

    // Group by item name and category
    const templateMap = new Map<string, BudgetItemTemplate>();

    data.forEach((item) => {
      const key = `${item.item_name}-${item.category}`;
      
      if (!templateMap.has(key)) {
        templateMap.set(key, {
          item_name: item.item_name,
          category: item.category as 'fixed' | 'variable' | 'other',
          phases: [item.phase_id],
          sample_cost: item.cost
        });
      } else {
        const template = templateMap.get(key)!;
        if (!template.phases.includes(item.phase_id)) {
          template.phases.push(item.phase_id);
        }
        // Use average cost as sample
        template.sample_cost = ((template.sample_cost || 0) + item.cost) / 2;
      }
    });

    return Array.from(templateMap.values());
  }

  /**
   * Bulk create budget items across multiple phases
   */
  static async bulkCreateBudgetItems(
    items: Array<CreateBudgetItemData & { phase_id: string }>
  ): Promise<void> {
    // Convert Date objects to strings for database insertion
    const dbItems = items.map(item => ({
      ...item,
      active_start_date: item.active_start_date?.toISOString().split('T')[0] || null,
      active_end_date: item.active_end_date?.toISOString().split('T')[0] || null
    }));

    const { error } = await supabase
      .from('phase_budget_items')
      .insert(dbItems);

    if (error) {
      console.error('Error bulk creating budget items:', error);
      throw new Error('Failed to create budget items');
    }
  }

  /**
   * Bulk update budget items (costs and actual costs)
   */
  static async bulkUpdateBudgetItems(updates: BulkBudgetUpdateData[]): Promise<void> {
    console.log('Starting bulk update with data:', updates);
    
    // Group updates by phase and item for efficient processing
    const updatePromises = updates.map(async (update, index) => {
      console.log(`Processing update ${index + 1}/${updates.length}:`, update);
      
      try {
        // Find existing item or create if it doesn't exist
        const { data: existingItems, error: selectError } = await supabase
          .from('phase_budget_items')
          .select('id')
          .eq('phase_id', update.phase_id)
          .eq('item_name', update.item_name)
          .eq('category', update.category)
          .limit(1);

        if (selectError) {
          console.error('Error selecting existing items:', selectError);
          throw selectError;
        }

        console.log(`Found ${existingItems?.length || 0} existing items for update ${index + 1}`);

        if (existingItems && existingItems.length > 0) {
          // Update existing item
          console.log(`Updating existing item ${existingItems[0].id}`);
          const { error } = await supabase
            .from('phase_budget_items')
            .update({
              cost: update.cost,
              actual_cost: update.actual_cost
            })
            .eq('id', existingItems[0].id);

          if (error) {
            console.error('Error updating existing item:', error);
            throw error;
          }
          console.log(`Successfully updated item ${existingItems[0].id}`);
        } else {
          // Create new item
          console.log(`Creating new item for phase ${update.phase_id}`);
          const { error } = await supabase
            .from('phase_budget_items')
            .insert({
              phase_id: update.phase_id,
              item_name: update.item_name,
              category: update.category,
              cost: update.cost,
              actual_cost: update.actual_cost,
              currency: 'USD' // Default currency
            });

          if (error) {
            console.error('Error creating new item:', error);
            throw error;
          }
          console.log(`Successfully created new item for phase ${update.phase_id}`);
        }
      } catch (error) {
        console.error(`Error processing update ${index + 1}:`, error);
        throw error;
      }
    });

    try {
      await Promise.all(updatePromises);
      console.log('All bulk updates completed successfully');
    } catch (error) {
      console.error('Bulk update failed:', error);
      throw new Error('Failed to update budget items: ' + (error as Error).message);
    }
  }

  /**
   * Get product phases for bulk operations
   */
  static async getProductPhases(productId: string): Promise<Array<{ id: string; name: string }>> {
    const { data, error } = await supabase
      .from('lifecycle_phases')
      .select('id, name')
      .eq('product_id', productId)
      .order('name');

    if (error) {
      console.error('Error fetching product phases:', error);
      throw new Error('Failed to fetch product phases');
    }

    return data || [];
  }
}