
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseAutoDocumentSyncProps {
  companyId: string;
  onSyncComplete?: () => void;
}

export function useAutoDocumentSync({ companyId, onSyncComplete }: UseAutoDocumentSyncProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const performAutoSync = useCallback(async () => {
    if (!companyId || isSyncing) return;
    
    setIsSyncing(true);
    
    try {
      console.log('[AutoDocumentSync] Auto-syncing documents for company:', companyId);
      
      // Trigger a refresh of document assignments
      if (onSyncComplete) {
        onSyncComplete();
      }
      
      setLastSyncTime(new Date());
      console.log('[AutoDocumentSync] Auto-sync completed successfully');
    } catch (error) {
      console.error('[AutoDocumentSync] Auto-sync failed:', error);
      // Don't show error toast for auto-sync to avoid spam
    } finally {
      setIsSyncing(false);
    }
  }, [companyId, onSyncComplete, isSyncing]);

  // Set up real-time listeners for phase changes
  useEffect(() => {
    if (!companyId) return;

    console.log('[AutoDocumentSync] Setting up real-time listeners for company:', companyId);

    // Listen for changes to company_phases (active/inactive status)
    const companyPhasesChannel = supabase
      .channel('company-phases-auto-sync')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'company_phases',
        filter: `company_id=eq.${companyId}`
      }, (payload) => {
        console.log('[AutoDocumentSync] Company phases changed:', payload);
        performAutoSync();
      })
      .subscribe();

    // REMOVED: phase_assigned_documents subscription had no company filter and was
    // triggering for ALL changes globally, causing continuous API calls.
    // The company_phases and phases subscriptions are sufficient for auto-sync.

    // Listen for changes to phases table (for the company)
    const phasesChannel = supabase
      .channel('phases-auto-sync')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'phases',
        filter: `company_id=eq.${companyId}`
      }, (payload) => {
        console.log('[AutoDocumentSync] Phases changed:', payload);
        performAutoSync();
      })
      .subscribe();

    // Cleanup function
    return () => {
      console.log('[AutoDocumentSync] Cleaning up real-time subscriptions');
      supabase.removeChannel(companyPhasesChannel);
      supabase.removeChannel(phasesChannel);
    };
  }, [companyId, performAutoSync]);

  return {
    isSyncing,
    lastSyncTime,
    performAutoSync
  };
}
