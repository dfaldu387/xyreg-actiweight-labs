import { supabase } from '@/integrations/supabase/client';
import { PROJECT_CATEGORIES, PROJECT_TYPES } from '@/types/project';
import { assignProductToFirstActivePhase } from '@/utils/productPhaseAssignment';
import { sanitizeImageArray, prepareImagesForStorage } from '@/utils/imageDataUtils';
import { PhaseSynchronizationService } from './phaseSynchronizationService';
import { ProductPhaseDependencyService } from './productPhaseDependencyService';

export interface ProductCreationData {
  name: string;
  description?: string;
  company_id: string;
  product_class?: string; // Made optional
  product_market?: string;
  project_types: string[]; // New mandatory field
}

export async function createProduct(productData: ProductCreationData): Promise<{ success: boolean; productId?: string; error?: string }> {
  try {
    const { data: newProduct, error } = await supabase
      .from('products')
      .insert({
        name: productData.name,
        description: productData.description,
        company_id: productData.company_id,
        class: productData.product_class || null, // Can be null now
        product_market: productData.product_market,
        project_types: productData.project_types, // Add project types
        status: 'Concept',
        version: '1.0', // Set initial version
        is_line_extension: false, // Default for new products
        parent_product_id: null // Default for new products
      })
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
      console.warn('[ProjectCreationService] Failed to sync phases from company:', syncError);
      // Don't fail product creation if phase sync fails
    }

    // Automatically assign product to first active phase and set current_lifecycle_phase
    const phaseAssignment = await assignProductToFirstActivePhase(newProduct.id, productData.company_id);
    if (!phaseAssignment.success) {
      console.warn('Product created but phase assignment failed:', phaseAssignment.error);
      // Don't fail product creation if phase assignment fails
    } else {
      // Update the product with the current_lifecycle_phase
      const { error: updateError } = await supabase
        .from('products')
        .update({ current_lifecycle_phase: phaseAssignment.phaseAssigned })
        .eq('id', newProduct.id);

      if (updateError) {
        console.warn('Failed to update current_lifecycle_phase:', updateError);
      }
    }

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
    const { data: newProduct, error: productError } = await supabase
      .from('products')
      .insert({
        name: productData.name,
        description: productData.description,
        company_id: productData.company_id,
        class: productData.product_class || null, // Can be null now
        product_market: productData.product_market,
        project_types: productData.project_types, // Add project types
        status: 'Concept',
        version: '1.0', // Set initial version
        is_line_extension: false, // Default for new products
        parent_product_id: null // Default for new products
      })
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
      console.warn('[ProjectCreationService] Failed to sync phases from company:', syncError);
      // Don't fail product creation if phase sync fails
    }

    // Automatically assign product to first active phase
    const phaseAssignment = await assignProductToFirstActivePhase(newProduct.id, companyId);
    if (!phaseAssignment.success) {
      console.warn('Product created but phase assignment failed:', phaseAssignment.error);
      // Don't fail product creation if phase assignment fails
    }

    // Get company phases with proper error handling
    const { data: companyPhases, error: phasesError } = await supabase
      .from('company_chosen_phases')
      .select(`
        position,
        company_phases!inner(id, name, description)
      `)
      .eq('company_id', companyId)
      .order('position');

    if (phasesError) {
      console.error('Error fetching company phases:', phasesError);
      throw phasesError;
    }

    // Safely handle the phases data
    if (companyPhases && Array.isArray(companyPhases)) {
      const phaseDocuments = companyPhases.map(cp => ({
        product_id: newProduct.id,
        phase_id: cp.company_phases.id,
        name: `${cp.company_phases.name} Template`,
        document_type: 'Template',
        status: 'Not Started'
      }));

      if (phaseDocuments.length > 0) {
        const { error: documentsError } = await supabase
          .from('documents')
          .insert(phaseDocuments);

        if (documentsError) {
          console.error('Error creating phase documents:', documentsError);
        }
      }
    }

    return { success: true, productId: newProduct.id };
  } catch (error) {
    console.error('Error creating product with templates:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export interface ExistingProductVersionData {
  baseProductId: string;
  projectName?: string;
  projectDescription?: string;
  projectTypes: string[];
  changeDescription?: string;
  companyId: string;
}

export async function createExistingProductVersion(
  versionData: ExistingProductVersionData
): Promise<{ success: boolean; productId?: string; projectId?: string; error?: string }> {
  try {
    // Fetch the base product data
    const { data: baseProduct, error: baseProductError } = await supabase
      .from('products')
      .select('name, description, company_id')
      .eq('id', versionData.baseProductId)
      .single();

    if (baseProductError) {
      console.error('Error fetching base product:', baseProductError);
      return { success: false, error: baseProductError.message };
    }

    if (!baseProduct) {
      console.error('Base product not found');
      return { success: false, error: 'Base product not found' };
    }

    // Create a new project for the product version
    const { data: newProject, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: versionData.projectName || `Upgrade ${baseProduct.name}`,
        description: versionData.projectDescription || `Project to upgrade existing product ${baseProduct.name}`,
        project_category: PROJECT_CATEGORIES.EXISTING_PRODUCT,
        project_types: versionData.projectTypes,
        company_id: versionData.companyId,
        product_id: versionData.baseProductId,
        status: 'Active'
      })
      .select('id')
      .single();

    if (projectError) {
      console.error('Error creating project:', projectError);
      return { success: false, error: projectError.message };
    }

    if (!newProject || !newProject.id) {
      console.error('No project ID returned after creation');
      return { success: false, error: 'No project ID returned' };
    }

    // Create a new product version (assuming you have a function for this)
    // const versionCreationResult = await createNewProductVersion({
    //   baseProductId: versionData.baseProductId,
    //   changeDescription: versionData.changeDescription,
    //   companyId: versionData.companyId
    // });

    // if (!versionCreationResult.success) {
    //   console.error('Error creating new product version:', versionCreationResult.error);
    //   return { success: false, error: versionCreationResult.error };
    // }

    return { success: true, projectId: newProject.id, productId: versionData.baseProductId };
  } catch (error) {
    console.error('Error creating existing product version:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function createNewProduct({
  name,
  description,
  companyId,
  projectTypes,
  projectStartDate,
  basicUdiDi
}: {
  name: string;
  description?: string;
  companyId: string;
  projectTypes: string[];
  projectStartDate?: Date;
  basicUdiDi?: string;
}): Promise<{ success: boolean; productId?: string; projectId?: string; error?: string }> {
  try {
    // Create the new product
    const { data: newProduct, error: productError } = await supabase
      .from('products')
      .insert({
        name,
        description: description || '',
        company_id: companyId,
        project_types: projectTypes,
        status: 'Concept',
        version: '1.0',
        is_line_extension: false,
        parent_product_id: null,
        basic_udi_di: basicUdiDi || null
      })
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
      console.warn('[ProjectCreationService] Failed to sync phases from company:', syncError);
      // Don't fail product creation if phase sync fails
    }

    // Automatically assign product to first active phase and set current_lifecycle_phase
    const phaseAssignment = await assignProductToFirstActivePhase(newProduct.id, companyId);
    if (!phaseAssignment.success) {
      console.warn('Product created but phase assignment failed:', phaseAssignment.error);
    } else {
      // Update the product with the current_lifecycle_phase
      const { error: updateError } = await supabase
        .from('products')
        .update({ current_lifecycle_phase: phaseAssignment.phaseAssigned })
        .eq('id', newProduct.id);

      if (updateError) {
        console.warn('Failed to update current_lifecycle_phase:', updateError);
      }
    }

    // Create the associated project
    const { data: newProject, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: `${name} Development Project`,
        description: description || `Development project for ${name}`,
        project_category: PROJECT_CATEGORIES.NEW_PRODUCT,
        project_types: projectTypes,
        company_id: companyId,
        product_id: newProduct.id,
        status: 'Active'
      })
      .select('id')
      .single();

    if (projectError) {
      console.error('Error creating project:', projectError);
      return { success: false, error: projectError.message };
    }

    return { success: true, productId: newProduct.id, projectId: newProject?.id };
  } catch (error) {
    console.error('Error creating product:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function createLineExtension({
  name,
  description,
  parentProductId,
  companyId,
  projectTypes,
  productPlatform
}: {
  name: string;
  description?: string;
  parentProductId: string | null;
  companyId: string;
  projectTypes: string[];
  productPlatform: string;
}): Promise<{ success: boolean; productId?: string; projectId?: string; error?: string }> {
  try {
    let parentImageData: string[] = [];
    let parentProductData: any = null;
    let resolvedParentProductId = parentProductId;

    if (!resolvedParentProductId) {
      const { data: platformDevices, error: platformError } = await supabase
        .from('products')
        .select('id')
        .eq('company_id', companyId)
        .eq('product_platform', productPlatform)
        .eq('is_archived', false)
        .limit(1);

      if (platformError) {
        console.error('[createLineExtension] Error fetching platform devices:', platformError);
        return { success: false, error: 'Failed to look up base device for this platform' };
      }

      if (platformDevices && platformDevices.length > 0) {
        resolvedParentProductId = platformDevices[0].id;
      }
    }

    if (!resolvedParentProductId) {
      return { success: false, error: 'Could not find a base device for this platform. Please select a base device.' };
    }

    // If we have a parent product, fetch its data including images
    if (resolvedParentProductId) {
      const { data: parentProduct, error: parentError } = await supabase
        .from('products')
        .select('id, name, images, class, markets, intended_purpose_data, contraindications')
        .eq('id', resolvedParentProductId)
        .single();

      if (parentError) {
        console.error('[createLineExtension] Error fetching parent product:', parentError);
        return { success: false, error: 'Failed to fetch parent product data' };
      }

      if (parentProduct) {
        parentProductData = parentProduct;
        // Extract and sanitize image data from parent product
        if (parentProduct.images) {
          parentImageData = sanitizeImageArray(parentProduct.images);
        }
      }
    }

    // Create the line extension product
    const { data: newProduct, error: productError } = await supabase
      .from('products')
      .insert({
        name,
        description: description || '',
        company_id: companyId,
        class: parentProductData?.class || null,
        markets: parentProductData?.markets || null,
        project_types: projectTypes,
        status: 'Concept',
        version: '1.0',
        is_line_extension: true,
        parent_product_id: resolvedParentProductId,
        product_platform: productPlatform,
        // Inherit image data from parent product
        images: parentImageData.length > 0 ? prepareImagesForStorage(parentImageData) : null,
        // Inherit other relevant data from parent
        intended_purpose_data: parentProductData?.intended_purpose_data || null,
        contraindications: parentProductData?.contraindications || null
      })
      .select('id')
      .single();

    if (productError) {
      console.error('[createLineExtension] Error creating line extension product:', productError);
      return { success: false, error: productError.message };
    }

    if (!newProduct || !newProduct.id) {
      console.error('[createLineExtension] No product ID returned after creation');
      return { success: false, error: 'No product ID returned' };
    }

    // Update parent product with the platform if it doesn't already have one
    if (resolvedParentProductId && productPlatform) {
      const { error: parentUpdateError } = await supabase
        .from('products')
        .update({ product_platform: productPlatform })
        .eq('id', resolvedParentProductId)
        .is('product_platform', null);

      if (parentUpdateError) {
        console.warn('[createLineExtension] Failed to update parent product platform:', parentUpdateError);
      }
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
      console.warn('[createLineExtension] Failed to sync phases from company:', syncError);
      // Don't fail product creation if phase sync fails
    }

    // Automatically assign product to first active phase and set current_lifecycle_phase
    const phaseAssignment = await assignProductToFirstActivePhase(newProduct.id, companyId);
    if (!phaseAssignment.success) {
      console.warn('[createLineExtension] Product created but phase assignment failed:', phaseAssignment.error);
    } else {
      // Update the product with the current_lifecycle_phase
      const { error: updateError } = await supabase
        .from('products')
        .update({ current_lifecycle_phase: phaseAssignment.phaseAssigned })
        .eq('id', newProduct.id);
        
      if (updateError) {
        console.warn('[createLineExtension] Failed to update current_lifecycle_phase:', updateError);
      }
    }

    // Create the associated project
    const { data: newProject, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: `${name} Development Project`,
        description: description || `Development project for ${name} line extension`,
        project_category: PROJECT_CATEGORIES.LINE_EXTENSION,
        project_types: projectTypes,
        company_id: companyId,
        product_id: newProduct.id,
        parent_product_id: parentProductId,
        status: 'Active'
      })
      .select('id')
      .single();

    if (projectError) {
      console.error('[createLineExtension] Error creating project:', projectError);
      return { success: false, error: projectError.message };
    }

    return {
      success: true,
      productId: newProduct.id,
      projectId: newProject?.id
    };
  } catch (error) {
    console.error('[createLineExtension] Unexpected error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function getCompanyProductsForSelection(companyId: string) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, status, inserted_at, version, parent_product_id')
      .eq('company_id', companyId);

    if (error) {
      console.error('Error fetching products for selection:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching products for selection:', error);
    return [];
  }
}
