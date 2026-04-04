
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { calculatePhaseTime } from "./gapAnalysisService";

/**
 * Service for updating gap analysis items
 */
export class GapAnalysisUpdateService {
  /**
   * Update a gap analysis item
   */
  async updateGapItem(itemId: string, updates: {
    name?: string;
    description?: string;
    status?: string;
    assigned_to?: string;
    priority?: string;
    action_needed?: string;
  }): Promise<boolean> {
    try {
      console.log("GapAnalysisUpdateService: Updating gap item:", itemId, updates);

      const { error } = await supabase
        .from('gap_analysis_items')
        .update({
          clause_summary: updates.name,
          requirement: updates.description || updates.name,
          status: this.mapStatusToDb(updates.status),
          assigned_to: updates.assigned_to,
          priority: updates.priority?.toLowerCase(),
          action_needed: updates.action_needed,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) {
        console.error("GapAnalysisUpdateService: Update failed:", error);
        toast.error(`Failed to update gap analysis item: ${error.message}`);
        return false;
      }

      console.log("GapAnalysisUpdateService: Update successful");
      toast.success("Gap analysis item updated successfully");
      return true;
    } catch (error) {
      console.error("GapAnalysisUpdateService: Unexpected error:", error);
      toast.error("An unexpected error occurred while updating the gap analysis item");
      return false;
    }
  }

  /**
   * Map UI status to database status
   */
  private mapStatusToDb(status?: string): string {
    if (!status) return 'non_compliant';
    
    switch (status.toLowerCase()) {
      case 'completed':
      case 'compliant':
      case 'closed':
        return 'compliant';
      case 'in progress':
      case 'partially compliant':
        return 'partially_compliant';
      case 'not applicable':
      case 'n/a':
        return 'not_applicable';
      case 'not started':
      case 'open':
      case 'non compliant':
      default:
        return 'non_compliant';
    }
  }

  /**
   * Update applicable phases for multiple gap analysis items
   */
  async updateGapItemPhases(itemIds: string[], phases: string[]): Promise<boolean> {
    try {
      console.log("GapAnalysisUpdateService: Updating phases for items:", itemIds, "Phases:", phases);

      // Validate user has permission to update these items
      const { data: items, error: fetchError } = await supabase
        .from('gap_analysis_items')
        .select('id, product_id')
        .in('id', itemIds);

      if (fetchError) {
        console.error("GapAnalysisUpdateService: Error fetching items for validation:", fetchError);
        toast.error(`Permission check failed: ${fetchError.message}`);
        return false;
      }

      if (!items || items.length !== itemIds.length) {
        console.error("GapAnalysisUpdateService: Some items not found or not accessible");
        toast.error("Some gap analysis items could not be found or you don't have permission to update them");
        return false;
      }

      // Group items by product_id for efficient batch phase_time calculation
      const itemsByProduct = new Map<string, string[]>();
      items.forEach(item => {
        const productId = item.product_id || 'no-product';
        if (!itemsByProduct.has(productId)) {
          itemsByProduct.set(productId, []);
        }
        itemsByProduct.get(productId)!.push(item.id);
      });

      // Calculate phase_time for each product group and update items
      const updatePromises = Array.from(itemsByProduct.entries()).map(async ([productId, itemIdsForProduct]) => {
        // Calculate phase_time (use null for 'no-product' group)
        const effectiveProductId = productId === 'no-product' ? null : productId;
        const phaseTime = await calculatePhaseTime(effectiveProductId, phases);

        // Update all items for this product with the same phase_time
        const { error: updateError } = await supabase
          .from('gap_analysis_items')
          .update({
            applicable_phases: phases,
            phase_time: phaseTime,
            updated_at: new Date().toISOString()
          })
          .in('id', itemIdsForProduct);

        if (updateError) {
          console.error(`GapAnalysisUpdateService: Phase update failed for product ${productId}:`, updateError);
          throw updateError;
        }

        return { productId, count: itemIdsForProduct.length };
      });

      // Wait for all updates to complete
      const results = await Promise.all(updatePromises);

      console.log("GapAnalysisUpdateService: Phase update successful", results);
      toast.success(`Successfully updated phases for ${itemIds.length} items`);
      return true;
    } catch (error: any) {
      console.error("GapAnalysisUpdateService: Unexpected error updating phases:", error);
      
      // Provide specific error messages based on error type
      if (error?.code === '42501') {
        toast.error("You don't have permission to update these gap analysis items. Please check your access level.");
      } else if (error?.code === '23503') {
        toast.error("One or more selected phases are invalid.");
      } else {
        toast.error(`Failed to update phases: ${error?.message || 'Unknown error'}`);
      }
      return false;
    }
  }

  /**
   * Check if an item is a gap analysis item
   */
  static async isGapAnalysisItem(itemId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('gap_analysis_items')
        .select('id')
        .eq('id', itemId)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }
}
