import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Loader2, PlayCircle, Eye, Ban } from "lucide-react";
import { mapDBStatusToUI, DocumentUIStatus } from "@/utils/statusUtils";

interface DocumentStatusToggleProps {
  status: string;
  onStatusChange: (status: DocumentUIStatus) => void;
  disabled?: boolean;
  isUpdating?: boolean;
}

const statusConfig: Record<DocumentUIStatus, { icon: React.ElementType; label: string; value: DocumentUIStatus }> = {
  "Not Started": {
    icon: PlayCircle,
    label: "Not Started",
    value: "Not Started"
  },
  "In Review": {
    icon: Eye,
    label: "In Review",
    value: "In Review"
  },
  "Approved": {
    icon: CheckCircle,
    label: "Approved",
    value: "Approved"
  },
  "Rejected": {
    icon: XCircle,
    label: "Rejected",
    value: "Rejected"
  },
  "N/A": {
    icon: Ban,
    label: "N/A",
    value: "N/A"
  },
  "Report": {
    icon: CheckCircle,
    label: "Report",
    value: "Report"
  }
};

export function DocumentStatusToggle({ status, onStatusChange, disabled = false, isUpdating = false }: DocumentStatusToggleProps) {
  const currentUIStatus = mapDBStatusToUI(status);
  const currentConfig = statusConfig[currentUIStatus];

  const handleStatusChange = (newStatus: DocumentUIStatus) => {
    onStatusChange(newStatus);
  };

  // Show updating spinner only when actually updating
  if (isUpdating) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Updating...</span>
      </div>
    );
  }

  return (
    <Select value={currentUIStatus} onValueChange={handleStatusChange} disabled={disabled}>
      <SelectTrigger className="w-30 h-8 text-xs" disabled={disabled}>
        <SelectValue>
          <div className="flex items-center gap-1 whitespace-nowrap">
            <currentConfig.icon className="h-3 w-3" />
            <span>{currentConfig.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.values(statusConfig).map(({ icon: Icon, label, value }) => (
          <SelectItem key={value} value={value} className="text-xs">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Icon className="h-3 w-3" />
              <span>{label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}