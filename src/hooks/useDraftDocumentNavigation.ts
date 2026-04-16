import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentStudioPersistenceService } from '@/services/documentStudioPersistenceService';

/**
 * Hook that checks if a draft document already exists for a given templateIdKey.
 * If it does, navigates directly to Document Studio. If not, calls onFirstCreate().
 */
export function useDraftDocumentNavigation(
  companyId: string | undefined,
  companyName: string,
  productId?: string
) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const handleDraftClick = useCallback(async (
    templateIdKey: string,
    onFirstCreate: () => void
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
      if (existing?.id) {
        // Document already exists — navigate to Document Studio
        const encodedName = encodeURIComponent(companyName);
        navigate(`/app/company/${encodedName}/document-studio?templateId=${existing.id}`);
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
  }, [companyId, companyName, productId, navigate]);

  return { handleDraftClick, checking };
}
