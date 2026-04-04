import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PercentageEditDialogProps {
  open: boolean;
  onClose: () => void;
  edgeId: string | null;
  currentPercentage: number;
  onSave: (edgeId: string, percentage: number) => void;
}

export function PercentageEditDialog({
  open,
  onClose,
  edgeId,
  currentPercentage,
  onSave,
}: PercentageEditDialogProps) {
  const [percentage, setPercentage] = useState<number>(currentPercentage);

  useEffect(() => {
    setPercentage(currentPercentage);
  }, [currentPercentage]);

  const handleSave = () => {
    if (edgeId && percentage >= 0 && percentage <= 100) {
      onSave(edgeId, percentage);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Distribution Percentage</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="percentage">Percentage (%)</Label>
            <Input
              id="percentage"
              type="number"
              min="0"
              max="100"
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter a value between 0 and 100
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={percentage < 0 || percentage > 100}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
