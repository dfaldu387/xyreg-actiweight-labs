import { supabase } from '@/integrations/supabase/client';
import { ProductForSelection } from '@/types/project';
import { assignProductToFirstActivePhase } from '@/utils/productPhaseAssignment';
import { checkProductNameExists, generateUniqueProductName } from './duplicateNameValidation';
import { ConsolidatedAutomaticInstanceService } from './consolidatedAutomaticInstanceService';
import { ProductUpdateService } from './productUpdateService';
import { productLimitService } from './productLimitService';
import { ReferenceNumberService } from './referenceNumberService';
import { PhaseSynchronizationService } from './phaseSynchronizationService';
import { ProductPhaseDependencyService } from './productPhaseDependencyService';
import { syncMissingDocsToProduct } from './productDocumentSyncService';
import { EnhancedRecalculationService } from './enhancedRecalculationService';

// Progress tracking types for device creation
export interface DeviceCreationProgress {
  step: number;
  totalSteps: number;
  stepName: string;
  percentage: number;
}

export type DeviceProgressCallback = (progress: DeviceCreationProgress) => void;

// Helper function to report progress
function reportProgress(
  onProgress: DeviceProgressCallback | undefined,
  step: number,
  totalSteps: number,
  stepName: string
) {
  if (onProgress) {
    const percentage = Math.round((step / totalSteps) * 100);
    onProgress({ step, totalSteps, stepName, percentage });
  }
}

/**
 * Get products available for selection in project creation
 */
export async function getCompanyProductsForSelection(companyId: string): Promise<ProductForSelection[]> {
  try {
    // Use pagination for companies with many products to avoid timeouts
    const PAGE_SIZE = 200; // Smaller chunks for better performance
    let allProducts: any[] = [];
    let hasMore = true;
    let page = 0;

    while (hasMore && page < 15) { // Safety limit to prevent infinite loops
      try {
        const { data: productsPage, error } = await supabase
          .from('products')
          .select('id, name, description, status, inserted_at, version, parent_product_id, basic_udi_di, udi_di')
          .eq('company_id', companyId)
          .eq('is_archived', false)
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
          .order('inserted_at', { ascending: false });

        if (error) {
          console.error(`[ProjectCreationService] Error fetching products page ${page}:`, error);
          if (page === 0) {
            throw error; // Only throw if first page fails
          }
          break; // Use partial data from successful pages
        }

        if (productsPage && productsPage.length > 0) {
          allProducts = [...allProducts, ...productsPage];
          hasMore = productsPage.length === PAGE_SIZE;
          page++;
        } else {
          hasMore = false;
        }
      } catch (pageError) {
        console.error(`[ProjectCreationService] Page ${page} failed:`, pageError);
        if (page === 0) {
          throw pageError;
        }
        break; // Continue with partial data
      }
    }

    if (allProducts.length === 0) {
      return [];
    }

    // Transform and validate the data
    const products: ProductForSelection[] = allProducts.map((product: any) => {
      return {
        id: product.id,
        name: product.name,
        description: product.description || '',
        status: product.status || 'On Track',
        created_at: product.inserted_at,
        inserted_at: product.inserted_at,
        version: product.version || '1.0',
        parent_product_id: product.parent_product_id,
        basic_udi_di: product.basic_udi_di,
        udi_di: product.udi_di,
        company_id: product.company_id
      };
    });

    return products;
  } catch (error) {
    console.error('[ProjectCreationService] Error in getCompanyProductsForSelection:', error);
    throw error;
  }
}

/**
 * Create a new product from scratch with progress tracking
 */
export async function createNewProduct(
  productData: {
    name: string;
    description?: string;
    companyId: string;
    projectTypes: string[];
    baseProductId?: string;
    launchDate?: Date;
    projectStartDate?: Date;
    productPlatform?: string;
    basicUdiDi?: string;
    systemArchitecture?: 'pure_hardware' | 'hardware_simd' | 'samd' | '';
  },
  onProgress?: DeviceProgressCallback
): Promise<{ success: boolean; productId?: string; portfolioId?: string; error?: string }> {
  const TOTAL_STEPS = 8;

  try {
    // Step 1: Validating device name
    reportProgress(onProgress, 1, TOTAL_STEPS, 'Validating device name');

    // Check plan limits first
    // const { data: { user } } = await supabase.auth.getUser();
    // if (user) {
    //   const limitCheck = await productLimitService.canCreateProduct(productData.companyId, user.id);
    //   if (!limitCheck.allowed) {
    //     return {
    //       success: false,
    //       error: limitCheck.reason || 'Plan limit exceeded'
    //     };
    //   }
    // }

    // Validate that product name doesn't already exist
    const nameCheck = await checkProductNameExists(productData.companyId, productData.name);
    if (nameCheck.error) {
      return { success: false, error: `Name validation failed: ${nameCheck.error}` };
    }

    if (nameCheck.exists) {
      return {
        success: false,
        error: `A product named "${productData.name}" already exists in this company. Please choose a different name.`
      };
    }

    // Step 2: Creating device record
    reportProgress(onProgress, 2, TOTAL_STEPS, 'Creating device record');

    // Map system architecture to key_technology_characteristics JSON
    const mapArchitectureToTechCharacteristics = (arch?: string) => {
      if (!arch) return null;
      switch (arch) {
        case 'pure_hardware':
          return { noSoftware: true };
        case 'hardware_simd':
          return { isSoftwareMobileApp: true };
        case 'samd':
          return { isSoftwareAsaMedicalDevice: true };
        default:
          return null;
      }
    };

    // Set project_start_date - use provided date or default to today
    const projectStartDate = productData.projectStartDate
      ? productData.projectStartDate.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const { data: newProduct, error } = await supabase
      .from('products')
      .insert({
        name: productData.name,
        description: productData.description,
        company_id: productData.companyId,
        project_types: productData.projectTypes,
        status: 'Concept',
        version: '1.0',
        is_line_extension: false,
        parent_product_id: null,
        is_archived: false,
        project_start_date: projectStartDate,
        projected_launch_date: productData.launchDate?.toISOString(),
        product_platform: productData.productPlatform,
        basic_udi_di: productData.basicUdiDi || null,
        key_technology_characteristics: mapArchitectureToTechCharacteristics(productData.systemArchitecture)
      })
      .select('id')
      .single();

    if (error) {
      console.error('[ProjectCreationService] Error creating product:', error);
      // Handle the unique constraint violation specifically
      if (error.code === '23505' && error.message.includes('unique_product_name_per_company')) {
        return {
          success: false,
          error: `A product named "${productData.name}" already exists in this company. Please choose a different name.`
        };
      }

      return { success: false, error: error.message };
    }

    if (!newProduct?.id) {
      return { success: false, error: 'No product ID returned' };
    }

    // Step 3: Setting up document templates — sync ALL company template docs + SOPs
    reportProgress(onProgress, 3, TOTAL_STEPS, 'Setting up document templates');

    try {
      const syncResult = await syncMissingDocsToProduct(newProduct.id, productData.companyId);
      if (!syncResult.success) {
        console.warn('[ProjectCreationService] Document sync had errors:', syncResult.errors);
      }
    } catch (error) {
      console.warn('[ProjectCreationService] Failed to sync documents:', error);
    }

    // Step 4: Assigning to lifecycle phase
    reportProgress(onProgress, 4, TOTAL_STEPS, 'Assigning to lifecycle phase');

    // Sync phases from company settings (Full Replace logic)
    try {
      const syncResult = await PhaseSynchronizationService.syncProductWithCompanyPhases(
        newProduct.id,
        productData.companyId
      );

      if (syncResult.success) {
        // Also sync dependencies from company
        await ProductPhaseDependencyService.initializeFromActiveCompanyPhases(
          newProduct.id,
          productData.companyId,
          true // Replace existing dependencies
        );

        // Recalculate timeline with dependencies (preserve-manual mode)
        // This ensures continuous phases like Risk Management start at the correct date
        try {
          const depsResult = await ProductPhaseDependencyService.getProductDependencies(newProduct.id);
          const deps = (depsResult.success && depsResult.dependencies ? depsResult.dependencies : []) as any[];

          await EnhancedRecalculationService.recalculateTimeline(
            newProduct.id,
            productData.companyId,
            {
              mode: 'preserve-manual',
              timelineMode: 'forward',
              projectStartDate: productData.projectStartDate || new Date(),
              enforceConstraints: false,
            },
            deps
          );
        } catch (recalcError) {
          console.warn('[ProjectCreationService] Failed to recalculate timeline:', recalcError);
        }
      }
    } catch (syncError) {
      console.error('[ProjectCreationService] Exception during phase sync:', syncError);
      // Don't fail product creation if phase sync fails
    }

    // Automatically assign product to first active phase
    const phaseAssignment = await assignProductToFirstActivePhase(newProduct.id, productData.companyId);
    if (!phaseAssignment.success) {
      console.warn('[ProjectCreationService] Product created but phase assignment failed:', phaseAssignment.error);
      // Don't fail product creation if phase assignment fails
    }

    // Step 5: Creating document instances
    reportProgress(onProgress, 5, TOTAL_STEPS, 'Creating document instances');

    // Automatically create system document instances for all company phases
    try {
      const instanceService = new ConsolidatedAutomaticInstanceService(newProduct.id, productData.companyId);
      // Skip cleanup for new products - phases were just created in Step 4
      const syncResult = await instanceService.syncAllCompanyTemplates({ skipCleanup: true });

      if (syncResult.errors.length > 0) {
        console.warn('[ProjectCreationService] Some document instances failed to create:', syncResult.errors);
      }
    } catch (error) {
      console.error('[ProjectCreationService] Error creating system document instances:', error);
      // Don't fail product creation if document instantiation fails
    }

    // Step 6: Generating reference number
    reportProgress(onProgress, 6, TOTAL_STEPS, 'Generating reference number');

    // Generate and assign EUDAMED reference number
    try {
      // Get company name for reference number generation
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', productData.companyId)
        .single();

      if (company) {
        await ReferenceNumberService.generateAndAssign(
          newProduct.id,
          productData.companyId,
          company.name
        );
      }
    } catch (refError) {
      console.error('[ProjectCreationService] Error generating reference number:', refError);
      // Don't fail product creation if reference number generation fails
    }

    // Step 7: Finalizing device setup
    reportProgress(onProgress, 7, TOTAL_STEPS, 'Finalizing device setup');

    // Invalidate product caches to refresh sidebar
    await ProductUpdateService.invalidateProductCaches(newProduct.id, productData.companyId);

    // Step 8: Complete
    reportProgress(onProgress, 8, TOTAL_STEPS, 'Complete');

    return {
      success: true,
      productId: newProduct.id
    };
  } catch (error) {
    console.error('[ProjectCreationService] Error creating new product:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Create a new product version based on an existing product
 */
export async function createExistingProductVersion(versionData: {
  baseProductId: string;
  projectName?: string;
  projectDescription?: string;
  projectTypes: string[];
  companyId: string;
  launchDate?: Date;
}): Promise<{ success: boolean; productId?: string; projectId?: string; error?: string }> {
  try {
    // Get the base product info for auto-naming if needed
    const { data: baseProduct, error: baseProductError } = await supabase
      .from('products')
      .select('name, version')
      .eq('id', versionData.baseProductId)
      .single();

    if (baseProductError) {
      console.error('[ProjectCreationService] Error fetching base product:', baseProductError);
      return { success: false, error: 'Could not find base product' };
    }

    // Generate auto version number and name if not provided
    let projectName = versionData.projectName;
    if (!projectName) {
      // Get existing versions for this base product
      const { data: existingVersions, error: versionsError } = await supabase
        .from('products')
        .select('version')
        .eq('parent_product_id', versionData.baseProductId)
        .order('version', { ascending: false });

      if (versionsError) {
        console.error('[ProjectCreationService] Error fetching versions:', versionsError);
        return { success: false, error: 'Could not fetch existing versions' };
      }

      // Determine next version number
      let nextVersionNumber = 2; // Start with v2
      if (existingVersions && existingVersions.length > 0) {
        const versions = existingVersions
          .map(v => v.version || '1.0')
          .map(v => {
            const match = v.match(/^(\d+)\.(\d+)$/);
            return match ? parseInt(match[1], 10) : 1;
          })
          .filter(v => !isNaN(v));

        if (versions.length > 0) {
          nextVersionNumber = Math.max(...versions) + 1;
        }
      }

      // Generate auto name
      const baseName = baseProduct.name.replace(/\s*\(v\d+\).*$/, ''); // Remove existing version suffix
      projectName = `${baseName} v${nextVersionNumber}`;
    }

    // Validate that the project name doesn't already exist
    const nameCheck = await checkProductNameExists(versionData.companyId, projectName);
    if (nameCheck.error) {
      return { success: false, error: `Name validation failed: ${nameCheck.error}` };
    }

    if (nameCheck.exists) {
      // Auto-generate a unique name if there's a conflict
      const uniqueNameResult = await generateUniqueProductName(versionData.companyId, projectName);
      if (uniqueNameResult.error) {
        return { success: false, error: `Could not generate unique name: ${uniqueNameResult.error}` };
      }
      projectName = uniqueNameResult.uniqueName;
    }

    // Call the database function with the exact parameter signature
    const { data: projectId, error } = await supabase.rpc('create_project_for_existing_product', {
      p_project_name: projectName,
      p_project_category: 'EXISTING PRODUCT',
      p_project_types: JSON.stringify(versionData.projectTypes),
      p_selected_product_id: versionData.baseProductId,
      p_company_id: versionData.companyId,
      p_description: versionData.projectDescription || ''
    });

    if (error) {
      console.error('[ProjectCreationService] Database error:', error);

      // Handle the unique constraint violation specifically
      if (error.message.includes('unique_product_name_per_company')) {
        return {
          success: false,
          error: `A product named "${projectName}" already exists. Please try again or choose a different name.`
        };
      }

      return { success: false, error: error.message };
    }

    if (!projectId) {
      return { success: false, error: 'No project ID returned from database function' };
    }

    // Get the project details to find the product_id
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('product_id')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('[ProjectCreationService] Could not fetch project details:', projectError);
      // Still return success but without productId
      return {
        success: true,
        projectId: projectId,
        error: 'Could not retrieve product ID'
      };
    }

    if (!projectData?.product_id) {
      return {
        success: true,
        projectId: projectId,
        error: 'Product ID not found in project'
      };
    }

    // Update the product with the launch date if provided
    if (versionData.launchDate) {
      try {
        const { error: launchDateError } = await supabase
          .from('products')
          .update({
            projected_launch_date: versionData.launchDate.toISOString()
          })
          .eq('id', projectData.product_id);

        if (launchDateError) {
          console.warn('[ProjectCreationService] Failed to update launch date:', launchDateError);
          // Don't fail the creation, just log the warning
        }
      } catch (error) {
        console.warn('[ProjectCreationService] Error updating launch date:', error);
      }
    }

    // Automatically create system document instances for all company phases
    // This ensures the new product version inherits template-based documents
    try {
      const instanceService = new ConsolidatedAutomaticInstanceService(projectData.product_id, versionData.companyId);
      const syncResult = await instanceService.syncAllCompanyTemplates();

      if (syncResult.errors.length > 0) {
        console.warn('[ProjectCreationService] Some document instances failed to create:', syncResult.errors);
      }
    } catch (error) {
      console.error('[ProjectCreationService] Error creating system document instances:', error);
      // Don't fail product creation if document instantiation fails
    }

    // Sync ALL company template docs + SOPs to this product version
    try {
      const docSyncResult = await syncMissingDocsToProduct(projectData.product_id, versionData.companyId);
      if (!docSyncResult.success) {
        console.warn('[ProjectCreationService] Document sync had errors:', docSyncResult.errors);
      }
    } catch (error) {
      console.warn('[ProjectCreationService] Failed to sync documents:', error);
    }

    // Copy current phase assignment from base product to ensure new version starts in same phase
    try {
      const { data: baseProductPhase, error: basePhaseError } = await supabase
        .from('lifecycle_phases')
        .select('phase_id, is_current_phase')
        .eq('product_id', versionData.baseProductId)
        .eq('is_current_phase', true)
        .single();

      if (!basePhaseError && baseProductPhase) {
        // Assign the new product to the same current phase as the base product
        const phaseAssignment = await assignProductToFirstActivePhase(projectData.product_id, versionData.companyId, baseProductPhase.phase_id);
        if (!phaseAssignment.success) {
          console.warn('[ProjectCreationService] Could not assign same phase as base product:', phaseAssignment.error);
        }
      } else {
        // Fall back to default phase assignment
        await assignProductToFirstActivePhase(projectData.product_id, versionData.companyId);
      }
    } catch (error) {
      console.error('[ProjectCreationService] Error copying phase assignment from base product:', error);
    }

    // Invalidate product caches to refresh sidebar
    await ProductUpdateService.invalidateProductCaches(projectData.product_id, versionData.companyId);

    return {
      success: true,
      projectId: projectId,
      productId: projectData.product_id
    };
  } catch (error) {
    console.error('[ProjectCreationService] Error creating product version:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Create a line extension product with platform support and progress tracking
 */
export async function createLineExtension(
  extensionData: {
    name: string;
    description?: string;
    parentProductId: string | null;
    companyId: string;
    projectTypes: string[];
    productPlatform: string;
    launchDate?: Date;
    projectStartDate?: Date;
  },
  onProgress?: DeviceProgressCallback
): Promise<{ success: boolean; productId?: string; error?: string }> {
  const TOTAL_STEPS = 7;

  try {
    // Step 1: Validating device name
    reportProgress(onProgress, 1, TOTAL_STEPS, 'Validating device name');

    // Check plan limits first
    // const { data: { user } } = await supabase.auth.getUser();
    // if (user) {
    //   const limitCheck = await productLimitService.canCreateProduct(extensionData.companyId, user.id);
    //   if (!limitCheck.allowed) {
    //     return {
    //       success: false,
    //       error: limitCheck.reason || 'Plan limit exceeded'
    //     };
    //   }
    // }

    let resolvedParentProductId = extensionData.parentProductId;

    // Validate that product name doesn't already exist
    const nameCheck = await checkProductNameExists(extensionData.companyId, extensionData.name);
    if (nameCheck.error) {
      return { success: false, error: `Name validation failed: ${nameCheck.error}` };
    }

    if (nameCheck.exists) {
      return {
        success: false,
        error: `A product named "${extensionData.name}" already exists in this company. Please choose a different name.`
      };
    }

    // Step 2: Resolving parent device
    reportProgress(onProgress, 2, TOTAL_STEPS, 'Resolving parent device');

    // Resolve parent product if not provided (use an existing device with same platform)
    if (!resolvedParentProductId) {
      const { data: platformDevices, error: platformError } = await supabase
        .from('products')
        .select('id')
        .eq('company_id', extensionData.companyId)
        .eq('product_platform', extensionData.productPlatform)
        .eq('is_archived', false)
        .limit(1);

      if (platformError) {
        console.error('[ProjectCreationService] Error fetching platform devices:', platformError);
        return { success: false, error: 'Failed to look up base device for this platform' };
      }

      if (platformDevices && platformDevices.length > 0) {
        resolvedParentProductId = platformDevices[0].id;
      }
    }

    if (!resolvedParentProductId) {
      return { success: false, error: 'Could not find a base device for this platform. Please select a base device.' };
    }

    // First, update the parent product to have the platform if it doesn't already
    const { data: parentProduct, error: parentError } = await supabase
      .from('products')
      .select('product_platform')
      .eq('id', resolvedParentProductId)
      .single();

    if (parentError) {
      console.error('[ProjectCreationService] Error fetching parent product:', parentError);
      return { success: false, error: 'Could not find parent product' };
    }

    // If parent product doesn't have a platform, assign it
    if (!parentProduct.product_platform) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ product_platform: extensionData.productPlatform })
        .eq('id', resolvedParentProductId);

      if (updateError) {
        console.error('[ProjectCreationService] Error updating parent product platform:', updateError);
        // Don't fail the creation for this, just log it
      }
    }

    // Step 3: Creating line extension record
    reportProgress(onProgress, 3, TOTAL_STEPS, 'Creating line extension record');

    // Set project_start_date - use provided date or default to today
    const projectStartDate = extensionData.projectStartDate
      ? extensionData.projectStartDate.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    // Create the line extension product
    const { data: newProduct, error } = await supabase
      .from('products')
      .insert({
        name: extensionData.name,
        description: extensionData.description,
        company_id: extensionData.companyId,
        parent_product_id: resolvedParentProductId,
        product_platform: extensionData.productPlatform,
        project_types: extensionData.projectTypes,
        status: 'Concept',
        version: '1.0',
        is_line_extension: true,
        is_archived: false,
        project_start_date: projectStartDate,
        projected_launch_date: extensionData.launchDate?.toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('[ProjectCreationService] Error creating line extension:', error);

      // Handle the unique constraint violation specifically
      if (error.code === '23505' && error.message.includes('unique_product_name_per_company')) {
        return {
          success: false,
          error: `A product named "${extensionData.name}" already exists in this company. Please choose a different name.`
        };
      }

      return { success: false, error: error.message };
    }

    if (!newProduct?.id) {
      return { success: false, error: 'No product ID returned' };
    }

    // Sync ALL company template docs + SOPs to this line extension
    try {
      const docSyncResult = await syncMissingDocsToProduct(newProduct.id, extensionData.companyId);
      if (!docSyncResult.success) {
        console.warn('[ProjectCreationService] Document sync had errors:', docSyncResult.errors);
      }
    } catch (error) {
      console.warn('[ProjectCreationService] Failed to sync documents:', error);
    }

    // Step 4: Assigning to lifecycle phase
    reportProgress(onProgress, 4, TOTAL_STEPS, 'Assigning to lifecycle phase');

    // Sync phases from company settings (Full Replace logic)
    try {
      const syncResult = await PhaseSynchronizationService.syncProductWithCompanyPhases(
        newProduct.id,
        extensionData.companyId
      );

      if (syncResult.success) {
        // Also sync dependencies from company
        await ProductPhaseDependencyService.initializeFromActiveCompanyPhases(
          newProduct.id,
          extensionData.companyId,
          true // Replace existing dependencies
        );
      }
    } catch (syncError) {
      console.error('[ProjectCreationService] Exception during phase sync:', syncError);
      // Don't fail product creation if phase sync fails
    }

    // Automatically assign product to first active phase
    const phaseAssignment = await assignProductToFirstActivePhase(newProduct.id, extensionData.companyId);
    if (!phaseAssignment.success) {
      console.warn('[ProjectCreationService] Line extension created but phase assignment failed:', phaseAssignment.error);
      // Don't fail product creation if phase assignment fails
    }

    // Step 5: Creating document instances
    reportProgress(onProgress, 5, TOTAL_STEPS, 'Creating document instances');

    // Automatically create system document instances for all company phases
    try {
      const instanceService = new ConsolidatedAutomaticInstanceService(newProduct.id, extensionData.companyId);
      // Skip cleanup for new products - phases were just created in Step 4
      const syncResult = await instanceService.syncAllCompanyTemplates({ skipCleanup: true });

      if (syncResult.errors.length > 0) {
        console.warn('[ProjectCreationService] Some document instances failed to create:', syncResult.errors);
      }
    } catch (error) {
      console.error('[ProjectCreationService] Error creating system document instances:', error);
      // Don't fail product creation if document instantiation fails
    }

    // Step 6: Finalizing device setup
    reportProgress(onProgress, 6, TOTAL_STEPS, 'Finalizing device setup');

    // Invalidate product caches to refresh sidebar
    await ProductUpdateService.invalidateProductCaches(newProduct.id, extensionData.companyId);

    // Step 7: Complete
    reportProgress(onProgress, 7, TOTAL_STEPS, 'Complete');

    return { success: true, productId: newProduct.id };
  } catch (error) {
    console.error('[ProjectCreationService] Error creating line extension:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
