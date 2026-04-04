
import { useState, useCallback } from 'react';
import { EnhancedPhaseSyncService, type SyncResult, type ValidationResult } from '@/services/enhancedPhaseSyncService';
import { toast } from 'sonner';

export function useEnhancedPhaseSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null);

  const syncProductPhases = useCallback(async (productId: string, companyId: string): Promise<SyncResult> => {
    setIsSyncing(true);
    
    try {
      console.log(`[useEnhancedPhaseSync] Starting sync for product ${productId}`);
      
      const result = await EnhancedPhaseSyncService.syncProductPhases(productId, companyId);
      setLastSyncResult(result);

      if (result.success) {
        toast.success(`Successfully synchronized ${result.syncedCount} phases`);
        console.log(`[useEnhancedPhaseSync] Sync successful: ${result.syncedCount} phases`);
      } else {
        const errorMessage = result.errors.join(', ');
        toast.error(`Phase sync failed: ${errorMessage}`);
        console.error(`[useEnhancedPhaseSync] Sync failed:`, result.errors);
      }

      return result;
    } catch (error) {
      console.error('[useEnhancedPhaseSync] Unexpected error:', error);
      const errorResult: SyncResult = {
        success: false,
        syncedCount: 0,
        errors: [`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
      setLastSyncResult(errorResult);
      toast.error('Phase synchronization failed unexpectedly');
      return errorResult;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const validatePhases = useCallback(async (productId: string): Promise<ValidationResult> => {
    console.log(`[useEnhancedPhaseSync] Validating phases for product ${productId}`);
    
    const validation = await EnhancedPhaseSyncService.validateProductPhases(productId);
    setLastValidation(validation);
    
    if (!validation.isValid) {
      console.warn(`[useEnhancedPhaseSync] Phase validation issues:`, validation.issues);
      validation.issues.forEach(issue => {
        toast.warning(`Phase issue: ${issue}`);
      });
    } else {
      console.log(`[useEnhancedPhaseSync] Phase validation passed`);
    }

    return validation;
  }, []);

  const emergencyRecover = useCallback(async (productId: string, companyId: string): Promise<SyncResult> => {
    setIsSyncing(true);
    
    try {
      console.log(`[useEnhancedPhaseSync] Starting emergency recovery for product ${productId}`);
      
      const result = await EnhancedPhaseSyncService.emergencyPhaseRecovery(productId, companyId);
      setLastSyncResult(result);

      if (result.success) {
        toast.success('Phase recovery completed successfully');
        console.log(`[useEnhancedPhaseSync] Recovery successful`);
      } else {
        const errorMessage = result.errors.join(', ');
        toast.error(`Recovery failed: ${errorMessage}`);
        console.error(`[useEnhancedPhaseSync] Recovery failed:`, result.errors);
      }

      return result;
    } catch (error) {
      console.error('[useEnhancedPhaseSync] Recovery error:', error);
      const errorResult: SyncResult = {
        success: false,
        syncedCount: 0,
        errors: [`Recovery error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
      setLastSyncResult(errorResult);
      toast.error('Emergency recovery failed');
      return errorResult;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    isSyncing,
    lastSyncResult,
    lastValidation,
    syncProductPhases,
    validatePhases,
    emergencyRecover
  };
}
