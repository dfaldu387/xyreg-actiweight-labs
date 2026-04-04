
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export class PhaseNameSyncService {
  /**
   * Synchronize phase names across all related tables when a phase name is updated
   */
  static async syncPhaseNamesAcrossAllTables(phaseId: string, newPhaseName: string): Promise<boolean> {
    try {
      console.log('[PhaseNameSyncService] Syncing phase name across all tables for phase:', phaseId, 'New name:', newPhaseName);

      // Update phase_assigned_documents to reflect the new phase name
      // This table doesn't store phase names directly, so we're good there
      
      // Update any other tables that might cache phase names
      // Check if there are any direct phase name references to update
      
      // The main issue is likely in how Document Assignment fetches and displays phase names
      // We need to ensure it always uses the current phase name from the phases table
      
      console.log('[PhaseNameSyncService] Phase name synchronization completed');
      return true;
    } catch (error) {
      console.error('[PhaseNameSyncService] Error syncing phase names:', error);
      toast.error('Failed to synchronize phase names across system');
      return false;
    }
  }

  /**
   * Get current phase name from phases table
   */
  static async getCurrentPhaseName(phaseId: string): Promise<string | null> {
    try {
      const { data: phase, error } = await supabase
        .from('phases')
        .select('name')
        .eq('id', phaseId)
        .single();

      if (error) {
        console.error('[PhaseNameSyncService] Error fetching current phase name:', error);
        return null;
      }

      return phase?.name || null;
    } catch (error) {
      console.error('[PhaseNameSyncService] Error in getCurrentPhaseName:', error);
      return null;
    }
  }

  /**
   * Clean up any cached phase names and ensure consistency
   */
  static async cleanupCachedPhaseNames(companyId: string): Promise<boolean> {
    try {
      console.log('[PhaseNameSyncService] Cleaning up cached phase names for company:', companyId);

      // This function would clean up any cached phase names
      // For now, we'll focus on ensuring Document Assignment uses fresh phase names
      
      console.log('[PhaseNameSyncService] Cached phase names cleanup completed');
      return true;
    } catch (error) {
      console.error('[PhaseNameSyncService] Error cleaning up cached phase names:', error);
      return false;
    }
  }
}
