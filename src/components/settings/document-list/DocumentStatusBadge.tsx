
import { Badge } from "@/components/ui/badge";

interface DocumentStatusBadgeProps {
  status?: string;
}

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  return (
    <Badge variant="outline" className="text-xs">
      {status || "Not Started"}
    </Badge>
  );
}
