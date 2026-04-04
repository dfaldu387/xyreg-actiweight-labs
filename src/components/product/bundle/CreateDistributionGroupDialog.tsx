import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertCircle } from 'lucide-react';
import type { BundleProduct } from './BundleBuildTab';

interface CreateDistributionGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMembers: BundleProduct[];
  onCreateGroup: (groupId: string, memberRates: { memberId: string; rate: number }[]) => void;
}

export function CreateDistributionGroupDialog({
  open,
  onOpenChange,
  selectedMembers,
  onCreateGroup,
}: CreateDistributionGroupDialogProps) {
  const [groupName, setGroupName] = useState('');
  const [memberRates, setMemberRates] = useState<{ memberId: string; rate: number }[]>([]);

  // Initialize when dialog opens
  useEffect(() => {
    if (open && selectedMembers.length > 0) {
      const relType = selectedMembers[0]?.relationshipType || 'item';
      const timestamp = Date.now().toString(36);
      setGroupName(`${relType}_group_${timestamp}`);
      
      const evenRate = 100 / selectedMembers.length;
      setMemberRates(selectedMembers.map(m => ({
        memberId: m.product.id,
        rate: evenRate,
      })));
    }
  }, [open]);

  // Sync memberRates with selectedMembers
  useEffect(() => {
    if (selectedMembers.length > 0) {
      const selectedIds = new Set(selectedMembers.map(m => m.product.id));
      
      // Remove rates for deselected members and add new members with even distribution
      const remainingRates = memberRates.filter(r => selectedIds.has(r.memberId));
      const existingIds = new Set(remainingRates.map(r => r.memberId));
      const newMembers = selectedMembers.filter(m => !existingIds.has(m.product.id));
      
      if (newMembers.length > 0) {
        const evenRate = 100 / selectedMembers.length;
        const updatedRates = [
          ...remainingRates,
          ...newMembers.map(m => ({ memberId: m.product.id, rate: evenRate }))
        ];
        setMemberRates(updatedRates);
      } else if (remainingRates.length !== memberRates.length) {
        setMemberRates(remainingRates);
      }
    }
  }, [selectedMembers]);

  const currentTotal = memberRates.reduce((sum, m) => sum + Math.round(m.rate), 0);
  const isValid = currentTotal === 100 && groupName.trim().length > 0;

  const handleRateChange = (index: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newRates = [...memberRates];
    
    // Calculate total of other members
    const otherTotal = memberRates.reduce((sum, m, i) => 
      i === index ? sum : sum + m.rate, 0
    );
    
    // Cap the new value so total doesn't exceed 100
    const maxAllowed = 100 - otherTotal;
    newRates[index].rate = Math.max(0, Math.min(maxAllowed, numValue));
    setMemberRates(newRates);
  };

  const handleSliderChange = (index: number, values: number[]) => {
    const newRates = [...memberRates];
    newRates[index].rate = Math.round(values[0]);
    setMemberRates(newRates);
  };

  const handleAutoBalance = () => {
    const currentTotal = memberRates.reduce((sum, m) => sum + m.rate, 0);
    
    if (currentTotal === 0) {
      // Even distribution
      const evenRate = 100 / memberRates.length;
      setMemberRates(memberRates.map(m => ({ ...m, rate: evenRate })));
      return;
    }

    // Proportional adjustment
    const factor = 100 / currentTotal;
    let adjusted = memberRates.map(m => ({
      ...m,
      rate: m.rate * factor,
    }));

    // Handle rounding
    const newTotal = adjusted.reduce((sum, m) => sum + m.rate, 0);
    const diff = 100 - newTotal;
    
    if (Math.abs(diff) > 0.001) {
      const maxIndex = adjusted.reduce((maxIdx, m, idx, arr) => 
        m.rate > arr[maxIdx].rate ? idx : maxIdx, 0
      );
      adjusted[maxIndex].rate += diff;
    }

    setMemberRates(adjusted);
  };

  const handleCreate = () => {
    if (!isValid) return;
    onCreateGroup(groupName, memberRates);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Distribution Group</DialogTitle>
          <DialogDescription>
            Define how these {selectedMembers.length} competing items are distributed. Percentages must sum to 100%.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Group Name */}
          <div className="space-y-2">
            <Label>Group ID</Label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., color_sets"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              Internal identifier for this distribution group
            </p>
          </div>

          {/* Distribution Display */}
          <div className="space-y-4">
            <Label>Distribution Split (%)</Label>
            
            <div className="space-y-3">
              {selectedMembers.map((member, index) => {
                const rate = memberRates[index]?.rate || 0;
                return (
                  <div key={member.product.id} className="flex items-center justify-between gap-4 p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {member.product.tradeName || member.product.name}
                      </div>
                      {member.isVariantGroup && (
                        <div className="text-xs text-muted-foreground">
                          Sibling Group ({member.variantCount} variants)
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={rate}
                        onChange={(e) => handleRateChange(index, e.target.value)}
                        className="w-20 text-right"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total Validation */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Total Distribution</span>
              <span className={`text-sm font-semibold ${isValid ? 'text-green-600' : 'text-amber-600'}`}>
                {currentTotal}%
              </span>
            </div>
            <Progress value={currentTotal} className="h-3" />
          </div>

          {!isValid && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {currentTotal !== 100 && `Percentages must sum to exactly 100%. Current total: ${currentTotal}%`}
                {!groupName.trim() && 'Group ID is required.'}
              </AlertDescription>
            </Alert>
          )}

          {isValid && (
            <Alert>
              <AlertDescription>
                These items will compete with each other. When the main product is sold, the distribution will follow these percentages.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!isValid}
          >
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
