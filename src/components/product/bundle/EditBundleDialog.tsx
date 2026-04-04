import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { TargetMarketsInput } from './TargetMarketsInput';
import { useUpdateBundleGroup } from '@/hooks/useProductBundleGroups';
import { toast } from 'sonner';

interface EditBundleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bundleId: string;
  currentName: string;
  currentDescription?: string;
  isFeasibilityStudy?: boolean;
  currentTargetMarkets?: string[];
}

export function EditBundleDialog({
  open,
  onOpenChange,
  bundleId,
  currentName,
  currentDescription,
  isFeasibilityStudy = false,
  currentTargetMarkets = [],
}: EditBundleDialogProps) {
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription || '');
  const [feasibilityStudy, setFeasibilityStudy] = useState(isFeasibilityStudy);
  const [targetMarkets, setTargetMarkets] = useState<string[]>(currentTargetMarkets);
  const updateMutation = useUpdateBundleGroup();

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Bundle name is required');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        bundleId,
        updates: {
          bundle_name: name.trim(),
          description: description.trim() || undefined,
          is_feasibility_study: feasibilityStudy,
          target_markets: targetMarkets,
        },
      });

      toast.success('Bundle updated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating bundle:', error);
      toast.error('Failed to update bundle');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Bundle</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bundle-name">Bundle Name *</Label>
            <Input
              id="bundle-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter bundle name"
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bundle-description">Description</Label>
            <Textarea
              id="bundle-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter bundle description (optional)"
              className="min-h-[80px]"
              disabled={updateMutation.isPending}
            />
          </div>

          <TargetMarketsInput
            value={targetMarkets}
            onChange={setTargetMarkets}
            disabled={updateMutation.isPending}
          />

          <div className="flex items-center space-x-2">
            <Checkbox
              id="feasibility-study-edit"
              checked={feasibilityStudy}
              onCheckedChange={(checked) => setFeasibilityStudy(checked as boolean)}
              disabled={updateMutation.isPending}
            />
            <Label
              htmlFor="feasibility-study-edit"
              className="text-sm font-normal cursor-pointer"
            >
              Mark as Feasibility Study
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
