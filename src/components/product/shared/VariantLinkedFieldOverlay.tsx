import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ExternalLink } from 'lucide-react';

interface VariantLinkedFieldOverlayProps {
  masterDeviceId: string;
  masterDeviceName: string;
  children: React.ReactNode;
}

/**
 * Wraps a field with a click-intercepting overlay when the product is a variant
 * and the field is linked (inherited from master). Clicking shows a dialog
 * directing the user to edit the field on the master device.
 */
export function VariantLinkedFieldOverlay({
  masterDeviceId,
  masterDeviceName,
  children,
}: VariantLinkedFieldOverlayProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  const goToMasterSameSection = () => {
    const currentPath = window.location.pathname + window.location.search;
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set('returnTo', 'variant-device');
    currentParams.set('variantReturnPath', currentPath);
    const search = currentParams.toString();
    navigate(`/app/product/${masterDeviceId}/device-information${search ? `?${search}` : ''}`);
  };

  return (
    <>
      <div className="relative">
        {/* Muted content */}
        <div className="opacity-60 pointer-events-none select-none">
          {children}
        </div>
        {/* Click interceptor */}
        <div
          className="absolute inset-0 cursor-not-allowed z-10"
          onClick={() => setDialogOpen(true)}
        />
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inherited from Master Device</AlertDialogTitle>
            <AlertDialogDescription>
              This field is shared from <strong>{masterDeviceName}</strong>. To edit it, go to the master device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={goToMasterSameSection}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Go to Master
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
