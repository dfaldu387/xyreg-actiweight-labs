import React, { useState } from 'react';
import { VariantEditBlockDialog } from './VariantEditBlockDialog';
import { useNavigate } from 'react-router-dom';

interface VariantFieldGuardProps {
  /** Whether this product is a variant */
  isVariant: boolean;
  /** Whether the field is in PF (linked) mode */
  isLinked: boolean;
  /** Master device name */
  masterDeviceName?: string;
  /** Master device ID for navigation */
  masterDeviceId?: string;
  /** The field content */
  children: React.ReactNode;
}

/**
 * Wraps a field with a click-intercepting overlay when the product is a variant
 * and the field is linked. Shows a dialog to redirect to master device.
 * 
 * Usage:
 * <VariantFieldGuard isVariant={isVariant} isLinked={isFieldPFMode?.('fieldKey')} masterDeviceName={...} masterDeviceId={...}>
 *   <Textarea ... />
 * </VariantFieldGuard>
 */
export function VariantFieldGuard({
  isVariant,
  isLinked,
  masterDeviceName,
  masterDeviceId,
  children,
}: VariantFieldGuardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  if (!isVariant || !isLinked || !masterDeviceId) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="relative">
        <div className="opacity-50 pointer-events-none select-none">
          {children}
        </div>
        <div
          className="absolute inset-0 cursor-not-allowed z-10 rounded-md"
          onClick={() => setDialogOpen(true)}
        />
      </div>
      <VariantEditBlockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        masterDeviceName={masterDeviceName || 'Master Device'}
        onGoToMaster={() => {
          const currentPath = window.location.pathname + window.location.search;
          const currentParams = new URLSearchParams(window.location.search);
          currentParams.set('returnTo', 'variant-device');
          currentParams.set('variantReturnPath', currentPath);
          const search = currentParams.toString();
          navigate(`/app/product/${masterDeviceId}/device-information${search ? `?${search}` : ''}`);
        }}
      />
    </>
  );
}
