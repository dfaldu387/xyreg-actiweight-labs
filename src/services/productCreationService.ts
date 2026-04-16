
import { supabase } from '@/integrations/supabase/client';
import { assignProductToFirstActivePhase } from '@/utils/productPhaseAssignment';
import { ProductDocumentDueDateService } from './productDocumentDueDateService';
import { NoPhaseService } from './noPhaseService';
import { PhaseSynchronizationService } from './phaseSynchronizationService';
import { ProductPhaseDependencyService } from './productPhaseDependencyService';
import { syncMissingDocsToProduct } from './productDocumentSyncService';

export interface ProductCreationData {
  name: string;
  description?: string;
  company_id: string;
  product_class?: string; // Made optional
  product_market?: string;
  project_types: string[]; // New mandatory field
  project_start_date?: Date;
}

export async function createProduct(productData: ProductCreationData): Promise<{ success: boolean; productId?: string; error?: string }> {
  try {
    // Set project_start_date - use provided date or default to today
    const projectStartDate = productData.project_start_date
      ? productData.project_start_date.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const { data: newProduct, error } = await supabase
      .from('products')
      .insert({
        name: productData.name,
        description: productData.description,
        company_id: productData.company_id,
        class: productData.product_class || null,
        product_market: productData.product_market,
        project_types: productData.project_types,
        status: 'Concept',
        version: '1.0',
        is_line_extension: false,
        parent_product_id: null,
        project_start_date: projectStartDate
      } as any)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return { success: false, error: error.message };
    }

    if (!newProduct || !newProduct.id) {
      console.error('No product ID returned after creation');
      return { success: false, error: 'No product ID returned' };
    }

    // Sync phases from company settings (Full Replace logic)
    try {
      const syncResult = await PhaseSynchronizationService.syncProductWithCompanyPhases(
        newProduct.id,
        productData.company_id
      );

      if (syncResult.success) {
        // Also sync dependencies from company
        await ProductPhaseDependencyService.initializeFromActiveCompanyPhases(
          newProduct.id,
          productData.company_id,
          true // Replace existing dependencies
        );
      }
    } catch (syncError) {
      console.warn('[ProductCreationService] Failed to sync phases from company:', syncError);
      // Don't fail product creation if phase sync fails
    }

    // Automatically assign product to first active phase and set current_lifecycle_phase
    const phaseAssignment = await assignProductToFirstActivePhase(newProduct.id, productData.company_id);
    if (!phaseAssignment.success) {
      console.warn('Product created but phase assignment failed:', phaseAssignment.error);
    } else {
      const { error: updateError } = await supabase
        .from('products')
        .update({ current_lifecycle_phase: phaseAssignment.phaseAssigned })
        .eq('id', newProduct.id);

      if (updateError) {
        console.warn('Failed to update current_lifecycle_phase:', updateError);
      }
    }

    // Sync ALL active phase documents + SOPs from company templates to this product
    try {
      const syncResult = await syncMissingDocsToProduct(newProduct.id, productData.company_id);
      console.log('[ProductCreationService] Document sync result:', syncResult);
    } catch (error) {
      console.warn('[ProductCreationService] Failed to sync documents:', error);
    }

    // Set up document due dates based on phase end dates
    setTimeout(async () => {
      try {
        await ProductDocumentDueDateService.assignDueDatesFromPhases(newProduct.id);
      } catch (error) {
        console.warn('Failed to assign due dates for new product:', error);
      }
    }, 1000);

    return { success: true, productId: newProduct.id };
  } catch (error) {
    console.error('Error creating product:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function createProductWithTemplates(
  productData: ProductCreationData,
  companyId: string
): Promise<{ success: boolean; productId?: string; error?: string }> {
  try {
    // Set project_start_date - use provided date or default to today
    const projectStartDate = productData.project_start_date
      ? productData.project_start_date.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const { data: newProduct, error: productError } = await supabase
      .from('products')
      .insert({
        name: productData.name,
        description: productData.description,
        company_id: productData.company_id,
        class: productData.product_class || null,
        product_market: productData.product_market,
        project_types: productData.project_types,
        status: 'Concept',
        version: '1.0',
        is_line_extension: false,
        parent_product_id: null,
        project_start_date: projectStartDate
      } as any)
      .select('id')
      .single();

    if (productError) {
      console.error('Error creating product:', productError);
      return { success: false, error: productError.message };
    }

    if (!newProduct || !newProduct.id) {
      console.error('No product ID returned after creation');
      return { success: false, error: 'No product ID returned' };
    }

    // Sync phases from company settings (Full Replace logic)
    try {
      const syncResult = await PhaseSynchronizationService.syncProductWithCompanyPhases(
        newProduct.id,
        companyId
      );

      if (syncResult.success) {
        // Also sync dependencies from company
        await ProductPhaseDependencyService.initializeFromActiveCompanyPhases(
          newProduct.id,
          companyId,
          true // Replace existing dependencies
        );
      }
    } catch (syncError) {
      console.warn('[ProductCreationService] Failed to sync phases from company:', syncError);
      // Don't fail product creation if phase sync fails
    }

    // Automatically assign product to first active phase and set current_lifecycle_phase
    const phaseAssignment = await assignProductToFirstActivePhase(newProduct.id, companyId);
    if (!phaseAssignment.success) {
      console.warn('Product created but phase assignment failed:', phaseAssignment.error);
    } else {
      const { error: updateError } = await supabase
        .from('products')
        .update({ current_lifecycle_phase: phaseAssignment.phaseAssigned })
        .eq('id', newProduct.id);

      if (updateError) {
        console.warn('Failed to update current_lifecycle_phase:', updateError);
      }
    }

    // Sync ALL active phase documents + SOPs from company templates to this product
    try {
      const syncResult = await syncMissingDocsToProduct(newProduct.id, companyId);
      console.log('[ProductCreationService] Document sync result:', syncResult);
    } catch (error) {
      console.warn('[ProductCreationService] Failed to sync documents:', error);
    }

    // Set up document due dates based on phase end dates
    setTimeout(async () => {
      try {
        await ProductDocumentDueDateService.assignDueDatesFromPhases(newProduct.id);
      } catch (error) {
        console.warn('Failed to assign due dates for new product:', error);
      }
    }, 1000);

    return { success: true, productId: newProduct.id };
  } catch (error) {
    console.error('Error creating product with templates:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
