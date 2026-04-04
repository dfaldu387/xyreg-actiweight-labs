import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DocumentChart } from "./DocumentChart";
import { mapDBStatusToUI } from "@/utils/statusUtils";
import { usePhaseDocuments } from "@/hooks/usePhaseDocuments";

interface DocumentGraphModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  productId: string;
  onFilterByPhaseAndStatus?: (phase: string, status: string) => void;
}

export function DocumentGraphModal({ 
  open, 
  onOpenChange, 
  companyId,
  productId,
  onFilterByPhaseAndStatus 
}: DocumentGraphModalProps) {
  
  const navigate = useNavigate();
  
  // Fetch the actual document data
  const { phaseDocuments: lifecyclePhaseDocuments } = usePhaseDocuments(companyId, productId);
  
  
  const chartData = useMemo(() => {
    return Object.entries(lifecyclePhaseDocuments).map(([phaseName, documents]) => {
      // Count documents by actual status considering due dates
      const statusCounts = (documents as any[]).reduce((acc: Record<string, number>, doc: any) => {
        const status = doc.status || doc.document_status;
        const dueDate = doc.dueDate || doc.due_date || doc.deadline;
        const isRecord = doc.is_record === true;

        // Determine the correct category
        let category = '';

        // Report: is_record === true (count separately - no overdue check)
        if (isRecord) {
          category = 'report';
        }
        // Approved: Completed, Approved, Closed (no overdue check for completed items)
        else if (status === 'Completed' || status === 'Approved' || status === 'Closed') {
          category = 'approved';
        }
        else {
          // For non-completed, non-report documents, check if overdue FIRST
          const today = new Date();
          today.setHours(23, 59, 59, 999); // End of today

          let isOverdue = false;
          if (dueDate) {
            const dueDateObj = new Date(dueDate);
            dueDateObj.setHours(23, 59, 59, 999); // End of due date
            isOverdue = dueDateObj < today;
          }

          if (isOverdue) {
            // Document is past due date - mark as overdue regardless of status
            category = 'overdue';
          }
          // Active: In Review, Under Review, In Progress (only if not overdue)
          else if (status === 'In Review' || status === 'Under Review' || status === 'In Progress') {
            category = 'active';
          }
          else {
            // Not Started, N/A, or other statuses without due date
            category = 'pending';
          }
        }

        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      return {
        phase: phaseName,
        approved: statusCounts['approved'] || 0,
        active: statusCounts['active'] || 0, // In Review, Under Review, In Progress
        pending: statusCounts['pending'] || 0,
        overdue: statusCounts['overdue'] || 0,
        report: statusCounts['report'] || 0, // is_record === true
        total: (documents as any[]).length,
        isActivePhase: false
      };
    }).filter(item => item.total > 0); // Only show phases with documents
  }, [lifecyclePhaseDocuments]);

  const handleSegmentClick = (phase: string, status: string) => {
    // Navigate to documents page with ONLY the phase filter (clear all other params)
    const newUrl = `/app/product/${productId}/documents?phase=${encodeURIComponent(phase)}`;
    navigate(newUrl, { replace: true });
    onOpenChange(false); // Close modal after navigation
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Document Status by Phase</DialogTitle>
          <DialogDescription>
            Interactive chart showing document status distribution across development phases. 
            Click on any colored segment to filter documents by phase and status.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6">
          {chartData.length > 0 ? (
            <DocumentChart 
              data={chartData} 
              onSegmentClick={handleSegmentClick}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium">No Document Data Available</p>
                <p className="text-sm">There are no documents to display in the chart.</p>
              </div>
            </div>
          )}
        </div>
        
        {chartData.length > 0 && (
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <h4 className="text-sm font-medium text-foreground mb-2">How to use this chart:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Each bar represents a development phase</li>
              <li>• Green (bottom) = Approved documents</li>
              <li>• Blue = Active documents (in current phase)</li>
              <li>• Grey = Pending documents</li>
              <li>• Red (top) = Overdue documents</li>
              <li>• Click any colored segment to filter documents by that phase and status</li>
              <li>• Hover over bars to see exact counts</li>
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}