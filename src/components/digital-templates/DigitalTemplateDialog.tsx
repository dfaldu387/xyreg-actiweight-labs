import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DigitalTemplateExecutor } from './DigitalTemplateExecutor';

interface DigitalTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityId: string;
  companyId: string;
  productId: string;
  templateType: string;
  phase: string;
  currentUserId: string;
  activityName: string;
}

export function DigitalTemplateDialog({
  open,
  onOpenChange,
  activityId,
  companyId,
  productId,
  templateType,
  phase,
  currentUserId,
  activityName
}: DigitalTemplateDialogProps) {
  const handleComplete = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Execute Digital Template</DialogTitle>
          <DialogDescription>
            Complete the digital template for: {activityName}
          </DialogDescription>
        </DialogHeader>
        
        <DigitalTemplateExecutor
          activityId={activityId}
          companyId={companyId}
          productId={productId}
          templateType={templateType}
          phase={phase}
          currentUserId={currentUserId}
          onComplete={handleComplete}
        />
      </DialogContent>
    </Dialog>
  );
}