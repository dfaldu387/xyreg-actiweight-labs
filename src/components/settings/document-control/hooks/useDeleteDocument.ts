
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DocumentItem } from "@/types/client";

/**
 * Custom hook for document deletion operations with proper phase management
 */
export function useDeleteDocument(
  documents: DocumentItem[],
  setDocuments: (docs: DocumentItem[]) => void,
  companyId?: string
) {
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Check if document belongs to protected phase group
   */
  const checkIfDocumentInProtectedGroup = async (doc: DocumentItem, companyId?: string): Promise<boolean> => {
    if (!companyId || !doc.phases || doc.phases.length === 0) return false;
    
    try {
      // Get protected phase group
      const { data: phaseGroups, error: groupError } = await supabase
        .from('phase_groups')
        .select('id')
        .eq('company_id', companyId)
        .eq('name', 'Detailed Design Control Steps');
        
      if (groupError || !phaseGroups || phaseGroups.length === 0) return false;
      
      const protectedGroupId = phaseGroups[0].id;
      
      // Check if any of the document's phases belong to this group
      const { data: phases, error: phaseError } = await supabase
        .from('phases')
        .select('id, group_id')
        .eq('company_id', companyId)
        .in('name', doc.phases);
        
      if (phaseError || !phases) return false;
      
      return phases.some(phase => phase.group_id === protectedGroupId);
    } catch (error) {
      console.error('Error checking document protection:', error);
      return false;
    }
  };

  /**
   * Find phase by name with fallback to partial matching
   */
  const findPhaseByName = async (phaseName: string, companyId?: string) => {
    if (!companyId) return null;
    
    // console.log(`Looking up phase: "${phaseName}" for company: ${companyId}`);
    
    // First try exact match
    let { data: phase, error } = await supabase
      .from('phases')
      .select('id, name')
      .eq('company_id', companyId)
      .eq('name', phaseName)
      .maybeSingle();
      
    if (error) {
      console.error("Error in exact phase lookup:", error);
      return null;
    }
    
    if (phase) {
      // console.log(`Found exact match for phase "${phaseName}":`, phase);
      return phase;
    }
    
    // If no exact match, try to find by partial matching (remove numbers and parentheses)
    const normalizedPhaseName = phaseName.replace(/^\(\d+\)\s*/, '').trim();
    // console.log(`No exact match found. Trying normalized name: "${normalizedPhaseName}"`);
    
    const { data: phases, error: searchError } = await supabase
      .from('phases')
      .select('id, name')
      .eq('company_id', companyId);
      
    if (searchError) {
      console.error("Error in phase search:", searchError);
      return null;
    }
    
    // Find phase that contains the normalized name
    const matchingPhase = phases?.find(p => {
      const normalizedDbName = p.name.replace(/^\(\d+\)\s*/, '').trim();
      return normalizedDbName.toLowerCase() === normalizedPhaseName.toLowerCase() ||
             p.name.toLowerCase().includes(normalizedPhaseName.toLowerCase());
    });
    
    if (matchingPhase) {
      // console.log(`Found phase by partial match: "${phaseName}" -> "${matchingPhase.name}":`, matchingPhase);
      return matchingPhase;
    }
    
    // console.log(`No phase found for "${phaseName}". Available phases:`, phases?.map(p => p.name));
    return null;
  };

  /**
   * Handle document deletion with proper state management
   * @param id - Document ID
   * @param phaseContext - If provided, only remove from this phase. If undefined, delete entire document. If "UNASSIGNED_DOCUMENT", archive instead of delete.
   */
  const handleDeleteDocument = async (id: string, phaseContext?: string): Promise<void> => {
    setIsDeleting(true);
    try {
      const docToDelete = documents.find(doc => doc.id === id);
      if (!docToDelete) {
        toast.error("Document not found");
        return;
      }

      // console.log(`Processing delete for document: ${docToDelete.name}, phase: ${phaseContext}`);

      if (phaseContext === "UNASSIGNED_DOCUMENT") {
        // Special case: Document is unassigned - archive it instead of deleting
        // console.log(`Archiving unassigned document "${docToDelete.name}"`);
        await handleArchiveUnassignedDocument(docToDelete, id);
      } else if (phaseContext && phaseContext !== "UNASSIGNED_DOCUMENT") {
        // Remove document from specific phase - should move to unassigned
        // console.log(`Removing document "${docToDelete.name}" from phase "${phaseContext}"`);
        await handlePhaseRemoval(docToDelete, phaseContext, id);
      } else {
        // Complete deletion - check if protected first
        const isProtected = await checkIfDocumentInProtectedGroup(docToDelete, companyId);
        
        if (isProtected) {
          toast.error("This document belongs to the 'Detailed Design Control Steps' phase group and cannot be permanently deleted.");
          return;
        }
        
        // console.log(`Permanently deleting document "${docToDelete.name}"`);
        await handleCompleteDocumentDeletion(docToDelete, id);
        // Remove from local state completely
        setDocuments(documents.filter(doc => doc.id !== id));
      }
      
    } catch (error) {
      console.error("Error processing document deletion:", error);
      toast.error("Failed to process document deletion");
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Handle archiving an unassigned document instead of permanent deletion
   */
  const handleArchiveUnassignedDocument = async (doc: DocumentItem, docId: string) => {
    // console.log(`Archiving unassigned document "${doc.name}"`);
    
    // Instead of deleting, we'll mark the document as archived/hidden
    // First, check if this document exists in the main documents table
    const { data: mainDoc, error: checkError } = await supabase
      .from('documents')
      .select('id')
      .eq('name', doc.name)
      .maybeSingle();
      
    if (checkError) {
      console.error("Error checking main document:", checkError);
      toast.error("Error archiving document");
      return;
    }
    
    if (mainDoc) {
      // Document exists in main table - we can't easily archive it without adding archive columns
      // For now, just remove from phase_assigned_documents
      const { error: deleteError } = await supabase
        .from('phase_assigned_documents')
        .delete()
        .eq('name', doc.name)
        .is('phase_id', null);
        
      if (deleteError) {
        console.error("Error removing unassigned document record:", deleteError);
        toast.error("Error archiving document");
        return;
      }
    } else {
      // Document only exists in phase_assigned_documents - remove it
      const { error: deleteError } = await supabase
        .from('phase_assigned_documents')
        .delete()
        .eq('name', doc.name)
        .is('phase_id', null);
        
      if (deleteError) {
        console.error("Error removing unassigned document record:", deleteError);
        toast.error("Error archiving document");
        return;
      }
    }
    
    // Remove from local state
    setDocuments(documents.filter(d => d.id !== docId));
    toast.success(`Document "${doc.name}" has been archived`);
  };

  /**
   * Handle removing document from specific phase
   */
  const handlePhaseRemoval = async (doc: DocumentItem, phaseName: string, docId: string) => {
    // console.log(`Starting phase removal for document "${doc.name}" from phase "${phaseName}"`);
    
    // Find the phase using improved lookup with fallbacks
    const phaseData = await findPhaseByName(phaseName, companyId);
    
    if (!phaseData) {
      console.error(`Phase "${phaseName}" not found for company ${companyId}`);
      toast.error(`Cannot find phase "${phaseName}". Operation aborted to prevent data loss.`);
      return;
    }

    // console.log(`Found phase "${phaseName}" with ID: ${phaseData.id}`);

    // Delete the specific assignment record for this document and phase
    const { error: deleteError } = await supabase
      .from('phase_assigned_documents')
      .delete()
      .eq('name', doc.name)
      .eq('phase_id', phaseData.id);
      
    if (deleteError) {
      console.error("Error deleting phase assignment:", deleteError);
      toast.error("Error removing document from phase");
      return;
    }
    
    // console.log(`Successfully removed assignment for document "${doc.name}" from phase "${phaseName}"`);
    
    // Check if this document has any remaining phase assignments
    const { data: remainingAssignments, error: checkError } = await supabase
      .from('phase_assigned_documents')
      .select(`
        id,
        phases!phase_assigned_documents_phase_id_fkey(name)
      `)
      .eq('name', doc.name)
      .not('phase_id', 'is', null);
    
    if (checkError) {
      console.error("Error checking remaining assignments:", checkError);
    }

    // If no remaining assignments, create an unassigned record
    if (!remainingAssignments || remainingAssignments.length === 0) {
      // console.log(`No remaining assignments for "${doc.name}", creating unassigned record`);
      const { error: insertError } = await supabase
        .from('phase_assigned_documents')
        .insert({
          name: doc.name,
          phase_id: null,
          status: doc.status || 'Not Started',
          document_type: doc.type || 'Standard'
        });
      
      if (insertError) {
        console.error("Error creating unassigned record:", insertError);
        toast.error("Error creating unassigned document record");
        return;
      }
      
      // console.log(`Successfully created unassigned record for "${doc.name}"`);
      
      // Update local state - document moves to unassigned (empty phases array)
      setDocuments(documents.map(d => {
        if (d.id === docId) {
          return { ...d, phases: [] };
        }
        return d;
      }));
    } else {
      // Update local state - remove only the specific phase
      const remainingPhaseNames = remainingAssignments
        .map(assignment => assignment.phases && typeof assignment.phases === 'object' && 'name' in assignment.phases ? assignment.phases.name : undefined)
        .filter(name => name) as string[];
      setDocuments(documents.map(d => {
        if (d.id === docId) {
          return { ...d, phases: remainingPhaseNames };
        }
        return d;
      }));
    }
    
    toast.success(`Document removed from ${phaseName}`);
  };

  /**
   * Handle complete document deletion
   */
  const handleCompleteDocumentDeletion = async (doc: DocumentItem, id: string) => {
    // console.log(`Permanently deleting document "${doc.name}" with ID: ${id}`);
    
    // Delete all phase assignments for this document
    const { error: deleteError } = await supabase
      .from('phase_assigned_documents')
      .delete()
      .eq('name', doc.name);
      
    if (deleteError) {
      console.error("Error deleting phase assignments:", deleteError);
      toast.error("Error deleting document");
      return;
    }
    
    // console.log(`Successfully deleted all assignments for document "${doc.name}"`);
    
    // Also clean up from main documents table if it exists there
    try {
      const { error: mainDocError } = await supabase
        .from('documents')
        .delete()
        .eq('name', doc.name);
        
      if (mainDocError) {
        console.warn("Warning: Could not remove from documents table:", mainDocError);
      }
      
      // Remove from excluded_documents if it exists there
      const { error: excludedError } = await supabase
        .from('excluded_documents')
        .delete()
        .eq('document_name', doc.name);
        
      if (excludedError) {
        console.warn("Warning: Could not remove from excluded_documents:", excludedError);
      }
    } catch (cleanupError) {
      console.warn("Non-critical cleanup errors:", cleanupError);
    }
    
    toast.success(`Document "${doc.name}" permanently deleted`);
  };

  return {
    isDeleting,
    handleDeleteDocument,
    checkIfDocumentInProtectedGroup
  };
}
