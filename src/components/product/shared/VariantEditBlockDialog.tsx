import React from 'react';
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

interface VariantEditBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  masterDeviceName: string;
  onGoToMaster: () => void;
}

export function VariantEditBlockDialog({
  open,
  onOpenChange,
  masterDeviceName,
  onGoToMaster,
}: VariantEditBlockDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Inherited from Master Device</AlertDialogTitle>
          <AlertDialogDescription>
            This field is shared from <strong className="text-foreground">{masterDeviceName}</strong>. 
            To edit it, go to the master device. Alternatively, you can unlink this field to make it independent.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onGoToMaster}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Go to Master
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
