import { useState, useCallback, useEffect } from 'react';
import { CompanySyncService, SyncStatus, CompanySyncResult } from '@/services/companySyncService';
import { toast } from 'sonner';

export function useCompanySync(productId?: string, companyId?: string) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingSyncStatus, setIsLoadingSyncStatus] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<CompanySyncResult | null>(null);

  // Load sync status
  const loadSyncStatus = useCallback(async () => {
    if (!productId || !companyId) return;

    setIsLoadingSyncStatus(true);
    try {
      const status = await CompanySyncService.getSyncStatus(productId, companyId);
      setSyncStatus(status);
    } catch (error) {
      console.error('Error loading sync status:', error);
      toast.error('Failed to load sync status');
    } finally {
      setIsLoadingSyncStatus(false);
    }
  }, [productId, companyId]);

  // Sync product with company settings
  const syncProduct = useCallback(async () => {
    if (!productId || !companyId) return;

    setIsSyncing(true);
    try {
      const result = await CompanySyncService.syncProductToCompany(productId, companyId);
      setLastSyncResult(result);
      
      // Reload sync status after sync
      await loadSyncStatus();
      
      return result;
    } catch (error) {
      console.error('Error syncing product:', error);
      toast.error('Failed to sync product');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [productId, companyId, loadSyncStatus]);

  // Sync all company products
  const syncAllCompanyProducts = useCallback(async () => {
    if (!companyId) return;

    setIsSyncing(true);
    try {
      const result = await CompanySyncService.syncCompanyToProducts(companyId);
      setLastSyncResult(result);
      
      // Reload sync status after sync
      if (productId) {
        await loadSyncStatus();
      }
      
      return result;
    } catch (error) {
      console.error('Error syncing company products:', error);
      toast.error('Failed to sync company products');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [companyId, productId, loadSyncStatus]);

  // Detect company changes
  const detectChanges = useCallback(async () => {
    if (!companyId) return null;

    try {
      return await CompanySyncService.detectCompanyChanges(companyId);
    } catch (error) {
      console.error('Error detecting changes:', error);
      return null;
    }
  }, [companyId]);

  // Auto-load sync status on mount
  useEffect(() => {
    loadSyncStatus();
  }, [loadSyncStatus]);

  return {
    syncStatus,
    isSyncing,
    isLoadingSyncStatus,
    lastSyncResult,
    syncProduct,
    syncAllCompanyProducts,
    detectChanges,
    loadSyncStatus,
    refreshSyncStatus: loadSyncStatus
  };
}