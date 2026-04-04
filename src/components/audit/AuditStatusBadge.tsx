
import { Badge } from "@/components/ui/badge";
import { AuditStatus } from "@/types/audit";

interface AuditStatusBadgeProps {
  status: AuditStatus;
}

export function AuditStatusBadge({ status }: AuditStatusBadgeProps) {
  const getStatusColor = (status: AuditStatus) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Planned":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Overdue":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <Badge variant="outline" className={`${getStatusColor(status)} font-medium`}>
      {status}
    </Badge>
  );
}
