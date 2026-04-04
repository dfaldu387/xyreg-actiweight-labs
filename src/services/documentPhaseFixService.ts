
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Service to fix and validate document phase ID assignments
 */
export class DocumentPhaseFixService {
  
  /**
   * Fix the "Concept Brief" document to point to the correct phase
   */
  static async fixConceptBriefPhaseId(productId: string, companyId: string): Promise<boolean> {
    try {
      console.log('[DocumentPhaseFixService] Starting fix for Concept Brief document');
      
      // First, find the "Concept Brief" document
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('id, name, phase_id')
        .eq('product_id', productId)
        .eq('name', 'Concept Brief')
        .eq('document_scope', 'product_document');

      if (docError) {
        console.error('[DocumentPhaseFixService] Error finding Concept Brief:', docError);
        return false;
      }

      if (!documents || documents.length === 0) {
        console.log('[DocumentPhaseFixService] No Concept Brief document found');
        return false;
      }

      const conceptBrief = documents[0];
      console.log('[DocumentPhaseFixService] Found Concept Brief:', conceptBrief);

      // Find the correct "(1) Concept & Feasibility" phase
      const { data: phases, error: phaseError } = await supabase
        .from('lifecycle_phases')
        .select('id, phase_id, name')
        .eq('product_id', productId)
        .ilike('name', '%Concept%Feasibility%');

      if (phaseError) {
        console.error('[DocumentPhaseFixService] Error finding phases:', phaseError);
        return false;
      }

      if (!phases || phases.length === 0) {
        console.log('[DocumentPhaseFixService] No Concept & Feasibility phase found');
        return false;
      }

      const correctPhase = phases[0];
      console.log('[DocumentPhaseFixService] Found correct phase:', correctPhase);

      // Check if the document is already pointing to the correct phase
      if (conceptBrief.phase_id === correctPhase.phase_id) {
        console.log('[DocumentPhaseFixService] Document already has correct phase_id');
        return true;
      }

      // Update the document to point to the correct phase
      const { error: updateError } = await supabase
        .from('documents')
        .update({ 
          phase_id: correctPhase.phase_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', conceptBrief.id);

      if (updateError) {
        console.error('[DocumentPhaseFixService] Error updating document phase_id:', updateError);
        toast.error('Failed to fix document phase assignment');
        return false;
      }

      console.log(`[DocumentPhaseFixService] Successfully updated Concept Brief phase_id from ${conceptBrief.phase_id} to ${correctPhase.phase_id}`);
      toast.success('Fixed Concept Brief phase assignment');
      return true;

    } catch (error) {
      console.error('[DocumentPhaseFixService] Unexpected error:', error);
      toast.error('Failed to fix document phase assignment');
      return false;
    }
  }

  /**
   * Validate all documents for a product have correct phase assignments
   */
  static async validateAllDocumentPhases(productId: string): Promise<{
    valid: number;
    invalid: number;
    issues: Array<{ documentName: string; issue: string; }>;
  }> {
    try {
      console.log('[DocumentPhaseFixService] Validating all document phases for product:', productId);
      
      // Get all documents for the product
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('id, name, phase_id, document_scope')
        .eq('product_id', productId);

      if (docError) {
        console.error('[DocumentPhaseFixService] Error fetching documents:', docError);
        throw docError;
      }

      // Get all phases for the product
      const { data: phases, error: phaseError } = await supabase
        .from('lifecycle_phases')
        .select('phase_id, name')
        .eq('product_id', productId);

      if (phaseError) {
        console.error('[DocumentPhaseFixService] Error fetching phases:', phaseError);
        throw phaseError;
      }

      const validPhaseIds = new Set(phases?.map(p => p.phase_id) || []);
      const issues: Array<{ documentName: string; issue: string; }> = [];
      let valid = 0;
      let invalid = 0;

      documents?.forEach(doc => {
        if (!doc.phase_id) {
          issues.push({
            documentName: doc.name,
            issue: 'No phase_id assigned'
          });
          invalid++;
        } else if (!validPhaseIds.has(doc.phase_id)) {
          issues.push({
            documentName: doc.name,
            issue: `Invalid phase_id: ${doc.phase_id}`
          });
          invalid++;
        } else {
          valid++;
        }
      });

      console.log('[DocumentPhaseFixService] Validation results:', { valid, invalid, issues });
      return { valid, invalid, issues };

    } catch (error) {
      console.error('[DocumentPhaseFixService] Error during validation:', error);
      return { valid: 0, invalid: 0, issues: [{ documentName: 'Unknown', issue: 'Validation failed' }] };
    }
  }
}
