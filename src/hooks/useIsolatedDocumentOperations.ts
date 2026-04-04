
import { useState } from 'react';
import { DocumentServiceRouter } from '@/services/documentServiceRouter';
import { toast } from 'sonner';

/**
 * Hook for isolated document operations that routes to the correct service
 */
export function useIsolatedDocumentOperations(productId: string, companyId: string) {
  const [isUpdating, setIsUpdating] = useState(false);

  // Create router instance
  const router = productId && companyId ? 
    new DocumentServiceRouter(productId, companyId) : null;

  /**
   * Update document status using the router
   */
  const updateDocumentStatus = async (documentId: string, status: string): Promise<boolean> => {
    if (!router) {
      console.error('useIsolatedDocumentOperations: Router not available - missing productId or companyId');
      toast.error('Cannot update document: missing context');
      return false;
    }

    setIsUpdating(true);
    try {
      console.log('useIsolatedDocumentOperations: Updating document status via router');
      const success = await router.updateDocumentStatus(documentId, status);
      return success;
    } catch (error) {
      console.error('useIsolatedDocumentOperations: Error updating document status:', error);
      toast.error('Failed to update document status');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Update document deadline using the router
   */
  const updateDocumentDeadline = async (documentId: string, deadline: Date | undefined): Promise<boolean> => {
    if (!router) {
      console.error('useIsolatedDocumentOperations: Router not available - missing productId or companyId');
      toast.error('Cannot update document: missing context');
      return false;
    }

    setIsUpdating(true);
    try {
      console.log('useIsolatedDocumentOperations: Updating document deadline via router');
      const success = await router.updateDocumentDeadline(documentId, deadline);
      return success;
    } catch (error) {
      console.error('useIsolatedDocumentOperations: Error updating document deadline:', error);
      toast.error('Failed to update document deadline');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Update document reviewers using the router
   */
  const updateDocumentReviewers = async (documentId: string, reviewers: any[]): Promise<boolean> => {
    if (!router) {
      console.error('useIsolatedDocumentOperations: Router not available - missing productId or companyId');
      toast.error('Cannot update document: missing context');
      return false;
    }

    setIsUpdating(true);
    try {
      console.log('useIsolatedDocumentOperations: Updating document reviewers via router');
      const success = await router.updateDocumentReviewers(documentId, reviewers);
      return success;
    } catch (error) {
      console.error('useIsolatedDocumentOperations: Error updating document reviewers:', error);
      toast.error('Failed to update document reviewers');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    isUpdating,
    updateDocumentStatus,
    updateDocumentDeadline,
    updateDocumentReviewers
  };
}
