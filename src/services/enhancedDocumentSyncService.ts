import { supabase } from "@/integrations/supabase/client";
import { getCompanyPhaseMappings, findPhaseByName } from "@/utils/phaseMapping";
import { supabaseApiClient } from "@/utils/supabaseApiClient";
import { DocumentCleanupService } from "@/services/documentCleanupService";
import { toast } from "sonner";

export interface EnhancedSyncResult {
  success: boolean;
  created: number;
  updated: number;
  cleaned: number;
  errors: string[];
  details?: any[];
}

/**
 * Enhanced document sync that includes cleanup and proper template instantiation
 */
export async function enhancedSyncDocumentsToProduct(
  productId: string,
  companyId: string,
  currentPhaseName?: string
): Promise<EnhancedSyncResult> {
  try {
    console.log('Starting enhanced document sync for product:', productId);
    
    // Step 1: Run cleanup for this product first
    const cleanupResult = await DocumentCleanupService.cleanupProductDocuments(productId);
    console.log('Cleanup completed:', cleanupResult);

    // Step 2: Get company phase mappings
    const phaseMappings = await getCompanyPhaseMappings(companyId);
    
    if (!currentPhaseName) {
      // Try to get current phase from product
      const { data: productData } = await supabase
        .from('products')
        .select('current_lifecycle_phase')
        .eq('id', productId)
        .single();
      
      currentPhaseName = productData?.current_lifecycle_phase;
    }

    if (!currentPhaseName) {
      return { 
        success: false, 
        created: 0, 
        updated: 0, 
        cleaned: cleanupResult.duplicatesRemoved + cleanupResult.orphansFixed,
        errors: ['No current phase found for product'] 
      };
    }

    const targetPhase = findPhaseByName(phaseMappings, currentPhaseName);
    
    if (!targetPhase) {
      return { 
        success: false, 
        created: 0, 
        updated: 0, 
        cleaned: cleanupResult.duplicatesRemoved + cleanupResult.orphansFixed,
        errors: [`Phase "${currentPhaseName}" not found in company phases`] 
      };
    }

    // Step 3: Ensure lifecycle phase exists and get its ID
    const lifecyclePhaseId = await ensureLifecyclePhaseExists(productId, targetPhase.id, targetPhase.name);

    // Step 4: Get phase document templates from company phase
    const { data: templates, error: templatesError } = await supabase
      .from('phase_assigned_documents')
      .select('*')
      .eq('phase_id', targetPhase.id);

    if (templatesError) {
      return {
        success: false,
        created: 0,
        updated: 0,
        cleaned: cleanupResult.duplicatesRemoved + cleanupResult.orphansFixed,
        errors: [`Failed to fetch templates: ${templatesError.message}`]
      };
    }

    if (!templates || templates.length === 0) {
      return { 
        success: true, 
        created: 0, 
        updated: 0, 
        cleaned: cleanupResult.duplicatesRemoved + cleanupResult.orphansFixed,
        errors: [] 
      };
    }

    // Step 5: Create new document instances safely using lifecycle phase ID
    let documentsCreated = 0;
    const creationErrors: string[] = [];

    for (const template of templates) {
      const documentData = {
        product_id: productId,
        company_id: companyId,
        phase_id: lifecyclePhaseId, // Use lifecycle phase ID, not company phase ID
        name: template.name,
        status: 'Not Started',
        document_type: template.document_type || 'Standard',
        document_scope: 'product_document' as const,
        template_source_id: template.id,
        description: `Template: ${template.name}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const result = await DocumentCleanupService.createDocumentSafely(documentData);
      
      if (result.success) {
        documentsCreated++;
      } else {
        // Only log as error if it's not a "already exists" error
        if (!result.error?.includes('already exists')) {
          creationErrors.push(result.error || 'Unknown error');
        }
      }
    }

    console.log(`Successfully created ${documentsCreated} documents from templates`);
    return { 
      success: true, 
      created: documentsCreated, 
      updated: 0, 
      cleaned: cleanupResult.duplicatesRemoved + cleanupResult.orphansFixed,
      errors: creationErrors,
      details: cleanupResult.details
    };

  } catch (error) {
    console.error('Error in enhancedSyncDocumentsToProduct:', error);
    return {
      success: false,
      created: 0,
      updated: 0,
      cleaned: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

async function ensureLifecyclePhaseExists(productId: string, phaseId: string, phaseName: string): Promise<string> {
  const { data: existingPhase } = await supabase
    .from('lifecycle_phases')
    .select('id')
    .eq('product_id', productId)
    .eq('phase_id', phaseId)
    .single();

  if (existingPhase) {
    return existingPhase.id;
  }

  // Remove current phase flags from other phases
  await supabase
    .from('lifecycle_phases')
    .update({ is_current_phase: false })
    .eq('product_id', productId);

  // Create new lifecycle phase
  const { data: newPhase, error } = await supabase
    .from('lifecycle_phases')
    .insert({
      product_id: productId,
      phase_id: phaseId,
      name: phaseName,
      is_current_phase: true,
      status: 'In Progress',
      progress: 0
    })
    .select('id')
    .single();

  if (error || !newPhase) {
    throw new Error(`Failed to create lifecycle phase: ${error?.message}`);
  }

  return newPhase.id;
}
