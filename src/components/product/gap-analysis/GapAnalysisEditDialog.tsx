
import React from 'react';
import { GapAnalysisItem } from '@/types/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { GapAnalysisDocumentUpload } from './GapAnalysisDocumentUpload';
import { GapAnalysisDocuments } from './GapAnalysisDocuments';
import { GapAnalysisEvidenceManager } from './GapAnalysisEvidenceManager';
import { GapAnalysisDueDateManager } from './GapAnalysisDueDateManager';
import { GapAnalysisReviewerAssignment } from './GapAnalysisReviewerAssignment';

interface GapAnalysisEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: GapAnalysisItem;
  onReviewerAssign?: (id: string, reviewerId: string) => void;
  companyId?: string;
}

export function GapAnalysisEditDialog({ 
  open, 
  onOpenChange, 
  item, 
  onReviewerAssign, 
  companyId 
}: GapAnalysisEditDialogProps) {
  const initialDueDate = item.dueDate || item.milestoneDate || (item as any).milestone_due_date;
  const dueDate = initialDueDate ? new Date(initialDueDate) : undefined;

  const handleReviewerChange = (reviewerId: string) => {
    if (onReviewerAssign) {
      onReviewerAssign(item.clauseId, reviewerId);
    }
  };

  const handleDocumentChange = () => {
    console.log('Documents updated for gap item:', item.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Gap Analysis Item</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Item Details */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Item Details</h4>
            <div className="p-3 border rounded-md bg-muted/30">
              <p className="font-medium text-sm">{item.clauseId} - {item.clauseSummary}</p>
              <p className="text-xs text-muted-foreground">{item.section || "No section specified"}</p>
              {item.gapDescription && (
                <p className="text-sm text-muted-foreground mt-2">{item.gapDescription}</p>
              )}
            </div>
          </div>

          {/* Due Date Management */}
          <GapAnalysisDueDateManager
            itemId={item.id || item.clauseId}
            initialDueDate={dueDate}
            itemStatus={item.status}
          />
          
          {/* Evidence & Links Management */}
          <GapAnalysisEvidenceManager
            itemId={item.id || item.clauseId}
            initialLinks={item.evidenceLinks || []}
          />
          
          {/* Documents */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Documents</Label>
              <GapAnalysisDocumentUpload
                gapItemId={item.id || item.clauseId}
                companyId={companyId}
                onUploadComplete={handleDocumentChange}
              />
            </div>
            <GapAnalysisDocuments
              gapItemId={item.id || item.clauseId}
              onDocumentChange={handleDocumentChange}
            />
          </div>
          
          {/* Reviewer Assignment */}
          <GapAnalysisReviewerAssignment
            assignedTo={item.assignedTo}
            onReviewerAssign={handleReviewerChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
