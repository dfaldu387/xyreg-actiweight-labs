
import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, Circle } from "lucide-react";

interface DocumentStatusIndicatorProps {
  status?: string;
  phases?: string[];
  size?: "sm" | "md" | "lg";
}

export function DocumentStatusIndicator({ 
  status = "Not Started", 
  phases = [], 
  size = "sm" 
}: DocumentStatusIndicatorProps) {
  const isAssigned = phases && phases.length > 0;
  
  const getStatusInfo = () => {
    switch (status) {
      case "Completed":
      case "Approved":
        return {
          label: "Completed",
          icon: CheckCircle,
          className: "bg-green-100 text-green-800 border-green-200"
        };
      case "In Progress":
      case "In Review":
        return {
          label: "In Progress",
          icon: Clock,
          className: "bg-yellow-100 text-yellow-800 border-yellow-200"
        };
      case "Overdue":
        return {
          label: "Overdue",
          icon: AlertCircle,
          className: "bg-red-100 text-red-800 border-red-200"
        };
      case "Not Started":
      default:
        return {
          label: isAssigned ? "Not Started" : "Unassigned",
          icon: Circle,
          className: isAssigned 
            ? "bg-gray-100 text-gray-700 border-gray-200" 
            : "bg-orange-100 text-orange-700 border-orange-200"
        };
    }
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 h-5",
    md: "text-sm px-2 py-1 h-6",
    lg: "text-sm px-3 py-1.5 h-7"
  };

  return (
    <Badge 
      variant="outline"
      className={`inline-flex items-center gap-1 ${statusInfo.className} ${sizeClasses[size]}`}
      title={`Status: ${statusInfo.label}${isAssigned ? ` (Assigned to ${phases.length} phase${phases.length === 1 ? '' : 's'})` : ' (No phase assignments)'}`}
    >
      <Icon className="h-3 w-3" />
      <span>{statusInfo.label}</span>
    </Badge>
  );
}
