import { useState, useCallback } from 'react';
import { GapAnalysisSyncService, SyncResult } from '@/services/gapAnalysisSyncService';
import { toast } from 'sonner';

export function useGapAnalysisSync() {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    templatesEnabled: number;
    totalTemplateItems: number;
    gapAnalysisItems: number;
    isInSync: boolean;
  } | null>(null);

  const regenerateGapItems = useCallback(async (
    companyId: string, 
    clearExisting: boolean = true
  ): Promise<SyncResult> => {
    setIsRegenerating(true);
    try {
      const result = await GapAnalysisSyncService.regenerateCompanyGapItems(companyId, clearExisting);
      
      if (result.success) {
        const messages = [];
        if (result.itemsCleared > 0) {
          messages.push(`Cleared ${result.itemsCleared} existing items`);
        }
        if (result.itemsCreated > 0) {
          messages.push(`Created ${result.itemsCreated} new items`);
        }
        if (result.templatesProcessed > 0) {
          messages.push(`Processed ${result.templatesProcessed} templates`);
        }
        
        if (messages.length > 0) {
          toast.success(`Gap analysis synchronized: ${messages.join(', ')}`);
        } else {
          toast.info('Gap analysis is already up to date');
        }
      } else {
        toast.error(`Synchronization failed: ${result.errors.join(', ')}`);
      }
      
      return result;
    } finally {
      setIsRegenerating(false);
    }
  }, []);

  const checkSyncStatus = useCallback(async (companyId: string) => {
    try {
      const status = await GapAnalysisSyncService.checkSyncStatus(companyId);
      setSyncStatus(status);
      return status;
    } catch (error) {
      console.error('Error checking sync status:', error);
      return null;
    }
  }, []);

  const syncAfterTemplateChange = useCallback(async (
    companyId: string,
    templateId: string,
    isEnabled: boolean,
    onProgress?: (current: number, total: number, meta?: { devices: number; requirements: number }) => void
  ) => {
    try {
      await GapAnalysisSyncService.syncAfterTemplateChange(companyId, templateId, isEnabled, onProgress);
      // Refresh sync status after change
      await checkSyncStatus(companyId);
    } catch (error) {
      console.error('Error syncing after template change:', error);
    }
  }, [checkSyncStatus]);

  return {
    isRegenerating,
    syncStatus,
    regenerateGapItems,
    checkSyncStatus,
    syncAfterTemplateChange
  };
}