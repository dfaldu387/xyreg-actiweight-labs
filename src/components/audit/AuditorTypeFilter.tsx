
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuditorType } from "@/utils/auditTypeUtils";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const AUDITOR_TYPE_DESCRIPTIONS: Record<Exclude<AuditorType, "all">, string> = {
  internal: "Your own team auditing internal processes and systems",
  external: "Your team auditing suppliers or external partners",
  "third-party": "Independent bodies (e.g. TÜV, BSI) or regulators (e.g. FDA) auditing your organization",
};

interface AuditorTypeFilterProps {
  value: AuditorType;
  onChange: (value: AuditorType) => void;
  className?: string;
}

export function AuditorTypeFilter({ value, onChange, className }: AuditorTypeFilterProps) {
  return (
    <div className={className}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">Auditor Type</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs space-y-1.5 p-3">
                <p><strong>Internal:</strong> {AUDITOR_TYPE_DESCRIPTIONS.internal}</p>
                <p><strong>External:</strong> {AUDITOR_TYPE_DESCRIPTIONS.external}</p>
                <p><strong>Third Party:</strong> {AUDITOR_TYPE_DESCRIPTIONS["third-party"]}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select auditor type" />
          </SelectTrigger>
          <SelectContent className="z-50">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="internal">Internal</SelectItem>
            <SelectItem value="external">External</SelectItem>
            <SelectItem value="third-party">Third Party</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
