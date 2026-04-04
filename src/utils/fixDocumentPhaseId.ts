
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Utility function to fix document phase ID mismatches
 * This specifically fixes the "Concept Brief" document to point to the correct phase
 */
export const fixDocumentPhaseId = async (
  documentId: string, 
  correctPhaseId: string,
  documentName: string = "document"
) => {
  try {
    console.log(`[fixDocumentPhaseId] Updating ${documentName} (${documentId}) to use phase ${correctPhaseId}`);
    
    // Update the document's phase_id in the documents table
    const { error: docError } = await supabase
      .from('documents')
      .update({ phase_id: correctPhaseId })
      .eq('id', documentId);

    if (docError) {
      console.error('[fixDocumentPhaseId] Error updating documents table:', docError);
      throw docError;
    }

    // Also check if there are any phase_assigned_documents entries that need updating
    const { error: phaseDocError } = await supabase
      .from('phase_assigned_documents')
      .update({ phase_id: correctPhaseId })
      .eq('name', documentName);

    if (phaseDocError) {
      console.warn('[fixDocumentPhaseId] Warning updating phase_assigned_documents:', phaseDocError);
      // Don't throw here as this might not exist
    }

    console.log(`[fixDocumentPhaseId] Successfully updated ${documentName} phase_id`);
    toast.success(`Fixed phase assignment for ${documentName}`);
    
    return true;
  } catch (error) {
    console.error('[fixDocumentPhaseId] Error:', error);
    toast.error(`Failed to fix phase assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};
