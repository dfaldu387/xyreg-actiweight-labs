
import { useState, useEffect } from 'react';
import { 
  getRecommendedDocsWithStatus,
  getDocumentFilterOptions,
  getPhaseDocumentStatistics,
  updateDocumentStatus,
  updateDocumentDeadline,
  type PhaseDocumentWithStatus
} from '@/utils/enhancedPhaseDocumentUtils';
import { toast } from 'sonner';

interface DocumentFilters {
  techApplicabilityFilter?: string;
  marketFilter?: string[];
  deviceClassFilter?: Record<string, string[]>;
  statusFilter?: string[];
}

interface FilterOptions {
  techApplicabilities: string[];
  markets: string[];
  deviceClasses: Record<string, string[]>;
  statuses: readonly string[];
}

export function useEnhancedPhaseDocuments(companyId: string, phaseName?: string) {
  const [documents, setDocuments] = useState<PhaseDocumentWithStatus[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [filters, setFilters] = useState<DocumentFilters>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [companyId, phaseName]);

  // Reload documents when filters change
  useEffect(() => {
    if (!loading) {
      loadDocuments();
    }
  }, [filters, companyId, phaseName]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load filter options and initial documents in parallel
      const [filterOptionsData, documentsData] = await Promise.all([
        getDocumentFilterOptions(companyId),
        getRecommendedDocsWithStatus(companyId, phaseName, filters)
      ]);

      setFilterOptions(filterOptionsData);
      setDocuments(documentsData);

      // Load statistics if phase is specified
      if (phaseName) {
        const stats = await getPhaseDocumentStatistics(companyId, phaseName);
        setStatistics(stats);
      }

    } catch (error) {
      console.error('Error loading phase documents:', error);
      toast.error('Failed to load phase documents');
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const documentsData = await getRecommendedDocsWithStatus(companyId, phaseName, filters);
      setDocuments(documentsData);

      // Update statistics if phase is specified
      if (phaseName) {
        const stats = await getPhaseDocumentStatistics(companyId, phaseName);
        setStatistics(stats);
      }
    } catch (error) {
      console.error('Error loading filtered documents:', error);
      toast.error('Failed to load filtered documents');
    }
  };

  const handleUpdateDocumentStatus = async (
    documentId: string,
    status: "Not Started" | "In Progress" | "Completed" | "Not Required"
  ) => {
    try {
      setUpdating(true);
      const success = await updateDocumentStatus(documentId, status);
      
      if (success) {
        // Update local state
        setDocuments(prev => prev.map(doc => 
          doc.id === documentId ? { ...doc, status } : doc
        ));
        
        // Refresh statistics
        if (phaseName) {
          const stats = await getPhaseDocumentStatistics(companyId, phaseName);
          setStatistics(stats);
        }
      }
    } catch (error) {
      console.error('Error updating document status:', error);
      toast.error('Failed to update document status');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateDocumentDeadline = async (
    documentId: string,
    deadline: Date | null
  ) => {
    try {
      setUpdating(true);
      const success = await updateDocumentDeadline(documentId, deadline);
      
      if (success) {
        // Update local state
        setDocuments(prev => prev.map(doc => 
          doc.id === documentId ? { ...doc, deadline } : doc
        ));
      }
    } catch (error) {
      console.error('Error updating document deadline:', error);
      toast.error('Failed to update document deadline');
    } finally {
      setUpdating(false);
    }
  };

  const updateFilters = (newFilters: Partial<DocumentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const refreshData = () => {
    loadData();
  };

  return {
    documents,
    filterOptions,
    filters,
    statistics,
    loading,
    updating,
    updateFilters,
    clearFilters,
    refreshData,
    updateDocumentStatus: handleUpdateDocumentStatus,
    updateDocumentDeadline: handleUpdateDocumentDeadline
  };
}
