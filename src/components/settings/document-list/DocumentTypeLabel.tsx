
import { Badge } from "@/components/ui/badge";
import { mapToAllowedType } from "../document-control/utils/documentMappingUtils";

interface DocumentTypeLabelProps {
  documentType?: string;
}

export function DocumentTypeLabel({ documentType }: DocumentTypeLabelProps) {
  // Use our reusable mapping function to ensure consistent capitalization
  const normalizedType = mapToAllowedType(documentType || "");

  return (
    <Badge variant="outline" className="text-xs">
      {normalizedType}
    </Badge>
  );
}
