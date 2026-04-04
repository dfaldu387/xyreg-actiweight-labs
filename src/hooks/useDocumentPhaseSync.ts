
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ensureCompanyPhaseIntegrity } from "@/utils/consolidatedPhaseUtils";

interface UseDocumentPhaseSyncProps {
  phaseId: string;
  onSyncComplete?: () => void;
}

/**
 * Hook to manage real-time syncing of document phases with enhanced error handling
 */
export function useDocumentPhaseSync({ phaseId, onSyncComplete }: UseDocumentPhaseSyncProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Setup real-time listeners with error handling
  useEffect(() => {
    if (!phaseId) return;
    
    try {
      // Create a channel for phase_assigned_documents changes
      const assignedDocsChannel = supabase
        .channel('phase-docs-sync')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'phase_assigned_documents',
            filter: `phase_id=eq.${phaseId}`
          }, 
          (payload) => {
            setLastSyncTime(new Date());
            setSyncError(null);
            if (onSyncComplete) onSyncComplete();
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.error('Error subscribing to phase document changes');
            setSyncError('Failed to establish real-time connection');
          }
        });
        
      // Create a channel for document_phase_assignments changes
      const phaseAssignmentsChannel = supabase
        .channel('doc-phase-assignments-sync')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'documents',
            filter: `phase_id=eq.${phaseId}`
          }, 
          (payload) => {
            setLastSyncTime(new Date());
            setSyncError(null);
            if (onSyncComplete) onSyncComplete();
          }
        )
        .subscribe();
        
      // Create a channel for excluded_documents changes  
      const excludedDocsChannel = supabase
        .channel('excluded-docs-sync')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'excluded_documents',
            filter: `phase_id=eq.${phaseId}`
          }, 
          (payload) => {
            setLastSyncTime(new Date());
            setSyncError(null);
            if (onSyncComplete) onSyncComplete();
          }
        )
        .subscribe();
      
      // Return cleanup function
      return () => {
        supabase.removeChannel(assignedDocsChannel);
        supabase.removeChannel(phaseAssignmentsChannel);
        supabase.removeChannel(excludedDocsChannel);
      };
    } catch (error) {
      console.error('Error setting up real-time sync:', error);
      setSyncError('Failed to initialize real-time sync');
    }
  }, [phaseId, onSyncComplete]);

  /**
   * Force a manual sync with the database with enhanced error handling
   */
  const syncWithDatabase = async (): Promise<{ success: boolean; error?: string }> => {
    if (!phaseId) {
      const error = 'No phase ID provided for sync';
      setSyncError(error);
      return { success: false, error };
    }
    
    setIsSyncing(true);
    setSyncError(null);
    
    try {
      // Use the new consolidated phase integrity function
      const result = await ensureCompanyPhaseIntegrity();
      
      if (!result.success) {
        const errorMsg = "Failed to sync document phases";
        console.error("Error syncing document phases:", result.results);
        setSyncError(errorMsg);
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }
      
      setLastSyncTime(new Date());
      toast.success("Document phases synced successfully");
      
      if (onSyncComplete) onSyncComplete();
      return { success: true };
    } catch (error) {
      const errorMsg = "An error occurred while syncing document phases";
      console.error("Error in syncWithDatabase:", error);
      setSyncError(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    lastSyncTime,
    syncError,
    syncWithDatabase
  };
}
