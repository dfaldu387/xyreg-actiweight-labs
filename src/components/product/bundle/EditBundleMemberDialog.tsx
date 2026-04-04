import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useUpdateBundleMember } from '@/hooks/useProductBundleGroups';
import { toast } from 'sonner';
import type { BundleMemberConfig } from '@/types/productBundle';

interface EditBundleMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  currentRelationshipType: string;
  currentMultiplier?: number;
}

export function EditBundleMemberDialog({
  open,
  onOpenChange,
  memberId,
  currentRelationshipType,
  currentMultiplier,
}: EditBundleMemberDialogProps) {
  const [relationshipType, setRelationshipType] = useState<BundleMemberConfig['relationship_type']>(
    currentRelationshipType as BundleMemberConfig['relationship_type']
  );
  const [multiplier, setMultiplier] = useState((currentMultiplier || 1).toString());
  const updateMemberMutation = useUpdateBundleMember();

  const handleSave = async () => {
    const multiplierValue = parseInt(multiplier);
    if (isNaN(multiplierValue) || multiplierValue < 1) {
      toast.error('Multiplier must be a positive number');
      return;
    }

    try {
      await updateMemberMutation.mutateAsync({
        memberId,
        updates: {
          relationship_type: relationshipType,
          multiplier: multiplierValue,
        },
      });

      toast.success('Member updated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error('Failed to update member');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Bundle Member</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="relationship-type">Relationship Type *</Label>
            <Select
              value={relationshipType}
              onValueChange={(value) => setRelationshipType(value as BundleMemberConfig['relationship_type'])}
            >
              <SelectTrigger id="relationship-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="component">Component</SelectItem>
                <SelectItem value="accessory">Accessory</SelectItem>
                <SelectItem value="consumable">Consumable</SelectItem>
                <SelectItem value="required">Required</SelectItem>
                <SelectItem value="optional">Optional</SelectItem>
                <SelectItem value="replacement_part">Replacement Part</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="multiplier">Multiplier</Label>
            <Input
              id="multiplier"
              type="number"
              min="1"
              value={multiplier}
              onChange={(e) => setMultiplier(e.target.value)}
              placeholder="1"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMemberMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMemberMutation.isPending}
          >
            {updateMemberMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
