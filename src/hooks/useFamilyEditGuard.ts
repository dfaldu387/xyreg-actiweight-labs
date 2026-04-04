import { useState, useCallback, useRef } from 'react';

const TEN_MINUTES_MS = 10 * 60 * 1000;

/**
 * Guard hook for PF (Product Family) field edits.
 * Shows a confirmation dialog on first edit per session.
 * After confirmation, allows all subsequent edits without re-prompting
 * for 10 minutes. After 10 min of inactivity the prompt reappears.
 */
export function useFamilyEditGuard(familyVariantCount?: number) {
  const [showDialog, setShowDialog] = useState(false);
  const [activeFieldLabel, setActiveFieldLabel] = useState('');
  const lastConfirmedAtRef = useRef<number | null>(null);
  const pendingActionRef = useRef<(() => void) | null>(null);

  const guardEdit = useCallback((
    fieldKey: string,
    fieldLabel: string,
    callback: () => void,
  ) => {
    // Single variant — no real family, skip warning
    if (familyVariantCount !== undefined && familyVariantCount <= 1) {
      callback();
      return;
    }
    // Already confirmed within cooldown — allow
    if (
      lastConfirmedAtRef.current !== null &&
      Date.now() - lastConfirmedAtRef.current < TEN_MINUTES_MS
    ) {
      callback();
      return;
    }
    // First edit or cooldown expired — show dialog
    setActiveFieldLabel(fieldLabel);
    pendingActionRef.current = callback;
    setShowDialog(true);
  }, [familyVariantCount]);

  const confirmEdit = useCallback(() => {
    if (pendingActionRef.current) {
      pendingActionRef.current();
      pendingActionRef.current = null;
    }
    lastConfirmedAtRef.current = Date.now();
    setShowDialog(false);
  }, []);

  const cancelEdit = useCallback(() => {
    pendingActionRef.current = null;
    setShowDialog(false);
  }, []);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    if (!open) {
      cancelEdit();
    }
  }, [cancelEdit]);

  return {
    showDialog,
    activeFieldLabel,
    guardEdit,
    confirmEdit,
    cancelEdit,
    handleDialogOpenChange,
  };
}
