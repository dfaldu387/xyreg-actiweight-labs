import { useState, useCallback } from 'react';
import { eudamedSyncService, type EudamedSyncResult, type SyncStatus } from '@/services/eudamedSyncService';
import { toast } from 'sonner';

export function useEudamedSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 100, operation: '' });

  const loadSyncStatus = useCallback(async (companyId: string) => {
    setIsLoadingStatus(true);
    try {
      const status = await eudamedSyncService.getCompanySyncStatus(companyId);
      setSyncStatus(status);
    } catch (error) {
      console.error('Error loading sync status:', error);
      toast.error('Failed to load sync status');
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  const performSync = useCallback(async (companyId: string): Promise<EudamedSyncResult | null> => {
    setIsSyncing(true);
    setProgress({ processed: 0, total: 100, operation: 'Starting sync...' });
    
    try {
      const result = await eudamedSyncService.performFullSync(
        companyId,
        (processed, total, operation) => {
          setProgress({ processed, total, operation });
        }
      );
      
    if (result.success) {
      if (result.duplicatesMerged > 0 || result.newProductsCreated > 0 || result.existingProductsUpdated > 0) {
        toast.success(
          `Sync completed! Updated ${result.existingProductsUpdated} products, merged ${result.duplicatesMerged} duplicates, created ${result.newProductsCreated} new products`
        );
      } else {
        toast.info('Sync completed - all products are already synchronized');
      }
    } else {
        toast.error(`Sync completed with ${result.errors.length} errors`);
      }
      
      // Reload sync status
      await loadSyncStatus(companyId);
      
      return result;
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error(`Sync failed: ${error}`);
      return null;
    } finally {
      setIsSyncing(false);
      setProgress({ processed: 0, total: 100, operation: '' });
    }
  }, [loadSyncStatus]);

  const bulkUpdateRegulatoryStatus = useCallback(async (companyId: string) => {
    setIsSyncing(true);
    setProgress({ processed: 0, total: 100, operation: 'Updating regulatory status...' });
    
    try {
      const result = await eudamedSyncService.bulkUpdateEudamedRegulatoryStatus(companyId);
      
      if (result.updated > 0) {
        toast.success(`Updated regulatory status for ${result.updated} products`);
      } else {
        toast.info('No products needed regulatory status updates');
      }
      
      if (result.errors.length > 0) {
        console.error('Bulk update errors:', result.errors);
        toast.error(`Completed with ${result.errors.length} errors`);
      }
      
      return result;
    } catch (error) {
      console.error('Bulk update failed:', error);
      toast.error(`Bulk update failed: ${error}`);
      return { updated: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    } finally {
      setIsSyncing(false);
      setProgress({ processed: 0, total: 100, operation: '' });
    }
  }, []);

  return {
    isSyncing,
    syncStatus,
    isLoadingStatus,
    progress,
    loadSyncStatus,
    performSync,
    bulkUpdateRegulatoryStatus
  };
}