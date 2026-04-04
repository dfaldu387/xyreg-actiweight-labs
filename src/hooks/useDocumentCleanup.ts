
import { useState, useCallback } from 'react';
import { DocumentCleanupService, CleanupResult } from '@/services/documentCleanupService';
import { toast } from 'sonner';

export function useDocumentCleanup() {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [lastCleanupResult, setLastCleanupResult] = useState<CleanupResult | null>(null);

  const cleanupProductDocuments = useCallback(async (productId: string): Promise<CleanupResult> => {
    setIsCleaningUp(true);
    try {
      const result = await DocumentCleanupService.cleanupProductDocuments(productId);
      setLastCleanupResult(result);
      return result;
    } finally {
      setIsCleaningUp(false);
    }
  }, []);

  const cleanupCompanyDocuments = useCallback(async (companyId: string): Promise<CleanupResult> => {
    setIsCleaningUp(true);
    try {
      const result = await DocumentCleanupService.cleanupCompanyDocuments(companyId);
      setLastCleanupResult(result);
      return result;
    } finally {
      setIsCleaningUp(false);
    }
  }, []);

  const createDocumentSafely = useCallback(async (documentData: {
    name: string;
    product_id: string;
    company_id: string;
    document_scope: 'product_document' | 'company_template' | 'company_document';
    document_type?: string;
    phase_id?: string;
    template_source_id?: string;
    description?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
  }) => {
    const result = await DocumentCleanupService.createDocumentSafely(documentData);
    
    if (!result.success) {
      toast.error(result.error || 'Failed to create document');
    }
    
    return result;
  }, []);

  return {
    isCleaningUp,
    lastCleanupResult,
    cleanupProductDocuments,
    cleanupCompanyDocuments,
    createDocumentSafely
  };
}
