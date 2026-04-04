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

interface GovernanceEditConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  sectionLabel: string;
  designReviewId?: string | null;
}

export function GovernanceEditConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  sectionLabel,
  designReviewId,
}: GovernanceEditConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <AlertTriangle className="h-5 w-5" />
            Approved Section — Edit Warning
          </DialogTitle>
          <DialogDescription>
            This section was approved during a Design Review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-1">
              {sectionLabel}
            </p>
            <p className="text-sm text-blue-700">
              This section was approved in a Design Review
              {designReviewId ? ` (${designReviewId.slice(0, 8)}…)` : ''}.
              Editing will mark it as <strong>modified</strong> and require a new review.
            </p>
          </div>
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
