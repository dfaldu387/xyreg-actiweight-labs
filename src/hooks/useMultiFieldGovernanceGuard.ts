import { useState, useCallback } from 'react';
import { markSectionModified, GovernanceStatus } from '@/services/fieldGovernanceService';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Multi-field governance guard for tabs with multiple governed fields.
 * Maintains a single dialog state with the active field key.
 */
export function useMultiFieldGovernanceGuard(
  productId: string | undefined,
  statusMap: Record<string, GovernanceStatus | null | undefined>
) {
  const [showDialog, setShowDialog] = useState(false);
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);
  const [activeFieldLabel, setActiveFieldLabel] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const queryClient = useQueryClient();

  const isFieldProtected = useCallback((fieldKey: string) => {
    const status = statusMap[fieldKey];
    return status === 'approved' || status === 'approved_with_conditions';
  }, [statusMap]);

  const guardEdit = useCallback((
    fieldKey: string,
    fieldLabel: string,
    callback: () => void
  ) => {
    if (!isFieldProtected(fieldKey)) {
      callback();
      return;
    }
    setActiveFieldKey(fieldKey);
    setActiveFieldLabel(fieldLabel);
    setPendingAction(() => callback);
    setShowDialog(true);
  }, [isFieldProtected]);

  const confirmEdit = useCallback(async () => {
    if (productId && activeFieldKey) {
      await markSectionModified(productId, activeFieldKey);
      queryClient.invalidateQueries({ queryKey: ['field-governance', productId] });
    }
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setShowDialog(false);
    setActiveFieldKey(null);
  }, [productId, activeFieldKey, pendingAction, queryClient]);

  const cancelEdit = useCallback(() => {
    setPendingAction(null);
    setShowDialog(false);
    setActiveFieldKey(null);
  }, []);

  return {
    showDialog,
    setShowDialog,
    activeFieldKey,
    activeFieldLabel,
    guardEdit,
    confirmEdit,
    cancelEdit,
    isFieldProtected,
  };
}
