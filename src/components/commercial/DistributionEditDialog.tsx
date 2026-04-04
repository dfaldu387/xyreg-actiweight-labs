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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface DistributionEditDialogProps {
  open: boolean;
  onClose: () => void;
  nodeData: {
    id: string;
    label: string;
  } | null;
  onSave: (data: { distributionMethod: string; customPercentages?: Record<string, number> }) => void;
}

export function DistributionEditDialog({
  open,
  onClose,
  nodeData,
  onSave,
}: DistributionEditDialogProps) {
  const [distributionMethod, setDistributionMethod] = useState<string>('equal_distribution');
  const [customPercentages, setCustomPercentages] = useState<Record<string, number>>({});

  useEffect(() => {
    if (open) {
      setDistributionMethod('equal_distribution');
      setCustomPercentages({});
    }
  }, [open]);

  const handleSave = () => {
    onSave({
      distributionMethod,
      ...(distributionMethod === 'fixed_percentages' ? { customPercentages } : {}),
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Distribution Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Distribution Method</Label>
            <RadioGroup value={distributionMethod} onValueChange={setDistributionMethod} className="mt-2 space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="equal_distribution" id="equal" />
                <Label htmlFor="equal" className="font-normal cursor-pointer">
                  Equal Distribution
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed_percentages" id="fixed" />
                <Label htmlFor="fixed" className="font-normal cursor-pointer">
                  Fixed Percentages
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gaussian" id="gaussian" />
                <Label htmlFor="gaussian" className="font-normal cursor-pointer">
                  Gaussian Distribution
                </Label>
              </div>
            </RadioGroup>
          </div>

          {distributionMethod === 'fixed_percentages' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Custom Percentages</Label>
              <p className="text-xs text-muted-foreground">
                Define custom percentages for child products (must total 100%)
              </p>
              <div className="text-xs text-muted-foreground mt-2">
                Configure specific percentages in the relationship definition dialog after connecting nodes.
              </div>
            </div>
          )}

          {distributionMethod === 'gaussian' && (
            <div className="text-sm text-muted-foreground">
              Gaussian (bell curve) distribution will be automatically applied to variants based on their position.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
