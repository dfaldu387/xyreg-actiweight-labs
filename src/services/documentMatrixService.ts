
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Toggle a document's exclusion status for a specific phase
 * @param phaseId The ID of the phase
 * @param docName The name of the document
 * @param currentlyExcluded Whether the document is currently excluded
 * @returns true if the operation was successful, false otherwise
 */
export const toggleDocumentExclusion = async (
  phaseId: string, 
  docName: string, 
  currentlyExcluded: boolean
): Promise<boolean> => {
  console.log(`Starting toggle operation for document "${docName}" in phase ${phaseId}. Currently excluded: ${currentlyExcluded}`);
  
  try {
    // Validate phase exists
    const { data: validPhase, error: validationError } = await supabase
      .from('phases')
      .select('id, name')
      .eq('id', phaseId)
      .single();
      
    if (validationError || !validPhase) {
      console.error("Error validating phase:", validationError);
      toast.error("Invalid phase selected");
      return false;
    }
    
    console.log(`Phase validated: ${validPhase.name} (${validPhase.id})`);
    
    if (currentlyExcluded) {
      // Document is currently excluded, so we include it
      console.log(`Including document "${docName}" - removing from excluded_documents`);
      
      // Remove from excluded_documents
      const { error: deleteError } = await supabase
        .from('excluded_documents')
        .delete()
        .eq('phase_id', phaseId)
        .eq('document_name', docName);
        
      if (deleteError) {
        console.error("Error removing from excluded_documents:", deleteError);
        toast.error(`Failed to include document: ${deleteError.message}`);
        return false;
      }
      
      console.log(`Successfully removed "${docName}" from excluded_documents`);
      
      // Add to phase_assigned_documents using UPSERT to prevent duplicates
      console.log(`Adding "${docName}" to phase_assigned_documents`);
      const { error: insertError } = await supabase
        .from('phase_assigned_documents')
        .upsert({
          phase_id: phaseId,
          name: docName,
          status: 'Not Started',
          document_type: 'Standard'
        }, { 
          onConflict: 'phase_id,name',
          ignoreDuplicates: false 
        });
        
      if (insertError) {
        console.error("Error adding to phase_assigned_documents:", insertError);
        // This is non-critical, document is still included (not excluded)
        console.warn("Document included but assignment may have failed");
      } else {
        console.log(`Successfully added "${docName}" to phase_assigned_documents`);
      }
      
      toast.success("Document included successfully");
      return true;
      
    } else {
      // Document is currently included/available, so we exclude it
      console.log(`Excluding document "${docName}" - adding to excluded_documents`);
      
      // Add to excluded_documents using UPSERT to prevent duplicates
      const { error: insertError } = await supabase
        .from('excluded_documents')
        .upsert({
          phase_id: phaseId,
          document_name: docName
        }, { 
          onConflict: 'phase_id,document_name',
          ignoreDuplicates: false 
        });
        
      if (insertError) {
        console.error("Error adding to excluded_documents:", insertError);
        toast.error(`Failed to exclude document: ${insertError.message}`);
        return false;
      }
      
      console.log(`Successfully added "${docName}" to excluded_documents`);
      
      // Remove from phase_assigned_documents if it exists
      const { error: removeError } = await supabase
        .from('phase_assigned_documents')
        .delete()
        .eq('phase_id', phaseId)
        .eq('name', docName);
        
      if (removeError) {
        console.error("Error removing from phase_assigned_documents:", removeError);
        // This is non-critical, document is still excluded
      } else {
        console.log(`Successfully removed "${docName}" from phase_assigned_documents`);
      }
      
      toast.success("Document excluded successfully");
      return true;
    }
  } catch (error) {
    console.error('Toggle document error:', error);
    toast.error(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

/**
 * Check if a document is excluded for a specific phase
 * @param phaseId The ID of the phase
 * @param docName The name of the document
 * @returns true if the document is excluded, false otherwise
 */
export const isDocumentExcluded = async (
  phaseId: string,
  docName: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('excluded_documents')
      .select('id')
      .eq('phase_id', phaseId)
      .eq('document_name', docName)
      .maybeSingle();
      
    if (error) {
      console.error("Error checking document exclusion:", error);
      return false;
    }
    
    const isExcluded = !!data;
    console.log(`Document "${docName}" exclusion status: ${isExcluded}`);
    return isExcluded;
  } catch (error) {
    console.error('Error checking document exclusion:', error);
    return false;
  }
};

/**
 * Check if a document is assigned to a specific phase
 * @param phaseId The ID of the phase
 * @param docName The name of the document
 * @returns true if the document is assigned, false otherwise
 */
export const isDocumentAssigned = async (
  phaseId: string,
  docName: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('phase_assigned_documents')
      .select('id')
      .eq('phase_id', phaseId)
      .eq('name', docName)
      .maybeSingle();
      
    if (error) {
      console.error("Error checking document assignment:", error);
      return false;
    }
    
    const isAssigned = !!data;
    console.log(`Document "${docName}" assignment status: ${isAssigned}`);
    return isAssigned;
  } catch (error) {
    console.error('Error checking document assignment:', error);
    return false;
  }
};
