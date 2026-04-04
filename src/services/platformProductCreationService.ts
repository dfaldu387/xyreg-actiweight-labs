import { supabase } from '@/integrations/supabase/client';
import { assignProductToFirstActivePhase } from '@/utils/productPhaseAssignment';
import { ProductDocumentDueDateService } from './productDocumentDueDateService';
import { ProductUpdateService } from './productUpdateService';
import { productLimitService } from './productLimitService';
import { standardDocData } from '@/data/standardDocData';
import { PhaseSynchronizationService } from './phaseSynchronizationService';
import { ProductPhaseDependencyService } from './productPhaseDependencyService';

export interface PlatformProductCreationData {
  name: string;
  description?: string;
  company_id: string;
  platform_name: string;
  product_class?: string;
  product_market?: string;
  project_types: string[];
  parent_product_id?: string;
  basic_udi_di?: string;
  project_start_date?: Date;
}

export async function createProductFromPlatform(
  productData: PlatformProductCreationData
): Promise<{ success: boolean; productId?: string; error?: string }> {
  try {
    // Check plan limits first
    // const { data: { user } } = await supabase.auth.getUser();
    // if (user) {
    //   const limitCheck = await productLimitService.canCreateProduct(productData.company_id, user.id);
    //   if (!limitCheck.allowed) {
    //     return {
    //       success: false,
    //       error: limitCheck.reason || 'Plan limit exceeded'
    //     };
    //   }
    // }
    // Set project_start_date - use provided date or default to today
    const projectStartDate = productData.project_start_date
      ? productData.project_start_date.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    // 1. Create the new product with platform linkage
    const { data: newProduct, error: productError } = await supabase
      .from('products')
      .insert({
        name: productData.name,
        description: productData.description,
        company_id: productData.company_id,
        product_platform: productData.platform_name,
        class: productData.product_class || null,
        product_market: productData.product_market,
        project_types: productData.project_types,
        parent_product_id: productData.parent_product_id || null,
        status: 'Concept',
        version: '1.0',
        is_line_extension: !!productData.parent_product_id,
        project_start_date: projectStartDate
      })
      .select('id')
      .single();

    if (productError) {
      console.error('Error creating platform product:', productError);
      return { success: false, error: productError.message };
    }
    console.log(`[PlatformProductCreationService] Successfully created Here Is The New Product`, newProduct);
    try {
      const STANDARD_DOCUMENT_TEMPLATES = standardDocData;
      const { data: getCompanyPhases, error: getCompanyPhasesError } = await supabase
        .from('phases')
        .select("*")
        .eq('company_id', productData.company_id)
      // .maybeSingle();
      if (getCompanyPhasesError) {
        console.log(`[CompanyInitializationService] Error getting company phases: ${getCompanyPhasesError}`);
        return
      }
      console.log(`Cloning ${getCompanyPhases.length} default documents to phase_assigned_document_template for product ${newProduct.id}`);

      if (getCompanyPhases.length > 0) {
        for (const template of STANDARD_DOCUMENT_TEMPLATES) {
          const phaseAssignments = getCompanyPhases
            .filter(phase => template.phases.includes(phase.name))
            .map(phase => ({
              phase_id: phase.id,
              name: template.name,
              document_type: 'Standard',
              document_scope: 'product_template' as const,
              status: 'Not Started',
              tech_applicability: 'All device types',
              markets: [],
              classes_by_market: {},
              file_name: '',
              file_path: '',
              file_size: 0,
              file_type: '',
              is_predefined_core_template: true,
              uploaded_at: null,
              uploaded_by: null,
              reviewers: [],
              description: null,
              deadline: null,
              reviewer_group_id: null,
              product_id: newProduct.id,
              company_id: productData.company_id
            } as any));
          console.log(`[PlatformProductCreationService] Successfully created Here Is The Phase Assignments`, phaseAssignments);
          const { error: insertError } = await supabase
            .from('phase_assigned_document_template')
            .insert(phaseAssignments);
          if (insertError) {
            console.log(`[PlatformProductCreationService] Error creating phase assigned document template: ${insertError}`);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to clone default documents:', error);
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
      console.warn('[PlatformProductCreationService] Failed to sync phases from company:', syncError);
      // Don't fail product creation if phase sync fails
    }

    // 2. Automatically assign product to first active phase
    const phaseAssignment = await assignProductToFirstActivePhase(newProduct.id, productData.company_id);
    if (!phaseAssignment.success) {
      console.warn('Product created but phase assignment failed:', phaseAssignment.error);
    } else {
      console.log(`Product automatically assigned to phase: ${phaseAssignment.phaseAssigned}`);

      // Update the product with the current_lifecycle_phase
      const { error: updateError } = await supabase
        .from('products')
        .update({ current_lifecycle_phase: phaseAssignment.phaseAssigned })
        .eq('id', newProduct.id);

      if (updateError) {
        console.warn('Failed to update current_lifecycle_phase:', updateError);
      }
    }

    // 3. Clone all default system documents to STANDARD_DOCUMENT_TEMPLATES for this product

    // 4. Inherit platform documents
    await inheritPlatformDocumentsForProduct(newProduct.id, productData.platform_name, productData.company_id);

    // 5. Set up document due dates based on phase end dates
    setTimeout(async () => {
      try {
        await ProductDocumentDueDateService.assignDueDatesFromPhases(newProduct.id);
      } catch (error) {
        console.warn('Failed to assign due dates for new platform product:', error);
      }
    }, 1000);

    // Invalidate product caches to refresh sidebar
    await ProductUpdateService.invalidateProductCaches(newProduct.id, productData.company_id);

    return { success: true, productId: newProduct.id };
  } catch (error) {
    console.error('Error creating platform product:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function inheritPlatformDocumentsForProduct(
  productId: string,
  platformName: string,
  companyId: string
) {
  try {
    // Find platform master product (first product with this platform name)
    const { data: platformProducts, error: platformError } = await supabase
      .from('products')
      .select('id')
      .eq('company_id', companyId)
      .eq('product_platform', platformName)
      .eq('is_archived', false)
      .order('inserted_at', { ascending: true })
      .limit(1);

    if (platformError || !platformProducts || platformProducts.length === 0) {
      console.log('No platform master product found');
      return;
    }

    const masterProductId = platformProducts[0].id;

    // Get platform documents to inherit
    const { data: platformDocuments, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .eq('product_id', masterProductId)
      .in('document_type', ['Platform Core', 'Architecture', 'Risk Management Platform', 'Biocompatibility Platform']);

    if (docsError || !platformDocuments) {
      console.error('Error fetching platform documents:', docsError);
      return;
    }

    // Create inherited documents
    const documentsToCreate = platformDocuments.map(platformDoc => ({
      product_id: productId,
      company_id: companyId,
      phase_id: platformDoc.phase_id,
      name: `${platformDoc.name} (Platform: ${platformName})`,
      status: 'Inherited',
      document_type: platformDoc.document_type,
      description: `Inherited from platform: ${platformName}`,
      document_scope: 'product_document' as const,
      version: '1.0',
      file_name: platformDoc.file_name,
      file_path: platformDoc.file_path,
      file_size: platformDoc.file_size
    }));

    if (documentsToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('documents')
        .insert(documentsToCreate);

      if (insertError) {
        console.error('Error inserting inherited platform documents:', insertError);
      } else {
        console.log(`Successfully inherited ${documentsToCreate.length} platform documents`);
      }
    }
  } catch (error) {
    console.error('Error in platform document inheritance:', error);
  }
}