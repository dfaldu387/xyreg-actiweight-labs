
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, X } from 'lucide-react';
import { GapAnalysisItem } from '@/types/client';
import { ReviewerGroupSelector } from '@/components/common/ReviewerGroupSelector';
import { useReviewerGroups } from '@/hooks/useReviewerGroups';
import { UniversalReviewManager } from '@/components/review/UniversalReviewManager';
import { assignReviewerGroupToGapItem } from '@/services/gapAnalysisService';
import { toast } from 'sonner';
import { useReviewWorkflows } from '@/hooks/useReviewWorkflows';

interface GapAnalysisReviewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: GapAnalysisItem;
  companyId?: string;
  onReviewerGroupsChanged?: () => void;
}

export function GapAnalysisReviewerDialog({
  open,
  onOpenChange,
  item,
  companyId,
  onReviewerGroupsChanged
}: GapAnalysisReviewerDialogProps) {
  const [selectedReviewerGroup, setSelectedReviewerGroup] = useState<string | undefined>();
  const [isAssigning, setIsAssigning] = useState(false);
  const { reviewerGroups, isLoading, error } = useReviewerGroups(companyId);
  const { fetchReviewerGroups } = useReviewWorkflows('gap_analysis_item', item.id, companyId, { enabled: open });

  const safeReviewerGroups = Array.isArray(reviewerGroups) ? reviewerGroups : [];

  const handleClose = () => {
    onOpenChange(false);
    setSelectedReviewerGroup(undefined);
  };

  const handleAssignReviewerGroup = async () => {
    if (!selectedReviewerGroup || !companyId || !item.id) {
      toast.error('Please select a reviewer group');
      return;
    }

    setIsAssigning(true);
    try {
      const result = await assignReviewerGroupToGapItem(
        item.id,
        selectedReviewerGroup,
        companyId
      );

      if (result.success) {
        toast.success(result.message);
        await fetchReviewerGroups();
        if (onReviewerGroupsChanged) {
          onReviewerGroupsChanged();
        }
        setSelectedReviewerGroup(undefined);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to assign reviewer group');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Reviewers - Gap Analysis Item
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Gap Item Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1">
                  {item.clauseId} - {item.clauseSummary}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {item.section || "No section specified"}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {item.framework}
                  </Badge>
                  {item.status && (
                    <Badge variant="secondary" className="text-xs">
                      {item.status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reviewer Group Selection */}
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">
                  Error loading reviewer groups. Please try again.
                </p>
              </div>
            )}
            
            {/* <ReviewerGroupSelector
              value={selectedReviewerGroup}
              onValueChange={setSelectedReviewerGroup}
              reviewerGroups={safeReviewerGroups}
              isLoading={isLoading}
              label="Select Reviewer Group"
              placeholder="Choose a reviewer group for this gap analysis item"
              allowClear
            /> */}

            {selectedReviewerGroup && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700">
                  Selected reviewer group will be assigned to review this gap analysis item.
                </p>
              </div>
            )}
          </div>

          {/* Universal Review Manager - Only fetch when dialog is open */}
          {companyId && open && (
            <div>
              <h3 className="text-sm font-medium mb-3">Review Groups</h3>
              <UniversalReviewManager
                recordType="gap_analysis_item"
                recordId={item.id}
                recordName={`${item.clauseId || 'Gap Item'} - ${item.clauseSummary || item.requirement || 'N/A'}`}
                companyId={companyId}
                enabled={open}
                onReviewerGroupsChange={() => {
                  fetchReviewerGroups();
                  if (onReviewerGroupsChanged) {
                    onReviewerGroupsChanged();
                  }
                }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={isAssigning}>
              Close
            </Button>
            {selectedReviewerGroup && (
              <Button onClick={handleAssignReviewerGroup} disabled={isAssigning}>
                {isAssigning ? 'Assigning...' : 'Assign Reviewer Group'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
