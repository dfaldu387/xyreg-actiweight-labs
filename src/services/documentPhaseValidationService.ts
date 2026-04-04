
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Service to validate and ensure document phase IDs are correct
 */
export class DocumentPhaseValidationService {
  
  /**
   * Validate all document phase assignments for a product
   */
  static async validateProductDocumentPhases(productId: string): Promise<{
    isValid: boolean;
    fixedCount: number;
    errors: string[];
  }> {
    try {
      console.log('[DocumentPhaseValidationService] Starting validation for product:', productId);
      
      let fixedCount = 0;
      const errors: string[] = [];
      
      // Get all documents for this product
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('id, name, phase_id, document_scope')
        .eq('product_id', productId);

      if (docError) {
        console.error('[DocumentPhaseValidationService] Error fetching documents:', docError);
        errors.push(`Failed to fetch documents: ${docError.message}`);
        return { isValid: false, fixedCount: 0, errors };
      }

      // Get all valid phases for this product
      const { data: phases, error: phaseError } = await supabase
        .from('lifecycle_phases')
        .select('phase_id, name')
        .eq('product_id', productId);

      if (phaseError) {
        console.error('[DocumentPhaseValidationService] Error fetching phases:', phaseError);
        errors.push(`Failed to fetch phases: ${phaseError.message}`);
        return { isValid: false, fixedCount: 0, errors };
      }

      const validPhaseIds = new Set(phases?.map(p => p.phase_id) || []);
      const phaseNameMap = new Map(phases?.map(p => [p.name, p.phase_id]) || []);
      
      console.log('[DocumentPhaseValidationService] Valid phase IDs:', Array.from(validPhaseIds));
      console.log('[DocumentPhaseValidationService] Phase name map:', Array.from(phaseNameMap.entries()));

      // Check each document
      for (const doc of documents || []) {
        if (!doc.phase_id) {
          errors.push(`Document "${doc.name}" has no phase_id assigned`);
          continue;
        }

        if (!validPhaseIds.has(doc.phase_id)) {
          console.log(`[DocumentPhaseValidationService] Document "${doc.name}" has invalid phase_id: ${doc.phase_id}`);
          
          // Try to fix based on document name
          let correctPhaseId: string | undefined;
          
          if (doc.name === 'Concept Brief') {
            // Find the Concept & Feasibility phase
            for (const [phaseName, phaseId] of phaseNameMap.entries()) {
              if (phaseName.toLowerCase().includes('concept') && phaseName.toLowerCase().includes('feasibility')) {
                correctPhaseId = phaseId;
                break;
              }
            }
          }
          
          if (correctPhaseId) {
            // Fix the document's phase_id
            const { error: updateError } = await supabase
              .from('documents')
              .update({ phase_id: correctPhaseId })
              .eq('id', doc.id);

            if (updateError) {
              errors.push(`Failed to fix phase_id for "${doc.name}": ${updateError.message}`);
            } else {
              console.log(`[DocumentPhaseValidationService] Fixed phase_id for "${doc.name}": ${doc.phase_id} -> ${correctPhaseId}`);
              fixedCount++;
            }
          } else {
            errors.push(`Document "${doc.name}" has invalid phase_id: ${doc.phase_id} (no automatic fix available)`);
          }
        }
      }

      const isValid = errors.length === 0;
      console.log('[DocumentPhaseValidationService] Validation complete:', { isValid, fixedCount, errorCount: errors.length });
      
      if (fixedCount > 0) {
        toast.success(`Fixed ${fixedCount} document phase assignment(s)`);
      }
      
      if (errors.length > 0) {
        console.warn('[DocumentPhaseValidationService] Validation errors:', errors);
      }

      return { isValid, fixedCount, errors };
      
    } catch (error) {
      console.error('[DocumentPhaseValidationService] Unexpected error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { isValid: false, fixedCount: 0, errors: [errorMessage] };
    }
  }

  /**
   * Add constraint validation before document creation/update
   */
  static async validateDocumentPhaseIdBeforeUpdate(
    documentId: string, 
    phaseId: string, 
    productId: string
  ): Promise<boolean> {
    try {
      // Check if the phase ID is valid for this product
      const { data: phase, error } = await supabase
        .from('lifecycle_phases')
        .select('phase_id')
        .eq('product_id', productId)
        .eq('phase_id', phaseId)
        .single();

      if (error || !phase) {
        console.error('[DocumentPhaseValidationService] Invalid phase_id for product:', { phaseId, productId, error });
        toast.error(`Invalid phase assignment: Phase not found for this product`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[DocumentPhaseValidationService] Error validating phase_id:', error);
      return false;
    }
  }
}
