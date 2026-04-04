import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';

interface CustomDefinitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldName: string;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

export function CustomDefinitionDialog({
  open,
  onOpenChange,
  fieldName,
  onConfirm,
  isLoading = false
}: CustomDefinitionDialogProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason.trim());
      setReason('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Custom Definition</DialogTitle>
          <DialogDescription>
            You're about to create a custom {fieldName} for this variant only.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-2 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
            <p className="text-sm text-orange-900 dark:text-orange-200">
              This variant will no longer inherit {fieldName} from the model. 
              Please explain why this variant needs a different value.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for custom definition <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="e.g., 'Pediatric version has age restrictions' or 'Different indication for smaller size'"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This will help others understand why this variant is different.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              onOpenChange(false);
              setReason('');
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!reason.trim() || isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Custom Definition'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
