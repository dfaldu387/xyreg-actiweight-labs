import { useState } from 'react';
import { PhaseDocument } from '@/types/phaseDocuments';
import { useDocumentCrud } from './useDocumentCrud';
import { usePhaseDocuments } from './usePhaseDocuments';
import { useDocumentPhases } from './useDocumentPhases';
import { updateDocumentPhases as updateDocumentPhasesInDb } from '@/components/settings/document-control/utils/documentOperations';
import { toast } from 'sonner';

/**
 * Hook for managing phase document actions including CRUD operations, status updates, and phase management
 */
export const usePhaseDocumentActions = (
  phaseId: string,
  documents: PhaseDocument[],
  setDocuments: (docs: PhaseDocument[]) => void,
  onDocumentChange?: () => void
) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Use the individual hooks for specific functionality
  const { addDocument, removeDocument, operationInProgress: crudInProgress } = useDocumentCrud(phaseId, documents, setDocuments);
  const { updateDocumentStatus, updateLoading: statusInProgress } = usePhaseDocuments(phaseId);
  const { updateDocumentPhases, updateLoading: phasesInProgress } = useDocumentPhases(documents, setDocuments);

  const handleAddDocument = async (documentName: string) => {
    setIsLoading(true);
    try {
      const success = await addDocument(documentName);
      if (success && onDocumentChange) {
        onDocumentChange();
      }
      return success;
    } catch (error) {
      console.error('Error adding document:', error);
      toast.error('Failed to add document');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDocument = async (documentId: string) => {
    setIsLoading(true);
    try {
      const success = await removeDocument(documentId);
      if (success && onDocumentChange) {
        onDocumentChange();
      }
      return success;
    } catch (error) {
      console.error('Error removing document:', error);
      toast.error('Failed to remove document');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (documentId: string, status: 'Not Started' | 'In Progress' | 'Completed' | 'Not Required') => {
    setIsLoading(true);
    try {
      const success = await updateDocumentStatus(documentId, status);
      if (success && onDocumentChange) {
        onDocumentChange();
      }
      return success;
    } catch (error) {
      console.error('Error updating document status:', error);
      toast.error('Failed to update document status');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDocumentPhases = async (documentName: string, phases: string[]) => {
    setIsLoading(true);
    try {
      const success = await updateDocumentPhasesInDb(documentName, phases);
      if (success && onDocumentChange) {
        onDocumentChange();
      }
      return success;
    } catch (error) {
      console.error('Error updating document phases:', error);
      toast.error('Failed to update document phases');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    addDocument: handleAddDocument,
    removeDocument: handleRemoveDocument,
    updateDocumentStatus: handleUpdateStatus,
    updateDocumentPhases: handleUpdateDocumentPhases,
    isLoading: isLoading || crudInProgress || statusInProgress || phasesInProgress
  };
};
