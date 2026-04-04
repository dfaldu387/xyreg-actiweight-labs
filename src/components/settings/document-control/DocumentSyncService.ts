
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ProductPhaseService } from '@/services/productPhaseService';
import { resolveCompanyIdentifier } from '@/utils/companyUtils';

/**
 * Hook for document synchronization operations
 */
export function useDocumentSync(onSyncComplete?: () => Promise<void>) {
  const [syncingDocuments, setSyncingDocuments] = useState(false);

  /**
   * Synchronize the document matrix with the catalog
   * Ensures consistent document state across the application
   */
  const handleSyncDocumentMatrix = async () => {
    setSyncingDocuments(true);
    toast.info("Starting document synchronization...");
    try {
      // Get companyId from URL to make the phase standardization robust
      const companyName = typeof window !== 'undefined' ? decodeURIComponent(window.location.pathname.split('/')[3]) : '';
      if (!companyName) {
        throw new Error("Could not determine company from URL.");
      }
      
      const { companyId } = await resolveCompanyIdentifier(companyName);
      if (!companyId) {
        throw new Error(`Could not resolve company: ${companyName}`);
      }
      
      console.log("Step 1: Ensuring standard phases for company:", companyId);
      await ProductPhaseService.ensureCompanyStandardPhases(companyId);
      console.log("Step 1 complete.");

      console.log("Step 2: Syncing document matrix from static template...");
      // Replaced faulty DocumentService.synchronizeDocumentCatalog() with a direct RPC call
      // to a safer database function.
      const { error: rpcError } = await supabase.rpc('sync_document_matrix_from_static');
      
      if (rpcError) {
        throw rpcError;
      }
      console.log("Step 2 complete.");

      toast.success('Document catalog synchronized successfully');
      
      // Call the callback if provided
      if (onSyncComplete) {
        await onSyncComplete();
      }

    } catch (error) {
      console.error('Error synchronizing document matrix:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(`Synchronization failed: ${errorMessage}`);
    } finally {
      setSyncingDocuments(false);
    }
  };

  return {
    syncingDocuments,
    handleSyncDocumentMatrix
  };
}
