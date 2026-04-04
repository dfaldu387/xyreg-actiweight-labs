
import { ClipboardList, FilePlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface AuditOrReview {
  name: string;
  type: "audit" | "design-review";
  phaseId?: string;
  position: "before" | "after";
  date?: Date | string;
  registrationDate?: Date | string; // Added registration date
}

interface AuditCardProps {
  audit: AuditOrReview;
}

export function AuditCard({ audit }: AuditCardProps) {
  // Format the date if it exists
  const formattedDate = audit.date 
    ? (typeof audit.date === 'string' 
        ? format(new Date(audit.date), "PPP") 
        : format(audit.date, "PPP"))
    : null;

  // Format the registration date if it exists
  const formattedRegistrationDate = audit.registrationDate
    ? (typeof audit.registrationDate === 'string'
        ? format(new Date(audit.registrationDate), "PPP")
        : format(audit.registrationDate, "PPP"))
    : null;

  return (
    <Card
      className={cn(
        "min-w-[240px] p-4 shadow-md transition-all",
        audit.type === "audit" 
          ? "border-primary border-2 border-dashed bg-primary/5" 
          : "border-gray-200 bg-muted"
      )}
      style={audit.type === "audit" 
        ? { borderWidth: "2px", borderStyle: "dashed", borderColor: "#9b87f5" } 
        : undefined}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {audit.type === "audit" 
            ? <ClipboardList className="h-5 w-5 text-primary flex-shrink-0" /> 
            : <FilePlus className="h-5 w-5 text-primary flex-shrink-0" />}
          <h4 className="font-medium">{audit.name}</h4>
        </div>
        <Badge className={cn(
          "text-xs",
          audit.type === "audit"
            ? "bg-primary/10 text-primary border border-primary"
            : "bg-gray-100 text-gray-700"
        )}>
          {audit.type === "audit" ? "Audit" : "Design Review"}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        {formattedDate 
          ? `Planned: ${formattedDate}`
          : (audit.position === "before" 
            ? "Happens before the phase" 
            : "Happens after the phase")
        }
        {formattedRegistrationDate && (
          <div className="mt-1">Registered: {formattedRegistrationDate}</div>
        )}
      </p>
    </Card>
  );
}
