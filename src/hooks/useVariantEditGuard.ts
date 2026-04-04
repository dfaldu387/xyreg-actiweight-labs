import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface VariantEditGuardResult {
  /** Returns true if the edit should be blocked (variant + linked field) */
  shouldBlock: (fieldKey: string) => boolean;
  /** Call this before allowing edits. It shows the dialog if blocked. */
  guardEdit: (fieldKey: string, callback: () => void) => void;
  /** Dialog state */
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  /** Navigate to master device */
  goToMaster: () => void;
  masterDeviceName: string;
}

/**
 * Hook that guards field edits on variant products when the field is linked (PF mode).
 * Shows a dialog directing the user to edit on the master device.
 */
export function useVariantEditGuard(
  isVariant: boolean,
  masterDeviceId?: string,
  masterDeviceName?: string,
  getFieldScope?: (fieldKey: string) => 'individual' | 'product_family'
): VariantEditGuardResult {
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  const shouldBlock = useCallback(
    (fieldKey: string): boolean => {
      if (!isVariant || !getFieldScope) return false;
      return getFieldScope(fieldKey) === 'product_family';
    },
    [isVariant, getFieldScope]
  );

  const guardEdit = useCallback(
    (fieldKey: string, callback: () => void) => {
      if (shouldBlock(fieldKey)) {
        setDialogOpen(true);
        return;
      }
      callback();
    },
    [shouldBlock]
  );

  const goToMaster = useCallback(() => {
    if (masterDeviceId) {
      const currentPath = window.location.pathname + window.location.search;
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set('returnTo', 'variant-device');
      currentParams.set('variantReturnPath', currentPath);
      const search = currentParams.toString();
      navigate(`/app/product/${masterDeviceId}/device-information${search ? `?${search}` : ''}`);
    }
  }, [masterDeviceId, navigate]);

  return {
    shouldBlock,
    guardEdit,
    dialogOpen,
    setDialogOpen,
    goToMaster,
    masterDeviceName: masterDeviceName || 'Master Device',
  };
}
