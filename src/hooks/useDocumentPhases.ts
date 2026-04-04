
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook for managing document phases using phase_assigned_documents table
 */
export const useDocumentPhases = (documents: any[], setDocuments: (docs: any[]) => void) => {
  const [updateLoading, setUpdateLoading] = useState(false);

  /**
   * Toggle a recommended document's inclusion/exclusion status
   */
  const toggleRecommendedDoc = async (docName: string, currentExcluded: boolean): Promise<void> => {
    setUpdateLoading(true);
    try {
      // This function would need phase context to work properly
      // For now, we'll just show a message
      console.warn("toggleRecommendedDoc needs phase context to work properly");
      toast.info("This feature requires phase context");
      
    } catch (error) {
      console.error("Error toggling document:", error);
      toast.error("Failed to toggle document status");
    } finally {
      setUpdateLoading(false);
    }
  };

  /**
   * Update document phases using phase_assigned_documents
   */
  const updateDocumentPhases = async (docName: string, selectedPhases: string[]): Promise<boolean> => {
    setUpdateLoading(true);
    try {
      // Get phase IDs for the selected phase names
      const { data: phaseData, error: phaseError } = await supabase
        .from('phases')
        .select('id, name')
        .in('name', selectedPhases);
        
      if (phaseError) {
        console.error("Error fetching phase IDs:", phaseError);
        toast.error("Failed to fetch phase information");
        return false;
      }
      
      if (!phaseData || phaseData.length === 0) {
        console.warn("No phases found for the selected names");
        return false;
      }
      
      const phaseIds = phaseData.map(p => p.id);
      
      // Remove existing assignments for this document
      const { error: deleteError } = await supabase
        .from('phase_assigned_documents')
        .delete()
        .eq('name', docName);
        
      if (deleteError) {
        console.error("Error removing existing assignments:", deleteError);
        toast.error("Failed to update document phases");
        return false;
      }
      
      // Insert new assignments
      if (phaseIds.length > 0) {
        const assignments = phaseIds.map(phaseId => ({
          phase_id: phaseId,
          name: docName,
          status: 'Not Started',
          document_type: 'Standard'
        }));
        
        const { error: insertError } = await supabase
          .from('phase_assigned_documents')
          .insert(assignments);
          
        if (insertError) {
          console.error("Error inserting new assignments:", insertError);
          toast.error("Failed to assign document to phases");
          return false;
        }
      }
      
      toast.success(`Updated phases for ${docName}`);
      return true;
      
    } catch (error) {
      console.error("Error updating document phases:", error);
      toast.error("Failed to update document phases");
      return false;
    } finally {
      setUpdateLoading(false);
    }
  };

  return {
    updateLoading,
    toggleRecommendedDoc,
    updateDocumentPhases
  };
};
