
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, XCircle, HelpCircle } from "lucide-react";
import { mapDBStatusToUI, DocumentUIStatus } from "@/utils/statusUtils";
import { cn } from "@/lib/utils";

interface DocumentStatusBadgeProps {
  status: string;
}

const statusInfo: Record<DocumentUIStatus, { icon: React.ElementType; label: string; className: string }> = {
  "Not Started": {
    icon: HelpCircle,
    label: "Not Started",
    className: "bg-gray-50 text-gray-600 border-gray-200/50 hover:bg-gray-100",
  },
  "In Review": {
    icon: Clock,
    label: "In Review", 
    className: "bg-blue-50 text-blue-700 border-blue-200/50 hover:bg-blue-100",
  },
  "Approved": {
    icon: Check,
    label: "Approved",
    className: "bg-green-50 text-green-700 border-green-200/50 hover:bg-green-100",
  },
  "Report": {
    icon: Check,
    label: "Report",
    className: "bg-green-50 text-green-700 border-green-200/50 hover:bg-green-100", // Same green as Approved
  },
  "Rejected": {
    icon: XCircle,
    label: "Rejected",
    className: "bg-red-50 text-red-700 border-red-200/50 hover:bg-red-100",
  },
  "N/A": {
    icon: XCircle,
    label: "N/A",
    className: "bg-gray-100 text-gray-600 border-gray-200/50 hover:bg-gray-200",
  },
};

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  const uiStatus = mapDBStatusToUI(status);
  const { icon: Icon, label, className } = statusInfo[uiStatus] || { icon: HelpCircle, label: uiStatus, className: "" };
  
  return (
    <Badge variant="outline" className={cn("flex items-center gap-1 font-normal", className)}>
      <Icon className="h-3 w-3" />
      <span>{label}</span>
    </Badge>
  );
}
