import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export class ProductDocumentDueDateService {
  /**
   * Automatically assigns due dates to product documents based on their phase end dates
   */
  static async assignDueDatesFromPhases(productId: string): Promise<boolean> {
    try {
      console.log(`[ProductDocumentDueDateService] Assigning due dates for product: ${productId}`);

      // Get all lifecycle phases for the product with their end dates
      const { data: phases, error: phasesError } = await supabase
        .from('lifecycle_phases')
        .select('id, phase_id, name, end_date')
        .eq('product_id', productId)
        .not('end_date', 'is', null);

      if (phasesError) {
        console.error('[ProductDocumentDueDateService] Error fetching phases:', phasesError);
        throw phasesError;
      }

      if (!phases || phases.length === 0) {
        console.log('[ProductDocumentDueDateService] No phases with end dates found for product');
        return true; // Not an error, just nothing to do
      }

      console.log(`[ProductDocumentDueDateService] Found ${phases.length} phases with end dates`);

      // Update documents for each phase
      let totalUpdated = 0;
      for (const phase of phases) {
        const { data: updateResult, error: updateError } = await supabase
          .from('documents')
          .update({
            due_date: phase.end_date,
            milestone_due_date: phase.end_date,
            updated_at: new Date().toISOString()
          })
          .eq('product_id', productId)
          .eq('phase_id', phase.id)
          .eq('document_scope', 'product_document')
          .select('id');

        if (updateError) {
          console.error(`[ProductDocumentDueDateService] Error updating documents for phase ${phase.name}:`, updateError);
          continue;
        }

        const updatedCount = updateResult?.length || 0;
        totalUpdated += updatedCount;
        console.log(`[ProductDocumentDueDateService] Updated ${updatedCount} documents for phase: ${phase.name}`);
      }

      console.log(`[ProductDocumentDueDateService] Total documents updated: ${totalUpdated}`);

      if (totalUpdated > 0) {
        toast.success(`Updated due dates for ${totalUpdated} documents based on phase end dates`);
      }

      return true;
    } catch (error) {
      console.error('[ProductDocumentDueDateService] Error assigning due dates:', error);
      toast.error('Failed to assign due dates to documents');
      return false;
    }
  }

  /**
   * Updates due dates for documents in a specific phase
   */
  static async updateDueDatesForPhase(productId: string, phaseId: string, endDate: string): Promise<boolean> {
    try {
      console.log(`[ProductDocumentDueDateService] Updating due dates for phase: ${phaseId}, end date: ${endDate}`);

      const { data, error } = await supabase
        .from('documents')
        .update({
          due_date: endDate,
          milestone_due_date: endDate,
          updated_at: new Date().toISOString()
        })
        .eq('product_id', productId)
        .eq('phase_id', phaseId)
        .eq('document_scope', 'product_document')
        .select('id');

      if (error) {
        console.error('[ProductDocumentDueDateService] Error updating phase documents:', error);
        throw error;
      }

      const updatedCount = data?.length || 0;
      console.log(`[ProductDocumentDueDateService] Updated ${updatedCount} documents for phase`);

      return true;
    } catch (error) {
      console.error('[ProductDocumentDueDateService] Error updating phase due dates:', error);
      return false;
    }
  }

  /**
   * Trigger to run when a phase end date is changed
   */
  static async onPhaseEndDateChange(productId: string, phaseId: string, newEndDate: string | null): Promise<void> {
    if (!newEndDate) {
      // If end date is removed, clear due dates for documents in this phase
      try {
        await supabase
          .from('documents')
          .update({
            due_date: null,
            milestone_due_date: null,
            updated_at: new Date().toISOString()
          })
          .eq('product_id', productId)
          .eq('phase_id', phaseId)
          .eq('document_scope', 'product_document');

        console.log(`[ProductDocumentDueDateService] Cleared due dates for phase ${phaseId}`);
      } catch (error) {
        console.error('[ProductDocumentDueDateService] Error clearing due dates:', error);
      }
      return;
    }

    // Update due dates based on new end date
    await this.updateDueDatesForPhase(productId, phaseId, newEndDate);
  }

  /**
   * Batch update due dates for all products in a company
   */
  static async assignDueDatesForAllProducts(companyId: string): Promise<{ updated: number; errors: string[] }> {
    try {
      console.log(`[ProductDocumentDueDateService] Batch updating due dates for company: ${companyId}`);

      // Get all products for the company
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_archived', false);

      if (productsError) {
        console.error('[ProductDocumentDueDateService] Error fetching products:', productsError);
        throw productsError;
      }

      if (!products || products.length === 0) {
        console.log('[ProductDocumentDueDateService] No products found for company');
        return { updated: 0, errors: [] };
      }

      let totalUpdated = 0;
      const errors: string[] = [];

      // Process each product
      for (const product of products) {
        try {
          const success = await this.assignDueDatesFromPhases(product.id);
          if (success) {
            totalUpdated++;
          } else {
            errors.push(`Failed to update product: ${product.name}`);
          }
        } catch (error) {
          console.error(`[ProductDocumentDueDateService] Error processing product ${product.name}:`, error);
          errors.push(`Error with product ${product.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      console.log(`[ProductDocumentDueDateService] Batch update complete. Updated: ${totalUpdated}, Errors: ${errors.length}`);

      if (totalUpdated > 0) {
        toast.success(`Updated due dates for ${totalUpdated} products`);
      }

      if (errors.length > 0) {
        toast.error(`Failed to update ${errors.length} products. Check console for details.`);
      }

      return { updated: totalUpdated, errors };
    } catch (error) {
      console.error('[ProductDocumentDueDateService] Error in batch update:', error);
      toast.error('Failed to batch update due dates');
      return { updated: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  }

  /**
   * Update due dates for a specific product (for existing products)
   */
  static async updateExistingProductDueDates(productId: string): Promise<boolean> {
    try {
      console.log(`[ProductDocumentDueDateService] Updating existing product due dates: ${productId}`);
      
      const success = await this.assignDueDatesFromPhases(productId);
      
      if (success) {
        toast.success('Due dates updated for existing device documents');
      }
      
      return success;
    } catch (error) {
      console.error('[ProductDocumentDueDateService] Error updating existing product:', error);
      toast.error('Failed to update existing product due dates');
      return false;
    }
  }
}