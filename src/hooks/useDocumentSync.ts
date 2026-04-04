
import { useState, useCallback } from 'react';
import { DocumentSyncService } from '@/services/documentSyncService';

export function useDocumentSync() {
  const [isSyncing, setIsSyncing] = useState(false);

  const syncDocuments = useCallback(async (companyId: string) => {
    setIsSyncing(true);
    try {
      return await DocumentSyncService.migrateExistingDocuments();
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    isSyncing,
    syncDocuments
  };
}
