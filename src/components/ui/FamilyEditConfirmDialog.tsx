import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface FamilyEditConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  fieldLabel?: string;
}

export function FamilyEditConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  fieldLabel,
}: FamilyEditConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-pf-accent">
            <AlertTriangle className="h-5 w-5" />
            Product Family Field
          </DialogTitle>
          <DialogDescription>
            This field is shared across the product family.
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 border border-pf-accent/25 bg-pf-accent/5 rounded-lg">
          <p className="text-sm">
            {fieldLabel ? <strong>{fieldLabel}</strong> : 'This field'} is shared across all variants in the product family. Changes here will apply to <strong>all variants</strong>.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Continue Editing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
