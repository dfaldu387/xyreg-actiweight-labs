import { useState, useCallback } from 'react';
import { DocumentStudioPersistenceService } from '@/services/documentStudioPersistenceService';

/**
 * Hook that checks if a draft document already exists for a given templateIdKey.
 * If it does, calls onOpenDraft with the document info. If not, calls onFirstCreate().
 */
export function useDraftDocumentNavigation(
  companyId: string | undefined,
  companyName: string,
  productId?: string
) {
  const [checking, setChecking] = useState(false);

  const handleDraftClick = useCallback(async (
    templateIdKey: string,
    onFirstCreate: () => void,
    onOpenDraft?: (doc: { id: string; name: string; type: string }) => void
  ) => {
    if (!companyId) return;
    setChecking(true);
    try {
      const result = await DocumentStudioPersistenceService.getDocumentCIsByReference(
        companyId,
        templateIdKey,
        productId
      );
      const existing = result.data?.[0];
      if (existing?.id && onOpenDraft) {
        onOpenDraft({
          id: existing.id,
          name: existing.name || templateIdKey,
          type: existing.document_type || 'document',
        });
      } else if (existing?.id) {
        // Fallback: no onOpenDraft provided, just call onFirstCreate
        onFirstCreate();
      } else {
        // First time — open the create dialog
        onFirstCreate();
      }
    } catch (err) {
      console.error('Failed to check existing draft for templateIdKey:', templateIdKey, 'companyId:', companyId, 'productId:', productId, err);
      onFirstCreate();
    } finally {
      setChecking(false);
    }
  }, [companyId, companyName, productId]);

  return { handleDraftClick, checking };
}
