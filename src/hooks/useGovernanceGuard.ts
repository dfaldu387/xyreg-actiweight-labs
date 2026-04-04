import { useState, useCallback } from 'react';
import { markSectionModified, GovernanceStatus } from '@/services/fieldGovernanceService';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook that guards edits to governed sections.
 * If a section is approved, it shows a confirmation dialog before allowing edits.
 * On confirm, it marks the section as "modified" (Blue Shift).
 */
export function useGovernanceGuard(
  productId: string | undefined,
  sectionKey: string,
  governanceStatus: GovernanceStatus | null | undefined
) {
  const [showDialog, setShowDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const queryClient = useQueryClient();

  const isProtected = governanceStatus === 'approved' || governanceStatus === 'approved_with_conditions';

  const guardEdit = useCallback(<T extends any[]>(
    callback: (...args: T) => void
  ) => {
    return (...args: T) => {
      if (!isProtected) {
        callback(...args);
        return;
      }
      // Store the pending action and show the dialog
      setPendingAction(() => () => callback(...args));
      setShowDialog(true);
    };
  }, [isProtected]);

  const confirmEdit = useCallback(async () => {
    if (productId) {
      await markSectionModified(productId, sectionKey);
      queryClient.invalidateQueries({ queryKey: ['field-governance', productId] });
    }
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setShowDialog(false);
  }, [productId, sectionKey, pendingAction, queryClient]);

  const cancelEdit = useCallback(() => {
    setPendingAction(null);
    setShowDialog(false);
  }, []);

  return {
    showDialog,
    setShowDialog,
    guardEdit,
    confirmEdit,
    cancelEdit,
    isProtected,
  };
}
