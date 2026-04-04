
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle } from "lucide-react";

interface GapItemDueDateBadgeProps {
  dueDate?: Date;
}

export function GapItemDueDateBadge({ dueDate }: GapItemDueDateBadgeProps) {
  // Get due date display info with color coding
  const getDueDateInfo = (dueDate?: Date) => {
    if (!dueDate) {
      return {
        display: 'No due date',
        color: 'bg-gray-100 text-gray-600 border-gray-200',
        isOverdue: false,
        isSoon: false
      };
    }

    const now = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let color = 'bg-green-100 text-green-700 border-green-200'; // Future dates
    let isOverdue = false;
    let isSoon = false;

    if (diffDays < 0) {
      color = 'bg-red-100 text-red-700 border-red-300';
      isOverdue = true;
    } else if (diffDays <= 7) {
      color = 'bg-yellow-100 text-yellow-700 border-yellow-300';
      isSoon = true;
    }

    return {
      display: dueDate.toLocaleDateString(),
      color,
      isOverdue,
      isSoon,
      diffDays: Math.abs(diffDays)
    };
  };

  const dueDateInfo = getDueDateInfo(dueDate);

  return (
    <Badge 
      variant="outline" 
      className={`text-xs font-medium px-2 py-1 ${dueDateInfo.color} flex items-center gap-1`}
    >
      <Clock className="h-3 w-3" />
      {dueDateInfo.display}
      {dueDateInfo.isOverdue && (
        <>
          <AlertTriangle className="h-3 w-3" />
          <span className="text-xs">(Overdue)</span>
        </>
      )}
      {dueDateInfo.isSoon && !dueDateInfo.isOverdue && (
        <span className="text-xs">(Due Soon)</span>
      )}
    </Badge>
  );
}
