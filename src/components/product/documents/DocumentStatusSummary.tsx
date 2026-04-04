
import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CircularProgress } from "@/components/common/CircularProgress";
import { usePhaseDocuments } from "@/hooks/usePhaseDocuments";

interface DocumentStatusSummaryProps {
  companyId: string;
  productId: string;
  phases?: any[];
}

export function DocumentStatusSummary({ companyId, productId, phases = [] }: DocumentStatusSummaryProps) {
  // Use the same hook as DocumentGraphModal and DocumentTabs for consistent data
  const { phaseDocuments: lifecyclePhaseDocuments } = usePhaseDocuments(companyId, productId);

  // Flatten all documents from all phases into a single array
  const allDocuments = useMemo(() => {
    const docs: any[] = [];
    Object.values(lifecyclePhaseDocuments).forEach((phaseDocs: any[]) => {
      docs.push(...phaseDocs);
    });
    return docs;
  }, [lifecyclePhaseDocuments]);

  // Count documents by status - same logic as DocumentGraphModal
  const countByStatus = useMemo(() => {
    let approved = 0;
    let active = 0;  // In Review = Active
    let pending = 0;
    let overdue = 0;
    let total = 0;

    allDocuments.forEach(doc => {
      const status = doc.status || doc.document_status || '';
      const dueDate = doc.due_date || doc.dueDate || doc.deadline;

      // Skip N/A documents from total
      if (status === 'Not Required') return;

      total++;

      // Approved: status is Completed, Approved, Closed, or Report
      if (status === 'Completed' || status === 'Approved' || status === 'Closed' || status === 'Report') {
        approved++;
        return;
      }

      // Check if overdue FIRST (for all non-approved documents)
      if (dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDateObj = new Date(dueDate);
        dueDateObj.setHours(0, 0, 0, 0);

        if (dueDateObj < today) {
          overdue++;
          return;
        }
      }

      // Active: In Review, Under Review, In Progress (actively being worked on)
      if (status === 'In Review' || status === 'Under Review' || status === 'In Progress') {
        active++;
        return;
      }

      // Everything else is pending (Not Started, Draft, etc.)
      pending++;
    });

    return { Approved: approved, Active: active, Pending: pending, Overdue: overdue, Total: total };
  }, [allDocuments]);

  // Calculate completion percentage
  const completionPercentage = countByStatus.Total > 0
    ? Math.round((countByStatus.Approved / countByStatus.Total) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Overall Status Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex flex-row gap-2 items-center justify-center mt-5">
              <span className="text-sm text-muted-foreground">Overall Completion</span>
              <div className="mt-2">
                <CircularProgress percentage={completionPercentage} size={40} />
              </div>
            </div>

            <div className="flex flex-col items-center bg-green-50 rounded-md p-2 mt-4">
              <span className="text-sm text-muted-foreground">Approved</span>
              <span className="text-lg font-semibold text-green-600">{countByStatus.Approved}</span>
            </div>

            <div className="flex flex-col items-center bg-blue-50 rounded-md p-2 mt-4">
              <span className="text-sm text-muted-foreground">Active</span>
              <span className="text-lg font-semibold text-blue-600">{countByStatus.Active}</span>
            </div>

            <div className="flex flex-col items-center bg-amber-50 rounded-md p-2 mt-4">
              <span className="text-sm text-muted-foreground">Pending</span>
              <span className="text-lg font-semibold text-amber-600">{countByStatus.Pending}</span>
            </div>

            <div className="flex flex-col items-center bg-red-50 rounded-md p-2 mt-4">
              <span className="text-sm text-muted-foreground">Overdue</span>
              <span className="text-lg font-semibold text-red-600">{countByStatus.Overdue}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
