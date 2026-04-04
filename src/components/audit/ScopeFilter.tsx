
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuditCategoryType } from "@/utils/auditTypeUtils";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const CATEGORY_DESCRIPTIONS: Record<Exclude<AuditCategoryType, "all">, string> = {
  "qms": "Quality management system audits (ISO 13485, Management Review, Document Control, Training, etc.)",
  "product": "Product-specific audits (Design Control, Risk Management, Software Validation, Sterilization, etc.)",
  "supply-chain": "Supplier evaluation and qualification audits",
  "regulatory": "External body and compliance audits (Notified Body, FDA Inspection, CE Marking, etc.)",
  "post-market": "Surveillance and clinical audits (PMS, Clinical Evaluation, Corrective Action, etc.)",
};

interface ScopeFilterProps {
  value: AuditCategoryType;
  onChange: (value: AuditCategoryType) => void;
  className?: string;
}

export function ScopeFilter({ value, onChange, className }: ScopeFilterProps) {
  return (
    <div className={className}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">Category</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs space-y-1.5 p-3">
                <p><strong>QMS / Management:</strong> {CATEGORY_DESCRIPTIONS.qms}</p>
                <p><strong>Product / Design:</strong> {CATEGORY_DESCRIPTIONS.product}</p>
                <p><strong>Supply Chain:</strong> {CATEGORY_DESCRIPTIONS["supply-chain"]}</p>
                <p><strong>Regulatory:</strong> {CATEGORY_DESCRIPTIONS.regulatory}</p>
                <p><strong>Post-Market:</strong> {CATEGORY_DESCRIPTIONS["post-market"]}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent className="z-50">
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="qms">QMS / Management</SelectItem>
            <SelectItem value="product">Product / Design</SelectItem>
            <SelectItem value="supply-chain">Supply Chain</SelectItem>
            <SelectItem value="regulatory">Regulatory</SelectItem>
            <SelectItem value="post-market">Post-Market</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
