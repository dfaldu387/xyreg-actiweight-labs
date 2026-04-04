
import { useState, useEffect } from 'react';
import { fetchPhaseDocuments, updateDocumentStatus, updateDocumentDeadline, addPhaseDocument, removePhaseDocument } from '@/api/unifiedDocumentsApi';
import { toast } from "sonner";

export const useUnifiedPhaseDocuments = (phaseId: string, companyId: string) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    if (!phaseId || !companyId) return;
    
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const { data } = await fetchPhaseDocuments(phaseId, companyId);
        setDocuments(data);
      } catch (error) {
        console.error("Error fetching unified phase documents:", error);
        toast.error("Failed to load phase documents");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [phaseId, companyId]);

  const updateDocStatus = async (documentId: string, status: string): Promise<boolean> => {
    setUpdateLoading(true);
    try {
      await updateDocumentStatus(documentId, status);
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId ? { ...doc, status } : doc
      ));
      return true;
    } catch (error) {
      console.error("Error updating document status:", error);
      return false;
    } finally {
      setUpdateLoading(false);
    }
  };

  const updateDocDeadline = async (documentId: string, deadline: Date): Promise<boolean> => {
    setUpdateLoading(true);
    try {
      await updateDocumentDeadline(documentId, deadline);
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId ? { ...doc, due_date: deadline.toISOString().split('T')[0] } : doc
      ));
      return true;
    } catch (error) {
      console.error("Error updating document deadline:", error);
      return false;
    } finally {
      setUpdateLoading(false);
    }
  };

  const addDocument = async (name: string, documentType: string = 'Standard'): Promise<string | null> => {
    setUpdateLoading(true);
    try {
      const success = await addPhaseDocument(phaseId, companyId, name);
      if (success) {
        // Refresh documents
        const { data } = await fetchPhaseDocuments(phaseId, companyId);
        setDocuments(data);
        return 'success';
      }
      return null;
    } catch (error) {
      console.error("Error adding document:", error);
      return null;
    } finally {
      setUpdateLoading(false);
    }
  };

  const removeDocument = async (documentId: string): Promise<boolean> => {
    setUpdateLoading(true);
    try {
      await removePhaseDocument(documentId);
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      return true;
    } catch (error) {
      console.error("Error removing document:", error);
      return false;
    } finally {
      setUpdateLoading(false);
    }
  };

  return {
    documents,
    loading,
    updateLoading,
    updateDocumentStatus: updateDocStatus,
    updateDocumentDeadline: updateDocDeadline,
    addDocument,
    removeDocument,
    setDocuments
  };
};
