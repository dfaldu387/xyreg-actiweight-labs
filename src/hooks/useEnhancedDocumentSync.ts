
import { useState, useCallback } from 'react';
import { enhancedSyncDocumentsToProduct, EnhancedSyncResult } from '@/services/enhancedDocumentSyncService';
import { toast } from 'sonner';

export function useEnhancedDocumentSync() {
  const [isSyncing, setIsSyncing] = useState(false);

  const syncProductDocuments = useCallback(async (
    productId: string, 
    companyId: string,
    currentPhase?: string
  ): Promise<EnhancedSyncResult> => {
    setIsSyncing(true);
    try {
      const result = await enhancedSyncDocumentsToProduct(productId, companyId, currentPhase);
      
      if (result.success) {
        const messages = [];
        if (result.cleaned > 0) {
          messages.push(`Cleaned up ${result.cleaned} issues`);
        }
        if (result.created > 0) {
          messages.push(`Created ${result.created} documents from templates`);
        }
        
        if (messages.length > 0) {
          toast.success(messages.join(', '));
        } else {
          toast.info('All documents are up to date');
        }
      } else {
        toast.error(`Sync failed: ${result.errors.join(', ')}`);
      }
      
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    isSyncing,
    syncProductDocuments
  };
}
