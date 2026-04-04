
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PhaseDocument } from '@/types/phaseDocuments';
import { syncDocumentToGapStatus } from '@/utils/statusSyncUtils';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook for document status and deadline operations
 */
export const useDocumentStatus = (documents: PhaseDocument[], setDocuments: (docs: PhaseDocument[]) => void) => {
  const [updateLoading, setUpdateLoading] = useState(false);
  const queryClient = useQueryClient();
  
  // Update document status
  const updateDocumentStatus = async (documentId: string, status: "Completed" | "In Progress" | "Not Started" | "Not Required"): Promise<boolean> => {
    setUpdateLoading(true);
    try {
      const { error } = await supabase
        .from('phase_assigned_documents')
        .update({ status })
        .eq('id', documentId);

      if (error) throw error;
      
      // Update local state for immediate UI response
      setDocuments(
        documents.map(doc => doc.id === documentId ? { ...doc, status } : doc)
      );
      
      // Sync status with related gap analysis items
      await syncDocumentToGapStatus(documentId, status);
      
      // Invalidate document queries to refresh all document-related components
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['phase-documents'] });
      
      toast.success(`Document status updated to ${status}`);
      return true;
    } catch (error) {
      console.error('Error updating document status:', error);
      toast.error('Failed to update document status');
      return false;
    } finally {
      setUpdateLoading(false);
    }
  };
  
  // Update document deadline
  const updateDocumentDeadline = async (documentId: string, deadline: Date | undefined): Promise<boolean> => {
    setUpdateLoading(true);
    try {
      const { error } = await supabase
        .from('phase_assigned_documents')
        .update({ 
          deadline: deadline ? deadline.toISOString() : null 
        })
        .eq('id', documentId);

      if (error) throw error;
      
      setDocuments(
        documents.map(doc => doc.id === documentId ? { ...doc, deadline } : doc)
      );
      
      toast.success(deadline ? 'Document deadline updated' : 'Document deadline removed');
      return true;
    } catch (error) {
      console.error('Error updating document deadline:', error);
      toast.error('Failed to update document deadline');
      return false;
    } finally {
      setUpdateLoading(false);
    }
  };

  return {
    updateLoading,
    updateDocumentStatus,
    updateDocumentDeadline
  };
};
