
import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CircularProgress } from "@/components/common/CircularProgress";

interface CompanyDocument {
  id: string;
  status: string;
  due_date?: string;
}

interface CompanyDocumentStatusSummaryProps {
  documents: CompanyDocument[];
}

export function CompanyDocumentStatusSummary({ documents }: CompanyDocumentStatusSummaryProps) {
  const countByStatus = useMemo(() => {
    let approved = 0;
    let active = 0;
    let pending = 0;
    let overdue = 0;
    let total = 0;

    documents.forEach(doc => {
      const status = doc.status || '';

      if (status === 'Not Required') return;

      total++;

      if (status === 'Completed' || status === 'Approved' || status === 'Closed' || status === 'Report') {
        approved++;
        return;
      }

      if (doc.due_date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDateObj = new Date(doc.due_date);
        dueDateObj.setHours(0, 0, 0, 0);

        if (dueDateObj < today) {
          overdue++;
          return;
        }
      }

      if (status === 'In Review' || status === 'Under Review' || status === 'In Progress') {
        active++;
        return;
      }

      pending++;
    });

    return { Approved: approved, Active: active, Pending: pending, Overdue: overdue, Total: total };
  }, [documents]);

  const completionPercentage = countByStatus.Total > 0
    ? Math.round((countByStatus.Approved / countByStatus.Total) * 100)
    : 0;

  return (
    <div className="space-y-4">
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
