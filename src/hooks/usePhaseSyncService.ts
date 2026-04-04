
import { useState, useCallback } from 'react';
import { PhaseSyncService, type SyncPayload, type SyncResult } from '@/services/phaseSyncService';

export function usePhaseSyncService() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const syncPhases = useCallback(async (payload: SyncPayload): Promise<SyncResult> => {
    setIsSyncing(true);
    try {
      const result = await PhaseSyncService.syncCompanyPhases(payload);
      setLastSyncResult(result);
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const convertAndSync = useCallback(async (
    companyId: string,
    phases: any[],
    documents: any[] = []
  ): Promise<SyncResult> => {
    const payload = PhaseSyncService.convertToSyncPayload(companyId, phases, documents);
    return await syncPhases(payload);
  }, [syncPhases]);

  const recalculateContinuousProcesses = useCallback(async (productId: string): Promise<{ success: boolean; updates: any[]; error?: string }> => {
    setIsSyncing(true);
    try {
      const { recalculateContinuousProcessDates } = await import('@/utils/enhancedPhaseSync');
      const result = await recalculateContinuousProcessDates(productId);
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    isSyncing,
    lastSyncResult,
    syncPhases,
    convertAndSync,
    recalculateContinuousProcesses,
    // Expose service methods for direct use
    createNewPhase: PhaseSyncService.createNewPhase,
    createNewDocument: PhaseSyncService.createNewDocument,
  };
}
