import { useState, useEffect, useCallback } from 'react';
import { RefactoredPhaseService, type CompanyPhase, type PhaseDocumentTemplate } from '@/services/refactoredPhaseService';
import { toast } from 'sonner';

export function useRefactoredPhases(companyId?: string) {
  const [phases, setPhases] = useState<CompanyPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPhases = useCallback(async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      setError(null);
      const phasesData = await RefactoredPhaseService.getCompanyPhases(companyId);
      setPhases(phasesData);
    } catch (err) {
      console.error('Error loading refactored phases:', err);
      setError(err instanceof Error ? err.message : 'Failed to load phases');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      loadPhases();
    } else {
      setLoading(false);
      setPhases([]);
    }
  }, [companyId, loadPhases]);

  const createPhase = useCallback(async (name: string, description?: string, categoryId?: string) => {
    if (!companyId) return false;

    try {
      const newPhase = await RefactoredPhaseService.createPhase(companyId, name, description, categoryId);
      if (newPhase) {
        setPhases(prev => [...prev, newPhase].sort((a, b) => a.position - b.position));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error creating phase:', err);
      return false;
    }
  }, [companyId]);

  const updatePhase = useCallback(async (phaseId: string, updates: { name?: string; description?: string; categoryId?: string }) => {
    if (!companyId) return false;

    try {
      const success = await RefactoredPhaseService.updatePhase(phaseId, {
        name: updates.name,
        description: updates.description,
        category_id: updates.categoryId || null
      });
      
      if (success) {
        setPhases(prev => prev.map(phase => 
          phase.id === phaseId 
            ? { 
                ...phase, 
                name: updates.name || phase.name,
                description: updates.description || phase.description,
                category_id: updates.categoryId || phase.category_id
              }
            : phase
        ));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating phase:', err);
      return false;
    }
  }, [companyId]);

  const deletePhase = useCallback(async (phaseId: string) => {
    try {
      const success = await RefactoredPhaseService.deletePhase(phaseId);
      
      if (success) {
        setPhases(prev => prev.filter(phase => phase.id !== phaseId));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error deleting phase:', err);
      return false;
    }
  }, []);

  const reorderPhases = useCallback(async (phaseIds: string[]) => {
    if (!companyId) return false;

    try {
      const success = await RefactoredPhaseService.reorderPhases(companyId, phaseIds);
      if (success) {
        await loadPhases(); // Reload to get updated positions
      }
      return success;
    } catch (err) {
      console.error('Error reordering phases:', err);
      return false;
    }
  }, [companyId, loadPhases]);

  return {
    phases,
    loading,
    error,
    loadPhases,
    createPhase,
    updatePhase,
    deletePhase,
    reorderPhases,
    refreshPhases: loadPhases
  };
}

export function usePhaseDocuments(companyPhaseId?: string) {
  const [documents, setDocuments] = useState<PhaseDocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    if (!companyPhaseId) return;

    try {
      setLoading(true);
      setError(null);
      const documentsData = await RefactoredPhaseService.getPhaseDocuments(companyPhaseId);
      setDocuments(documentsData);
    } catch (err) {
      console.error('Error loading phase documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [companyPhaseId]);

  useEffect(() => {
    if (companyPhaseId) {
      loadDocuments();
    } else {
      setLoading(false);
      setDocuments([]);
    }
  }, [companyPhaseId, loadDocuments]);

  const addDocument = useCallback(async (documentData: Partial<PhaseDocumentTemplate>) => {
    if (!companyPhaseId) return false;

    try {
      const newDocument = await RefactoredPhaseService.addDocumentToPhase(companyPhaseId, documentData);
      if (newDocument) {
        setDocuments(prev => [...prev, newDocument].sort((a, b) => a.name.localeCompare(b.name)));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error adding document:', err);
      return false;
    }
  }, [companyPhaseId]);

  const updateDocumentStatus = useCallback(async (documentId: string, status: string) => {
    try {
      const success = await RefactoredPhaseService.updateDocumentStatus(documentId, status);
      if (success) {
        setDocuments(prev => 
          prev.map(doc => 
            doc.id === documentId ? { ...doc, status } : doc
          )
        );
      }
      return success;
    } catch (err) {
      console.error('Error updating document status:', err);
      return false;
    }
  }, []);

  return {
    documents,
    loading,
    error,
    loadDocuments,
    addDocument,
    updateDocumentStatus,
    refreshDocuments: loadDocuments
  };
}
