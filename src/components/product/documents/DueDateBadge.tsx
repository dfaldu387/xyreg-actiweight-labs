
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface DueDateBadgeProps {
  document: any;
}

export function DueDateBadge({ document }: DueDateBadgeProps) {
  // Get due date display info with color coding
  const getDueDateInfo = (document: any) => {
    const dueDate = document.due_date || document.deadline ||document.dueDate;
    if (!dueDate) {
      return {
        display: 'No due date',
        color: 'bg-gray-100 text-gray-600',
        isOverdue: false,
        isSoon: false
      };
    }

    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let color = 'bg-green-100 text-green-700'; // Future dates
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
      display: due.toLocaleDateString(),
      color,
      isOverdue,
      isSoon,
      diffDays: Math.abs(diffDays)
    };
  };

  const dueDateInfo = getDueDateInfo(document);

  return (
    <Badge 
      variant="outline" 
      className={`text-xs font-medium px-2 py-1 ${dueDateInfo.color}`}
    >
      <Clock className="h-3 w-3 mr-1" />
      {dueDateInfo.display}
      {dueDateInfo.isOverdue && (
        <span className="ml-1 text-xs">(Overdue)</span>
      )}
      {dueDateInfo.isSoon && !dueDateInfo.isOverdue && (
        <span className="ml-1 text-xs">(Due Soon)</span>
      )}
    </Badge>
  );
}
